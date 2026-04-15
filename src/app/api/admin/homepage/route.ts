import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "huse2024!";

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

// GET - list all homepage items (ordered by position)
export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("homepage_items")
    .select("*")
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST - create new item
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, title, description, image_url, link_url } = body;

  // Get max position
  const { data: last } = await supabase
    .from("homepage_items")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("homepage_items")
    .insert({ type: type || "product", title: title || "", description: description || "", image_url: image_url || "", link_url: link_url || "", position })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT - update item (edit or reorder)
export async function PUT(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Bulk reorder: { reorder: [{id, position}, ...] }
  if (body.reorder && Array.isArray(body.reorder)) {
    for (const item of body.reorder) {
      await supabase.from("homepage_items").update({ position: item.position }).eq("id", item.id);
    }
    return NextResponse.json({ success: true });
  }

  // Single item update
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const update: Record<string, unknown> = {};
  for (const key of ["type", "title", "description", "image_url", "link_url", "position", "active"]) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }

  const { data, error } = await supabase.from("homepage_items").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - remove item
export async function DELETE(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("homepage_items").delete().eq("id", Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
