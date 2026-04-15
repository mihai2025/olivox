import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Public endpoint - returns active homepage items + homepage_active flag
export async function GET() {
  // Check if homepage is active
  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "homepage_active")
    .single();

  const active = setting?.value === "true";

  if (!active) {
    return NextResponse.json({ active: false, items: [] });
  }

  const { data: items } = await supabase
    .from("homepage_items")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  return NextResponse.json({ active: true, items: items || [] });
}
