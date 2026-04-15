/**
 * One-off diagnostic: compare catalog.txt (PDF extracted) vs Supabase DB.
 *
 * Usage:
 *   cd E:/olivox
 *   npx tsx scripts/diagnose.ts
 *
 * Does NOT mutate the database.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

// -- Env loading (same convention as scrape-mysnep.ts) ---------------------
const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// -- Helpers ---------------------------------------------------------------

// Map Romanian diacritics / PDF-garbled chars to ASCII for robust matching.
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .replace(/[ĂÂÀÁÄÃÅ]/gi, "A")
    .replace(/[ÎÍÌÏ]/gi, "I")
    .replace(/[ȘŞ]/gi, "S")
    .replace(/[ȚŢ]/gi, "T")
    .replace(/[Ê]/gi, "E")
    .replace(/[Ô]/gi, "O")
    .replace(/[Û]/gi, "U")
    .replace(/&/g, " AND ")
    .replace(/\b[\u0080-\uFFFF]\b/g, "") // stray garbled chars
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function slugify(s: string): string {
  return normalize(s).toLowerCase().replace(/\s+/g, "-");
}

// -- Parse catalog.txt -----------------------------------------------------

const raw = readFileSync(resolve(process.cwd(), "catalog.txt"), "utf8");
const lines = raw.split(/\r?\n/);

// Strategy: iterate all lines. A product name line is a "mostly uppercase"
// short line that is NOT a section header. Section headers appear as
// big-type category banners (e.g. "NUTRIIE", "INGRIJIRE PERSONAL", etc.).
// We collect (name, lineIndex) then dedupe (case-insensitive normalized).

const SECTION_HEADERS = new Set(
  [
    "NUTRITIE",
    "INGRIJIRE PERSONALA",
    "INGRIJIREA MEDIULUI",
    "INGRIJIRE CORPORALA",
    "CONTROLUL GREUTATII",
    "PROGRAME",
    "SUPLIMENTE ALIMENTARE",
    "SPORT",
    "SPORT ELEVEN",
    "ALIMENTE FUNCTIONALE",
    "BEAUTY SNEP",
    "NAT",
    "SNEPLUMAX",
    "MAKE UP",
    "MAKE-UP",
    "PARFUMURI",
    "PARFUMURI DE CAMERA",
    "BIO MOLECULE",
    "BIO MOLECOLE",
    "BIO EFFECTIVE",
    "HYDROPURA",
    "SUNCARE",
    "INLOCUITOR DE MAS",
    "INLOCUITOR DE MASA",
    "NOI DE SNEP",
    "REZERV",
    "REZERVE",
    "INDEX",
    "NOTES",
    "SNEP SPA",
    "LISTA DE PRETURI",
    "LISTA DE PREURI",
    "YOUR WELL BEING SOLUTION",
    "CHOOSE YOUR LANGUAGE",
    "PASIUNEA NOASTRA",
    "COD",
    "ITEM",
    "PROMO",
    "NOASTRA",
  ]
);

// Detect "looks like uppercase product name" line.
function looksLikeProductName(line: string): string | null {
  const t = line.replace(/\s{2,}.*$/, "").trim(); // drop long trailing whitespace (TOC page numbers)
  if (!t) return null;
  // The TOC has entries like "VEGAN PLUS CACAO" followed by many spaces and a page number.
  // And body has entries like "VEGAN PLUS CACAO" alone.
  const cleaned = t.replace(/\s+\d+$/, "").trim(); // strip trailing page number
  if (cleaned.length < 2 || cleaned.length > 70) return null;
  // must contain a letter
  if (!/[A-Za-z]/.test(cleaned)) return null;
  // must be overwhelmingly uppercase letters / digits
  const letters = cleaned.match(/[A-Za-z\u00C0-\u017F\u0080-\uFFFF]/g) || [];
  const upper = cleaned.match(/[A-Z\u00C0-\u017F\u0080-\uFFFF]/g) || [];
  // exclude lowercase-heavy lines
  const lowers = (cleaned.match(/[a-z]/g) || []).length;
  if (lowers > 2) return null;
  if (letters.length < 2) return null;
  if (upper.length / letters.length < 0.8) return null;
  // exclude pure-number or single letters
  if (/^[0-9 .-]+$/.test(cleaned)) return null;
  // exclude known decoration strings
  const norm = normalize(cleaned);
  if (!norm) return null;
  if (SECTION_HEADERS.has(norm)) return null;
  if (norm === "CHOOSE YOUR LANGUAGE" || norm === "CHOOSE YOUR") return null;
  if (norm.startsWith("ITEM ")) return null;
  if (norm.startsWith("COD ")) return null;
  if (norm.startsWith("PROMO")) return null;
  if (/^\d+$/.test(norm)) return null;
  if (norm.length < 3) return null;
  // exclude obvious prose fragments (should have been caught by lowers rule but extra safety)
  return cleaned;
}

// First pass: extract all candidate product-name lines
type Cand = { raw: string; norm: string; line: number };
const candidates: Cand[] = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Some TOC lines have the name AND a page-number AND sometimes another name.
  // Split on 3+ spaces to isolate column content.
  const pieces = line.split(/\s{3,}/).map((p) => p.trim()).filter(Boolean);
  for (const p of pieces) {
    const n = looksLikeProductName(p);
    if (n) {
      candidates.push({ raw: n, norm: normalize(n), line: i + 1 });
    }
  }
}

// Dedupe by normalized name, keeping first occurrence line number
const catalogMap = new Map<string, { raw: string; line: number }>();
for (const c of candidates) {
  if (!catalogMap.has(c.norm)) {
    catalogMap.set(c.norm, { raw: c.raw, line: c.line });
  }
}

// Further filter out clearly non-product tokens that still slipped through
const NON_PRODUCT_NOISE = new Set([
  "INDEX",
  "NOTES",
  "SNEP",
  "SNEP SPA",
  "ITALY",
  "PI",
  "WWW MYSNEP COM",
  "PROMO",
  "EDITIE NOIEMBRIE",
  "HOME",
  "GARDEN",
  "PETS",
  "BE BIO EFFECTIVE",
  "EM BIO MOLECULE",
  "COD",
  "ITEM",
  "NATURAL VOLUME",
  "WATERPROOF",
  "OSMOZ INVERS",
  "HYDROGENERATOR",
  "FILTRU EXTERN",
  "TREI CATEGORII DE MICROORGANISME",
  "LOT",
  "LA SNEP",
  "PLUS",
  "Z",
  "NOASTRA",
  "NOI DE SNEP",
  "PASIUNEA",
  "NOASTR",
  "FR",
  "CREEM",
  "EDITIE",
  "ELEVEN",
  "NAT",
  "MAKE UP",
  "PARFUMURI",
  "SPORT",
  "REZERV",
  "REZERVE",
  "SUNCARE",
]);

for (const k of [...catalogMap.keys()]) {
  if (NON_PRODUCT_NOISE.has(k)) catalogMap.delete(k);
}

// -- Fetch DB --------------------------------------------------------------

async function main() {
  const [{ data: cats, error: catErr }, { data: prods, error: prodErr }] =
    await Promise.all([
      supabase.from("product_categories").select("id, parent_id, name, slug"),
      supabase
        .from("products")
        .select(
          "id, source_id, name, slug, description, short_description, ingredients, warnings, usage_info"
        ),
    ]);

  if (catErr) throw catErr;
  if (prodErr) throw prodErr;

  const categories = cats || [];
  const products = prods || [];

  // Expected top-level categories from catalog
  const expectedCats: { name: string; slug: string; parent?: string }[] = [
    { name: "Nutriție", slug: "nutritie" },
    { name: "Controlul Greutății", slug: "controlul-greutatii", parent: "nutritie" },
    { name: "Programe", slug: "programe", parent: "nutritie" },
    { name: "Suplimente Alimentare", slug: "suplimente-alimentare", parent: "nutritie" },
    { name: "Sport", slug: "sport", parent: "nutritie" },
    { name: "Alimente Funcționale", slug: "alimente-functionale", parent: "nutritie" },
    { name: "Îngrijire Personală", slug: "ingrijire-personala" },
    { name: "Beauty Snep", slug: "beauty-snep", parent: "ingrijire-personala" },
    { name: "NAT", slug: "nat", parent: "ingrijire-personala" },
    { name: "SnepLumax", slug: "sneplumax", parent: "ingrijire-personala" },
    { name: "Make-Up", slug: "make-up", parent: "ingrijire-personala" },
    { name: "Parfumuri", slug: "parfumuri", parent: "ingrijire-personala" },
    { name: "Îngrijirea Mediului", slug: "ingrijirea-mediului" },
    { name: "Parfumuri de Cameră", slug: "parfumuri-de-camera", parent: "ingrijirea-mediului" },
    { name: "Bio Molecule", slug: "bio-molecule", parent: "ingrijirea-mediului" },
    { name: "Bio Effective", slug: "bio-effective", parent: "ingrijirea-mediului" },
    { name: "Hydropura", slug: "hydropura", parent: "ingrijirea-mediului" },
  ];

  const dbCatSlugs = new Set(categories.map((c: any) => c.slug));
  const missingCats = expectedCats.filter((c) => !dbCatSlugs.has(c.slug));

  // Product name comparison
  const dbNameNormToProd = new Map<string, any>();
  for (const p of products) {
    dbNameNormToProd.set(normalize(p.name), p);
  }

  const catalogNames = [...catalogMap.entries()].map(([norm, v]) => ({
    norm,
    raw: v.raw,
    line: v.line,
  }));

  const inCatalogNotDB = catalogNames.filter((c) => !dbNameNormToProd.has(c.norm));
  const dbNormSet = new Set(dbNameNormToProd.keys());
  const catalogNormSet = new Set(catalogMap.keys());
  const inDBNotCatalog = products.filter(
    (p: any) => !catalogNormSet.has(normalize(p.name))
  );

  // Empty field checks
  const emptyCounts = {
    description: 0,
    short_description: 0,
    ingredients: 0,
    warnings: 0,
    usage_info: 0,
  };
  const isEmpty = (v: any) => v == null || String(v).trim() === "";
  const prodMissingSummary: { name: string; missing: string[] }[] = [];
  for (const p of products as any[]) {
    const missing: string[] = [];
    for (const k of Object.keys(emptyCounts) as (keyof typeof emptyCounts)[]) {
      if (isEmpty(p[k])) {
        emptyCounts[k]++;
        missing.push(k);
      }
    }
    if (missing.length >= 2) prodMissingSummary.push({ name: p.name, missing });
  }
  prodMissingSummary.sort((a, b) => b.missing.length - a.missing.length);

  // -- Build markdown report --
  const out: string[] = [];
  out.push(`# Olivox Catalog vs Supabase DB — Diagnostic Report`);
  out.push("");
  out.push(`_Generated: ${new Date().toISOString()}_`);
  out.push("");
  out.push(`- DB products: **${products.length}**`);
  out.push(`- Catalog product-name candidates (deduped): **${catalogMap.size}**`);
  out.push(`- DB categories: **${categories.length}**`);
  out.push("");

  // A
  out.push(`## A. Categories`);
  out.push("");
  out.push(`### Current categories in DB (${categories.length})`);
  out.push("");
  if (categories.length === 0) {
    out.push("_none_");
  } else {
    for (const c of categories as any[]) {
      out.push(`- **${c.name}** (slug: \`${c.slug}\`${c.parent_id ? `, parent_id: ${c.parent_id}` : ""})`);
    }
  }
  out.push("");
  out.push(`### Expected from catalog but NOT in DB (${missingCats.length})`);
  out.push("");
  if (missingCats.length === 0) {
    out.push("_all expected categories are present_");
  } else {
    for (const c of missingCats) {
      out.push(`- **${c.name}** → slug: \`${c.slug}\`${c.parent ? ` (parent: \`${c.parent}\`)` : ""}`);
    }
  }
  out.push("");

  // B
  out.push(`## B. Products`);
  out.push("");
  out.push(`- Catalog: **${catalogMap.size}** distinct product-name candidates`);
  out.push(`- DB: **${products.length}** products`);
  out.push("");
  out.push(`### In catalog but NOT in DB (${inCatalogNotDB.length})`);
  out.push("");
  if (inCatalogNotDB.length === 0) {
    out.push("_none_");
  } else {
    for (const c of inCatalogNotDB) {
      out.push(`- \`${c.raw}\` (catalog.txt line ${c.line})`);
    }
  }
  out.push("");
  out.push(`### In DB but NOT matched to catalog (${inDBNotCatalog.length})`);
  out.push("");
  out.push(`_Likely variants, duplicates, renamed entries, or diacritics mismatch._`);
  out.push("");
  if (inDBNotCatalog.length === 0) {
    out.push("_none_");
  } else {
    for (const p of inDBNotCatalog as any[]) {
      out.push(`- \`${p.name}\` (source_id: ${p.source_id ?? "—"})`);
    }
  }
  out.push("");

  // C
  out.push(`## C. Products with empty fields`);
  out.push("");
  for (const [k, v] of Object.entries(emptyCounts)) {
    out.push(`- **${v}** products missing \`${k}\``);
  }
  out.push("");
  out.push(`### Top products missing 2+ fields (up to 20)`);
  out.push("");
  const top = prodMissingSummary.slice(0, 20);
  if (top.length === 0) {
    out.push("_none_");
  } else {
    for (const p of top) {
      out.push(`- **${p.name}** — missing: ${p.missing.join(", ")}`);
    }
  }
  out.push("");

  const md = out.join("\n");
  writeFileSync(resolve(process.cwd(), "diagnose-report.md"), md, "utf8");
  console.log(md);
  console.log("\n---\nWritten to diagnose-report.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
