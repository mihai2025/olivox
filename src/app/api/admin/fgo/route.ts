import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import crypto from "crypto";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "olivox2026!";
const FGO_PROD_URL = "https://api.fgo.ro/v1";
const FGO_TEST_URL = "https://api-testuat.fgo.ro/v1";

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

interface FgoSettings {
  cui: string;
  api_key: string;
  serie: string;
  platform_url: string;
  cota_tva?: number;
  test_mode?: boolean;
}

async function getFgoSettings(): Promise<FgoSettings | null> {
  const { data } = await supabase.from("settings").select("value").eq("key", "fgo").single();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

function fgoUrl(fgo: FgoSettings): string {
  return fgo.test_mode ? FGO_TEST_URL : FGO_PROD_URL;
}

function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").toUpperCase();
}

// Remove diacritics for FGO nomenclature compatibility
function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ș/g, "s").replace(/Ș/g, "S")
    .replace(/ț/g, "t").replace(/Ț/g, "T")
    .replace(/ă/g, "a").replace(/Ă/g, "A")
    .replace(/â/g, "a").replace(/Â/g, "A")
    .replace(/î/g, "i").replace(/Î/g, "I");
}

export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, order_id } = body;

  const fgo = await getFgoSettings();
  if (!fgo || !fgo.cui || !fgo.api_key) {
    return NextResponse.json({ error: "FGO nu este configurat. Mergi la Setari > FGO Facturare." }, { status: 400 });
  }

  const baseUrl = fgoUrl(fgo);

  // Test connection
  if (action === "test") {
    try {
      const hash = sha1(fgo.cui + fgo.api_key);
      const res = await fetch(`${baseUrl}/nomenclator/tva`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const env = fgo.test_mode ? "TEST" : "PRODUCTIE";
        return NextResponse.json({ success: true, message: `Conexiune OK (${env})` });
      } else {
        return NextResponse.json({ error: `FGO a raspuns cu status ${res.status}` }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Nu se poate conecta la FGO: " + String(e) }, { status: 500 });
    }
  }

  if (!fgo.serie) {
    return NextResponse.json({ error: "Seria facturii nu este configurata." }, { status: 400 });
  }

  // Get order
  const { data: order, error: orderErr } = await supabase.from("orders").select("*").eq("id", order_id).single();
  if (orderErr || !order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });

  // Get site config for company details
  const { data: siteRow } = await supabase.from("settings").select("value").eq("key", "site_config").single();
  const siteConfig = siteRow ? JSON.parse(siteRow.value) : {};

  if (action === "emitere") {
    if (order.fgo_numar) {
      return NextResponse.json({ error: "Factura a fost deja emisa: " + order.fgo_serie + " " + order.fgo_numar }, { status: 400 });
    }

    const clientName = order.customer_name || "Client";
    const hash = sha1(fgo.cui + fgo.api_key + clientName);

    // Parse address - format: "strada, localitate, judet" or Easybox format
    let judet = "", localitate = "", adresa = "";
    try {
      const raw = order.address || "";
      if (raw.startsWith("Easybox:")) {
        const parts = raw.replace("Easybox:", "").trim().split(",").map((s: string) => s.trim());
        adresa = parts[1] || parts[0] || "";
        localitate = parts[2] || "";
        judet = parts[3] || "";
      } else {
        const parts = raw.split(",").map((s: string) => s.trim());
        adresa = parts[0] || "";
        localitate = parts[1] || "";
        judet = parts[2] || "";
      }
    } catch { /* best effort */ }

    // Normalize for FGO nomenclature (no diacritics)
    judet = removeDiacritics(judet);
    localitate = removeDiacritics(localitate);

    if (!judet) {
      return NextResponse.json({ error: "Judetul lipseste din adresa comenzii. Format asteptat: strada, localitate, judet" }, { status: 400 });
    }

    const ramburs = order.ramburs != null ? order.ramburs : 0;
    const orderValue = (ramburs !== 0) ? ramburs : (order.order_value || siteConfig.productPrice || 0);
    const siteName = siteConfig.siteName || siteConfig.domain || "olivox.ro";

    const payload = {
      CodUnic: fgo.cui,
      Hash: hash,
      Serie: fgo.serie,
      Valuta: "RON",
      TipFactura: "Factura",
      Text: `[${siteName}] - Comanda #${order.id}`,
      Client: {
        Denumire: clientName,
        Email: order.customer_email || "",
        Telefon: order.customer_phone || "",
        Tara: "RO",
        Judet: judet,
        Localitate: localitate,
        Adresa: adresa,
        Tip: "PF",
      },
      Continut: [
        {
          Denumire: order.product_name || `Husa ${order.brand_name} ${order.model_name}`,
          NrProduse: 1,
          UM: "BUC",
          CotaTVA: fgo.cota_tva ?? 0,
          PretTotal: orderValue,
        },
      ],
      PlatformaUrl: fgo.platform_url || "https://olivox.ro",
    };

    try {
      const res = await fetch(`${baseUrl}/factura/emitere`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.Success) {
        const serie = data.Factura?.Serie || fgo.serie;
        const numar = data.Factura?.Numar || "";
        const link = data.Factura?.Link || "";

        await supabase.from("orders").update({
          fgo_serie: serie,
          fgo_numar: numar,
          fgo_link: link,
        }).eq("id", order_id);

        return NextResponse.json({ success: true, serie, numar, link });
      } else {
        return NextResponse.json({ error: data.Message || "Eroare FGO necunoscuta" }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Eroare comunicare FGO: " + String(e) }, { status: 500 });
    }
  }

  if (action === "stornare") {
    if (!order.fgo_numar || !order.fgo_serie) {
      return NextResponse.json({ error: "Nu exista factura de stornat." }, { status: 400 });
    }

    const hash = sha1(fgo.cui + fgo.api_key + order.fgo_numar);

    const payload = {
      CodUnic: fgo.cui,
      Hash: hash,
      Numar: order.fgo_numar,
      Serie: order.fgo_serie,
      PlatformaUrl: fgo.platform_url || "https://olivox.ro",
    };

    try {
      const res = await fetch(`${baseUrl}/factura/stornare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.Success) {
        // Clear invoice from order
        await supabase.from("orders").update({
          fgo_serie: null,
          fgo_numar: null,
          fgo_link: null,
        }).eq("id", order_id);

        return NextResponse.json({ success: true, storno: data.Factura });
      } else {
        return NextResponse.json({ error: data.Message || "Eroare stornare FGO" }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Eroare comunicare FGO: " + String(e) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Actiune necunoscuta" }, { status: 400 });
}
