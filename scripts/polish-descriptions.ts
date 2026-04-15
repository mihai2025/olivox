/**
 * Polish weak / missing Romanian product descriptions in Supabase.
 *
 * Rules:
 *  - Target products where stripped-HTML description length < 200 chars OR
 *    description contains the replacement char U+FFFD ("�").
 *  - Skip merchandise (tricou, caciul, fular, termos, etc.) — see MERCH_KEYWORDS.
 *  - If a product already has >=200 chars of clean text (no �), leave it alone.
 *  - Fuzzy-match against catalog-data.json (jaccard >= 0.45) to seed content.
 *  - Clean mangled diacritics (� -> remove or replace from a small heuristic list).
 *  - Compose final HTML in <p>…</p> blocks, 120-300 words.
 *  - Update `short_description` when empty (plain text 120-180 chars).
 *
 * Run:
 *   npx tsx scripts/polish-descriptions.ts --dry-run
 *   npx tsx scripts/polish-descriptions.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---- env ----
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
const VERBOSE = process.argv.includes("--verbose");

// ---- types ----
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

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_slugs: string[] | null;
  sku: string | null;
};

// ---- merch filter ----
const MERCH_KEYWORDS = [
  "tricou",
  "caciul",
  "caciula",
  "fular",
  "termos",
  "pixuri",
  "pix snep",
  "agenda",
  "catalog general",
  "catalog a5",
  "catalog de produse",
  "bratar",
  "brar",
  "brri",
  "abtibild",
  "abibild",
  "the leader book",
  "snepcard",
  "shaker",
  "agitator",
  "husa pentru tableta",
  "slimfit",
  "jacheta",
  "husa valiza",
  "plac de silicon",
  "placa de silicon",
  "gift box",
  "cupa snep",
  "cup snep",
  "capsule door",
  "pochette",
  "geanta frigorific",
  "rezervati costa",
];
/** normalize Romanian for substring matching */
function toPlainRo(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[îí]/g, "i")
    .replace(/[ăâ]/g, "a")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/\uFFFD/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function isMerch(p: Product): boolean {
  const hay = `${toPlainRo(p.name)} ${toPlainRo(p.slug)}`;
  return MERCH_KEYWORDS.some((kw) => hay.includes(kw));
}

// ---- helpers ----
function stripHtml(html: string | null | undefined): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
function hasMojibake(s: string | null | undefined): boolean {
  return !!s && s.includes("\uFFFD");
}

/** Heuristic cleanup of lost-diacritic replacement chars. */
function fixMojibake(s: string): string {
  if (!s) return s;
  let out = s;

  // Known fragments where � clearly stood in for a diacritic letter.
  const patterns: Array<[RegExp, string]> = [
    [/\bi\s+bis?cuite\b/gi, "și biscuit"],
    [/\bcrem\s+i\s+bis?cuite\b/gi, "cremă și biscuit"],
    [/\bi\s+soia\b/gi, "și soia"],
    [/\b\s*NLOCUITOR\b/gi, "ÎNLOCUITOR"],
    [/\bNLOCUITOR\b/g, "ÎNLOCUITOR"],
    [/\bnlocuitor\b/g, "înlocuitor"],
    [/\bTh\s*\*/gi, "Thé"],
    [/\bTh\b/g, "Thé"],
    [/\bmas\s*\*/gi, "masă"],
    [/\bmas\b(?=\s*[,.)])/g, "masă"],
    [/\bsntoas\b/gi, "sănătoasă"],
    [/\bsntate\b/gi, "sănătate"],
    [/\bcldur\b/gi, "căldură"],
    [/\bbuntate\b/gi, "bunătate"],
    [/\bnatur\b(?=\s*[,.)])/g, "natură"],
    [/\bdac\b/g, "dacă"],
    [/\bpoft\b/g, "poftă"],
    [/\bceva\s+dulce\s+dar\s+sntos\b/gi, "ceva dulce dar sănătos"],
    // generic: remove remaining replacement chars (U+FFFD, and backslash-u escapes)
  ];
  for (const [re, rep] of patterns) out = out.replace(re, rep);
  // collapse remaining � — safest to drop.
  out = out.replace(/\uFFFD+/g, "");
  // tidy double spaces / broken punctuation
  out = out.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
  return out;
}

