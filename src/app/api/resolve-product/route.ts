import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Internal helper for middleware: given an old product slug,
// return the primary category slug and current product slug
// so middleware can issue a 301 to /produse/<category>/<slug>.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const { data } = await supabase
    .from("products")
    .select("slug, category_slugs")
    .eq("slug", slug)
    .single();

  if (!data || !data.category_slugs || data.category_slugs.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    category: data.category_slugs[0],
    productSlug: data.slug,
  }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
