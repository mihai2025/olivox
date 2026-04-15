const STORAGE_KEY = "order_source";

interface OrderSource {
  source: string;
  medium: string;
  campaign: string;
  label: string;
}

const REFERRER_MAP: Record<string, { source: string; medium: string }> = {
  "google.": { source: "google", medium: "organic" },
  "bing.": { source: "bing", medium: "organic" },
  "yahoo.": { source: "yahoo", medium: "organic" },
  "duckduckgo.": { source: "duckduckgo", medium: "organic" },
  "facebook.com": { source: "facebook", medium: "social" },
  "fb.com": { source: "facebook", medium: "social" },
  "instagram.com": { source: "instagram", medium: "social" },
  "tiktok.com": { source: "tiktok", medium: "social" },
  "twitter.com": { source: "twitter", medium: "social" },
  "x.com": { source: "twitter", medium: "social" },
  "pinterest.com": { source: "pinterest", medium: "social" },
  "youtube.com": { source: "youtube", medium: "social" },
};

function detectLabel(source: string, medium: string): string {
  if (medium === "cpc" || medium === "paid" || medium === "ads") return `${source} ads`;
  if (medium === "organic") return `${source} organic`;
  if (medium === "social") return `${source}`;
  if (medium === "email") return "email";
  if (source === "direct") return "direct";
  if (source) return source;
  return "direct";
}

export function captureSource(): void {
  if (typeof window === "undefined") return;

  // Don't overwrite if already captured this session (first touch wins)
  if (sessionStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  let source = "";
  let medium = "";
  let campaign = utmCampaign || "";

  if (utmSource) {
    // UTM params present
    source = utmSource.toLowerCase();
    medium = (utmMedium || "").toLowerCase();
  } else {
    // Detect from referrer
    const ref = document.referrer.toLowerCase();
    if (!ref) {
      source = "direct";
      medium = "";
    } else {
      let matched = false;
      for (const [domain, info] of Object.entries(REFERRER_MAP)) {
        if (ref.includes(domain)) {
          source = info.source;
          medium = info.medium;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Unknown referrer
        try {
          source = new URL(ref).hostname.replace("www.", "");
        } catch {
          source = "referral";
        }
        medium = "referral";
      }
    }
  }

  const data: OrderSource = {
    source,
    medium,
    campaign,
    label: detectLabel(source, medium),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSource(): OrderSource {
  if (typeof window === "undefined") return { source: "", medium: "", campaign: "", label: "direct" };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { source: "direct", medium: "", campaign: "", label: "direct" };
}
