import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "pixels")
    .single();

  if (!data) return NextResponse.json({});

  try {
    return NextResponse.json(JSON.parse(data.value));
  } catch {
    return NextResponse.json({});
  }
}
