import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function titleCase(s: string): string {
  return (s || "")
    .toLowerCase()
    .split(" ")
    .map((w) => w.length ? w[0].toUpperCase() + w.slice(1) : w)
    .join(" ");
}

export async function GET() {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json([], { status: 500 });

  const cats = data || [];
  // Count products per slug in one query
  const { data: prods } = await supabase.from("products").select("category_slugs");
  const counts: Record<string, number> = {};
  for (const row of prods || []) {
    const slugs = (row as { category_slugs?: string[] }).category_slugs || [];
    for (const s of slugs) counts[s] = (counts[s] || 0) + 1;
  }

  const enriched = cats.map((c) => ({
    ...c,
    name: titleCase(c.name),
    product_count: counts[c.slug] ?? c.product_count ?? 0,
  }));

  return NextResponse.json(enriched);
}
