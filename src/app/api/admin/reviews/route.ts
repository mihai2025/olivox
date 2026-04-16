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

// GET /api/admin/reviews?status=pending - list reviews
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "pending";

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);

  // enrich with product name
  const ids = Array.from(new Set((reviews || []).map((r) => r.product_id)));
  const productMap = new Map<number, string>();
  if (ids.length > 0) {
    const { data: prods } = await supabase.from("products").select("id, name, slug").in("id", ids);
    for (const p of prods || []) productMap.set(p.id, `${p.name} (${p.slug})`);
  }

  const enriched = (reviews || []).map((r) => ({ ...r, product_name: productMap.get(r.product_id) || `#${r.product_id}` }));
  return NextResponse.json(enriched);
}

// PATCH /api/admin/reviews - moderate a review
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, status } = body;
  if (!id || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id si status (pending|approved|rejected) obligatorii" }, { status: 400 });
  }
  const { error } = await supabase.from("product_reviews").update({ status }).eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/reviews?id=N
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await supabase.from("product_reviews").delete().eq("id", Number(id));
  return NextResponse.json({ ok: true });
}
