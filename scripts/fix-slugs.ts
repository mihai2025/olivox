/**
 * Re-slugify products with broken slugs (containing HTML-entity remnants like
 * "icircn", "atacirct", "hacircrt", etc.) by deriving slug fresh from the name.
 * Ensures uniqueness — appends source_id on collision.
 *
 * Run: npx tsx scripts/fix-slugs.ts [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const DRY = process.argv.includes("--dry-run");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ș/g, "s").replace(/ş/g, "s")
    .replace(/ț/g, "t").replace(/ţ/g, "t")
    .replace(/ă/g, "a").replace(/â/g, "a").replace(/î/g, "i")
    .replace(/&amp;/g, "and")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

const BAD_RX = /icircn|hacircrt|atacirct|acircra|racircnd|esenial|icirc|acirc|nbsp|amp|iacute|lmacircie|icircnlocuire|ganoderm\b|uleiu/;

async function main() {
  const { data: all } = await supabase.from("products").select("id, slug, name, source_id");
  const products = all || [];
  const usedSlugs = new Set(products.map(p => p.slug));

  const bad = products.filter(p => BAD_RX.test(p.slug));
  console.log(`Found ${bad.length} bad slugs`);

  let updated = 0;
  for (const p of bad) {
    let newSlug = slugify(p.name);
    if (!newSlug) continue;
    if (usedSlugs.has(newSlug) && newSlug !== p.slug) {
      newSlug = `${newSlug}-${String(p.source_id || p.id).toLowerCase()}`;
    }
    if (newSlug === p.slug) continue;

    if (DRY) {
      console.log(`[dry] ${p.slug}  →  ${newSlug}`);
    } else {
      const { error } = await supabase.from("products").update({ slug: newSlug }).eq("id", p.id);
      if (error) console.error(p.slug, error.message);
      else { updated++; usedSlugs.delete(p.slug); usedSlugs.add(newSlug); console.log(`✓ ${p.slug}  →  ${newSlug}`); }
    }
  }
  console.log(`\nUpdated ${updated} slugs`);
}

main().catch((e) => { console.error(e); process.exit(1); });
