import { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Termeni si Conditii | olivox.ro",
  description: "Termeni si conditii de utilizare a site-ului olivox.ro. Informatii despre comenzi, livrare, returnare si garantie.",
  robots: { index: true, follow: true },
};

export default function TermeniPage() {
  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header__logo"><a href="/" style={{ textDecoration: "none", color: "inherit" }}>oli<span>vox</span>.ro</a></div>
      </header>
      <div className="legal-page">
        <h1>Termeni si Conditii</h1>
        <p><strong>Ultima actualizare:</strong> 31 martie 2026</p>

        <h2>1. Informatii generale</h2>
        <p>Site-ul olivox.ro este operat de <strong>HUSE PRINTATE SRL</strong>, CIF 46001845, cu sediul in Sat Văcărești, Str. Principală nr. 104, Teleorman, România.</p>
        <p>Prin accesarea si utilizarea acestui site, acceptati in totalitate prezentii termeni si conditii.</p>

        <h2>2. Produse si servicii</h2>
        <p>Comercializam produse alimentare premium — ulei de masline extravirgin si suplimente naturale. Pretul afisat pe site include TVA.</p>

        <h2>3. Procesul de comanda</h2>
        <p>Pentru a plasa o comanda, clientul trebuie sa:</p>
        <ul>
          <li>Selecteze produsul dorit</li>
          <li>Completeze datele de livrare (nume, adresa, telefon)</li>
          <li>Confirme comanda prin apasarea butonului &quot;Comanda acum&quot;</li>
        </ul>
        <p>Dupa plasarea comenzii, clientul va primi o confirmare pe email (daca a furnizat adresa de email).</p>

        <h2>4. Preturi si plata</h2>
        <p>Pretul produselor este cel afisat pe site la momentul plasarii comenzii. Plata se efectueaza ramburs, la livrare (cash sau card la curier).</p>

        <h2>5. Livrare</h2>
        <p>Comenzile sunt procesate in 1-2 zile lucratoare de la plasare. Livrarea se face prin curier, in 1-2 zile lucratoare suplimentare. Livrarea este gratuita pe teritoriul Romaniei.</p>

        <h2>6. Dreptul de retragere</h2>
        <p>Conform OUG 34/2014, consumatorul beneficiaza de dreptul de retragere in termen de 14 zile de la primirea produsului, cu exceptia situatiilor prevazute la art. 16 (de ex. produse cu termen scurt de expirare desigilate).</p>
        <p>In cazul in care produsul prezinta defecte, ne obligam sa il inlocuim sau sa rambursam contravaloarea.</p>

        <h2>7. Garantie</h2>
        <p>Garantam calitatea produselor comercializate. In cazul unor defecte constatate la primire, produsul va fi inlocuit sau rambursat.</p>

        <h2>9. Protectia datelor</h2>
        <p>Datele personale sunt prelucrate conform <a href="/politica-confidentialitate">Politicii de confidentialitate</a> si legislatiei GDPR.</p>

        <h2>10. Litigii</h2>
        <p>Eventualele litigii se vor solutiona pe cale amiabila. In caz contrar, competenta revine instantelor judecatoresti romane.</p>
        <p>Consumatorii pot depune reclamatii pe platforma europeana SOL: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a></p>
        <p>ANPC: <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer">anpc.ro</a></p>

        <h2>11. Contact</h2>
        <p>Pentru orice intrebari: <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a> | Tel: <a href="tel:0737965125">0737 965 125</a></p>
      </div>
      <Footer />
    </div>
  );
}
