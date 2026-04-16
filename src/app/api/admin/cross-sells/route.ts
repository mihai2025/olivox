import { NextRequest, NextResponse } from "next/server";
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

// GET: list cross-sells for a source (product or category)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sourceType = req.nextUrl.searchParams.get("source_type");
  const sourceId = req.nextUrl.searchParams.get("source_id");

  if (!sourceType || !sourceId) return NextResponse.json([]);

  const { data: rows } = await supabase
    .from("cross_sells")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_id", Number(sourceId))
    .order("position");

  if (!rows?.length) return NextResponse.json([]);

  // Fetch target product details
  const productIds = rows.map((r) => r.target_product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, r2_image_url, image_url")
    .in("id", productIds);

  const productMap = new Map((products || []).map((p) => [p.id, p]));

  const result = rows.map((r) => ({
    id: r.id,
    target_product_id: r.target_product_id,
    product: productMap.get(r.target_product_id) || null,
  }));

  return NextResponse.json(result);
}

// POST: add a cross-sell link
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { source_type, source_id, target_product_id } = body;

  if (!source_type || !source_id || !target_product_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get max position
  const { data: existing } = await supabase
    .from("cross_sells")
    .select("position")
    .eq("source_type", source_type)
    .eq("source_id", source_id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("cross_sells")
    .insert({ source_type, source_id: Number(source_id), target_product_id: Number(target_product_id), position: nextPos })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE: remove a cross-sell link
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase.from("cross_sells").delete().eq("id", Number(id));
  return NextResponse.json({ ok: true });
}
