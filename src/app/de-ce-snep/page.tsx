import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "De ce Snep — Istorie, cercetare, certificari | Olivox",
  description:
    "Snep: producator italian cu peste 40 de ani de experienta in suplimente naturiste. Cercetare R&D, materii prime controlate, certificari ISO si trasabilitate.",
  alternates: { canonical: "https://olivox.ro/de-ce-snep" },
  openGraph: {
    title: "De ce Snep — Istorie, cercetare si certificari",
    description:
      "Snep: peste 40 de ani de experienta in suplimente naturiste, cercetare proprie, materii prime controlate.",
    url: "https://olivox.ro/de-ce-snep",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: "https://olivox.ro/de-ce-snep",
  name: "De ce Snep",
  about: {
    "@type": "Brand",
    name: "Snep",
    description:
      "Producator italian de suplimente alimentare, alimente functionale si cosmetice naturale, fondat in 1979.",
  },
};

export default function DeCeSnepPage() {
  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="static-page">
        <header className="static-page__hero">
          <div className="eyebrow">De ce Snep</div>
          <h1>Un catalog naturist construit in peste 40 de ani</h1>
          <p className="lead">
            Snep SpA este un producator italian specializat in suplimente alimentare, alimente functionale si
            cosmetice naturale. Am ales sa distribuim acest catalog in Romania pentru ca imbina cercetarea
            farmaceutica cu traditia fitoterapeutica mediteraneana.
          </p>
        </header>

        <section>
          <h2>O istorie de peste patru decenii</h2>
          <p>
            Fondata la sfarsitul anilor &apos;70, Snep a crescut pornind de la formule bazate pe oleuropeina,
            ganoderma si extracte de plante standardizate. Astazi catalogul cuprinde cateva sute de produse, de la
            suplimente clasice la linii dedicate — nutritie sportiva, cosmetica naturala, programe de control al
            greutatii, sanatate articulara si digestiva.
          </p>
        </section>

        <section>
          <h2>Cercetare &amp; dezvoltare</h2>
          <p>
            Fiecare produs Snep porneste de la un proces R&amp;D intern: selectia ingredientelor active,
            standardizarea extractelor (ex. oleuropeina minim 18% in linia Olivol) si testarea stabilitatii.
            Publicam fisele tehnice direct pe paginile de produs — poti vedea exact ce contine fiecare formula.
          </p>
        </section>

        <section>
          <h2>Certificari si conformitate</h2>
          <ul className="bullets">
            <li>Productie in Italia, conform reglementarilor UE pentru suplimente alimentare.</li>
            <li>Proceduri GMP (Good Manufacturing Practice) pentru suplimentele alimentare.</li>
            <li>Materii prime provenite din filiere controlate, cu trasabilitate.</li>
            <li>Ambalare si etichetare conforme cu Regulamentul UE 1169/2011.</li>
          </ul>
        </section>

        <section>
          <h2>Sustenabilitate</h2>
          <p>
            Snep acorda o atentie speciala alegerii extractelor din specii cultivate sustenabil (maslin,
            ganoderma, probiotice) si ambalajelor reciclabile. Ca distribuitor, consolidam livrarile catre
            Romania pentru a reduce emisiile asociate transportului.
          </p>
        </section>

        <section>
          <h2>Ce gasesti in catalogul Olivox</h2>
          <p>
            Catalogul nostru acopera toate liniile Snep disponibile pentru publicul larg: suplimente pe baza de
            plante, programe nutritionale, cosmetice pentru piele si par, alimente functionale. Cauta direct in{" "}
            <a href="/categorii">pagina de categorii</a> sau exploreaza{" "}
            <a href="/articole">articolele noastre</a> pentru context si recomandari.
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}
