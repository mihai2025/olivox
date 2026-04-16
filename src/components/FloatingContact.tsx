"use client";

import { useEffect, useState } from "react";
import { useConfig } from "@/lib/use-config";
import { trackEvent } from "@/lib/analytics";

export default function FloatingContact() {
  const config = useConfig();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const phoneRaw = (config.phone || "").replace(/\D/g, "");
  if (!phoneRaw) return null;

  const waNumber = phoneRaw.startsWith("40")
    ? phoneRaw
    : phoneRaw.startsWith("0")
    ? "40" + phoneRaw.slice(1)
    : "40" + phoneRaw;

  const href = isMobile ? `tel:${config.phone}` : `https://wa.me/${waNumber}`;
  const label = isMobile ? `Suna la ${config.phone}` : "Scrie-ne pe WhatsApp";

  const onClick = () => {
    trackEvent(isMobile ? "click_phone" : "click_whatsapp", { channel: isMobile ? "tel" : "whatsapp" });
  };

  return (
    <a
      href={href}
      target={isMobile ? undefined : "_blank"}
      rel={isMobile ? undefined : "noopener noreferrer"}
      className="floating-contact"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {isMobile ? (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.7.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4.9c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.7.1.3 0 .7-.2 1l-2.3 2.2z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.09.55 4.12 1.6 5.92L2 22l4.33-1.14a9.9 9.9 0 0 0 5.71 1.82h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02A9.86 9.86 0 0 0 12.04 2zm0 18.13h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-2.57.67.69-2.5-.2-.32a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.17.25-.64.8-.79.96-.14.17-.29.19-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.77-1.84-.2-.48-.4-.41-.56-.42l-.47-.01c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.12.17 1.76 2.69 4.26 3.77.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.29z" />
        </svg>
      )}
      <span className="floating-contact__label">{isMobile ? "Suna" : "WhatsApp"}</span>
    </a>
  );
}
