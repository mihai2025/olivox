import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact | olivox.ro",
  description: "Contacteaza echipa Olivox pentru intrebari despre produse sau comenzi. Telefon, email, livrare in 3-5 zile lucratoare.",
  robots: { index: true, follow: true },
};

export default async function ContactPage() {
  const config = await getSiteConfig();

  const emailHref = config.emailOrders ? `mailto:${config.emailOrders}` : "";
  const phoneHref = config.phone ? `tel:${config.phone.replace(/\s+/g, "")}` : "";
  const addressParts = [config.companyAddress, config.companyLocality, config.companyCounty].filter(Boolean);

  return (
    <>
      <Header />
      <main className="contact-page">
        <section className="contact-hero">
          <div className="eyebrow">Suntem aici pentru tine</div>
          <h1 className="contact-hero__title">Contact</h1>
          <p className="contact-hero__lede">
            Ai intrebari despre un produs, o comanda sau livrare? Scrie-ne sau suna-ne —
            raspundem rapid si cu grija.
          </p>
        </section>

        <section className="contact-grid">
          {config.emailOrders && (
            <article className="contact-card">
              <div className="eyebrow">Scrie-ne</div>
              <h3>Email</h3>
              <a className="contact-card__main" href={emailHref}>{config.emailOrders}</a>
              <p className="contact-card__sub">Raspundem in maxim 24 ore lucratoare.</p>
            </article>
          )}

          {config.phone && (
            <article className="contact-card">
              <div className="eyebrow">Suna-ne</div>
              <h3>Telefon</h3>
              <a className="contact-card__main" href={phoneHref}>{config.phone}</a>
              <p className="contact-card__sub">Luni–Vineri, 09:00–18:00</p>
            </article>
          )}

          {addressParts.length > 0 && (
            <article className="contact-card">
              <div className="eyebrow">Adresa</div>
              <h3>Sediu</h3>
              <p className="contact-card__main contact-card__main--sm">
                {addressParts.join(", ")}
              </p>
            </article>
          )}
        </section>

        <section className="contact-info">
          <div className="contact-info__col">
            <div className="eyebrow">Livrare</div>
            <h2>Cum ajung produsele la tine</h2>
            <ul className="contact-info__list">
              <li><strong>3–5 zile lucratoare</strong> livrare in toata Romania</li>
              <li>Expediem prin curier rapid (Sameday) sau easybox</li>
              <li>Confirmam telefonic fiecare comanda inainte de expediere</li>
              <li>Plata: ramburs la livrare sau transfer bancar</li>
            </ul>
          </div>

          <div className="contact-info__col">
            <div className="eyebrow">Firma</div>
            <h2>Date de identificare</h2>
            <dl className="contact-info__dl">
              {config.companyName && (<><dt>Nume</dt><dd>{config.companyName}</dd></>)}
              {config.companyCIF && (<><dt>CUI</dt><dd>{config.companyCIF}</dd></>)}
              {addressParts.length > 0 && (<><dt>Sediu</dt><dd>{addressParts.join(", ")}</dd></>)}
              {config.iban && (<><dt>IBAN</dt><dd>{config.iban}</dd></>)}
            </dl>
          </div>
        </section>

        <section className="contact-legal">
          <p>
            Pentru reclamatii privind produsele sau comenzile poti contacta ANPC la{" "}
            <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer">anpc.ro</a>{" "}
            sau platforma europeana SOL la{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
          </p>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            mainEntity: {
              "@type": "LocalBusiness",
              name: config.companyName || "OLIVOX",
              telephone: config.phone ? `+40${config.phone.replace(/^0/, "").replace(/\s+/g, "")}` : undefined,
              email: config.emailOrders || undefined,
              address: addressParts.length ? {
                "@type": "PostalAddress",
                streetAddress: config.companyAddress || undefined,
                addressLocality: config.companyLocality || undefined,
                addressRegion: config.companyCounty || undefined,
                addressCountry: "RO",
              } : undefined,
              openingHours: "Mo-Fr 09:00-18:00",
            },
          }),
        }}
      />

      <Footer />
    </>
  );
}
