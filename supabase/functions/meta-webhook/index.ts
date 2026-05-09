// Meta (WhatsApp / Messenger / Instagram) webhook receiver.
// Reuses the existing `customer-chat` edge function for AI logic so all
// channels (web widget + Meta DMs) share the same chatbot brain.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Channel = "whatsapp" | "messenger" | "instagram";

function detectChannel(body: any): Channel | null {
  const obj = body?.object;
  if (obj === "whatsapp_business_account") return "whatsapp";
  if (obj === "page") return "messenger";
  if (obj === "instagram") return "instagram";
  return null;
}

interface IncomingMsg {
  channel: Channel;
  externalUserId: string;
  text: string;
  channelRow: any;
  recipientId?: string; // page id / phone number id (used to send reply back)
  senderName?: string;
}

function extractMessages(body: any, channel: Channel): Array<Omit<IncomingMsg, "channelRow">> {
  const out: Array<Omit<IncomingMsg, "channelRow">> = [];
  const entries = body?.entry || [];

  for (const entry of entries) {
    if (channel === "whatsapp") {
      const changes = entry.changes || [];
      for (const ch of changes) {
        const val = ch.value || {};
        const phoneNumberId = val?.metadata?.phone_number_id;
        const contacts = val.contacts || [];
        const nameByWaId: Record<string, string> = {};
        for (const c of contacts) {
          if (c?.wa_id && c?.profile?.name) nameByWaId[c.wa_id] = c.profile.name;
        }
        const msgs = val.messages || [];
        for (const m of msgs) {
          if (m.type === "text" && m.text?.body) {
            out.push({
              channel,
              externalUserId: m.from,
              text: m.text.body,
              recipientId: phoneNumberId,
              senderName: nameByWaId[m.from],
            });
          }
        }
      }
    } else {
      // Messenger + Instagram both use "messaging" array on entry
      const messaging = entry.messaging || [];
      const pageId = entry.id;
      for (const ev of messaging) {
        if (ev.message && ev.message.text && !ev.message.is_echo) {
          out.push({
            channel,
            externalUserId: ev.sender?.id,
            text: ev.message.text,
            recipientId: pageId,
          });
        }
      }
    }
  }
  return out;
}

async function fetchSenderName(channel: Channel, userId: string, token: string): Promise<string | null> {
  if (!userId || !token) return null;
  try {
    const url = `https://graph.facebook.com/v21.0/${userId}?fields=name,first_name,last_name,username&access_token=${encodeURIComponent(token)}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.name || [j?.first_name, j?.last_name].filter(Boolean).join(" ") || j?.username || null;
  } catch {
    return null;
  }
}

async function sendReply(msg: IncomingMsg, text: string) {
  const ch = msg.channelRow;
  const token = ch.access_token;
  if (!token) {
    console.warn("[meta-webhook] no access_token configured for channel", ch.id);
    return;
  }

  // Strip ```products fenced blocks for Meta plain-text reply (web widget renders them).
  const clean = text.replace(/```products[\s\S]*?```/gi, "").trim() || "Got it!";
  const truncated = clean.length > 4000 ? clean.slice(0, 3990) + "…" : clean;

  try {
    if (msg.channel === "whatsapp") {
      const url = `https://graph.facebook.com/v21.0/${msg.recipientId}/messages`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: msg.externalUserId,
          type: "text",
          text: { body: truncated },
        }),
      });
      if (!r.ok) console.error("[meta-webhook] WA send fail", r.status, await r.text());
    } else {
      // Messenger + Instagram share the Send API
      const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: msg.externalUserId },
          message: { text: truncated },
          messaging_type: "RESPONSE",
        }),
      });
      if (!r.ok) console.error("[meta-webhook] FB/IG send fail", r.status, await r.text());
    }
  } catch (e) {
    console.error("[meta-webhook] send error", e);
  }
}

async function handleMessage(supabase: any, msg: IncomingMsg) {
  const ch = msg.channelRow;

  // Resolve sender display name (WhatsApp gives it inline, Messenger/IG via Graph API).
  let senderName = msg.senderName || null;
  if (!senderName && (msg.channel === "messenger" || msg.channel === "instagram")) {
    senderName = await fetchSenderName(msg.channel, msg.externalUserId, ch.access_token);
  }

  // Find or create meta_conversation → chatbot_conversation
  let { data: mc } = await supabase
    .from("meta_conversations")
    .select("*")
    .eq("meta_channel_id", ch.id)
    .eq("external_user_id", msg.externalUserId)
    .maybeSingle();

  let conversationId: string | null = mc?.conversation_id || null;

  if (!conversationId) {
    const { data: conv } = await supabase
      .from("chatbot_conversations")
      .insert({
        session_id: `${msg.channel}:${msg.externalUserId}`,
        channel: msg.channel,
        external_user_id: msg.externalUserId,
        display_name: senderName,
        user_agent: `meta-${msg.channel}`,
      })
      .select("id")
      .single();
    conversationId = conv?.id ?? null;
  } else if (senderName) {
    await supabase
      .from("chatbot_conversations")
      .update({ display_name: senderName })
      .eq("id", conversationId)
      .is("display_name", null);
  }

  if (!mc) {
    await supabase.from("meta_conversations").insert({
      meta_channel_id: ch.id,
      channel: msg.channel,
      external_user_id: msg.externalUserId,
      conversation_id: conversationId,
      display_name: senderName,
    });
  } else {
    await supabase
      .from("meta_conversations")
      .update({
        conversation_id: conversationId,
        last_message_at: new Date().toISOString(),
        ...(senderName && !mc.display_name ? { display_name: senderName } : {}),
      })
      .eq("id", mc.id);
  }

  // Pull recent message history for context (last 20)
  const { data: history } = await supabase
    .from("chatbot_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = [
    ...((history || []).filter((m: any) => m.role === "user" || m.role === "assistant")),
    { role: "user", content: msg.text },
  ];

  // Call shared customer-chat function
  const chatRes = await fetch(`${SUPABASE_URL}/functions/v1/customer-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      messages,
      sessionId: `${msg.channel}:${msg.externalUserId}`,
      conversationId,
    }),
  });

  if (!chatRes.ok) {
    console.error("[meta-webhook] customer-chat failed", chatRes.status, chatRes.text());
    await sendReply(msg, "Sorry, I'm having trouble right now. Please try again shortly.");
    return;
  }

  const { content } = await chatRes.json();
  if (content) await sendReply(msg, content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);

  // ----- GET: webhook verification -----
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token) {
      const { data: ch } = await supabase
        .from("meta_channels")
        .select("id")
        .eq("verify_token", token)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (ch) return new Response(challenge || "ok", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  // ----- POST: incoming events -----
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const channel = detectChannel(body);
  if (!channel) return new Response("ok", { status: 200 });

  const incoming = extractMessages(body, channel);
  if (incoming.length === 0) return new Response("ok", { status: 200 });

  // Look up the matching active channel row
  const { data: channels } = await supabase
    .from("meta_channels")
    .select("*")
    .eq("channel", channel)
    .eq("is_active", true);

  if (!channels || channels.length === 0) {
    console.warn("[meta-webhook] no active channel row for", channel);
    return new Response("ok", { status: 200 });
  }

  // Pick the first active row for this channel (most setups have 1).
  const channelRow = channels[0];

  // Process messages sequentially to keep ordering simple.
  for (const m of incoming) {
    try {
      await handleMessage(supabase, { ...m, channelRow });
    } catch (e) {
      console.error("[meta-webhook] handle error", e);
    }
  }

  return new Response("ok", { status: 200 });
});
