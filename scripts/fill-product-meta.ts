/**
 * Fill meta_title, meta_description, keywords for products where they are NULL/empty.
 * Template-based, uses product.name + category names + existing short_description.
 * Also fills short_description when description exists but short is empty.
 *
 * Run: npx tsx scripts/fill-product-meta.ts [--dry-run]
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

function titleCase(s: string): string {
  return (s || "").toLowerCase().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ").trim();
}

function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function deriveKeywords(name: string, categoryNames: string[]): string {
  const base = new Set<string>();
  const tokens = name.toLowerCase()
    .replace(/[^a-zăâîșț0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !/^(cu|de|la|pe|in|si|sau|pentru)$/.test(w));
  for (const t of tokens) base.add(t);
  for (const c of categoryNames) {
    const ct = c.toLowerCase().replace(/[^a-zăâîșț0-9 ]/gi, " ").split(/\s+/).filter(w => w.length > 2);
    for (const t of ct) base.add(t);
  }
  base.add("olivox");
  base.add("snep");
  base.add("romania");
  base.add("supliment natural");
  return Array.from(base).slice(0, 15).join(", ");
}

async function main() {
  const { data: cats } = await supabase.from("product_categories").select("slug, name");
  const catBySlug = new Map<string, string>();
  for (const c of cats || []) catBySlug.set(c.slug, c.name);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, meta_title, meta_description, keywords, category_slugs");

  let updated = 0;
  for (const p of products || []) {
    const updates: Record<string, string> = {};

    const catNames = (p.category_slugs || []).map((s: string) => catBySlug.get(s) || s).map(titleCase);
    const catText = catNames[0] || "";
    const prettyName = titleCase(p.name);

    // short_description from description if empty
    if (!p.short_description && p.description) {
      const plain = stripHtml(p.description);
      if (plain.length > 40) updates.short_description = plain.slice(0, 180);
    }

    // meta_title
    if (!p.meta_title) {
      const t = catText ? `${prettyName} — ${catText} | olivox.ro` : `${prettyName} | olivox.ro`;
      updates.meta_title = t.slice(0, 70);
    }

    // meta_description
    if (!p.meta_description) {
      const sd = stripHtml(updates.short_description || p.short_description || "");
      const base = sd || stripHtml(p.description || "") || `${prettyName} — produs disponibil pe olivox.ro.`;
      const tail = " Livrare 3-5 zile lucratoare in Romania.";
      const avail = 160 - tail.length;
      updates.meta_description = (base.slice(0, avail).replace(/\s+\S*$/, "") + tail).slice(0, 160);
    }

    // keywords
    if (!p.keywords) {
      updates.keywords = deriveKeywords(p.name, catNames);
    }

    if (!Object.keys(updates).length) continue;

    if (DRY) {
      console.log(`[dry] ${p.slug}:`, Object.keys(updates).join(","));
    } else {
      const { error } = await supabase.from("products").update(updates).eq("id", p.id);
      if (error) console.error(p.slug, error.message);
      else updated++;
    }
  }

  console.log(`\nUpdated ${updated} products`);
}

main().catch((e) => { console.error(e); process.exit(1); });