function normalizeName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[îí]/g, "i")
    .replace(/[ăâ]/g, "a")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/\ufffd/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function jaccard(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function toParagraphsHtml(text: string): string {
  const clean = fixMojibake(text).replace(/\r/g, "").trim();
  if (!clean) return "";
  const parts = clean
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-ZĂÂÎȘȚ])/)
    .map((p) => p.trim())
    .filter(Boolean);
  // If only one big paragraph, split on sentence boundaries every ~2 sentences for readability
  const paras: string[] = [];
  if (parts.length === 1) {
    const sentences = parts[0].split(/(?<=[.!?])\s+/).filter(Boolean);
    for (let i = 0; i < sentences.length; i += 2) {
      paras.push(sentences.slice(i, i + 2).join(" "));
    }
  } else {
    paras.push(...parts);
  }
  return paras.map((p) => `<p>${p.replace(/\n/g, " ")}</p>`).join("");
}

function makeShort(plain: string, max = 180, min = 120): string {
  const s = fixMojibake(plain).replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  // cut at last space before max
  const cut = s.slice(0, max);
  const idx = cut.lastIndexOf(" ");
  const trimmed = (idx > min ? cut.slice(0, idx) : cut).replace(/[,;:\s]+$/, "");
  return trimmed + (trimmed.endsWith(".") ? "" : "…");
}

