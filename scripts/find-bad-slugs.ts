import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await s.from("products").select("id, slug, name");
  const bad = (data || []).filter(p => /icircn|hacircrt|atacirct|acircra|racircnd|esenial|icircle|iuml|iacute/.test(p.slug));
  console.log(`Bad slugs: ${bad.length}`);
  for (const p of bad.slice(0, 50)) console.log(`  ${p.slug.padEnd(60)} ← ${p.name}`);
})();
