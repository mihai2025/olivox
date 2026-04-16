"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/analytics";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) setVisible(true);
  }, []);

  const acceptAll = () => {
    setConsent({ analytics: true, marketing: true });
    setVisible(false);
  };
  const essentialOnly = () => {
    setConsent({ analytics: false, marketing: false });
    setVisible(false);
  };
  const saveSettings = () => {
    setConsent({ analytics, marketing });
    setShowSettings(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="consent-banner" role="dialog" aria-live="polite" aria-label="Setari cookies">
        <div className="consent-banner__inner">
          <div className="consent-banner__text">
            <strong>Cookie-uri si confidentialitate.</strong> Folosim cookie-uri esentiale pentru functionarea site-ului
            si, cu acordul tau, cookie-uri de analiza si marketing pentru a imbunatati experienta.{" "}
            <a href="/politica-cookies" className="consent-banner__link">
              Afla mai multe
            </a>
            .
          </div>
          <div className="consent-banner__actions">
            <button type="button" className="consent-banner__btn consent-banner__btn--ghost" onClick={() => setShowSettings(true)}>
              Setari
            </button>
            <button type="button" className="consent-banner__btn consent-banner__btn--ghost" onClick={essentialOnly}>
              Doar esentiale
            </button>
            <button type="button" className="consent-banner__btn consent-banner__btn--primary" onClick={acceptAll}>
              Accept tot
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="consent-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="consent-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Preferinte cookies">
            <div className="consent-modal__header">
              <h3>Preferinte cookies</h3>
              <button className="consent-modal__close" onClick={() => setShowSettings(false)} aria-label="Inchide">
                ✕
              </button>
            </div>
            <div className="consent-modal__body">
              <div className="consent-category">
                <div className="consent-category__head">
                  <strong>Esentiale</strong>
                  <span className="consent-category__badge">Intotdeauna active</span>
                </div>
                <p>Necesare pentru autentificare, cos, securitate. Nu pot fi dezactivate.</p>
              </div>

              <label className="consent-category">
                <div className="consent-category__head">
                  <strong>Analiza</strong>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    aria-label="Accept cookies de analiza"
                  />
                </div>
                <p>Ne ajuta sa intelegem cum este folosit site-ul (Google Analytics 4). Datele sunt agregate.</p>
              </label>

              <label className="consent-category">
                <div className="consent-category__head">
                  <strong>Marketing</strong>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    aria-label="Accept cookies de marketing"
                  />
                </div>
                <p>Personalizarea reclamelor si masurarea campaniilor (Meta Pixel).</p>
              </label>
            </div>
            <div className="consent-modal__footer">
              <button type="button" className="consent-banner__btn consent-banner__btn--ghost" onClick={essentialOnly}>
                Doar esentiale
              </button>
              <button type="button" className="consent-banner__btn consent-banner__btn--primary" onClick={saveSettings}>
                Salveaza preferintele
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
