import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { getSiteConfig } from "@/lib/site-config";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "olivox2026!";

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

async function getFanCourierSettings() {
  const { data } = await supabase.from("settings").select("value").eq("key", "fancourier").single();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function getFanToken(fc: Record<string, string>): Promise<string | null> {
  // Auth endpoint: POST /login?username=X&password=Y
  const res = await fetch(
    `https://api.fancourier.ro/login?username=${encodeURIComponent(fc.username)}&password=${encodeURIComponent(fc.password)}`,
    { method: "POST" }
  );
  const data = await res.json();
  return data?.data?.token || data?.token || null;
}

// CREATE AWB
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fc = await getFanCourierSettings();
  if (!fc?.username || !fc?.password || !fc?.client_id) {
    return NextResponse.json({ error: "Credentiale FanCourier incomplete. Completeaza in Setari." }, { status: 400 });
  }

  const { order_id } = await request.json();

  const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", order_id).single();
  if (orderError || !order) return NextResponse.json({ error: "Comanda nu a fost gasita" }, { status: 404 });
  // Allow re-generating AWB (e.g. switching courier)

  try {
    const token = await getFanToken(fc);
    if (!token) {
      return NextResponse.json({ error: "Autentificare FanCourier esuata. Verifica username/parola in Setari." }, { status: 500 });
    }

    // Parse address: "strada, localitate, judet"
    const addressParts = order.address?.split(",").map((s: string) => s.trim()) || [];
    const street = addressParts[0] || order.address || "";
    const locality = addressParts[1] || "";
    const county = addressParts[2] || "";

    const sc = await getSiteConfig();

    // AWB body per documentatie FanCourier
    const rambursValue = order.ramburs != null ? order.ramburs : (order.order_value || sc.productPrice || 0);
    const isZeroRamburs = rambursValue === 0;

    const awbBody = {
      clientId: Number(fc.client_id),
      shipments: [
        {
          info: {
            service: "Standard",
            packages: { parcel: 1, envelope: 0 },
            weight: 0.3,
            ...(isZeroRamburs ? {} : { cod: rambursValue }),
            declaredValue: rambursValue,
            payment: "sender",
            ...(isZeroRamburs ? {} : { returnPayment: "sender" }),
            content: order.product_name || `Husa ${order.brand_name} ${order.model_name}`,
            observation: `#${order.id} ${order.product_name || ""}${order.brand_name ? " " + order.brand_name : ""}${order.model_name ? " " + order.model_name : ""}${order.custom_name ? " - " + order.custom_name : ""}${order.observations ? " | " + order.observations : ""}`.trim(),
            dimensions: { length: 20, height: 3, width: 12 },
            ...(isZeroRamburs ? {} : await (async () => {
              const sc = await getSiteConfig();
              const iban = sc.iban || fc.iban || "";
              const banca = sc.banca || fc.banca || "";
              return iban && banca ? { bank: banca, bankAccount: iban } : {};
            })()),
          },
          recipient: {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email || "",
            address: {
              county: county,
              locality: locality,
              street: street,
            },
          },
        },
      ],
    };

    const awbRes = await fetch("https://api.fancourier.ro/intern-awb", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(awbBody),
    });

    const awbData = await awbRes.json();

    // Extract AWB number from response
    let awbNumber = "";
    const shipment = awbData?.response?.[0];
    if (shipment?.awbNumber) {
      awbNumber = String(shipment.awbNumber);
    } else if (shipment?.awb) {
      awbNumber = String(shipment.awb);
    }

    // Check for errors in response
    if (shipment?.errors) {
      return NextResponse.json({
        error: "FanCourier a returnat erori",
        details: JSON.stringify(shipment.errors),
      }, { status: 500 });
    }

    if (!awbNumber) {
      return NextResponse.json({
        error: "Nu s-a putut genera AWB",
        details: JSON.stringify(awbData),
      }, { status: 500 });
    }

    // Save AWB to order (separate column for FanCourier + legacy field)
    await supabase.from("orders").update({
      awb_number: awbNumber,
      awb_status: "Creat FanCourier",
      fan_awb: awbNumber,
      fan_status: "Creat FanCourier",
    }).eq("id", order_id);

    return NextResponse.json({
      awb: awbNumber,
      tracking_url: `https://www.fancourier.ro/awb-tracking/?tracking=${awbNumber}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Eroare la generare AWB", details: String(error) }, { status: 500 });
  }
}

// GET PDF - Printare AWB
export async function GET(request: Request) {
  // Accept auth via header OR query param
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("auth");
  const headerAuth = checkAuth(request);
  const validKey = queryKey && queryKey === (process.env.ADMIN_PASS || "olivox2026!");

  if (!headerAuth && !validKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const awb = searchParams.get("awb");
  if (!awb) return NextResponse.json({ error: "AWB number required" }, { status: 400 });

  const fc = await getFanCourierSettings();
  if (!fc?.username || !fc?.password || !fc?.client_id) {
    return NextResponse.json({ error: "Credentiale FanCourier incomplete" }, { status: 400 });
  }

  try {
    const token = await getFanToken(fc);
    if (!token) return NextResponse.json({ error: "Auth failed" }, { status: 500 });

    // Per documentatie: GET /awb/label?clientId=X&awbs[]=Y&pdf=1&dpi=300
    const pdfRes = await fetch(
      `https://api.fancourier.ro/awb/label?clientId=${fc.client_id}&awbs[]=${awb}&pdf=1&dpi=300&format=A4&copies=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const contentType = pdfRes.headers.get("content-type") || "";

    if (!pdfRes.ok || !contentType.includes("pdf")) {
      const errText = await pdfRes.text();
      return NextResponse.json({ error: "Nu s-a putut descarca PDF. AWB-ul poate fi generat cu alt cont FanCourier.", details: errText }, { status: 500 });
    }

    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AWB-${awb}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Eroare", details: String(error) }, { status: 500 });
  }
}
