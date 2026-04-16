import { supabase } from "@/lib/supabase";

const BASE = "https://olivox.ro";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let rows: Array<{
    slug: string;
    name: string;
    category_slugs: string[] | null;
    r2_image_url: string | null;
    image_url: string | null;
    imported_at: string | null;
  }> = [];

  try {
    const { data } = await supabase
      .from("products")
      .select("slug, name, category_slugs, r2_image_url, image_url, imported_at")
      .order("id", { ascending: false })
      .limit(5000);
    rows = (data || []) as typeof rows;
  } catch {
    rows = [];
  }

  const urls: string[] = [];
  for (const p of rows) {
    if (!p.slug || !p.category_slugs || p.category_slugs.length === 0) continue;
    const image = p.r2_image_url || p.image_url;
    if (!image) continue;
    const loc = `${BASE}/produse/${p.category_slugs[0]}/${p.slug}`;
    const lastmod = p.imported_at || new Date().toISOString();
    urls.push(
      `  <url>\n` +
        `    <loc>${xmlEscape(loc)}</loc>\n` +
        `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n` +
        `    <image:image>\n` +
        `      <image:loc>${xmlEscape(image)}</image:loc>\n` +
        `      <image:title>${xmlEscape(p.name || "")}</image:title>\n` +
        `    </image:image>\n` +
        `  </url>`
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

export const revalidate = 3600;