// ---- category-aware synthesis ----
const CATEGORY_TEMPLATES: Record<string, (name: string) => string[]> = {
  "uleiuri-esentiale": (n) => [
    `${n} este un ulei esențial cu puritate 100%, obținut prin procedee care păstrează intacte proprietățile aromatice și active ale plantei.`,
    `Poate fi folosit ca supliment alimentar sau pentru aromaterapie, contribuind la confortul zilnic și la o stare generală de bine.`,
    `Se recomandă utilizarea conform indicațiilor producătorului și păstrarea într-un loc răcoros, ferit de lumina directă a soarelui.`,
  ],
  suplimente: (n) => [
    `${n} este un supliment alimentar conceput pentru a completa o alimentație echilibrată și un stil de viață activ.`,
    `Formula sprijină necesarul zilnic de nutrienți și contribuie la menținerea confortului și tonusului organismului.`,
    `Se administrează conform recomandărilor de pe ambalaj. Nu înlocuiește o dietă variată și un mod de viață sănătos.`,
  ],
  "suplimente-alimentare": (n) => [
    `${n} este un supliment alimentar ce completează necesarul zilnic de substanțe nutritive și sprijină bunăstarea generală.`,
    `Formula a fost gândită pentru a se integra ușor în rutina zilnică, fiind potrivită persoanelor active care își doresc un plus de susținere.`,
    `Se recomandă administrarea conform indicațiilor de pe ambalaj și respectarea dozei zilnice.`,
  ],
  "parfum-de-camera": (n) => [
    `${n} este un odorizant de cameră cu bețișoare parfumate, realizat pentru a oferi o atmosferă plăcută și relaxantă în orice încăpere.`,
    `Parfumul se difuzează constant, fără surse de căldură sau flacără, iar intensitatea poate fi ajustată prin numărul de bețișoare introduse în flacon.`,
    `Este ideal pentru living, dormitor, baie sau birou și poate fi folosit și ca element decorativ discret.`,
  ],
  "parfumuri-de-camera": (n) => [
    `${n} este un parfum de cameră cu bețișoare din bambus, gândit pentru a împrospăta aerul și a crea o ambianță primitoare.`,
    `Difuzia se face natural, prin capilaritate, fără a necesita electricitate sau flacără, iar aroma persistă săptămâni întregi.`,
    `Potrivit pentru locuință, birou sau spații comerciale mici, aduce un plus de rafinament oricărui interior.`,
  ],
  "controlul-greutatii": (n) => [
    `${n} face parte din linia destinată controlului greutății și sprijină rutinele zilnice de alimentație echilibrată.`,
    `Este gândit pentru a înlocui o masă sau pentru a completa aportul de nutrienți, oferind o opțiune practică și gustoasă.`,
    `Se folosește conform indicațiilor de pe ambalaj, ca parte a unui stil de viață activ și a unei diete variate.`,
  ],
  cafea: (n) => [
    `${n} este o cafea selecționată cu atenție, potrivită pentru preparare zilnică, fie la espressor, fie cu metode manuale.`,
    `Aroma echilibrată și corpolența plăcută o fac ideală atât pentru consum simplu, cât și pentru băuturi cu lapte.`,
    `Păstrați ambalajul închis ermetic, într-un loc răcoros și uscat, pentru a menține prospețimea boabelor.`,
  ],
  choco: (n) => [
    `${n} este o băutură pe bază de cacao, preparată rapid cu apă fierbinte sau lapte, care transformă o pauză obișnuită într-un moment de răsfăț.`,
    `Formula oferă un gust intens de ciocolată și poate fi integrată cu ușurință în rutina zilnică.`,
    `Se recomandă consumarea ca parte a unei alimentații echilibrate și variate.`,
  ],
  alimente: (n) => [
    `${n} este un produs alimentar conceput pentru o gustare sănătoasă și savuroasă, potrivită pentru întreaga familie.`,
    `Ingredientele atent selecționate oferă un profil nutritiv echilibrat, ideal ca alternativă la snackurile clasice.`,
    `Se consumă ca atare sau ca parte a unei mese ușoare; a se păstra conform indicațiilor de pe ambalaj.`,
  ],
  "alimente-functionale": (n) => [
    `${n} este un aliment funcțional formulat pentru a completa dieta zilnică cu nutrienți cu rol specific pentru organism.`,
    `Produsul este potrivit persoanelor care își doresc o alimentație echilibrată și un aport controlat de substanțe active.`,
    `A se consuma ca parte a unei diete variate și a unui stil de viață sănătos.`,
  ],
  "ingrijirea-corpului": (n) => [
    `${n} este un produs pentru îngrijirea corpului, formulat pentru a oferi confort și o senzație plăcută după fiecare utilizare.`,
    `Textura agreabilă și parfumul discret fac din el un aliat constant în rutina zilnică de îngrijire.`,
    `Se aplică pe pielea curată, masând ușor până la absorbție. Pentru uz extern.`,
  ],
  fata: (n) => [
    `${n} este un produs de îngrijire a feței, creat pentru a contribui la aspectul sănătos și luminos al pielii.`,
    `Formula delicată este potrivită pentru utilizare zilnică, completând eficient rutina de skincare.`,
    `Se aplică pe pielea curată, evitând contactul direct cu ochii.`,
  ],
  par: (n) => [
    `${n} este un produs de îngrijire a părului, formulat pentru a sprijini aspectul natural, sănătos și strălucitor al firului de păr.`,
    `Utilizat regulat, contribuie la hidratarea și întreținerea echilibrului scalpului.`,
    `Se folosește conform indicațiilor de pe ambalaj, pe păr umed sau uscat, după caz.`,
  ],
  aloe: (n) => [
    `${n} face parte din linia Aloe, valorificând proprietățile binecunoscute ale sucului și gelului de Aloe Vera.`,
    `Produsul completează rutina zilnică și sprijină confortul general, contribuind la bunăstarea organismului.`,
    `Se folosește conform indicațiilor de pe ambalaj, ca parte a unui stil de viață echilibrat.`,
  ],
  ceaiuri: (n) => [
    `${n} este un ceai selecționat, perfect pentru momentele de relaxare și pentru a completa o rutină zilnică echilibrată.`,
    `Aroma sa delicată îl face potrivit pentru consum în orice moment al zilei, cald sau rece.`,
    `Se prepară prin infuzare în apă fierbinte, conform indicațiilor de pe ambalaj.`,
  ],
  "protectie-solara": (n) => [
    `${n} face parte din linia de protecție solară, formulată pentru a oferi un plus de siguranță pielii expuse la soare.`,
    `Textura confortabilă se aplică ușor, fără a lăsa senzație lipicioasă, fiind potrivită pentru utilizare zilnică în perioada caldă.`,
    `Se reaplică periodic, mai ales după baie sau transpirație abundentă.`,
  ],
  "promotii-si-kit-uri": (n) => [
    `${n} este un kit gândit pentru a reuni produse complementare, oferind o soluție completă la un preț avantajos.`,
    `Ansamblul include articole care se potențează reciproc, fiind ideal atât pentru uzul personal, cât și ca idee de cadou.`,
    `Fiecare produs din kit se folosește conform indicațiilor de pe ambalajul propriu.`,
  ],
  programe: (n) => [
    `${n} este un program structurat, care reunește produse Snep menite să sprijine un obiectiv comun legat de stilul de viață și bunăstare.`,
    `Pachetul oferă o abordare coerentă, îmbinând produse pentru nutriție, control al greutății și confort zilnic.`,
    `Se urmează conform recomandărilor și pliantelor însoțitoare, ca parte a unei rutine echilibrate.`,
  ],
  "necesitatile-energetice": (n) => [
    `${n} este un produs gândit pentru susținerea necesarului energetic în timpul zilei sau în perioade solicitante.`,
    `Formula sprijină tonusul și confortul general, fiind o alegere potrivită pentru persoanele active.`,
    `Se administrează conform indicațiilor de pe ambalaj, ca parte a unui stil de viață echilibrat.`,
  ],
  "bio-effective": (n) => [
    `${n} face parte din gama Bio Effective, o linie de soluții pentru îngrijire și confort în locuință.`,
    `Produsul este formulat pentru o utilizare simplă și eficientă, integrându-se ușor în rutina zilnică.`,
    `A se folosi conform indicațiilor de pe ambalaj.`,
  ],
  corp: (n) => [
    `${n} este un produs destinat îngrijirii corpului, formulat pentru a menține confortul și aspectul sănătos al pielii.`,
    `Aplicarea regulată sprijină hidratarea și catifelarea tenului, fiind potrivit pentru utilizarea zilnică.`,
    `Se folosește pe pielea curată, masând ușor până la absorbție.`,
  ],
  "ingrijirea-mediului": (n) => [
    `${n} este un produs din linia de îngrijire a locuinței, gândit pentru curățenie eficientă și o atmosferă plăcută.`,
    `Formula sa performantă se integrează ușor în rutina de întreținere a casei.`,
    `A se folosi conform indicațiilor de pe ambalaj.`,
  ],
};
function fallbackTemplate(name: string): string[] {
  return [
    `${name} este un produs din catalogul Snep, selecționat pentru calitatea ingredientelor și pentru modul în care se integrează într-un stil de viață echilibrat.`,
    `Este gândit să completeze rutina zilnică, oferind o experiență plăcută la fiecare utilizare.`,
    `A se folosi conform indicațiilor de pe ambalaj, ca parte a unei alimentații variate și a unui stil de viață sănătos.`,
  ];
}
function synthesizeFromCategory(p: Product): string {
  const cats = p.category_slugs || [];
  for (const slug of cats) {
    if (CATEGORY_TEMPLATES[slug]) return CATEGORY_TEMPLATES[slug](niceName(p.name)).join("\n\n");
  }
  return fallbackTemplate(niceName(p.name)).join("\n\n");
}
function niceName(raw: string): string {
  const n = fixMojibake(raw || "").trim();
  // Don't shout — convert ALL CAPS to Title Case
  if (/[A-ZĂÂÎȘȚ]/.test(n) && n === n.toUpperCase()) {
    return n.toLocaleLowerCase("ro-RO").replace(/(^|\s|-)([a-zăâîșț])/g, (_m, pre, ch) => pre + ch.toLocaleUpperCase("ro-RO"));
  }
  return n;
}

