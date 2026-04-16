import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Cron job: sync AWB tracking status from FanCourier and Sameday
// Run daily via Vercel Cron or external cron service
// URL: /api/cron?secret=CRON_SECRET

const TRACKING_MAP: Record<string, string> = {
  // FanCourier status -> our status
  "Livrat": "livrat",
  "Delivered": "livrat",
  "Retur": "retur",
  "Return": "retur",
  "Refused": "retur",
  "Refuzat": "retur",
};

// Sameday statusId codes -> our status
const SD_STATUS_ID_MAP: Record<number, string> = {
  9: "livrat",   // Livrata cu succes
  35: "retur",   // Retur
};

// Sameday status text keywords -> our status (fallback)
// Note: "refuz predare" = expeditorul nu a predat coletul, NU e retur
// Doar "retur" explicit inseamna retur real
const SD_TEXT_MAP: Record<string, string> = {
  "livrat": "livrat",
  "delivered": "livrat",
};

async function getFanCourierSettings() {
  const { data } = await supabase.from("settings").select("value").eq("key", "fancourier").single();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function getSamedaySettings() {
  const { data } = await supabase.from("settings").select("value").eq("key", "sameday").single();
  if (!data) return null;
  try { return JSON.parse(data.value); } catch { return null; }
}

async function getFanToken(fc: Record<string, string>): Promise<string | null> {
  const res = await fetch(
    `https://api.fancourier.ro/login?username=${encodeURIComponent(fc.username)}&password=${encodeURIComponent(fc.password)}`,
    { method: "POST" }
  );
  const data = await res.json();
  return data?.data?.token || null;
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

// ---- FanCourier tracking ----
async function trackFanCourier(token: string, clientId: string) {
  // Check fan_awb (new) OR awb_number (legacy) for FanCourier orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, fan_awb, awb_number, sd_awb, eb_awb, status")
    .not("status", "in", '("livrat","retur","anulat")')
    .or("fan_awb.neq.,awb_number.neq.");

  // Filter: must have an AWB, and exclude Sameday/Easybox orders (they have sd_awb or eb_awb)
  const filtered = (orders || []).filter((o) => {
    const awb = o.fan_awb || o.awb_number;
    if (!awb) return false;
    // If this AWB belongs to Sameday/Easybox, skip it
    if (o.sd_awb === awb || o.eb_awb === awb) return false;
    return true;
  });
  if (!filtered.length) return { checked: 0, updated: 0, results: [] };

  let updated = 0;
  const results: Array<{ id: number; awb: string; fc_status: string; new_status: string | null }> = [];

  for (let i = 0; i < filtered.length; i += 10) {
    const batch = filtered.slice(i, i + 10);
    const awbParams = batch.map((o) => `awb[]=${o.fan_awb || o.awb_number}`).join("&");

    try {
      const res = await fetch(
        `https://api.fancourier.ro/reports/awb/tracking?clientId=${clientId}&${awbParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const trackingData = data?.data || [];

      for (const track of trackingData) {
        const awb = String(track.awbNumber);
        const fcMessage = track.message || "";
        const order = batch.find((o) => (o.fan_awb || o.awb_number) === awb);
        if (!order) continue;

        let newStatus: string | null = null;
        for (const [keyword, status] of Object.entries(TRACKING_MAP)) {
          if (fcMessage.toLowerCase().includes(keyword.toLowerCase())) {
            newStatus = status;
            break;
          }
        }

        if (newStatus && newStatus !== order.status) {
          await supabase.from("orders").update({
            status: newStatus,
            awb_status: fcMessage,
            fan_status: fcMessage,
          }).eq("id", order.id);
          updated++;
        } else {
          await supabase.from("orders").update({
            awb_status: fcMessage,
            fan_status: fcMessage,
          }).eq("id", order.id);
        }

        results.push({ id: order.id, awb, fc_status: fcMessage, new_status: newStatus });
      }
    } catch (e) {
      console.error("FanCourier tracking batch error:", e);
    }
  }

  return { checked: filtered.length, updated, results };
}

// ---- Sameday tracking ----
async function trackSameday(token: string, baseUrl: string) {
  // Get orders with Sameday AWBs (sd_awb or eb_awb) not in final state
  const { data: sdOrders } = await supabase
    .from("orders")
    .select("id, sd_awb, eb_awb, status")
    .not("status", "in", '("livrat","retur","anulat")')
    .or("sd_awb.neq.,eb_awb.neq.");

  if (!sdOrders?.length) return { checked: 0, updated: 0, results: [] };

  // Filter to only those that actually have an AWB
  const orders = sdOrders.filter((o) => o.sd_awb || o.eb_awb);
  if (!orders.length) return { checked: 0, updated: 0, results: [] };

  let updated = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Array<Record<string, any>> = [];

  for (const order of orders) {
    const awb = order.sd_awb || order.eb_awb;
    if (!awb) continue;

    try {
      const res = await fetch(`${baseUrl}/api/client/awb/${awb}/status`, {
        headers: { "X-Auth-Token": token },
      });

      if (!res.ok) {
        const body = await res.text();
        results.push({ id: order.id, awb, error: `HTTP ${res.status}`, body });
        continue;
      }

      const data = await res.json();

      // Sameday returns: { expeditionSummary, expeditionStatus, expeditionHistory, parcelsStatus }
      const expStatus = data?.expeditionStatus;
      const summary = data?.expeditionSummary;
      if (!expStatus) {
        results.push({ id: order.id, awb, error: "no_expeditionStatus", raw: data });
        continue;
      }

      const statusId = expStatus.statusId;
      const statusLabel = expStatus.status || "";

      // Map Sameday status to our internal status
      let newStatus: string | null = null;

      // 1. Check summary.delivered flag
      if (summary?.delivered === true) {
        newStatus = "livrat";
      }
      // 2. Check statusId
      else if (typeof statusId === "number" && SD_STATUS_ID_MAP[statusId]) {
        newStatus = SD_STATUS_ID_MAP[statusId];
      }
      // 3. Fallback: check status text keywords
      else {
        const label = statusLabel.toLowerCase();
        for (const [keyword, status] of Object.entries(SD_TEXT_MAP)) {
          if (label.includes(keyword)) {
            newStatus = status;
            break;
          }
        }
      }

      const isEasybox = !!order.eb_awb && awb === order.eb_awb;
      const statusField = isEasybox ? "eb_status" : "sd_status";

      const updateData: Record<string, string> = {
        awb_status: statusLabel,
        [statusField]: statusLabel,
      };

      if (newStatus && newStatus !== order.status) {
        updateData.status = newStatus;
        await supabase.from("orders").update(updateData).eq("id", order.id);
        updated++;
      } else {
        await supabase.from("orders").update(updateData).eq("id", order.id);
      }

      results.push({ id: order.id, awb, sd_status: statusLabel, statusId, delivered: summary?.delivered, new_status: newStatus });
    } catch (e) {
      results.push({ id: order.id, awb, error: String(e) });
    }
  }

  return { checked: orders.length, updated, results };
}

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "olivox2026!";

function checkAdminAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === ADMIN_USER && pass === ADMIN_PASS;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const isSecretValid = secret === (process.env.CRON_SECRET || "cron2024");
  const isAdminValid = checkAdminAuth(req);
  if (!isSecretValid && !isAdminValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fanResult = { checked: 0, updated: 0, results: [] as unknown[] };
  const sdResult = { checked: 0, updated: 0, results: [] as unknown[] };

  // FanCourier tracking
  const fc = await getFanCourierSettings();
  if (fc?.username && fc?.password && fc?.client_id) {
    const token = await getFanToken(fc);
    if (token) {
      const r = await trackFanCourier(token, fc.client_id);
      fanResult.checked = r.checked;
      fanResult.updated = r.updated;
      fanResult.results = r.results;
    }
  }

  // Sameday tracking
  const sd = await getSamedaySettings();
  if (sd?.username && sd?.password) {
    const baseUrl = sd.test_mode === "true" ? "https://sameday-api.demo.zitec.com" : "https://api.sameday.ro";
    const token = await getSamedayToken(sd);
    if (token) {
      const r = await trackSameday(token, baseUrl);
      sdResult.checked = r.checked;
      sdResult.updated = r.updated;
      sdResult.results = r.results;
    }
  }

  return NextResponse.json({
    ok: true,
    fancourier: fanResult,
    sameday: sdResult,
  });
}
