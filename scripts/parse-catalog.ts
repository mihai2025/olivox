/**
 * Parse the SNEP catalog (`catalog.txt`, layout-preserved pdftotext output)
 * into a structured JSON map of products to their per-section content.
 *
 * Output: `catalog-data.json` at the repo root, an array of:
 *   {
 *     name_raw: string,            // header exactly as found (with � for mangled diacritics)
 *     name_normalized: string,     // � stripped, collapsed whitespace
 *     description: string | null,  // leading prose of the block
 *     ingredients: string | null,  // text from "Ce este înăuntru / Ingredienti / Ingredients"
 *     usage_info: string | null,   // text from "Mod de utilizare / Come si usa"
 *     warnings: string | null,     // text from "Avertismente / Avvertenze"
 *     category_hint: string | null,// last category banner before the product
 *     code: string | null,         // first "Item NNNN" / "COD: NNNN" / "Cod produs: NNNN"
 *   }
 *
 * Run:
 *   cd E:/olivox
 *   npx tsx scripts/parse-catalog.ts
 *
 * Read-only: does NOT mutate the database.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CATALOG_PATH = resolve(process.cwd(), "catalog.txt");
const OUTPUT_PATH = resolve(process.cwd(), "catalog-data.json");

// -- Heuristics ------------------------------------------------------------

// Body starts after the TOC. The TOC ends around line 287 ("LISTA DE PREURI 172")
// and the first real body header (a product/category header at column 0) is
// "VEGAN PLUS CACAO" near line 379. We use a conservative skip + a content
// heuristic (must see the "PASIUNEA NOASTR" preface) to avoid drift.
const TOC_MAX_LINE = 350;

// Sub-section labels. The catalog rarely uses them explicitly, but when it
// does they appear at the start of a line (possibly indented) and are
// followed by a colon or a newline.
const SECTION_PATTERNS: Record<"ingredients" | "usage_info" | "warnings", RegExp[]> = {
  ingredients: [
    /^\s*(ce\s+este\s+[îiI�]n[aă�]untru)\s*[:.\-]?\s*$/i,
    /^\s*(ingredien[tț]i|ingredien[tț]e|ingredients)\s*[:.\-]?\s*$/i,
    /^\s*(compozi[tț]ie|composizione)\s*[:.\-]?\s*$/i,
  ],
  usage_info: [
    /^\s*(mod\s+de\s+utilizare|mod\s+de\s+folosire)\s*[:.\-]?\s*$/i,
    /^\s*(cum\s+s[ăa�]?[\-\s]?l\s+folose[sș�]ti)\s*[:.\-]?\s*$/i,
    /^\s*(come\s+si\s+usa|modalit[àa]\s+d['’]uso)\s*[:.\-]?\s*$/i,
    /^\s*(utilizare|usage)\s*[:.\-]?\s*$/i,
  ],
  warnings: [
    /^\s*(avertismente|avertizari|aten[tț]ie)\s*[:.\-]?\s*$/i,
    /^\s*(avvertenze|warnings)\s*[:.\-]?\s*$/i,
  ],
};

// Category banners are short ALL-CAPS lines that are *indented* (header lines
// for products are at column 0). We collect a small whitelist of recurring
// banners; anything matching these becomes the running category_hint.
const CATEGORY_KEYWORDS = [
  "PROGRAME",
  "SUPLIMENTE ALIMENTARE",
  "SUPLIMENTE",
  "�NLOCUITOR DE MAS",
  "�NLOCUITOR",
  "ALIMENTE FUNCIONALE",
  "ALIMENTE",
  "�NGRIJIRE CORPORAL",
  "�NGRIJIRE PERSONAL",
  "�NGRIJIRE",
  "PARFUMURI DE CAMER",
  "PARFUMURI",
  "�NGRIJIREA MEDIULUI",
  "BIO MOLECULE",
  "BIO MOLECOLE",
  "BIO EFFECTIVE",
  "HYDROPURA",
  "SUNCARE",
  "ESSENTIAL OIL",
];

// Match a product header: ALL CAPS at column 0, ≥3 chars, may contain
// digits/punct/`�`. Excludes pure numbers (page footers) and the Snep
// boilerplate.
const HEADER_RE =
  /^[A-Z0-9�][A-Z0-9�'’\-\s\&\+\.\/\(\)"]{2,}$/;

const HEADER_DENYLIST = new Set<string>([
  "CHOOSE YOUR",
  "LANGUAGE",
  "CHOOSE YOUR LANGUAGE",
  "YOUR PROGRAM",
  "INDEX",
  "NOTES",
  "SNEP",
  "SNEP SPA",
  "HOME",
  "GARDEN",
  "PETS",
  "ITEM",
  "COD",
  "PASIUNEA",
  "NOASTR",
  "NOI DE",
  "NOI DE SNEP",
  "MOSTRE",
  "REZERVE",
  "BASE",
  "COMPLETE",
  "COMPOSIZIONE",
  "INGREDIENTI",
  "AVVERTENZE",
  "FILOZOFIE",
  "EDIIE",
  "STARTING POINT",
  "SHAKER FREE",
  "+ SHAKER FREE",
  "WWW.MYSNEP.COM",
  "WWW.HYDROPURA.IT",
  "WWW.SNEP.COM",
  "MADE IN ITALY",
  "MADE",
  "IN ITALY",
  "OPRII CONSUMUL DE PLASTIC",
  "BEA AP DE CALITATE SUPERIOAR",
  "CALITATE MADE IN ITALY",
  "�NCEPE S ECONOMISETI",
  "TREI CATEGORII DE MICROORGANISME",
  "OSMOZ INVERS",
  "HYDROGENERATOR",
  "FILTRU EXTERN",
  "PUNE HYDROPURA PE MASA",
  "TRAVEL SET SPRAY",
  "MOSTRE PARFUMURI",
  "GEANT & POCHETTE SUNCARE",
  "GEANT",
  "POCHETTE",
  // long boilerplate prose that happens to be uppercase-ish
  "TOATE PRODUSELE, ALIMENTELE, PRODUSELE",
]);

const HEADER_DENY_PREFIXES = [
  "ITEM ",
  "COD:",
  "COD ",
  "WWW.",
  "VIA ",
  "VIALE ",
  "TEL ",
  "FAX ",
  "EDIIE ",
  "AROME",
  "1)",
  "2)",
  "3)",
  "4)",
  "5)",
  "+ ",
  "*",
];

// -- Helpers ---------------------------------------------------------------

// Strip layout-bleed tokens that get glued to the right of a header due to
// pdftotext column reconstruction (e.g. "VEGAN PLUS ANANAS    CHOOSE YOUR").
function stripLayoutBleed(headerLine: string): string {
  return headerLine
    .replace(/\f/g, "")
    .replace(/\s{2,}CHOOSE\s+YOUR.*$/i, "")
    .replace(/\s{2,}LANGUAGE\s*$/i, "")
    .replace(/\s{2,}Item\s+[0-9A-Z\-].*$/i, "")
    .replace(/\s{2,}COD\s*[:\-]?\s*[0-9A-Z]+.*$/i, "")
    .replace(/\s{2,}PROMO.*$/i, "")
    .replace(/\s{2,}\d{1,4}\s*$/, "") // trailing page number
    .replace(/\s+$/g, "")
    .trim();
}

// Tag-lines that appear at column 0 directly under a real header but are
// flavor/variant subtitles, not new products.
const TAGLINE_DENYLIST = new Set<string>([
  "FR ADAOS DE ZAHR",
  "FR ADAOS",
  "PROMO",
  "PROMO X3",
  "NEW",
  "NOU",
]);

function looksLikeHeader(rawLine: string): boolean {
  // Must start at column 0 (no leading whitespace) -> product header.
  if (rawLine.length === 0 || /^\s/.test(rawLine)) return false;
  const cleaned = stripLayoutBleed(rawLine);
  const line = cleaned.trim();
  if (line.length < 3) return false;
  if (/^\d+$/.test(line)) return false; // page numbers
  if (/^[\W_]+$/.test(line)) return false;
  if (HEADER_DENYLIST.has(line.toUpperCase())) return false;
  if (TAGLINE_DENYLIST.has(line.toUpperCase())) return false;
  for (const p of HEADER_DENY_PREFIXES) {
    if (line.toUpperCase().startsWith(p)) return false;
  }
  // Reject "rezerv" reference table rows (3-column shorthand product names)
  // and headers that are only multiple short tokens with multiple double-spaces
  // suggesting they are actually a horizontal table.
  if (/\s{3,}\S+\s{3,}\S+/.test(rawLine)) return false;
  // Header must be uppercase-ish: ratio of uppercase letters to total letters
  const letters = line.replace(/[^A-Za-z�]/g, "");
  if (letters.length < 3) return false;
  const upper = line.replace(/[^A-Z�]/g, "");
  const ratio = upper.length / Math.max(letters.length, 1);
  if (ratio < 0.85) return false;
  // No sentence punctuation typical of prose
  if (/[.!?]\s/.test(line)) return false;
  return HEADER_RE.test(line);
}

// Continuation lines of multi-line category banners (e.g. "�NLOCUITOR" then
// "DE MAS" on the next line). They are indented and short.
const CATEGORY_CONTINUATION = new Set<string>([
  "DE MAS",
  "ALIMENTARE",
  "CORPORAL",
  "PERSONAL",
  "FUNCIONALE",
  "DE CAMER",
  "MEDIULUI",
  "MOLECULE",
  "MOLECOLE",
  "EFFECTIVE",
]);

function looksLikeCategoryBanner(rawLine: string): string | null {
  // Category banners are indented and contain a category keyword.
  if (!/^\s+/.test(rawLine)) return null;
  const line = rawLine.trim();
  if (line.length < 3) return null;
  if (CATEGORY_CONTINUATION.has(line.toUpperCase())) {
    // Continuation line — return a sentinel so caller drops it from blocks
    // but keeps the existing category_hint.
    return "__CONTINUATION__";
  }
  for (const kw of CATEGORY_KEYWORDS) {
    if (line === kw || line.startsWith(kw + " ") || line.endsWith(" " + kw)) {
      return kw;
    }
  }
  return null;
}

function normalizeName(raw: string): string {
  return raw
    .replace(/�/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSection(
  line: string,
): "ingredients" | "usage_info" | "warnings" | null {
  for (const [section, patterns] of Object.entries(SECTION_PATTERNS) as [
    "ingredients" | "usage_info" | "warnings",
    RegExp[],
  ][]) {
    for (const re of patterns) {
      if (re.test(line)) return section;
    }
  }
  return null;
}

function extractCode(blockLines: string[]): string | null {
  for (const l of blockLines) {
    let m = l.match(/Item\s+([0-9A-Z]+)/i);
    if (m) return m[1];
    m = l.match(/COD\s*[:\-]?\s*([0-9A-Z]+)/i);
    if (m) return m[1];
    m = l.match(/Cod\s+produs\s*[:\-]?\s*([0-9A-Z]+)/i);
    if (m) return m[1];
  }
  return null;
}

function cleanProse(text: string): string {
  return text
    // strip stray "Item NNNN" / "4000NNNN" code lines anywhere on a line
    .replace(/^.*\bItem\s+[0-9A-Z\-]+.*$/gim, "")
    .replace(/^.*\b4\d{6,}[A-Z]?\b.*$/gm, "")
    .replace(/^.*\bCOD\s*[:\-]?\s*[0-9A-Z]+\b.*$/gim, "")
    .replace(/^.*\bPROMO\s*x?\d.*$/gim, "")
    .replace(/^\s*CHOOSE YOUR\s*$/gim, "")
    .replace(/^\s*LANGUAGE\s*$/gim, "")
    // strip lone page numbers
    .replace(/^\s*\d{1,3}\s*$/gm, "")
    // collapse multiple blank lines and trailing whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/^\s+|\s+$/g, "")
    .trim();
}

interface ProductBlock {
  name_raw: string;
  name_normalized: string;
  description: string | null;
  ingredients: string | null;
  usage_info: string | null;
  warnings: string | null;
  category_hint: string | null;
  code: string | null;
}

function parse(catalog: string): ProductBlock[] {
  // Strip form-feed page-break markers; pdftotext puts them at column 0
  // which would otherwise hide product headers that follow them.
  const lines = catalog.replace(/\f/g, "").split(/\r?\n/);
  const products: ProductBlock[] = [];

  // Find body start: skip past TOC_MAX_LINE OR until we see the first
  // real body header that comes *after* line 350.
  let i = TOC_MAX_LINE;

  let currentCategory: string | null = null;
  let currentHeader: string | null = null;
  let currentBlock: string[] = [];

  function flush() {
    if (!currentHeader) return;
    const blockText = currentBlock.join("\n");
    const code = extractCode(currentBlock);

    // Split on sub-sections.
    const sections: Record<
      "description" | "ingredients" | "usage_info" | "warnings",
      string[]
    > = {
      description: [],
      ingredients: [],
      usage_info: [],
      warnings: [],
    };
    let active: keyof typeof sections = "description";

    for (const raw of currentBlock) {
      const detected = detectSection(raw);
      if (detected) {
        active = detected;
        continue;
      }
      sections[active].push(raw);
    }

    const description = cleanProse(sections.description.join("\n")) || null;
    const ingredients = cleanProse(sections.ingredients.join("\n")) || null;
    const usage_info = cleanProse(sections.usage_info.join("\n")) || null;
    const warnings = cleanProse(sections.warnings.join("\n")) || null;

    // Skip blocks that have no usable content at all.
    if (!description && !ingredients && !usage_info && !warnings && !code) {
      currentHeader = null;
      currentBlock = [];
      return;
    }

    products.push({
      name_raw: currentHeader,
      name_normalized: normalizeName(currentHeader),
      description,
      ingredients,
      usage_info,
      warnings,
      category_hint: currentCategory,
      code,
    });
    currentHeader = null;
    currentBlock = [];
    void blockText;
  }

  for (; i < lines.length; i++) {
    const line = lines[i];

    // Track category banners.
    const banner = looksLikeCategoryBanner(line);
    if (banner) {
      if (banner !== "__CONTINUATION__") {
        currentCategory = banner;
      }
      // Don't add banners (or continuations) to the current block.
      continue;
    }

    if (looksLikeHeader(line)) {
      flush();
      currentHeader = stripLayoutBleed(line);
      currentBlock = [];
      continue;
    }

    if (currentHeader) {
      currentBlock.push(line);
    }
  }
  flush();

  return products;
}

// -- Main ------------------------------------------------------------------

function main() {
  const text = readFileSync(CATALOG_PATH, "utf8");
  const products = parse(text);

  // De-duplicate consecutive identical headers caused by re-banner repetition.
  const dedup: ProductBlock[] = [];
  for (const p of products) {
    const prev = dedup[dedup.length - 1];
    if (
      prev &&
      prev.name_normalized === p.name_normalized &&
      !prev.description &&
      p.description
    ) {
      // upgrade previous empty entry with new content
      dedup[dedup.length - 1] = p;
      continue;
    }
    if (prev && prev.name_normalized === p.name_normalized && prev.description && !p.description) {
      // skip empty duplicate
      continue;
    }
    dedup.push(p);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(dedup, null, 2), "utf8");

  const total = dedup.length;
  const withDesc = dedup.filter(p => p.description).length;
  const withIngredients = dedup.filter(p => p.ingredients).length;
  const withUsage = dedup.filter(p => p.usage_info).length;
  const withWarnings = dedup.filter(p => p.warnings).length;
  const withCategory = dedup.filter(p => p.category_hint).length;
  const withCode = dedup.filter(p => p.code).length;

  const report = [
    "=== Catalog parse summary ===",
    `Source:   ${CATALOG_PATH}`,
    `Output:   ${OUTPUT_PATH}`,
    `Products: ${total}`,
    `  with description:  ${withDesc}`,
    `  with ingredients:  ${withIngredients}`,
    `  with usage_info:   ${withUsage}`,
    `  with warnings:     ${withWarnings}`,
    `  with category:     ${withCategory}`,
    `  with code:         ${withCode}`,
    "",
    "First 10 product names (normalized):",
    ...dedup.slice(0, 10).map((p, idx) => `  ${idx + 1}. ${p.name_normalized}`),
    "",
    "Last 5 product names (normalized):",
    ...dedup.slice(-5).map((p, idx) => `  ${total - 5 + idx + 1}. ${p.name_normalized}`),
  ].join("\n");

  console.log(report);
}

main();
