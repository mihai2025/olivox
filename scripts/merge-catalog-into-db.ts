/**
 * Fuzzy-match catalog-data.json entries against DB products (by name), and fill
 * `description` and/or `short_description` when the DB row is empty.
 *
 * Run: npx tsx scripts/merge-catalog-into-db.ts [--dry-run]
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

type CatalogEntry = {
  name_raw: string;
  name_normalized: string;
  description: string | null;
  ingredients?: string | null;
  usage_info?: string | null;
  warnings?: string | null;
  code?: string | null;
  category_hint?: string | null;
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[îí]/g, "i")
    .replace(/[ăâ]/g, "a")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/\ufffd/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple token-based similarity: jaccard
function similarity(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

async function main() {
  const entries = JSON.parse(readFileSync("catalog-data.json", "utf8")) as CatalogEntry[];
  const { data: prods } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, source_id, sku");

  const products = prods || [];
  console.log(`catalog: ${entries.length} entries | db: ${products.length} products`);

  let matched = 0, updated = 0, skipped = 0;

  for (const p of products) {
    // Skip if description AND short_description already present
    const descEmpty = !p.description || p.description.replace(/<[^>]+>/g, "").trim().length < 40;
    if (!descEmpty && p.short_description) continue;

    // Find best matching catalog entry
    let best: { entry: CatalogEntry; score: number } | null = null;
    for (const e of entries) {
      const score = similarity(p.name, e.name_raw);
      if (score > (best?.score ?? 0)) best = { entry: e, score };
    }
    if (!best || best.score < 0.45) continue;
    matched++;

    const updates: Record<string, string> = {};
    const catDesc = (best.entry.description || "").trim();
    if (descEmpty && catDesc.length > 60) {
      const descHtml = `<p>${catDesc.replace(/\n\n+/g, "</p><p>").replace(/\n/g, " ")}</p>`;
      updates.description = descHtml;
    }
    if (!p.short_description && catDesc.length > 40) {
      updates.short_description = catDesc.slice(0, 200);
    }

    if (!Object.keys(updates).length) { skipped++; continue; }

    if (DRY) {
      console.log(`[dry] ${p.slug}  ← "${best.entry.name_raw}" (sim=${best.score.toFixed(2)}) fields: ${Object.keys(updates).join(",")}`);
    } else {
      const { error } = await supabase.from("products").update(updates).eq("id", p.id);
      if (error) console.error(p.slug, error.message);
      else { updated++; console.log(`✓ ${p.slug}  ← "${best.entry.name_raw.slice(0, 50)}"`); }
    }
  }

  console.log(`\nMatched ${matched}, updated ${updated}, skipped ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
