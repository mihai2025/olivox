import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  const { name, slug, image_url } = await request.json();
  const { error } = await supabase.from("product_categories").insert({
    name, slug, image_url: image_url || "", sort_order: 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...fields } = body;
  const update: Record<string, unknown> = {};
  for (const key of ["name", "slug", "image_url", "r2_image_url", "description", "sort_order", "meta_title", "meta_description", "parent_id"]) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }
  const { data: before } = await supabase.from("product_categories").select("slug").eq("id", id).single();
  const { error } = await supabase.from("product_categories").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Bust cache for affected pages
  try {
    revalidatePath("/categorii");
    revalidatePath("/");
    if (before?.slug) revalidatePath(`/produse/${before.slug}`);
    if (update.slug && update.slug !== before?.slug) revalidatePath(`/produse/${update.slug}`);
    revalidatePath("/sitemap.xml");
  } catch {}
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const { data: before } = await supabase.from("product_categories").select("slug").eq("id", id).single();
  const { error } = await supabase.from("product_categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    revalidatePath("/categorii");
    revalidatePath("/");
    if (before?.slug) revalidatePath(`/produse/${before.slug}`);
  } catch {}
  return NextResponse.json({ success: true });
}
