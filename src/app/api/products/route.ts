import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "24");

  // Single product by slug
  if (slug) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ product: null }, { status: 404 });
    }

    // Resolve addon groups into custom_fields
    if (data.addon_group_ids?.length) {
      const { data: settingsRow } = await supabase.from("settings").select("value").eq("key", "addon_groups").single();
      if (settingsRow) {
        try {
          const groups = JSON.parse(settingsRow.value);
          const groupFields = (data.addon_group_ids as string[])
            .flatMap((gid: string) => {
              const group = groups.find((g: { id: string; fields: unknown[] }) => g.id === gid);
              return group?.fields || [];
            });
          data.custom_fields = [...groupFields, ...(data.custom_fields || [])];
        } catch { /* ignore parse errors */ }
      }
    }

    return NextResponse.json({ product: data });
  }
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("products")
    .select("id, name, slug, r2_image_url, image_url, print_image_url, price, category_slugs, short_description", { count: "exact" });

  if (category) {
    query = query.contains("category_slugs", [category]);
  }

  const searchTerm = searchParams.get("search");
  if (searchTerm) {
    // Split into words and match ALL (AND logic)
    const words = searchTerm.trim().split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      query = query.ilike("name", `%${word}%`);
    }
  }

  const { data, error, count } = await query
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }

  return NextResponse.json({
    products: data || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}
