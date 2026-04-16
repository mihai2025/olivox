import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Livrare si retur — 3-5 zile lucratoare | Olivox",
  description:
    "Livrare in 3-5 zile lucratoare prin curier in toata Romania. Drept de retur 14 zile conform OUG 34/2014. Informatii complete despre transport si returnare.",
  alternates: { canonical: "https://olivox.ro/livrare-si-retur" },
  openGraph: {
    title: "Livrare si retur — 3-5 zile lucratoare",
    description: "Livrare rapida prin curier. Retur in 14 zile conform OUG 34/2014.",
    url: "https://olivox.ro/livrare-si-retur",
    type: "website",
  },
};

export default function LivrareReturPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <article className="static-page">
        <header className="static-page__hero">
          <div className="eyebrow">Logistica</div>
          <h1>Livrare si retur</h1>
          <p className="lead">
            Livram in toata Romania in 3-5 zile lucratoare. Ai drept de retragere de 14 zile calendaristice,
            conform OUG 34/2014.
          </p>
        </header>

        <section>
          <h2>Livrare</h2>
          <ul className="bullets">
            <li><strong>Termen:</strong> 3-5 zile lucratoare de la confirmarea telefonica a comenzii.</li>
            <li><strong>Acoperire:</strong> toata Romania, prin curier (FanCourier sau Sameday).</li>
            <li><strong>Cost:</strong> afisat la finalul formularului, in functie de localitate si greutate.</li>
            <li><strong>Plata:</strong> ramburs (cash sau card la curier).</li>
            <li><strong>Tracking:</strong> primesti codul AWB pe email sau SMS cand coletul pleaca.</li>
          </ul>
        </section>

        <section>
          <h2>Confirmare comanda</h2>
          <p>
            Dupa plasarea comenzii prin formular, un operator te va contacta telefonic in cateva ore lucratoare
            pentru confirmare. Acolo verificam adresa, produsele si eventuale intrebari.
          </p>
        </section>

        <section>
          <h2>Retur — 14 zile</h2>
          <p>
            Conform <strong>OUG 34/2014</strong> privind drepturile consumatorilor in cadrul contractelor
            incheiate cu profesionistii, ai dreptul sa te retragi din contract fara motivare, in termen de 14
            zile calendaristice de la primirea coletului.
          </p>
          <h3>Cum procedezi</h3>
          <ol className="bullets">
            <li>Scrie-ne la <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a> cu numarul comenzii si produsele returnate.</li>
            <li>Ambaleaza produsele in starea originala, sigilate, nedesfacute, impreuna cu factura.</li>
            <li>Trimite coletul prin curier la adresa pe care ti-o comunicam. Costul returului este suportat de client, conform legii.</li>
            <li>Dupa primirea si verificarea coletului, iti returnam contravaloarea produselor in maxim 14 zile, folosind aceeasi metoda de plata.</li>
          </ol>
          <h3>Exceptii de la dreptul de retur</h3>
          <p>
            Conform OUG 34/2014, articolul 16, nu pot fi returnate: produsele sigilate care, odata desfacute, nu
            pot fi returnate din motive de protectie a sanatatii sau de igiena (de exemplu suplimentele al caror
            sigiliu a fost rupt), produsele personalizate sau cele cu durata scurta de valabilitate care au
            depasit termenul.
          </p>
        </section>

        <section>
          <h2>Produs deteriorat la primire</h2>
          <p>
            Daca la primire observi ca ambalajul exterior este deteriorat, refuza coletul sau accepta-l cu
            mentiuni scrise pe AWB. Trimite-ne imediat o fotografie la <a href="mailto:comenzi@olivox.ro">comenzi@olivox.ro</a>{" "}
            si organizam inlocuirea gratuita.
          </p>
        </section>

        <section>
          <h2>Contact pentru logistica</h2>
          <p>
            Pentru orice intrebare legata de livrare sau retur, contacteaza-ne prin <a href="/contact">pagina de contact</a> sau
            la email. Raspundem in maxim 24 de ore lucratoare.
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}
