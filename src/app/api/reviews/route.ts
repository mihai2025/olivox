import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/reviews?product_id=X -> approved reviews for a product
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  if (!productId) return NextResponse.json({ reviews: [], aggregate: null });

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("id, customer_name, rating, comment, created_at")
    .eq("product_id", Number(productId))
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!reviews?.length) return NextResponse.json({ reviews: [], aggregate: null });

  const count = reviews.length;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const avg = sum / count;

  return NextResponse.json({
    reviews,
    aggregate: {
      count,
      average: Math.round(avg * 10) / 10,
    },
  });
}

// POST /api/reviews - submit a new review (goes to pending)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, customer_name, rating, comment, email } = body;

  if (!product_id || !rating) {
    return NextResponse.json({ error: "product_id si rating sunt obligatorii" }, { status: 400 });
  }

  const ratingNum = Math.max(1, Math.min(5, Math.round(Number(rating))));
  const name = String(customer_name || "").trim().slice(0, 100);
  const text = String(comment || "").trim().slice(0, 2000);
  const mail = String(email || "").trim().slice(0, 200);

  if (!name) {
    return NextResponse.json({ error: "Numele este obligatoriu" }, { status: 400 });
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: Number(product_id),
    customer_name: name,
    rating: ratingNum,
    comment: text,
    email: mail,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: "Multumim! Recenzia ta va fi publicata dupa moderare." });
}
