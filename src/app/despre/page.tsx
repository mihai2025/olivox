import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Despre Olivox — Distribuitor oficial Snep in Romania",
  description:
    "Olivox este distribuitor oficial Snep in Romania: catalog complet de suplimente alimentare naturiste, alimente functionale si cosmetice naturale, produse in Italia.",
  alternates: { canonical: "https://olivox.ro/despre" },
  openGraph: {
    title: "Despre Olivox — Distribuitor oficial Snep",
    description:
      "Misiunea, valorile si povestea Olivox: de ce am ales sa aducem in Romania produsele naturiste Snep.",
    url: "https://olivox.ro/despre",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: "https://olivox.ro/despre",
  name: "Despre Olivox",
  description:
    "Olivox este distribuitor oficial Snep in Romania — suplimente alimentare, alimente functionale si cosmetice naturale.",
  mainEntity: {
    "@type": "Organization",
    name: "Olivox",
    url: "https://olivox.ro",
    description:
      "Distribuitor oficial Snep in Romania: catalog complet de produse naturiste, cu accent pe transparenta, calitate si suport clienti.",
  },
};

export default function DesprePage() {
  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="static-page">
        <header className="static-page__hero">
          <div className="eyebrow">Despre noi</div>
          <h1>Un catalog naturist complet, adus cu atentie in Romania</h1>
          <p className="lead">
            Olivox aduce catalogul complet <strong>Snep</strong> — companie italiana fondata in 1979, specializata in
            suplimente alimentare, alimente functionale si cosmetice naturale — clientilor din Romania, cu consiliere
            si livrare rapida.
          </p>
        </header>

        <section>
          <h2>Misiunea noastra</h2>
          <p>
            Credem ca sanatatea incepe de la ce punem in farfurie si pe piele. Misiunea Olivox este sa faca accesibile
            in Romania produse naturiste riguros testate, cu trasabilitate clara, fara compromisuri la ingrediente sau
            proces de fabricatie.
          </p>
        </section>

        <section>
          <h2>De ce naturist?</h2>
          <p>
            Suplimentele si cosmeticele pe care le distribuim folosesc plante, extracte si principii active cu
            istoric terapeutic documentat — de la ganoderma, olivol si oleuropeina, pana la probiotice si extracte
            standardizate. Alegem Snep pentru ca publica fise tehnice, foloseste materii prime controlate si are
            echipa R&amp;D activa de peste 40 de ani.
          </p>
        </section>

        <section>
          <h2>Valorile noastre</h2>
          <ul className="bullets">
            <li><strong>Transparenta.</strong> Fise tehnice, ingrediente complete, avertismente clare pe fiecare produs.</li>
            <li><strong>Calitate.</strong> Distribuim doar catalog Snep original, importat direct, nu repackaging.</li>
            <li><strong>Consiliere.</strong> Raspundem la intrebari despre ingrediente, contraindicatii si combinatii.</li>
            <li><strong>Respect pentru client.</strong> Retur 14 zile conform OUG 34/2014, fara birocratie.</li>
          </ul>
        </section>

        <section>
          <h2>Cum lucram</h2>
          <p>
            Comenzile se plaseaza prin formularul de pe pagina fiecarui produs sau la telefon. Livram in 3-5 zile
            lucratoare prin curier in toata Romania. Pentru intrebari punctuale despre un produs, ne poti scrie pe
            email sau WhatsApp — raspundem in cateva ore.
          </p>
          <p>
            Vezi catalogul complet in <a href="/categorii">pagina de categorii</a> sau afla mai multe in{" "}
            <a href="/de-ce-snep">sectiunea dedicata Snep</a>.
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}
