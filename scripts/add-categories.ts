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

type CatSeed = { slug: string; name: string; parent?: string; sort_order?: number };

// Hierarchy (root → children)
const CATS: CatSeed[] = [
  // Root groups
  { slug: "nutritie", name: "Nutritie", sort_order: 10 },
  { slug: "ingrijire-personala", name: "Ingrijire Personala", sort_order: 20 },
  { slug: "ingrijirea-mediului", name: "Ingrijirea Mediului", sort_order: 30 },

  // Under Nutritie
  { slug: "suplimente-alimentare", name: "Suplimente Alimentare", parent: "nutritie", sort_order: 11 },
  { slug: "alimente-functionale", name: "Alimente Functionale", parent: "nutritie", sort_order: 12 },

  // Under Ingrijire Personala
  { slug: "beauty-snep", name: "Beauty Snep", parent: "ingrijire-personala", sort_order: 21 },
  { slug: "nat", name: "NAT", parent: "ingrijire-personala", sort_order: 22 },
  { slug: "sneplumax", name: "SnepLumax", parent: "ingrijire-personala", sort_order: 23 },
  { slug: "make-up", name: "Make-Up", parent: "ingrijire-personala", sort_order: 24 },
  { slug: "parfumuri", name: "Parfumuri", parent: "ingrijire-personala", sort_order: 25 },

  // Under Ingrijirea Mediului
  { slug: "parfumuri-de-camera", name: "Parfumuri de Camera", parent: "ingrijirea-mediului", sort_order: 31 },
];

async function main() {
  // First pass: insert roots (no parent)
  for (const c of CATS.filter(c => !c.parent)) {
    const { error } = await supabase.from("product_categories").upsert({
      slug: c.slug,
      name: c.name,
      sort_order: c.sort_order ?? 0,
    }, { onConflict: "slug" });
    if (error) console.error("root:", c.slug, error.message);
    else console.log("✓ root", c.slug);
  }

  // Fetch id→slug map for parents
  const { data: all } = await supabase.from("product_categories").select("id, slug");
  const slugToId = new Map<string, number>();
  for (const row of all || []) slugToId.set(row.slug, row.id);

  // Second pass: insert children with parent_id
  for (const c of CATS.filter(c => c.parent)) {
    const parent_id = slugToId.get(c.parent!);
    if (!parent_id) { console.error("missing parent for", c.slug); continue; }
    const { error } = await supabase.from("product_categories").upsert({
      slug: c.slug,
      name: c.name,
      parent_id,
      sort_order: c.sort_order ?? 0,
    }, { onConflict: "slug" });
    if (error) console.error("child:", c.slug, error.message);
    else console.log("✓", c.slug, "→", c.parent);
  }

  // Attach existing "flat" DB categories as children of the right parent
  const ATTACH: Record<string, string> = {
    "controlul-greutatii": "nutritie",
    "programe": "nutritie",
    "suplimente": "suplimente-alimentare",       // rename alias: suplimente stays, but gets parent
    "aloe": "suplimente-alimentare",
    "uleiuri-esentiale": "suplimente-alimentare",
    "linia-real": "suplimente-alimentare",
    "nevoi-specifice": "suplimente-alimentare",
    "omega-si-perle": "suplimente-alimentare",
    "necesitatile-energetice": "suplimente-alimentare",
    "pur": "suplimente-alimentare",
    "proteina": "sport",
    "sport": "alimente-functionale",
    "pauze-dulci": "alimente-functionale",
    "alimente": "alimente-functionale",
    "cafea": "alimente-functionale",
    "choco": "alimente-functionale",
    "ceaiuri": "alimente-functionale",
    "masina-de-cafea": "alimente-functionale",
    "accesorii-pentru-cafenea": "alimente-functionale",
    "ingrijirea-corpului": "ingrijire-personala",
    "fata": "ingrijire-personala",
    "par": "ingrijire-personala",
    "oil": "ingrijire-personala",
    "corp": "ingrijire-personala",
    "protectie-solara": "ingrijire-personala",
    "makeup": "make-up",
    "parfumuri-inspirate": "parfumuri",
    "bio-molecule": "ingrijire-personala",
    "hydropura": "ingrijirea-mediului",
    "bio-effective": "ingrijirea-mediului",
    "parfum-de-camera": "parfumuri-de-camera",
    "promotii-si-kit-uri": undefined as unknown as string, // keep as root (no parent)
  };

  // Refresh map (new children inserted above need to be findable as parents)
  const { data: all2 } = await supabase.from("product_categories").select("id, slug");
  for (const row of all2 || []) slugToId.set(row.slug, row.id);

  for (const [slug, parentSlug] of Object.entries(ATTACH)) {
    if (!parentSlug) continue;
    const parent_id = slugToId.get(parentSlug);
    if (!parent_id) { console.error("parent missing for attach", slug, "→", parentSlug); continue; }
    const { error } = await supabase.from("product_categories").update({ parent_id }).eq("slug", slug);
    if (error) console.error("attach:", slug, error.message);
    else console.log("↪", slug, "→", parentSlug);
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
