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

export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["fancourier", "sameday", "fgo", "pixels", "site_config", "whatsapp", "addon_groups", "homepage_active"]);

  const settings: Record<string, unknown> = {};
  data?.forEach((row) => {
    try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
  });

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    const jsonValue = JSON.stringify(value);
    await supabase
      .from("settings")
      .upsert({ key, value: jsonValue }, { onConflict: "key" });
  }

  return NextResponse.json({ success: true });
}
