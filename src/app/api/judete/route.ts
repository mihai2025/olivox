import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ghidulSupabase = createClient(
  "https://bmqqpnhwyozakcpxavps.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcXFwbmh3eW96YWtjcHhhdnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjU4MjksImV4cCI6MjA4NDUwMTgyOX0.7feQiPcJBqjB5sNLGqkMfYUGWVWSg8pp696IH70BMzQ"
);

// Cache judete in memory (they rarely change)
let cachedJudete: { id: number; name: string }[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function GET() {
  if (cachedJudete && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedJudete);
  }

  const { data, error } = await ghidulSupabase
    .from("judete")
    .select("id, nume")
    .order("nume", { ascending: true });

  if (error) {
    return NextResponse.json(cachedJudete || []);
  }

  cachedJudete = data?.map((j) => ({ id: j.id, name: j.nume })) || [];
  cacheTime = Date.now();
  return NextResponse.json(cachedJudete);
}
