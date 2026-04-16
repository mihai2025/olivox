import { NextResponse } from "next/server";
import { getOrders, updateOrderStatus, deleteOrder } from "@/lib/db";
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

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (fields.status && Object.keys(fields).length === 1) {
      const order = await updateOrderStatus(id, fields.status);
      return NextResponse.json(order);
    }
    // Full update
    const update: Record<string, unknown> = {};
    for (const key of ["status", "customer_name", "customer_phone", "customer_email", "address", "brand_name", "model_name", "custom_name", "product_name", "text_color", "observations", "custom_field_values", "order_value", "locker_id", "awb_number", "awb_status", "fan_awb", "fan_status", "sd_awb", "sd_status", "eb_awb", "eb_status", "final_image_url", "print_image_url", "ramburs", "fgo_serie", "fgo_numar", "fgo_link"]) {
      if (fields[key] !== undefined) update[key] = fields[key];
    }
    const { data, error: err } = await supabase.from("orders").update(update).eq("id", id).select().single();
    if (err) throw err;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update order", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete order", details: String(error) },
      { status: 500 }
    );
  }
}
