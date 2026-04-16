// Centralized analytics dispatcher (GDPR-aware).
// Consent is read from localStorage key "olivox_consent".

export type ConsentCategory = "essential" | "analytics" | "marketing";

export interface ConsentState {
  essential: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export const CONSENT_KEY = "olivox_consent";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed?.analytics !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConsent(state: Omit<ConsentState, "essential" | "timestamp">) {
  if (typeof window === "undefined") return;
  const payload: ConsentState = {
    essential: true,
    analytics: !!state.analytics,
    marketing: !!state.marketing,
    timestamp: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  } catch {}
  try {
    document.cookie = `${CONSENT_KEY}=${encodeURIComponent(
      JSON.stringify({ a: payload.analytics, m: payload.marketing })
    )}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {}
  // Notify listeners so pixel loaders can react.
  try {
    window.dispatchEvent(new CustomEvent("olivox:consent-change", { detail: payload }));
  } catch {}
}

type GtagFn = (...args: unknown[]) => void;
type FbqFn = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void };

interface AnalyticsWindow {
  gtag?: GtagFn;
  dataLayer?: unknown[];
  fbq?: FbqFn;
}

function w(): AnalyticsWindow & Window {
  return window as unknown as AnalyticsWindow & Window;
}

export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const consent = getConsent();
  const analyticsOk = !!consent?.analytics;
  const marketingOk = !!consent?.marketing;

  // Always leave a breadcrumb on window for debugging.
  try {
    const win = w() as unknown as { __olivoxEvents?: unknown[] };
    win.__olivoxEvents = win.__olivoxEvents || [];
    win.__olivoxEvents.push({ name, payload, ts: Date.now() });
  } catch {}

  if (analyticsOk && typeof w().gtag === "function") {
    try {
      w().gtag!("event", name, payload);
    } catch {}
  }

  if (marketingOk && typeof w().fbq === "function") {
    try {
      // Map common ecommerce events to Meta's standard event names.
      const metaName =
        name === "purchase"
          ? "Purchase"
          : name === "add_to_cart"
          ? "AddToCart"
          : name === "view_item"
          ? "ViewContent"
          : name === "begin_checkout"
          ? "InitiateCheckout"
          : name === "page_view"
          ? "PageView"
          : name;
      const known = new Set([
        "Purchase",
        "AddToCart",
        "ViewContent",
        "InitiateCheckout",
        "PageView",
        "Lead",
        "CompleteRegistration",
        "Contact",
        "Subscribe",
      ]);
      if (known.has(metaName)) {
        w().fbq!("track", metaName, payload);
      } else {
        w().fbq!("trackCustom", metaName, payload);
      }
    } catch {}
  }
}

export function trackPageView(url?: string) {
  if (typeof window === "undefined") return;
  const location = url || window.location.pathname + window.location.search;
  trackEvent("page_view", { page_path: location, page_location: window.location.href });
}
