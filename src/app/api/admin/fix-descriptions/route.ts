import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

const WOO_URL = "https://tablostar.ro/wp-json/wc/v3";
const WOO_KEY = "ck_d9f31e7e54ed57ad244512b36752e240a4c6bde4";
const WOO_SECRET = "cs_81b737583b4e76a333f91bed509aae60fc5e92af";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (key !== (process.env.IMPORT_KEY || "import2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 50;

  // Fetch products from WooCommerce with original HTML descriptions
  const res = await fetch(
    `${WOO_URL}/products?per_page=${perPage}&page=${page}&category=271&status=publish&orderby=id&order=asc&consumer_key=${WOO_KEY}&consumer_secret=${WOO_SECRET}`
  );

  const totalPages = parseInt(res.headers.get("x-wp-totalpages") || "1");
  const products = await res.json();

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ page, updated: 0, message: "Done" });
  }

  let updated = 0;
  let skipped = 0;

  for (const prod of products) {
    // Clean HTML: keep tags but fix &nbsp;
    const cleanHtml = (html: string) => {
      if (!html) return "";
      return html
        .replace(/&nbsp;/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    };

    const shortDesc = cleanHtml(prod.short_description);
    const fullDesc = cleanHtml(prod.description);

    // Find product in our DB by woo_id
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("woo_id", prod.id)
      .single();

    if (!existing) {
      skipped++;
      continue;
    }

    await supabase
      .from("products")
      .update({
        short_description: shortDesc,
        description: fullDesc,
      })
      .eq("woo_id", prod.id);

    updated++;
  }

  const hasMore = page < totalPages;

  return NextResponse.json({
    page,
    total_pages: totalPages,
    updated,
    skipped,
    has_more: hasMore,
    next: hasMore ? `?page=${page + 1}&key=${key}` : null,
    message: hasMore ? `Page ${page}/${totalPages} done.` : "All descriptions updated!",
  });
}
