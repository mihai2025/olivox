/**
 * Backfill missing product fields (ingredients, warnings, usage_info, description)
 * from mysnep.com, visiting ONLY products where the fields are currently NULL/empty.
 * Uses the saved session (MYSNEP_COOKIES in .env.local) to access logged-in content.
 *
 * Run: npx tsx scripts/backfill-fields.ts [--limit=N] [--dry-run]
 */

import { chromium, BrowserContext } from "playwright";
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LIMIT = Number(args.find(a => a.startsWith("--limit="))?.split("=")[1]) || 0;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  // Fetch products missing at least one of the content fields
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, source_url, description, short_description, ingredients, warnings, usage_info, certifications")
    .or("ingredients.is.null,warnings.is.null,usage_info.is.null,description.is.null,description.eq.")
    .not("source_url", "is", null)
    .order("id", { ascending: true });

  if (error) { console.error(error); process.exit(1); }
  const list = (products || []).filter(p => p.source_url && /mysnep\.com/.test(p.source_url));
  console.log(`Found ${list.length} products to backfill`);

  const work = LIMIT ? list.slice(0, LIMIT) : list;

  const browser = await chromium.launch({ headless: true });
  const ctx: BrowserContext = await browser.newContext({ locale: "ro-RO", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36" });

  if (process.env.MYSNEP_COOKIES) {
    const cookies = process.env.MYSNEP_COOKIES.split(";").map(kv => {
      const [name, ...rest] = kv.trim().split("=");
      return { name: name.trim(), value: rest.join("=").trim(), domain: ".mysnep.com", path: "/" };
    }).filter(c => c.name && c.value);
    if (cookies.length) { await ctx.addCookies(cookies); console.log(`Loaded ${cookies.length} cookie(s)`); }
  }

  await ctx.addInitScript(() => { (globalThis as unknown as { __name?: unknown }).__name = (fn: unknown) => fn; });
  const page = await ctx.newPage();

  // Set Romanian
  await page.goto("https://www.mysnep.com/");
  await page.evaluate(() => { const fn = (window as unknown as { cambia_lingua?: (n: number) => void }).cambia_lingua; if (fn) fn(2); });
  await page.waitForLoadState("networkidle").catch(() => {});
  await sleep(1500);

  let updated = 0;
  for (const p of work) {
    const needs: string[] = [];
    if (!p.description || p.description === "") needs.push("description");
    if (!p.ingredients) needs.push("ingredients");
    if (!p.warnings) needs.push("warnings");
    if (!p.usage_info) needs.push("usage_info");
    if (!needs.length) continue;

    try {
      await page.goto(p.source_url!, { waitUntil: "domcontentloaded" });
      await sleep(600);
    } catch (e) {
      console.error("  goto fail:", p.slug, (e as Error).message);
      continue;
    }

    const data = await page.evaluate(() => {
      const BAD_ANCESTORS = ["#Cookiebot", "[class*='Cybot']", "[class*='Cookiebot']", "[class*='cookie']", "[class*='Cookie']", "[class*='consent']"];
      const inBad = (el: Element) => BAD_ANCESTORS.some(sel => el.closest(sel));

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

      const extract = (id: string) => {
        const el = document.getElementById(id) as HTMLElement | null;
        if (!el || inBad(el)) return null;
        const h = cleanHtml(el.innerHTML || "");
        const plain = h.replace(/<[^>]+>/g, "").trim();
        return plain.length >= 15 ? h : null;
      };

      // map tab-link labels to content ids
      const tabLinks = Array.from(document.querySelectorAll("a[href^='#']")) as HTMLAnchorElement[];
      const labelToId: Record<string, string> = {};
      for (const a of tabLinks) {
        const href = a.getAttribute("href") || "";
        if (!/^#\w+$/.test(href)) continue;
        const label = (a.textContent || "").trim().toLowerCase();
        labelToId[label] = href.slice(1);
      }
      const findByLabel = (rx: RegExp): string | null => {
        for (const [label, id] of Object.entries(labelToId)) if (rx.test(label)) return extract(id);
        return null;
      };

      return {
        description: findByLabel(/descriere|descrizione/i),
        ingredients: findByLabel(/ce este [îi]n[ăa]untru|ingredient|compozi|cosa c[`'’]?[èe] dentro/i),
        warnings: findByLabel(/avertismente|avvertenze|aten[țt]|warning/i),
        usage_info: findByLabel(/cum s[ăa][- ]?l folose[șs]ti|mod de utilizare|come si usa|usage|utilizare/i),
      };
    });

    const updates: Record<string, string | null> = {};
    for (const field of needs) {
      const v = data[field as keyof typeof data];
      if (v) updates[field] = v;
    }
    // Derive short_description from first paragraph of description if missing
    if (!p.short_description && (data.description || p.description)) {
      const src = data.description || p.description!;
      const tmp = src.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      updates.short_description = tmp.slice(0, 200);
    }

    if (Object.keys(updates).length === 0) {
      console.log(`· ${p.slug} — nothing new`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry] ${p.slug} would set:`, Object.keys(updates).join(", "));
    } else {
      const { error: uerr } = await supabase.from("products").update(updates).eq("id", p.id);
      if (uerr) console.error("  update fail:", p.slug, uerr.message);
      else { updated++; console.log(`✓ ${p.slug} — ${Object.keys(updates).join(", ")}`); }
    }
    await sleep(500);
  }

  await browser.close();
  console.log(`\nDone. Updated ${updated} / ${work.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
