import { NextResponse } from "next/server";
import { sendOrderEmail, sendClientEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, customer_phone, address } = body;

    if (!customer_name || !customer_phone || !address) {
      return NextResponse.json(
        { error: "Nume, telefon si adresa sunt obligatorii." },
        { status: 400 }
      );
    }

    // Create order in database
    const { createOrder } = await import("@/lib/db");
    const order = await createOrder({
      brand_name: body.brand_name || "",
      model_name: body.model_name || "",
      custom_name: body.custom_name || "",
      product_name: body.product_name || "",
      text_color: body.text_color || "",
      image_url: body.image_url || "",
      original_image_url: body.original_image_url || "",
      final_image_url: body.final_image_url || "",
      design_image_url: body.design_image_url || "",
      shipping_method: body.shipping_method || "fancourier",
      order_source: body.order_source ? JSON.stringify(body.order_source) : "",
      custom_field_values: body.custom_field_values || {},
      cross_sell_items: body.cross_sell_items || [],
      product_category_slugs: body.product_category_slugs || [],
      order_value: body.order_value || 0,
      locker_id: body.locker_id || null,
      address,
      customer_name,
      customer_phone,
      customer_email: body.customer_email || "",
      observations: body.observations || "",
    });

    // Send emails
    const emailErrors: string[] = [];

    // Send email to admin
    try {
      await sendOrderEmail({ ...body, order_id: order.id });
      console.log(`Admin email sent for order #${order.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Failed to send admin email for order #${order.id}:`, msg, e);
      emailErrors.push(`Admin email: ${msg}`);
    }

    // Send confirmation email to client
    try {
      await sendClientEmail({ ...body, order_id: order.id });
      console.log(`Client email sent for order #${order.id} to ${body.customer_email || "(no email)"}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Failed to send client email for order #${order.id}:`, msg, e);
      emailErrors.push(`Client email: ${msg}`);
    }

    return NextResponse.json(
      { ...order, email_errors: emailErrors.length > 0 ? emailErrors : undefined },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Comanda nu a putut fi salvata. Incearca din nou.", details: String(error) },
      { status: 500 }
    );
  }
}
