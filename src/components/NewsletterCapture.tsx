"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function NewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("err");
      setMsg("Introdu o adresa de email valida.");
      return;
    }
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Eroare la abonare.");
      setStatus("ok");
      setMsg("Multumim! Iti vom scrie in curand.");
      setEmail("");
      trackEvent("newsletter_subscribe", { source: "footer" });
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Eroare la abonare.");
    }
  };

  return (
    <form className="newsletter" onSubmit={submit} aria-label="Abonare newsletter">
      <label htmlFor="newsletter-email" className="newsletter__label">
        Newsletter — sfaturi naturiste, o data pe luna
      </label>
      <div className="newsletter__row">
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="nume@exemplu.ro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="newsletter__input"
          autoComplete="email"
        />
        <button type="submit" className="newsletter__btn" disabled={status === "loading"}>
          {status === "loading" ? "Se trimite..." : "Abonare"}
        </button>
      </div>
      {msg && (
        <p className={`newsletter__msg newsletter__msg--${status}`} role="status">
          {msg}
        </p>
      )}
      <p className="newsletter__note">Prin abonare esti de acord cu <a href="/politica-confidentialitate">politica de confidentialitate</a>. Te poti dezabona oricand.</p>
    </form>
  );
}
