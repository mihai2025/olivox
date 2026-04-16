"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "olivox_announcement_dismissed_v1";

export default function AnnouncementBar() {
  const [message, setMessage] = useState<string>(
    "Livrare 3-5 zile lucratoare in Romania — comanda rapid prin formular."
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {}
    setVisible(true);

    // Try to read a dynamic message from settings via /api/config (if exposed),
    // fallback stays in place otherwise.
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.announcement === "string" && data.announcement.trim()) {
          setMessage(data.announcement);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="announcement-bar" role="status" aria-live="polite">
      <div className="announcement-bar__inner">
        <span className="announcement-bar__dot" aria-hidden="true">•</span>
        <span className="announcement-bar__text">{message}</span>
        <button
          type="button"
          className="announcement-bar__close"
          onClick={dismiss}
          aria-label="Inchide anuntul"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
