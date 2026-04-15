import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE = "https://olivox.ro";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/categorii`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/articole`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/cautare`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const legal: MetadataRoute.Sitemap = [
    "termeni-si-conditii",
    "politica-confidentialitate",
    "politica-cookies",
  ].map((slug) => ({
    url: `${BASE}/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.2,
  }));

  let categoryUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: categories } = await supabase
      .from("product_categories")
      .select("slug, imported_at");
    categoryUrls = (categories || []).map((cat) => ({
      url: `${BASE}/produse/${cat.slug}`,
      lastModified: cat.imported_at ? new Date(cat.imported_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {}

  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: products } = await supabase
      .from("products")
      .select("slug, category_slugs, imported_at")
      .order("id", { ascending: false })
      .limit(5000);
    productUrls = (products || [])
      .filter((p) => p.slug && p.category_slugs && p.category_slugs.length > 0)
      .map((p) => ({
        url: `${BASE}/produse/${p.category_slugs[0]}/${p.slug}`,
        lastModified: p.imported_at ? new Date(p.imported_at) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch {}

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(5000);
    articleUrls = (articles || [])
      .filter((a) => a.slug)
      .map((a) => ({
        url: `${BASE}/articole/${a.slug}`,
        lastModified: a.published_at ? new Date(a.published_at) : now,
        changeFrequency: "monthly",
        priority: 0.5,
      }));
  } catch {}

  return [...core, ...categoryUrls, ...productUrls, ...articleUrls, ...legal];
}
