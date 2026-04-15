/**
 * Scraper mysnep.com → Supabase + R2
 *
 * Usage:
 *   cd E:\olivox
 *   npm install --save-dev playwright tsx
 *   npx playwright install chromium
 *   npx tsx scripts/scrape-mysnep.ts              # all categories
 *   npx tsx scripts/scrape-mysnep.ts --category AC6   # one category
 *   npx tsx scripts/scrape-mysnep.ts --dry-run    # don't write to DB/R2
 *   npx tsx scripts/scrape-mysnep.ts --limit 5    # only 5 products per category
 *
 * Env vars (reads .env.local automatically if present):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or ANON — see note)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL, R2_UPLOAD_PREFIX
 *
 * NOTE: to insert via RLS-enabled tables you need SUPABASE_SERVICE_ROLE_KEY
 * (service key), not the publishable/anon key. Add it to .env.local before running.
 */

import { chromium, Page, BrowserContext } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// --------------- Env loading ---------------
const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET || "ghidulfunerar";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://media.ghidulfunerar.ro";
const R2_UPLOAD_PREFIX = process.env.R2_UPLOAD_PREFIX || "olivox";

// --------------- CLI args ---------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LIMIT = Number((args.find(a => a.startsWith("--limit="))?.split("=")[1]) || 0);
const ONLY_CAT = args.find(a => a.startsWith("--category="))?.split("=")[1] || null;

// --------------- Clients ---------------
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// --------------- Helpers ---------------
const BASE = "https://www.mysnep.com";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

async function uploadImageToR2(srcUrl: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(srcUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!DRY_RUN) {
      await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    }
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (e) {
    console.error("  R2 upload failed:", srcUrl, (e as Error).message);
    return null;
  }
}

