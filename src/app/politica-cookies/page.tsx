import { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Politica Cookies | olivox.ro",
  description: "Informatii despre cookie-urile utilizate pe site-ul olivox.ro si modul in care le puteti gestiona.",
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header__logo"><a href="/" style={{ textDecoration: "none", color: "inherit" }}>oli<span>vox</span>.ro</a></div>
      </header>
      <div className="legal-page">
        <h1>Politica Cookies</h1>
        <p><strong>Ultima actualizare:</strong> 31 martie 2026</p>

        <h2>1. Ce sunt cookie-urile?</h2>
        <p>Cookie-urile sunt fisiere text de mici dimensiuni stocate pe dispozitivul dumneavoastra de catre browser-ul web. Acestea sunt utilizate pe scara larga pentru a face site-urile web sa functioneze mai eficient.</p>

        <h2>2. Cookie-uri utilizate</h2>

        <h2>2.1 Cookie-uri strict necesare</h2>
        <p>Acestea sunt esentiale pentru functionarea site-ului si nu pot fi dezactivate. Includ cookie-uri de sesiune pentru autentificarea in zona de administrare.</p>

        <h2>2.2 Cookie-uri de performanta</h2>
        <p>Utilizam Vercel Analytics pentru a intelege cum este utilizat site-ul. Aceste cookie-uri colecteaza informatii anonime despre paginile vizitate.</p>

        <h2>3. Gestionarea cookie-urilor</h2>
        <p>Puteti controla si sterge cookie-urile prin setarile browser-ului. Dezactivarea cookie-urilor poate afecta functionarea site-ului.</p>
        <ul>
          <li><strong>Chrome:</strong> Setari → Confidentialitate si securitate → Cookie-uri</li>
          <li><strong>Firefox:</strong> Optiuni → Viata privata si securitate</li>
          <li><strong>Safari:</strong> Preferinte → Confidentialitate</li>
          <li><strong>Edge:</strong> Setari → Cookie-uri si permisiuni site</li>
        </ul>

        <h2>4. Contact</h2>
        <p>Pentru intrebari: <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a></p>
      </div>
      <Footer />
    </div>
  );
}
