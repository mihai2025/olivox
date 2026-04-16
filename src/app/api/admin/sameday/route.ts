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

function getBaseUrl(sd: Record<string, string>) {
  return sd.test_mode === "true" ? "https://sameday-api.demo.zitec.com" : "https://api.sameday.ro";
}

// CREATE AWB
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sd = await getSamedaySettings();
  if (!sd?.username || !sd?.password) {
    return NextResponse.json({ error: "Credentiale Sameday incomplete. Completeaza in Setari." }, { status: 400 });
  }

  const body = await request.json();
  const { order_id, locker_id } = body;

  const { data: order } = await supabase.from("orders").select("*").eq("id", order_id).single();
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita" }, { status: 404 });

  const token = await getSamedayToken(sd);
  if (!token) return NextResponse.json({ error: "Autentificare Sameday esuata" }, { status: 500 });

  const baseUrl = getBaseUrl(sd);
  const sc = await getSiteConfig();

  // Parse address - for easybox, get locker details from API
  let street = "";
  let city = "";
  let county = "";

  if (locker_id) {
    // Parse from easybox address string: "Easybox: name, address, city"
    if (order.address?.startsWith("Easybox:")) {
      const parts = order.address.replace("Easybox:", "").trim().split(",").map((s: string) => s.trim());
      // parts[0] = locker name, parts[1] = street, parts[2] = city
      street = parts[1] || "";
      city = parts[2] || "";
    }
    // Fetch locker county from API (city/address as fallback already parsed)
    try {
      const lockersRes = await fetch("http" + (baseUrl.includes("demo") ? "" : "s") + "://" + new URL(baseUrl).host + "/api/client/lockers?countPerPage=1000&page=1", {
        headers: { "X-Auth-Token": token },
      });
      const lockersData = await lockersRes.json();
      let locker = (lockersData?.data || []).find((l: { lockerId: number }) => l.lockerId === Number(locker_id));
      // Try more pages if not found
      if (!locker && lockersData?.pages > 1) {
        for (let p = 2; p <= lockersData.pages; p++) {
          const r2 = await fetch(`${baseUrl}/api/client/lockers?countPerPage=1000&page=${p}`, { headers: { "X-Auth-Token": token } });
          const d2 = await r2.json();
          locker = (d2?.data || []).find((l: { lockerId: number }) => l.lockerId === Number(locker_id));
          if (locker) break;
        }
      }
      if (locker) {
        street = locker.address || street;
        city = locker.city || city;
        county = locker.county || "";
      }
    } catch {}
  } else {
    const addressParts = order.address?.split(",").map((s: string) => s.trim()) || [];
    street = addressParts[0] || order.address || "";
    city = addressParts[1] || "";
    county = addressParts[2] || "";
  }

  // Build form data (Sameday API v2 format)
  const params = new URLSearchParams();
  params.set("pickupPoint", sd.pickup_point_id || "");
  params.set("packageType", "0"); // PARCEL
  params.set("packageNumber", "1");
  params.set("packageWeight", "0.3");
  params.set("service", locker_id ? (sd.locker_service_id || sd.service_id || "") : (sd.service_id || ""));
  params.set("awbPayment", "1"); // CLIENT
  params.set("thirdPartyPickup", "0");
  const rambursValue = order.ramburs != null ? order.ramburs : (order.order_value || sc.productPrice || 0);
  params.set("cashOnDelivery", String(rambursValue));
  params.set("insuredValue", String(rambursValue));
  params.set("awbRecipient[name]", order.customer_name);
  params.set("awbRecipient[phoneNumber]", order.customer_phone);
  params.set("awbRecipient[personType]", "0"); // persoana fizica
  params.set("awbRecipient[email]", order.customer_email || (locker_id ? sc.emailOrders || "comenzi@olivox.ro" : ""));
  params.set("awbRecipient[countyString]", county);
  params.set("awbRecipient[cityString]", city);
  params.set("awbRecipient[address]", street);
  params.set("parcels[0][weight]", "0.3");
  params.set("parcels[0][width]", "12");
  params.set("parcels[0][height]", "3");
  params.set("parcels[0][length]", "20");
  params.set("observation", `#${order.id} ${order.product_name || ""}${order.brand_name ? " " + order.brand_name : ""}${order.model_name ? " " + order.model_name : ""}${order.custom_name ? " - " + order.custom_name : ""}${order.observations ? " | " + order.observations : ""}`.trim());

  if (locker_id) {
    params.set("lockerLastMile", String(locker_id));
  }

  try {
    const res = await fetch(`${baseUrl}/api/awb`, {
      method: "POST",
      headers: { "X-Auth-Token": token, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok || !data.awbNumber) {
      return NextResponse.json({ error: "Eroare Sameday", details: JSON.stringify(data) }, { status: 500 });
    }

    // Save AWB in separate columns based on locker (easybox) or not (sameday)
    const statusText = locker_id ? "Creat Easybox" : "Creat Sameday";
    const update: Record<string, string> = {
      awb_number: data.awbNumber,
      awb_status: statusText,
    };
    if (locker_id) {
      update.eb_awb = data.awbNumber;
      update.eb_status = statusText;
    } else {
      update.sd_awb = data.awbNumber;
      update.sd_status = statusText;
    }
    await supabase.from("orders").update(update).eq("id", order_id);

    return NextResponse.json({
      awb: data.awbNumber,
      cost: data.awbCost,
      tracking_url: `https://sameday.ro/status-colet/?awb=${data.awbNumber}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Eroare", details: String(error) }, { status: 500 });
  }
}

// GET — PDF download or lockers list
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const queryAuth = searchParams.get("auth");
  const headerAuth = checkAuth(request);
  const validKey = queryAuth && queryAuth === (process.env.ADMIN_PASS || "olivox2026!");
  if (!headerAuth && !validKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sd = await getSamedaySettings();
  if (!sd?.username || !sd?.password) return NextResponse.json({ error: "Sameday not configured" }, { status: 400 });

  const token = await getSamedayToken(sd);
  if (!token) return NextResponse.json({ error: "Auth failed" }, { status: 500 });

  const baseUrl = getBaseUrl(sd);

  // Download PDF
  if (action === "pdf") {
    const awb = searchParams.get("awb");
    if (!awb) return NextResponse.json({ error: "AWB required" }, { status: 400 });

    const res = await fetch(`${baseUrl}/api/awb/download/${awb}/A4`, {
      headers: { "X-Auth-Token": token },
    });

    if (!res.ok) return NextResponse.json({ error: "PDF download failed" }, { status: 500 });

    const pdf = await res.arrayBuffer();
    return new NextResponse(pdf, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="AWB-SD-${awb}.pdf"` },
    });
  }

  // List lockers
  if (action === "lockers") {
    const res = await fetch(`${baseUrl}/api/client/lockers?countPerPage=500`, {
      headers: { "X-Auth-Token": token },
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Get services
  if (action === "services") {
    const res = await fetch(`${baseUrl}/api/client/services`, {
      headers: { "X-Auth-Token": token },
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Get pickup points
  if (action === "pickup-points") {
    const res = await fetch(`${baseUrl}/api/client/pickup-points`, {
      headers: { "X-Auth-Token": token },
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