// --------------- Set Romanian language ---------------
async function setRomanian(page: Page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  // Romanian is index 2 according to inspection (0=IT, 1=EN, 2=RO)
  await page.evaluate(() => {
    const fn = (window as unknown as { cambia_lingua?: (n: number) => void }).cambia_lingua;
    if (typeof fn === "function") fn(2);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(1500);
}

// --------------- Discover categories ---------------
type CatRef = { code: string; slug: string; url: string; name: string };
async function discoverCategories(page: Page): Promise<CatRef[]> {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  const links = await page.$$eval("a[href*='-AC']", (as) =>
    as.map((a) => ({ href: (a as HTMLAnchorElement).href, text: (a.textContent || "").trim() }))
  );
  const seen = new Set<string>();
  const cats: CatRef[] = [];
  for (const l of links) {
    const m = l.href.match(/\/([a-z0-9-]+)-AC(\d+)\.html/i);
    if (!m) continue;
    const code = `AC${m[2]}`;
    if (seen.has(code)) continue;
    seen.add(code);
    cats.push({ code, slug: slugify(l.text || m[1]), url: l.href.replace(/[?#].*$/, ""), name: l.text || m[1] });
  }
  return cats;
}

// --------------- Fetch category details (description + image) ---------------
type CatDetail = { description: string; image_src: string | null };
async function fetchCategoryDetail(page: Page, catUrl: string): Promise<CatDetail> {
  try {
    await page.goto(catUrl, { waitUntil: "domcontentloaded" });
    await sleep(700);
    return await page.evaluate(() => {
      const BAD_ANCESTORS = ["#Cookiebot", "[class*='Cybot']", "[class*='Cookiebot']", "[class*='cookie']", "[class*='Cookie']", "[class*='consent']", ".cookiebar", ".cookie-consent", ".privacy-banner", "#footer", "footer", "header", "#menu", "nav"];
      const BAD_TEXT = /cookie|Cookie|Cybot|PHPSESSID|persisten|sessione|browser viene chiuso|chiuso il browser|normativa vigente|politica|privacy|©|articole gă?site|articoli trovati|occorrenze trovate|rezultatele c[ăa]ut[ăa]rii|risultati della ricerca|per pagin[aă]|afi[șs]ate \d+ pe pagin|pubblicit|fornitore|raccolti|sign[- ]in|autentific|oportunitate de afaceri|opportunit[àa] commerciale|suplimenta veniturile|integrare il tuo reddito|contacta[țt]i|[îi]nregistra[țt]i|proponiamo|proponem/i;
      const inBad = (el: Element) => BAD_ANCESTORS.some(sel => el.closest(sel));

      let description = "";
      const looksLikeProductCard = (el: HTMLElement) => !!el.querySelector("a[href*='-A'][href*='.html']");
      const isMeaningful = (t: string) => t.length > 120 && !BAD_TEXT.test(t) && !/\bCod:\s*\d/i.test(t);

      const cleanHtml = (raw: string): string => {
        const box = document.createElement("div");
        box.innerHTML = raw;
        const walker = document.createTreeWalker(box, NodeFilter.SHOW_COMMENT);
        const toRemove: Node[] = [];
        while (walker.nextNode()) toRemove.push(walker.currentNode);
        for (const n of toRemove) n.parentNode?.removeChild(n);
        let changed = true;
        while (changed) {
          changed = false;
          for (const el of Array.from(box.querySelectorAll("*"))) {
            if (el.tagName === "IMG" || el.tagName === "BR") continue;
            const t = (el.textContent || "").trim();
            const hasMedia = el.querySelector("img, br, video, iframe");
            if (!t && !hasMedia) { el.remove(); changed = true; }
          }
        }
        return (box.innerHTML || "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
      };

      for (const sel of [".descrizione", ".cat-desc", ".intro", "#intro", "#contenuto > p", "main > p"]) {
        const els = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
        for (const c of els) {
          if (inBad(c)) continue;
          if (looksLikeProductCard(c)) continue;
          const t = (c.textContent || "").trim();
          if (isMeaningful(t)) { description = c.innerHTML || t; break; }
        }
        if (description) break;
      }
      if (!description) {
        const ps = Array.from(document.querySelectorAll("p"));
        for (const p of ps) {
          if (inBad(p)) continue;
          if (looksLikeProductCard(p)) continue;
          const t = (p.textContent || "").trim();
          if (isMeaningful(t)) { description = p.outerHTML; break; }
        }
      }

      if (description) description = cleanHtml(description);
      // image: look for a banner/hero image or first large category image that is NOT a product thumbnail
      const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
      let image_src: string | null = null;
      for (const img of imgs) {
        const src = img.src;
        if (!src) continue;
        if (/Articoli\/big/i.test(src)) continue; // product thumb
        if (/logo|icon|favicon|pixel|spacer|blank/i.test(src)) continue;
        if ((img.naturalWidth || img.width) < 200 && (img.naturalHeight || img.height) < 200) continue;
        image_src = src;
        break;
      }
      return { description, image_src };
    });
  } catch {
    return { description: "", image_src: null };
  }
}

// --------------- List products in a category (with pagination) ---------------
type ProdRef = { code: string; slug: string; url: string; name: string; sku: string | null; stock_status: string };
async function listProductsInCategory(page: Page, catUrl: string): Promise<ProdRef[]> {
  const out: ProdRef[] = [];
  const seen = new Set<string>();
  await page.goto(catUrl, { waitUntil: "domcontentloaded" });
  await sleep(800);

  // discover total pages
  const pages = await page.$$eval("a[href*='cambia_pag']", (as) => {
    const nums = as.map((a) => {
      const m = (a.getAttribute("href") || "").match(/cambia_pag\((\d+)\)/);
      return m ? Number(m[1]) : 0;
    });
    return nums.length ? Math.max(...nums) : 1;
  });

  for (let p = 1; p <= pages; p++) {
    if (p > 1) {
      await page.evaluate((n) => {
        const fn = (window as unknown as { cambia_pag?: (n: number) => void }).cambia_pag;
        if (typeof fn === "function") fn(n);
      }, p);
      await page.waitForLoadState("networkidle").catch(() => {});
      await sleep(1200);
    }

    const items = await page.$$eval("a[href*='-A']", (as) => {
      // First pass: map code -> { sku, nameText, stock } from card anchor with "Cod: NNN"
      const meta = new Map<string, { sku: string | null; nameText: string; stock: string }>();
      for (const a of as as HTMLAnchorElement[]) {
        if (a.href.startsWith("javascript:")) continue;
        if (/-AC\d+/i.test(a.href)) continue;
        const m = a.href.match(/\/([a-z0-9-]+)-A(\d+)/i);
        if (!m) continue;
        const code = `A${m[2]}`;
        const txt = (a.textContent || "").trim();
        const skuMatch = txt.match(/Cod:\s*(\w+)/i);
        if (!skuMatch) continue;
        const nameText = txt.replace(/\s*Cod:\s*\w+\s*/i, "").trim();
        // Walk up to the card container; check its text for availability tokens
        let cardText = "";
        let cur: Element | null = a.parentElement;
        for (let i = 0; i < 6 && cur; i++) {
          cardText = (cur.textContent || "");
          if (/(EUR|RON)\s*\d/i.test(cardText)) break;
          cur = cur.parentElement;
        }
        let stock = "unknown";
        if (/non\s+disponibil|indisponibil|epuizat|esaurito|out\s+of\s+stock/i.test(cardText)) stock = "out_of_stock";
        else if (/disponibil/i.test(cardText)) stock = "in_stock";
        meta.set(code, { sku: skuMatch[1], nameText, stock });
      }

      const results: { href: string; text: string; sku: string | null; stock: string }[] = [];
      const seen = new Set<string>();
      for (const a of as as HTMLAnchorElement[]) {
        if (a.href.startsWith("javascript:")) continue;
        if (/-AC\d+/i.test(a.href)) continue;
        const m = a.href.match(/\/([a-z0-9-]+)-A(\d+)/i);
        if (!m) continue;
        const code = `A${m[2]}`;
        if (!meta.has(code)) continue;
        if (seen.has(code)) continue;
        const info = meta.get(code)!;
        const txt = info.nameText || (a.textContent || "").trim();
        if (!txt) continue;
        seen.add(code);
        results.push({ href: a.href, text: txt, sku: info.sku, stock: info.stock });
      }
      return results;
    });

    for (const it of items) {
      const m = it.href.match(/\/([a-z0-9-]+)-A(\d+)(?:-[A-Z0-9]+)?\.html/i);
      if (!m) continue;
      const code = `A${m[2]}`;
      if (seen.has(code)) continue;
      seen.add(code);
      out.push({ code, slug: slugify(m[1]), url: it.href.replace(/[?#].*$/, ""), name: it.text || m[1], sku: it.sku, stock_status: it.stock });
    }
    if (LIMIT && out.length >= LIMIT) break;
  }
  return LIMIT ? out.slice(0, LIMIT) : out;
}

// --------------- Scrape one product ---------------
type ProdData = {
  source_id: string; slug: string; name: string; sku: string | null;
  quantity: string | null; points: number | null; stock_status: string;
  price: number | null; currency: string;
  short_description: string; description: string;
  ingredients: string | null; warnings: string | null;
  usage_info: string | null; certifications: string | null;
  datasheet_url: string | null;
  image_src: string | null; source_url: string; category_codes: string[];
  variants: { id: string; name: string }[];
};

async function scrapeProduct(page: Page, url: string, fallbackSlug: string, fallbackSku: string | null = null, fallbackStock: string = "unknown"): Promise<ProdData | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await sleep(500);
    const data = await page.evaluate(() => {
      const BAD_ANCESTORS = ["#Cookiebot", "[class*='Cybot']", "[class*='Cookiebot']", "[class*='cookie']", "[class*='Cookie']", "[class*='consent']", ".cookiebar", ".cookie-consent", ".privacy-banner", "#footer", "footer", "header", "#menu", "nav"];
      const BAD_TEXT = /cookie|Cookie|Questa tipologia|Cybot|PHPSESSID|persisten|sessione|browser viene chiuso|chiuso il browser|normativa vigente/i;
      const BAD_NAMES = /vezi articolele|articoli correlati|prodotti correlati|articole similare|produse similare|prodotti consigliati|scorri per gli articoli|ai nevoie|proponiamo/i;
      const inBad = (el: Element) => BAD_ANCESTORS.some(sel => el.closest(sel));

      // Name: prefer heading closest to main product image
      let name = "";
      const mainImg = document.querySelector("img[src*='Articoli/big']") as HTMLElement | null;
      if (mainImg) {
        let cur: Element | null = mainImg.parentElement;
        for (let i = 0; i < 8 && cur && !name; i++) {
          const headings = cur.querySelectorAll("h1, h2, h3");
          for (const h of Array.from(headings)) {
            if (inBad(h)) continue;
            const t = (h.textContent || "").trim();
            if (t.length > 2 && t.length < 200 && !BAD_TEXT.test(t) && !BAD_NAMES.test(t)) {
              name = t.replace(/\s*Cod:\s*\d+\s*$/i, "").trim();
              break;
            }
          }
          cur = cur.parentElement;
        }
      }
      if (!name) {
        for (const sel of ["h1", "h2", "h3", ".productname"]) {
          const els = Array.from(document.querySelectorAll(sel));
          for (const el of els) {
            if (inBad(el)) continue;
            const t = (el.textContent || "").trim();
            if (t.length > 2 && t.length < 200 && !BAD_TEXT.test(t) && !BAD_NAMES.test(t)) {
              name = t.replace(/\s*Cod:\s*\d+\s*$/i, "").trim();
              break;
            }
          }
          if (name) break;
        }
      }

      // Price: scan only main content, not headers/footers
      let bodyText = "";
      const main = document.querySelector("main") || document.querySelector("#contenuto") || document.body;
      bodyText = (main as HTMLElement).innerText || "";
      const allText = (document.body.innerText || "") + " " + (document.body.textContent || "");
      const priceMatch = bodyText.match(/(EUR|RON|USD)\s*([\d.,]+)/i) || allText.match(/(EUR|RON|USD)\s*([\d.,]+)/i);
      const currency = priceMatch ? priceMatch[1].toUpperCase() : "EUR";
      const price = priceMatch ? Number(priceMatch[2].replace(/\./g, "").replace(",", ".")) : null;

      // SKU: prefer longer "Cod produs: NNNNNNN" from product detail page; fallback to short "Cod: NNN" from listing
      const skuMatch =
        bodyText.match(/Cod\s*produs[:\s]*(\w+)/i) ||
        allText.match(/Cod\s*produs[:\s]*(\w+)/i) ||
        bodyText.match(/Cod:\s*(\w+)/i) ||
        allText.match(/Cod:\s*(\w+)/i);
      const sku = skuMatch ? skuMatch[1] : null;

      // Quantity: must match a unit pattern (ml/g/mg/l/kg/litru/gummies/capsule/tablete/bustine/porții)
      let quantity: string | null = null;
      const QTY_PATTERN = /^\s*\d+[\s,.]*\d*\s*(ml|g|mg|kg|l|litri?|litru|gummies?|capsule|caps\.?|tablete|tablets|bustine|por[țt]ii?|pastile|sti?cl[aeă]|bottles?|pcs)\b/i;
      const qtyContainers = Array.from(document.querySelectorAll(".size-case, .size, .formato")) as HTMLElement[];
      for (const s of qtyContainers) {
        if (inBad(s)) continue;
        const t = ((s.querySelector("p")?.textContent || s.textContent) || "").trim();
        if (QTY_PATTERN.test(t)) { quantity = t; break; }
      }
      // Fallback: any .small containing a unit-shaped text
      if (!quantity) {
        const smalls = Array.from(document.querySelectorAll(".small")) as HTMLElement[];
        for (const s of smalls) {
          if (inBad(s)) continue;
          const t = ((s.querySelector("p")?.textContent || s.textContent) || "").trim();
          if (QTY_PATTERN.test(t)) { quantity = t; break; }
        }
      }

      // Points: "Puncte Volum: N.NN" or "punti: N.NN"
      const pointsMatch = allText.match(/Puncte\s*Volum[:\s]*([\d.,]+)/i) || allText.match(/punti[:\s]*([\d.,]+)/i);
      const points = pointsMatch ? Number(pointsMatch[1].replace(",", ".")) : null;

      // Stock: "disponibil"/"disponibile" = in_stock; "non disponibil"/"indisponibil"/"epuizat"/"esaurito" = out_of_stock
      let stock_status = "in_stock";
      if (/non\s+disponibil|non\s+disponibile|indisponibil|epuizat|esaurito|out\s+of\s+stock|esgotado/i.test(allText)) {
        stock_status = "out_of_stock";
      } else if (!/disponibil|disponibile|in\s+stock/i.test(allText)) {
        stock_status = "unknown";
      }

      // Variants: <select name="flavor" onchange="seleziona_correlato(...)">
      const variants: { id: string; name: string }[] = [];
      const variantSelect = document.querySelector("select[onchange*='seleziona_correlato'], select[name='flavor']") as HTMLSelectElement | null;
      if (variantSelect) {
        for (const opt of Array.from(variantSelect.options)) {
          const id = (opt.value || "").trim();
          const name = (opt.textContent || "").trim();
          if (!id || !name) continue;
          if (/^alege$|^scegli$|^select$/i.test(name)) continue;
          variants.push({ id, name });
        }
      }

      // Image
      const imgEl = document.querySelector("img[src*='Articoli/big']") as HTMLImageElement | null;
      const image_src = imgEl ? imgEl.src : null;

      // HTML cleaner: strip comments, empty tags, whitespace between tags, style-only wrappers
      const cleanHtml = (raw: string): string => {
        const box = document.createElement("div");
        box.innerHTML = raw;
        // Remove HTML comments
        const walker = document.createTreeWalker(box, NodeFilter.SHOW_COMMENT);
        const toRemove: Node[] = [];
        while (walker.nextNode()) toRemove.push(walker.currentNode);
        for (const n of toRemove) n.parentNode?.removeChild(n);
        // Iteratively remove empty elements
        let changed = true;
        while (changed) {
          changed = false;
          for (const el of Array.from(box.querySelectorAll("*"))) {
            if (el.tagName === "IMG" || el.tagName === "BR") continue;
            const t = (el.textContent || "").trim();
            const hasMedia = el.querySelector("img, br, video, iframe");
            if (!t && !hasMedia) { el.remove(); changed = true; }
          }
        }
        // Unwrap single-child style-only divs to reduce nesting noise
        changed = true;
        let iter = 0;
        while (changed && iter++ < 5) {
          changed = false;
          for (const el of Array.from(box.querySelectorAll("div"))) {
            if (el.parentElement === null) continue;
            if (el.children.length !== 1) continue;
            if ((el.textContent || "").trim() !== (el.children[0].textContent || "").trim()) continue;
            const only = el.children[0];
            el.replaceWith(only);
            changed = true;
          }
        }
        return (box.innerHTML || "")
          .replace(/>\s+</g, "><")
          .replace(/\s{2,}/g, " ")
          .trim();
      };

      // Description: pull text from the "Descriere" tab (usually #one) and similar
      let description = "";
      for (const sel of ["#one", "#descrizione", ".descrizione", "#scheda-prodotto", ".scheda-prodotto", ".product-description"]) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el && !inBad(el)) {
          const h = el.innerHTML || "";
          if (h.replace(/<[^>]+>/g, "").trim().length > 50) { description = h; break; }
        }
      }

      if (!description) {
        const ps = Array.from(document.querySelectorAll("p"));
        const good = ps.filter(p => {
          if (inBad(p)) return false;
          const t = (p.textContent || "").trim();
          if (t.length < 40) return false;
          if (BAD_TEXT.test(t)) return false;
          return true;
        });
        description = good.slice(0, 6).map(p => p.outerHTML).join("");
      }

      if (description) {
        description = cleanHtml(description);
        // If cleaned is effectively empty (only tags/whitespace), discard
        const plain = description.replace(/<[^>]+>/g, "").trim();
        if (plain.length < 20) description = "";
      }

      // Other tabs: map by tab-link label text
      let ingredients: string | null = null;
      let warnings: string | null = null;
      let usage_info: string | null = null;
      let certifications: string | null = null;

      const tabLinks = Array.from(document.querySelectorAll("a[href^='#']")) as HTMLAnchorElement[];
      for (const link of tabLinks) {
        const href = link.getAttribute("href") || "";
        if (!/^#\w+$/.test(href)) continue;
        const target = document.getElementById(href.slice(1)) as HTMLElement | null;
        if (!target || inBad(target)) continue;
        const label = (link.textContent || "").trim().toLowerCase();
        const html = (target.innerHTML || "");
        const clean = cleanHtml(html);
        const plainLen = clean.replace(/<[^>]+>/g, "").trim().length;
        if (plainLen < 15) continue;

        if (/ce este [îi]n[ăa]untru|cosa c['']?[èe] dentro|ingredient|compozi[țt]/i.test(label)) {
          if (!ingredients || clean.length > ingredients.length) ingredients = clean;
        } else if (/avertismente|avvertenze|warning|aten[țt]/i.test(label)) {
          if (!warnings || clean.length > warnings.length) warnings = clean;
        } else if (/cum s[ăa][- ]?l folose[șs]ti|come si usa|mod de utilizare|usage|how to use|utilizare/i.test(label)) {
          if (!usage_info || clean.length > usage_info.length) usage_info = clean;
        } else if (/certific[ăa]ri|certifications?|certificati/i.test(label)) {
          if (!certifications || clean.length > certifications.length) certifications = clean;
        }
      }

      // Datasheet: find PDF link (technical specifications / scheda tecnica)
      let datasheet_url: string | null = null;
      const pdfLinks = Array.from(document.querySelectorAll("a[href$='.pdf'], a[href*='.pdf?']")) as HTMLAnchorElement[];
      for (const a of pdfLinks) {
        if (inBad(a)) continue;
        datasheet_url = a.href;
        break;
      }

      // Short: derive from the description we just extracted (its first paragraph)
      let short = "";
      if (description) {
        const tmp = document.createElement("div");
        tmp.innerHTML = description;
        for (const p of Array.from(tmp.querySelectorAll("p"))) {
          const t = (p.textContent || "").trim();
          if (t.length < 30) continue;
          if (BAD_TEXT.test(t)) continue;
          short = t.slice(0, 280);
          break;
        }
        if (!short) {
          const allText = (tmp.textContent || "").trim();
          short = allText.slice(0, 280);
        }
      }

      return { name, price, currency, sku, quantity, points, stock_status, image_src, description, short, variants, ingredients, warnings, usage_info, certifications, datasheet_url };
    });

    const codeMatch = url.match(/-A(\d+)/);
    const source_id = codeMatch ? `A${codeMatch[1]}` : fallbackSlug;

    return {
      source_id,
      slug: fallbackSlug,
      name: data.name || fallbackSlug,
      sku: data.sku || fallbackSku,
      quantity: data.quantity,
      points: data.points,
      stock_status: data.stock_status === "unknown" ? fallbackStock : data.stock_status,
      price: data.price,
      currency: data.currency || "EUR",
      short_description: data.short,
      description: data.description,
      ingredients: data.ingredients,
      warnings: data.warnings,
      usage_info: data.usage_info,
      certifications: data.certifications,
      datasheet_url: data.datasheet_url,
      image_src: data.image_src,
      source_url: url,
      category_codes: [],
      variants: data.variants || [],
    };
  } catch (e) {
    console.error("  product scrape failed:", url, (e as Error).message);
    return null;
  }
}

// --------------- Upsert helpers ---------------
async function upsertCategory(cat: CatRef, imageR2: string | null, description: string, imageSrc: string | null) {
  if (DRY_RUN) { console.log("  [dry] category", cat.slug, description ? "(has desc)" : "(no desc)", imageSrc ? "(has img)" : "(no img)"); return; }
  const { error } = await supabase.from("product_categories").upsert({
    source_id: cat.code,
    name: cat.name,
    slug: cat.slug,
    source_url: cat.url,
    description,
    image_url: imageSrc,
    r2_image_url: imageR2,
  }, { onConflict: "slug" });
  if (error) console.error("  category upsert:", error.message);
}

async function upsertProduct(p: ProdData, imageR2: string | null, datasheetR2: string | null, categorySlug: string) {
  if (DRY_RUN) { console.log("  [dry] product", p.slug, `sku=${p.sku || "-"}`, `qty=${p.quantity || "-"}`, `pts=${p.points ?? "-"}`, `${p.price ?? "-"} ${p.currency}`, `stock=${p.stock_status}`, p.variants.length ? `(${p.variants.length} variants)` : "", p.datasheet_url ? "(pdf)" : ""); return; }
  const build = (slug: string) => ({
    source_id: p.source_id,
    name: p.name,
    slug,
    sku: p.sku,
    quantity: p.quantity,
    points: p.points,
    stock_status: p.stock_status,
    price: p.price,
    currency: p.currency,
    short_description: p.short_description,
    description: p.description,
    ingredients: p.ingredients,
    warnings: p.warnings,
    usage_info: p.usage_info,
    certifications: p.certifications,
    datasheet_url: p.datasheet_url,
    datasheet_r2_url: datasheetR2,
    r2_image_url: imageR2,
    image_url: p.image_src,
    source_url: p.source_url,
    variants: p.variants,
    category_slugs: [categorySlug],
  });
  // Upsert on source_id (mysnep product code is authoritative)
  let { error } = await supabase.from("products").upsert(build(p.slug), { onConflict: "source_id" });
  if (error && /duplicate key|unique constraint|23505/i.test(error.message)) {
    // Slug collides with a different source_id — suffix and retry
    const uniqueSlug = `${p.slug}-${p.source_id.toLowerCase()}`;
    const retry = await supabase.from("products").upsert(build(uniqueSlug), { onConflict: "source_id" });
    error = retry.error;
  }
  if (error) console.error("  product upsert:", error.message);
}

// --------------- Main ---------------
async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing Supabase env"); process.exit(1); }
  if (!DRY_RUN && !R2_ACCESS_KEY_ID) { console.error("Missing R2 env"); process.exit(1); }

  console.log("mysnep scraper starting", { DRY_RUN, LIMIT, ONLY_CAT });
  const HEADLESS = process.env.MYSNEP_HEADLESS !== "false";
  const browser = await chromium.launch({ headless: HEADLESS });
  const storageFile = resolve(process.cwd(), ".mysnep-session.json");
  const ctxOpts: Parameters<typeof browser.newContext>[0] = { locale: "ro-RO", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36" };
  if (existsSync(storageFile)) {
    ctxOpts.storageState = storageFile;
    console.log("Using saved mysnep session from .mysnep-session.json");
  }
  const ctx: BrowserContext = await browser.newContext(ctxOpts);

  // MYSNEP_COOKIES: copy-paste from browser devtools (format: "name1=value1; name2=value2")
  // Needed if the logged-in view shows different SKUs / prices / points than guest view.
  if (process.env.MYSNEP_COOKIES) {
    const cookies = process.env.MYSNEP_COOKIES.split(";").map(kv => {
      const [name, ...rest] = kv.trim().split("=");
      return { name: name.trim(), value: rest.join("=").trim(), domain: ".mysnep.com", path: "/" };
    }).filter(c => c.name && c.value);
    if (cookies.length) {
      await ctx.addCookies(cookies);
      console.log(`Loaded ${cookies.length} cookie(s) from MYSNEP_COOKIES`);
    }
  }
  // Polyfill __name (esbuild/tsx injects it into page.evaluate callbacks)
  await ctx.addInitScript(() => {
    // @ts-expect-error shim
    if (typeof globalThis.__name === "undefined") globalThis.__name = (fn: unknown) => fn;
  });
  const page = await ctx.newPage();

  await setRomanian(page);

  let categories = await discoverCategories(page);
  if (ONLY_CAT) categories = categories.filter(c => c.code === ONLY_CAT);
  console.log("Categories:", categories.length);

  for (const cat of categories) {
    console.log(`\n=== ${cat.code} ${cat.name} ===`);

    const detail = await fetchCategoryDetail(page, cat.url);
    let catImageR2: string | null = null;
    if (detail.image_src) {
      const ext = (detail.image_src.split(".").pop() || "jpg").split("?")[0].slice(0, 5);
      const key = `${R2_UPLOAD_PREFIX}/categories/${cat.slug}.${ext}`;
      catImageR2 = await uploadImageToR2(detail.image_src, key);
    }
    await upsertCategory(cat, catImageR2, detail.description, detail.image_src);

    const prods = await listProductsInCategory(page, cat.url);
    console.log("  products:", prods.length);

    for (const p of prods) {
      console.log("  →", p.slug);
      const data = await scrapeProduct(page, p.url, p.slug, p.sku, p.stock_status);
      if (!data) continue;

      let imageR2: string | null = null;
      if (data.image_src) {
        const ext = (data.image_src.split(".").pop() || "jpg").split("?")[0].slice(0, 5);
        const key = `${R2_UPLOAD_PREFIX}/products/${data.slug}.${ext}`;
        imageR2 = await uploadImageToR2(data.image_src, key);
      }

      let datasheetR2: string | null = null;
      if (data.datasheet_url) {
        const key = `${R2_UPLOAD_PREFIX}/datasheets/${data.source_id.toLowerCase()}.pdf`;
        datasheetR2 = await uploadImageToR2(data.datasheet_url, key);
      }

      await upsertProduct(data, imageR2, datasheetR2, cat.slug);
      await sleep(600);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
