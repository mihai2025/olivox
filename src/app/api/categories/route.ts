import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data || []);
}
