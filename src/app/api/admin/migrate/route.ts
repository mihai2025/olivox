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

export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const migrations = [
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS addon_group_ids jsonb DEFAULT '[]'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fan_awb text DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fan_status text DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS sd_awb text DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS sd_status text DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS eb_awb text DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS eb_status text DEFAULT ''",
    // Migrate existing awb_number data into separate columns
    "UPDATE orders SET fan_awb = awb_number, fan_status = awb_status WHERE awb_number != '' AND awb_number IS NOT NULL AND shipping_method = 'fancourier' AND (fan_awb = '' OR fan_awb IS NULL)",
    "UPDATE orders SET sd_awb = awb_number, sd_status = awb_status WHERE awb_number != '' AND awb_number IS NOT NULL AND shipping_method = 'sameday' AND (sd_awb = '' OR sd_awb IS NULL)",
    "UPDATE orders SET eb_awb = awb_number, eb_status = awb_status WHERE awb_number != '' AND awb_number IS NOT NULL AND shipping_method = 'easybox' AND (eb_awb = '' OR eb_awb IS NULL)",
    // Cross-sells
    `CREATE TABLE IF NOT EXISTS cross_sells (
      id serial PRIMARY KEY,
      source_type text NOT NULL CHECK (source_type IN ('product', 'category')),
      source_id integer NOT NULL,
      target_product_id integer NOT NULL,
      position integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      UNIQUE(source_type, source_id, target_product_id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_cross_sells_target ON cross_sells (target_product_id)",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS cross_sell_items jsonb DEFAULT '[]'",
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_category_slugs jsonb DEFAULT '[]'",
    "ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS seo_text text DEFAULT ''",
    // Reviews
    `CREATE TABLE IF NOT EXISTS product_reviews (
      id serial PRIMARY KEY,
      product_id integer NOT NULL,
      customer_name text NOT NULL DEFAULT '',
      rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment text NOT NULL DEFAULT '',
      email text DEFAULT '',
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    "CREATE INDEX IF NOT EXISTS idx_reviews_product_status ON product_reviews (product_id, status)",
    // Homepage builder
    `CREATE TABLE IF NOT EXISTS homepage_items (
      id serial PRIMARY KEY,
      type text NOT NULL DEFAULT 'product',
      title text NOT NULL DEFAULT '',
      description text DEFAULT '',
      image_url text DEFAULT '',
      link_url text DEFAULT '',
      position int NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  ];

  const results: string[] = [];

  for (const sql of migrations) {
    const { error } = await supabase.rpc("exec_sql", { query: sql });
    if (error) {
      results.push(`SKIP: ${sql.slice(0, 60)}... (${error.message})`);
    } else {
      results.push(`OK: ${sql.slice(0, 60)}...`);
    }
  }

  return NextResponse.json({ success: true, results });
}
