"use client";

import { useConfig } from "@/lib/use-config";

export default function Footer() {
  const c = useConfig();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <div className="footer-logo" dangerouslySetInnerHTML={{ __html: c.logoHtml }} />
          <p className="footer-company">{c.companyName}</p>
          <p className="footer-detail">CIF: {c.companyCIF}</p>
          <p className="footer-detail">{c.companyAddress}</p>
          <p className="footer-detail">{c.companyLocality}, {c.companyCounty}, Romania</p>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <p className="footer-detail"><a href={`tel:${c.phone}`}>{c.phone}</a></p>
          <p className="footer-detail"><a href={`mailto:${c.emailOrders}`}>{c.emailOrders}</a></p>
        </div>

        <div className="footer-col">
          <h4>Produse Olivox</h4>
          <div className="footer-links">
            <a href="/categorii">Toate categoriile</a>
            <a href="/articole">Articole</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Informatii</h4>
          <div className="footer-links">
            <a href="/termeni-si-conditii">Termeni si conditii</a>
            <a href="/politica-confidentialitate">Politica de confidentialitate</a>
            <a href="/politica-cookies">Politica cookies</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {c.siteName} — Toate drepturile rezervate</p>
        <div className="footer-legal-links">
          <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer">ANPC</a>
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">SOL</a>
          <a href="/admin" title="Admin" style={{ opacity: 0.3 }}>⚙</a>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: c.companyName,
        alternateName: c.siteName,
        url: c.domain,
        telephone: `+4${c.phone.replace(/^0/, "")}`,
        email: c.emailOrders,
        address: { "@type": "PostalAddress", streetAddress: c.companyAddress, addressLocality: c.companyLocality, addressRegion: c.companyCounty, addressCountry: "RO" },
        taxID: c.companyCIF,
      })}} />
    </footer>
  );
}
