import { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact | olivox.ro",
  description: "Contacteaza-ne pentru intrebari despre produsele noastre. Telefon, email, adresa. Raspundem in maxim 24 ore.",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header__logo"><a href="/" style={{ textDecoration: "none", color: "inherit" }}>oli<span>vox</span>.ro</a></div>
      </header>
      <div className="legal-page">
        <h1>Contact</h1>

        <h2>Date firma</h2>
        <p><strong>HUSE PRINTATE SRL</strong></p>
        <p>CIF: 46001845</p>
        <p>Sat Văcărești, Str. Principală nr. 104, Teleorman, România</p>

        <h2>Contacteaza-ne</h2>
        <p>Telefon: <a href="tel:0737965125"><strong>0737 965 125</strong></a> (Luni-Vineri, 9:00-18:00)</p>
        <p>Email: <a href="mailto:comenzi@olivox.ro"><strong>comenzi@olivox.ro</strong></a></p>
        <p>Raspundem la email in maxim 24 ore lucratoare.</p>

        <h2>Informatii comenzi</h2>
        <ul>
          <li>Comenzile se proceseaza in 1-2 zile lucratoare</li>
          <li>Livrarea se face prin curier in 1-2 zile suplimentare</li>
          <li>Livrarea este gratuita in toata Romania</li>
          <li>Plata se face ramburs la livrare</li>
        </ul>

        <h2>Reclamatii</h2>
        <p>ANPC: <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer">anpc.ro</a></p>
        <p>Platforma SOL: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
      </div>

      {/* ContactPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            mainEntity: {
              "@type": "LocalBusiness",
              name: "HUSE PRINTATE SRL",
              telephone: "+40737965125",
              email: "comenzi@olivox.ro",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Str. Principală nr. 104, Sat Văcărești",
                addressLocality: "Văcărești",
                addressRegion: "Teleorman",
                addressCountry: "RO",
              },
              openingHours: "Mo-Fr 09:00-18:00",
            },
          }),
        }}
      />

      <Footer />
    </div>
  );
}
