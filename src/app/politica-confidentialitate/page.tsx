import { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Politica de Confidentialitate | olivox.ro",
  description: "Politica de confidentialitate GDPR a site-ului olivox.ro. Cum colectam, utilizam si protejam datele dumneavoastra personale.",
  robots: { index: true, follow: true },
};

export default function PoliticaPage() {
  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header__logo"><a href="/" style={{ textDecoration: "none", color: "inherit" }}>oli<span>vox</span>.ro</a></div>
      </header>
      <div className="legal-page">
        <h1>Politica de Confidentialitate</h1>
        <p><strong>Ultima actualizare:</strong> 31 martie 2026</p>

        <h2>1. Operator de date</h2>
        <p><strong>HUSE PRINTATE SRL</strong>, CIF 46001845, Sat Văcărești, Str. Principală nr. 104, Teleorman, România.</p>
        <p>Email: <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a></p>

        <h2>2. Ce date colectam</h2>
        <p>Colectam urmatoarele date personale necesare procesarii comenzilor:</p>
        <ul>
          <li>Nume si prenume</li>
          <li>Adresa de livrare (judet, localitate, strada)</li>
          <li>Numar de telefon</li>
          <li>Adresa de email (optional)</li>
        </ul>

        <h2>3. Scopul prelucrarii</h2>
        <ul>
          <li>Procesarea si livrarea comenzilor</li>
          <li>Comunicarea cu clientul privind statusul comenzii</li>
          <li>Trimiterea confirmarii de comanda pe email</li>
          <li>Indeplinirea obligatiilor legale (facturare, contabilitate)</li>
        </ul>

        <h2>4. Temeiul legal</h2>
        <p>Prelucrarea se bazeaza pe executarea contractului (plasarea comenzii) conform Art. 6(1)(b) GDPR si pe obligatiile legale conform Art. 6(1)(c) GDPR.</p>

        <h2>5. Durata stocarii</h2>
        <p>Datele personale sunt stocate pe durata necesara indeplinirii scopurilor mentionate, dar nu mai mult de 3 ani de la ultima comanda, cu exceptia datelor necesare conform obligatiilor legale (facturi — 10 ani).</p>

        <h2>6. Destinatari</h2>
        <p>Datele pot fi transmise catre:</p>
        <ul>
          <li>Servicii de curierat — pentru livrarea comenzilor</li>
          <li>Servicii de hosting si stocare (Vercel, Supabase, Cloudflare) — pentru functionarea site-ului</li>
          <li>Servicii de email (Resend) — pentru notificari</li>
        </ul>

        <h2>7. Drepturile dumneavoastra</h2>
        <p>Conform GDPR, aveti dreptul la:</p>
        <ul>
          <li>Acces la datele personale</li>
          <li>Rectificarea datelor inexacte</li>
          <li>Stergerea datelor (&quot;dreptul de a fi uitat&quot;)</li>
          <li>Restrictionarea prelucrarii</li>
          <li>Portabilitatea datelor</li>
          <li>Opozitia la prelucrare</li>
        </ul>
        <p>Pentru exercitarea acestor drepturi, contactati-ne la <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a>.</p>

        <h2>8. Plangeri</h2>
        <p>Aveti dreptul de a depune o plangere la Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal (ANSPDCP) — <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>.</p>

        <h2>9. Securitate</h2>
        <p>Implementam masuri tehnice si organizatorice adecvate pentru protectia datelor personale, inclusiv criptare SSL/TLS, acces restrictionat si stocare securizata.</p>
      </div>
      <Footer />
    </div>
  );
}
