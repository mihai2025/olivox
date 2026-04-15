import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ghidulSupabase = createClient(
  "https://bmqqpnhwyozakcpxavps.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcXFwbmh3eW96YWtjcHhhdnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjU4MjksImV4cCI6MjA4NDUwMTgyOX0.7feQiPcJBqjB5sNLGqkMfYUGWVWSg8pp696IH70BMzQ"
);

const TIP_RANK: Record<string, number> = {
  sector: 1,
  municipiu: 2,
  oras: 3,
  comuna: 4,
};

// Cache localitati per judet
const localitatiCache = new Map<string, { data: string[]; time: number }>();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const judetId = searchParams.get("judetId");

  if (!judetId) {
    return NextResponse.json([]);
  }

  const cached = localitatiCache.get(judetId);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const { data, error } = await ghidulSupabase
    .from("localitati")
    .select("id, nume, tip_localitate")
    .eq("judet_id", Number(judetId))
    .order("nume", { ascending: true });

  if (error) {
    return NextResponse.json(cached?.data || []);
  }

  const sorted = (data ?? []).sort((a, b) => {
    const ra = TIP_RANK[a.tip_localitate ?? ""] ?? 5;
    const rb = TIP_RANK[b.tip_localitate ?? ""] ?? 5;
    if (ra !== rb) return ra - rb;
    return a.nume.localeCompare(b.nume, "ro");
  });

  const result = sorted.map((l) => l.nume);
  localitatiCache.set(judetId, { data: result, time: Date.now() });
  return NextResponse.json(result);
}
