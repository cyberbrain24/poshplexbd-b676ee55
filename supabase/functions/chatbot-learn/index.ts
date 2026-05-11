// Admin-only: mine recent customer chats + curated FAQs + product/order signals
// and auto-extract behavior rules + new FAQs into the chatbot knowledge base.
// Triggered manually from /admin/chatbot.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { aiChatCompletion } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Admin-only auth
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await userClient.auth.getUser();
  if (!userRes?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRow } = await admin
    .from("user_roles").select("role").eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Start run
  const { data: runRow, error: runErr } = await admin
    .from("chatbot_learning_runs")
    .insert({ status: "running", triggered_by: userRes.user.id })
    .select("*").single();
  if (runErr) {
    return new Response(JSON.stringify({ error: runErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const runId = runRow.id;

  try {
    // === 1. Past conversations (last 30 days, max 80 most-recent with ≥2 messages)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: convs } = await admin
      .from("chatbot_conversations")
      .select("id, channel, tag, last_message_at")
      .gte("last_message_at", since)
      .gt("message_count", 1)
      .order("last_message_at", { ascending: false })
      .limit(80);
    const convIds = (convs || []).map((c) => c.id);

    let messages: any[] = [];
    if (convIds.length > 0) {
      const { data: msgs } = await admin
        .from("chatbot_messages")
        .select("conversation_id, role, content, feedback, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
        .limit(1500);
      messages = msgs || [];
    }

    // Build compact transcripts (truncate per-message to 280 chars)
    const byConv = new Map<string, any[]>();
    for (const m of messages) {
      const arr = byConv.get(m.conversation_id) || [];
      arr.push(m);
      byConv.set(m.conversation_id, arr);
    }
    const transcripts = Array.from(byConv.entries()).slice(0, 60).map(([cid, arr]) => {
      const lines = arr.map((m) => {
        const fb = m.feedback === "up" ? " 👍" : m.feedback === "down" ? " 👎" : "";
        return `${m.role.toUpperCase()}${fb}: ${(m.content || "").slice(0, 280)}`;
      }).join("\n");
      return `--- conversation ${cid.slice(0, 8)} ---\n${lines}`;
    }).join("\n\n");

    // === 2. Admin-curated FAQ examples
    const { data: faqs } = await admin
      .from("chatbot_faqs")
      .select("question, answer, is_active, auto_generated")
      .eq("is_active", true)
      .eq("auto_generated", false)
      .order("sort_order")
      .limit(60);

    const faqText = (faqs || []).map(
      (f) => `Q: ${f.question}\nA: ${f.answer}`,
    ).join("\n\n");

    // === 3. Product catalog signals (best-sellers, top categories)
    const orderSince = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { data: items } = await admin
      .from("order_items")
      .select("product_name, quantity, created_at")
      .gte("created_at", orderSince)
      .limit(2000);
    const sellerMap = new Map<string, number>();
    for (const it of items || []) {
      sellerMap.set(it.product_name, (sellerMap.get(it.product_name) || 0) + (it.quantity || 1));
    }
    const bestSellers = Array.from(sellerMap.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([name, qty]) => `- ${name} (${qty} sold)`).join("\n");

    const { data: cats } = await admin
      .from("categories").select("name").limit(30);
    const categoryList = (cats || []).map((c) => c.name).join(", ");

    const { data: brands } = await admin
      .from("brands").select("name").limit(20);
    const brandList = (brands || []).map((b) => b.name).join(", ");

    // === 4. Existing learnings (so we don't duplicate)
    const { data: existingLearnings } = await admin
      .from("chatbot_learnings")
      .select("content").eq("is_active", true).limit(50);
    const existingText = (existingLearnings || []).map((l: any) => `- ${l.content}`).join("\n");

    // === 5. Ask the AI
    const settings = (await admin.from("chatbot_settings").select("text_model, model").maybeSingle()).data;
    const model = settings?.text_model || settings?.model || "google/gemini-2.5-flash";

    const systemPrompt = `You analyze customer service chat transcripts for POSHPLEX (a Bangladeshi streetwear brand) and extract concrete improvements for our shopping chatbot.

You will receive:
- Recent customer/AI chat transcripts (with 👍/👎 feedback)
- Existing admin-curated FAQs (the source of truth)
- Best-selling products and active categories/brands
- Existing learnings already in the knowledge base

Your job: produce JSON with three arrays. Be SHORT, CONCRETE, ACTIONABLE. No fluff.

Output JSON shape:
{
  "behavior_rules": [
    "<one-sentence rule the bot should always follow, e.g. 'Always confirm size and color before placing an order'>"
  ],
  "style_notes": [
    "<one-sentence tone/style note, e.g. 'Use short replies in English; avoid emojis other than ✅'>"
  ],
  "new_faqs": [
    { "question": "<verbatim style question customers ask>", "answer": "<concise admin-approved-style answer>" }
  ]
}

Rules:
- Maximum 5 items per array. Only include items that are clearly supported by the data.
- DO NOT duplicate anything that already exists in "Existing learnings" or "Existing FAQs".
- DO NOT invent product details, prices, or policies that are not in the data.
- For new_faqs, only include questions that appeared 2+ times across different conversations OR clearly reflect a knowledge gap (the AI gave a weak/wrong answer that got 👎).
- Behavior rules should improve sales conversion, accuracy, or customer experience.
- If you have nothing useful for an array, return [].

Respond with raw JSON only. No markdown fencing.`;

    const userPrompt = `=== RECENT TRANSCRIPTS (${byConv.size} conversations) ===
${transcripts || "(none)"}

=== EXISTING ADMIN FAQs ===
${faqText || "(none)"}

=== BEST-SELLERS (last 60 days) ===
${bestSellers || "(none)"}

=== CATEGORIES ===
${categoryList || "(none)"}

=== BRANDS ===
${brandList || "(none)"}

=== EXISTING LEARNINGS (do not duplicate) ===
${existingText || "(none)"}`;

    const aiResp = await aiChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI error ${aiResp.status}: ${t.slice(0, 300)}`);
    }
    const aiData = await aiResp.json();
    const raw = aiData?.choices?.[0]?.message?.content || "{}";
    // Strip ```json fences if the model added them
    const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    const behaviorRules: string[] = Array.isArray(parsed.behavior_rules) ? parsed.behavior_rules.slice(0, 5) : [];
    const styleNotes: string[] = Array.isArray(parsed.style_notes) ? parsed.style_notes.slice(0, 5) : [];
    const newFaqs: any[] = Array.isArray(parsed.new_faqs) ? parsed.new_faqs.slice(0, 5) : [];

    // === 6. Auto-apply (insert)
    let learningsAdded = 0;
    const sourceMeta = { run_id: runId, conversations_analyzed: byConv.size };
    for (const r of behaviorRules) {
      if (!r || typeof r !== "string") continue;
      const { error } = await admin.from("chatbot_learnings").insert({
        kind: "rule", content: r.trim().slice(0, 500), source: sourceMeta,
      });
      if (!error) learningsAdded++;
    }
    for (const s of styleNotes) {
      if (!s || typeof s !== "string") continue;
      const { error } = await admin.from("chatbot_learnings").insert({
        kind: "style", content: s.trim().slice(0, 500), source: sourceMeta,
      });
      if (!error) learningsAdded++;
    }

    let faqsAdded = 0;
    const { data: maxOrderRow } = await admin.from("chatbot_faqs").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    let nextOrder = (maxOrderRow?.sort_order ?? -1) + 1;
    for (const f of newFaqs) {
      if (!f?.question || !f?.answer) continue;
      const { error } = await admin.from("chatbot_faqs").insert({
        question: String(f.question).trim().slice(0, 300),
        answer: String(f.answer).trim().slice(0, 1500),
        sort_order: nextOrder++,
        is_active: true,
        auto_generated: true,
        source: `learning_run:${runId}`,
      });
      if (!error) faqsAdded++;
    }

    // Finish run
    await admin.from("chatbot_learning_runs").update({
      status: "succeeded",
      finished_at: new Date().toISOString(),
      conversations_analyzed: byConv.size,
      learnings_added: learningsAdded,
      faqs_added: faqsAdded,
      summary: { behavior_rules: behaviorRules, style_notes: styleNotes, new_faqs: newFaqs },
    }).eq("id", runId);

    return new Response(JSON.stringify({
      ok: true,
      run_id: runId,
      conversations_analyzed: byConv.size,
      learnings_added: learningsAdded,
      faqs_added: faqsAdded,
      preview: { behavior_rules: behaviorRules, style_notes: styleNotes, new_faqs: newFaqs },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("chatbot_learning_runs").update({
      status: "failed", finished_at: new Date().toISOString(), error: message.slice(0, 1000),
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
