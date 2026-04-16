import { NextResponse } from "next/server";

const START = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: Math.floor((Date.now() - START) / 1000),
      timestamp: new Date().toISOString(),
      service: "olivox-web",
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
