import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
for (const line of readFileSync(".env.local","utf8").split("\n")) { const m=line.match(/^([A-Z0-9_]+)=(.*)$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; }
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false}});
(async()=>{
  const {data}=await s.from("products").select("id, name, slug, description");
  const rows=(data||[]).map(p=>{
    const plain=(p.description||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
    return { slug:p.slug, name:p.name, len:plain.length, plain };
  });
  const empty = rows.filter(r => r.len === 0);
  const veryShort = rows.filter(r => r.len > 0 && r.len < 80);
  const short = rows.filter(r => r.len >= 80 && r.len < 200);
  const ok = rows.filter(r => r.len >= 200 && r.len < 2000);
  const long = rows.filter(r => r.len >= 2000);
  console.log(`Total: ${rows.length}`);
  console.log(`  Empty:           ${empty.length}`);
  console.log(`  < 80 chars:      ${veryShort.length}`);
  console.log(`  80-200 chars:    ${short.length}`);
  console.log(`  200-2000 chars:  ${ok.length}`);
  console.log(`  > 2000 chars:    ${long.length}`);
  console.log(`\nSample very short (need rewrite):`);
  for (const r of veryShort.slice(0,10)) console.log(`  ${r.slug} (${r.len}) — "${r.plain.slice(0,60)}"`);
  console.log(`\nSample empty:`);
  for (const r of empty.slice(0,10)) console.log(`  ${r.slug} — ${r.name}`);
})();
