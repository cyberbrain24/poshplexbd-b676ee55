import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: files } = await supabase.storage.from("music").list("", { limit: 1000 });
  if (files?.length) {
    await supabase.storage.from("music").remove(files.map((f) => f.name));
  }
  const { error } = await supabase.storage.deleteBucket("music");
  return new Response(JSON.stringify({ ok: !error, error: error?.message, removed: files?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
