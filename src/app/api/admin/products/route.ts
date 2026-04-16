import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "olivox2026!";

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { error } = await supabase.from("products").insert({
    woo_id: 0,
    name: body.name,
    slug: body.slug,
    image_url: body.image_url || "",
    r2_image_url: body.image_url || "",
    price: body.price || 0,
    category_slugs: body.category_slugs || [],
    template: body.template || "generic",
    short_description: body.short_description || "",
    description: body.description || "",
    meta_title: body.meta_title || "",
    meta_description: body.meta_description || "",
    keywords: body.keywords || "",
    custom_fields: body.custom_fields || [],
    addon_group_ids: body.addon_group_ids || [],
    source_url: body.source_url || "",
    sku: body.sku || "",
    stock_status: body.stock_status || "",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...fields } = body;
  const update: Record<string, unknown> = {};
  for (const key of ["name", "slug", "price", "image_url", "r2_image_url", "print_image_url", "short_description", "description", "category_slugs", "template", "meta_title", "meta_description", "keywords", "custom_fields", "addon_group_ids", "source_url", "sku", "stock_status"]) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }
  const { error } = await supabase.from("products").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
