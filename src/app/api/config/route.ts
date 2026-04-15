import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";

export async function GET() {
  const config = await getSiteConfig();
  // Don't expose admin email and email from to public
  const { emailAdmin, emailFrom, ...publicConfig } = config;
  return NextResponse.json(publicConfig);
}
