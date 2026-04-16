"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getConsent, trackPageView } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function injectInline(id: string, code: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.text = code;
  document.head.appendChild(s);
}

function loadGA() {
  if (!GA_ID) return;
  injectScript("ga4-lib", `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  injectInline(
    "ga4-init",
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`
  );
}

function loadMeta() {
  if (!META_PIXEL_ID) return;
  injectInline(
    "meta-pixel-init",
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');`
  );
}

export default function AnalyticsLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>("");
  const loadedRef = useRef<{ ga: boolean; meta: boolean }>({ ga: false, meta: false });

  // Load scripts when consent is granted (initial + on change).
  useEffect(() => {
    const apply = () => {
      const c = getConsent();
      if (c?.analytics && !loadedRef.current.ga) {
        loadGA();
        loadedRef.current.ga = true;
      }
      if (c?.marketing && !loadedRef.current.meta) {
        loadMeta();
        loadedRef.current.meta = true;
      }
    };
    apply();
    const handler = () => apply();
    window.addEventListener("olivox:consent-change", handler);
    return () => window.removeEventListener("olivox:consent-change", handler);
  }, []);

  // Track pageviews on every route change (respects consent via trackEvent).
  useEffect(() => {
    const path = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
