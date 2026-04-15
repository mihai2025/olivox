import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Public: fetch cross-sell products for a given product (bidirectional)
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  const categorySlugs = req.nextUrl.searchParams.get("category_slugs");

  if (!productId) return NextResponse.json([]);

  const pid = Number(productId);
  const targetIds = new Set<number>();

  // 1. Product-level cross-sells (direct: source -> target)
  const { data: direct } = await supabase
    .from("cross_sells")
    .select("target_product_id")
    .eq("source_type", "product")
    .eq("source_id", pid);
  for (const r of direct || []) targetIds.add(r.target_product_id);

  // 2. Product-level cross-sells (reverse: target -> source, bidirectional)
  const { data: reverse } = await supabase
    .from("cross_sells")
    .select("source_id")
    .eq("source_type", "product")
    .eq("target_product_id", pid);
  for (const r of reverse || []) targetIds.add(r.source_id);

  // 3. Category-level cross-sells
  if (categorySlugs) {
    const slugs = categorySlugs.split(",").filter(Boolean);
    if (slugs.length > 0) {
      // Get category IDs from slugs
      const { data: cats } = await supabase
        .from("product_categories")
        .select("id")
        .in("slug", slugs);
      const catIds = (cats || []).map((c) => c.id);

      if (catIds.length > 0) {
        const { data: catCrossSells } = await supabase
          .from("cross_sells")
          .select("target_product_id")
          .eq("source_type", "category")
          .in("source_id", catIds);
        for (const r of catCrossSells || []) targetIds.add(r.target_product_id);
      }
    }
  }

  // Remove self
  targetIds.delete(pid);

  if (targetIds.size === 0) return NextResponse.json([]);

  // Fetch product details
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, r2_image_url, image_url, category_slugs")
    .in("id", Array.from(targetIds));

  return NextResponse.json(products || []);
}