// ---- main ----
async function main() {
  const entries = JSON.parse(readFileSync("catalog-data.json", "utf8")) as CatalogEntry[];

  const { data: allProds, error } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, category_slugs, sku");
  if (error) throw error;

  const products = (allProds || []) as Product[];
  console.log(`total products in db: ${products.length}`);

  // Candidates: stripped-HTML len < 200 OR contains �
  const targets = products.filter((p) => {
    const plain = stripHtml(p.description);
    return plain.length < 200 || hasMojibake(p.description);
  });
  console.log(`candidates (short or mangled): ${targets.length}`);

  const merch = targets.filter(isMerch);
  const actionable = targets.filter((p) => !isMerch(p));
  console.log(`  merch (skipped):  ${merch.length}`);
  console.log(`  actionable:       ${actionable.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const skippedReasons: Record<string, number> = {};
  const errorDetails: string[] = [];

  for (const p of actionable) {
    const plainOld = stripHtml(p.description);
    const hadMojibake = hasMojibake(p.description);

    // Try fuzzy match to catalog
    let bestEntry: CatalogEntry | null = null;
    let bestScore = 0;
    for (const e of entries) {
      const score = jaccard(p.name, e.name_raw);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = e;
      }
    }

    // Quality gate: any mojibake (>=1 � char) usually means the surrounding
    // Romanian words also lost diacritics silently (mslin -> măslin, etc.), so
    // the content is unsafe to reuse even after dropping the visible �.
    const mojiCount = (s: string) => ((s || "").match(/\uFFFD/g) || []).length;

    // Build base text
    let baseText = "";
    let source = "";
    if (bestEntry && bestScore >= 0.45) {
      const catTextRaw = [
        bestEntry.description,
        bestEntry.usage_info,
      ]
        .filter((s): s is string => !!s && s.trim().length > 0)
        .join("\n\n");
      // Only use catalog text if it isn't heavily mangled.
      if (mojiCount(catTextRaw) === 0) {
        const catClean = fixMojibake(catTextRaw).trim();
        if (catClean.length > 150 && catClean.length < 1400) {
          baseText = catClean;
          source = `catalog(${bestEntry.code || "?"}, sim=${bestScore.toFixed(2)})`;
        }
      }
    }

    // Existing DB content: only usable if not heavily mojibake'd.
    const existingClean = fixMojibake(plainOld).trim();
    const existingUsable = mojiCount(plainOld) === 0 && existingClean.length >= 120;
    if (!baseText) {
      if (existingUsable) {
        baseText = existingClean;
        source = "existing-cleaned";
      }
    } else if (existingUsable && !hadMojibake) {
      if (existingClean.length > baseText.length * 1.3) {
        baseText = existingClean;
        source = "existing-longer";
      }
    }

    // Fall back to category-based synthesis
    if (!baseText) {
      baseText = synthesizeFromCategory(p);
      source = "synth";
    }

    // If base is still thin (<60 words), pad with category template intro
    if (wordCount(baseText) < 60) {
      const pad = synthesizeFromCategory(p);
      // put existing first then template intro
      baseText = `${baseText}\n\n${pad}`;
      source += "+pad";
    }

    // Word-count cap (300 words)
    const words = baseText.split(/\s+/);
    if (words.length > 300) baseText = words.slice(0, 300).join(" ").replace(/[,;]$/, "") + ".";

    const newHtml = toParagraphsHtml(baseText);
    const newPlain = stripHtml(newHtml);

    // Sanity: must be >=120 chars clean and contain no �
    if (newPlain.length < 120 || newPlain.includes("\uFFFD")) {
      skipped++;
      const reason = newPlain.includes("\uFFFD") ? "still-has-mojibake" : "too-short-after";
      skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
      errorDetails.push(`SKIP ${p.slug} (${reason})`);
      continue;
    }

    const updates: Record<string, string> = { description: newHtml };

    // short_description
    const shortCurrent = (p.short_description || "").trim();
    const shortNeedsFix = !shortCurrent || shortCurrent.includes("\uFFFD") || shortCurrent.length < 40;
    if (shortNeedsFix) {
      updates.short_description = makeShort(newPlain);
    }

    if (DRY) {
      if (VERBOSE) {
        console.log(`\n[dry] ${p.slug}  [${source}]  oldLen=${plainOld.length} newLen=${newPlain.length} moji=${hadMojibake ? "Y" : "n"}`);
        console.log(`       name: ${p.name}`);
        console.log(`       short: ${updates.short_description || "(keep)"}`);
        console.log(`       desc: ${newPlain.slice(0, 160)}…`);
      } else {
        console.log(`[dry] ${p.slug}  [${source}]  ${plainOld.length}→${newPlain.length}${hadMojibake ? " (moji)" : ""}`);
      }
      updated++;
    } else {
      const { error: upErr } = await supabase.from("products").update(updates).eq("id", p.id);
      if (upErr) {
        errors++;
        errorDetails.push(`ERR ${p.slug}: ${upErr.message}`);
        console.error(`x ${p.slug}: ${upErr.message}`);
      } else {
        updated++;
        console.log(`ok ${p.slug}  [${source}]  ${plainOld.length}→${newPlain.length}${hadMojibake ? " moji-fixed" : ""}`);
      }
    }
  }

  console.log("\n==== SUMMARY ====");
  console.log(`Total candidates        : ${targets.length}`);
  console.log(`  Merch (skipped)       : ${merch.length}`);
  console.log(`  Actionable            : ${actionable.length}`);
  console.log(`Updated                 : ${updated}${DRY ? " (dry-run)" : ""}`);
  console.log(`Skipped                 : ${skipped}`);
  for (const [k, v] of Object.entries(skippedReasons)) console.log(`    ${k}: ${v}`);
  console.log(`Errors                  : ${errors}`);
  if (errorDetails.length) {
    console.log("\nDetails (first 20):");
    for (const d of errorDetails.slice(0, 20)) console.log(`  ${d}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
