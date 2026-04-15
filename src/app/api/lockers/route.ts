import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function getSamedaySettings() {
  const { data } = await supabase.from("settings").select("value").eq("key", "sameday").single();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function getSamedayToken(sd: Record<string, string>): Promise<string | null> {
  const baseUrl = sd.test_mode === "true" ? "https://sameday-api.demo.zitec.com" : "https://api.sameday.ro";
  const res = await fetch(`${baseUrl}/api/authenticate`, {
    method: "POST",
    headers: {
      "X-Auth-Username": sd.username,
      "X-Auth-Password": sd.password,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "remember_me=1",
  });
  const data = await res.json();
  return data?.token || null;
}

// Cache lockers for 30 minutes (6500+ lockers, rarely changes)
let cachedLockers: { data: unknown; time: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function GET() {
  // Return cached if fresh
  if (cachedLockers && Date.now() - cachedLockers.time < CACHE_TTL) {
    return NextResponse.json(cachedLockers.data);
  }

  const sd = await getSamedaySettings();
  if (!sd?.username || !sd?.password) {
    return NextResponse.json({ error: "Sameday not configured" }, { status: 500 });
  }

  const token = await getSamedayToken(sd);
  if (!token) {
    return NextResponse.json({ error: "Sameday auth failed" }, { status: 500 });
  }

  const baseUrl = sd.test_mode === "true" ? "https://sameday-api.demo.zitec.com" : "https://api.sameday.ro";

  try {
    // Fetch all pages (max 1000 per page, ~6500 total)
    const allLockers: { id: number; name: string; address: string; city: string; county: string }[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${baseUrl}/api/client/lockers?countPerPage=1000&page=${page}`, {
        headers: { "X-Auth-Token": token },
      });
      const data = await res.json();
      const items = data?.data || [];

      if (!Array.isArray(items) || items.length === 0) break;

      for (const l of items) {
        allLockers.push({
          id: l.lockerId || l.id,
          name: l.name,
          address: l.address,
          city: l.city,
          county: l.county || "",
        });
      }

      totalPages = data.pages || 1;
      page++;
    } while (page <= totalPages);

    cachedLockers = { data: allLockers, time: Date.now() };
    return NextResponse.json(allLockers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lockers", details: String(error) }, { status: 500 });
  }
}
