import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const URL = "https://olivox.ro/brand/snep";
const OG_IMAGE = "https://olivox.ro/husapersonalizata.webp";

export const metadata: Metadata = {
  title: "Snep SpA — producatorul italian distribuit in Romania | Olivox",
  description:
    "Snep SpA: producator italian de suplimente, alimente functionale, uleiuri esentiale si cosmetice naturale. Olivox este distribuitorul oficial in Romania.",
  keywords:
    "Snep, Snep SpA, Snep Romania, distribuitor Snep, catalog Snep, produse Snep, suplimente Snep, cosmetice Snep, Olivox Snep",
  alternates: { canonical: URL },
  openGraph: {
    title: "Snep SpA — producatorul italian distribuit de Olivox",
    description:
      "Afla ce produce Snep SpA si de ce olivox.ro este distribuitorul oficial in Romania pentru intregul catalog.",
    url: URL,
    siteName: "olivox.ro",
    type: "article",
    locale: "ro_RO",
    images: [{ url: OG_IMAGE, alt: "Snep — producator italian" }],
  },
};

export default function BrandSnepPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: "Snep SpA",
    url: "https://mysnep.com",
    description:
      "Snep SpA este un producator italian de suplimente alimentare, alimente functionale, uleiuri esentiale si cosmetice naturale.",
    logo: OG_IMAGE,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: "Branduri", item: "https://olivox.ro/brand/snep" },
      { "@type": "ListItem", position: 3, name: "Snep", item: URL },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Ce produce Snep SpA?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Snep SpA produce suplimente alimentare, alimente functionale, uleiuri esentiale, cosmetice naturale (fata, corp, par, sun, beauty), make-up, parfumuri inspirate, parfumuri de camera, cafea functionala si produse de ingrijirea casei.",
        },
      },
      {
        "@type": "Question",
        name: "Cine este distribuitorul Snep in Romania?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Olivox.ro este distribuitorul oficial al catalogului Snep in Romania, cu livrare in 3-5 zile lucratoare si factura fiscala.",
        },
      },
      {
        "@type": "Question",
        name: "Produsele Snep sunt certificate?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Da. Snep fabrica in Italia in unitati cu standarde GMP si respecta reglementarile UE privind suplimentele alimentare si cosmeticele.",
        },
      },
    ],
  };

  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="breadcrumb">
        <a href="/">Acasa</a> / <span>Brand Snep</span>
      </nav>

      <article className="article-detail" style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
        <h1 className="article-detail__title">Snep SpA — producatorul pe care il distribuim</h1>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.65, margin: "16px 0 24px" }}>
          Olivox.ro este distribuitorul oficial in Romania al catalogului <strong>Snep SpA</strong>, un producator italian
          specializat in suplimente alimentare, alimente functionale, uleiuri esentiale, cosmetice naturale, make-up,
          parfumuri si produse pentru ingrijirea casei. Pe aceasta pagina afli cine este Snep, ce fabrica si de ce am
          ales sa aducem in Romania intreaga lor gama.
        </p>

        <div className="article-detail__body" dangerouslySetInnerHTML={{ __html: `
<h2>Cine este Snep</h2>
<p>Snep SpA este un grup italian cu experienta in industria wellness si beauty. Compania proiecteaza si fabrica produse in Italia,
integrand traditia fitoterapica mediteraneeana cu standarde moderne de calitate (unitati de productie cu certificare GMP, trasabilitate pe lot,
materii prime controlate si notificate). Catalogul Snep este construit pe trei piloni: <strong>nutritie</strong>, <strong>ingrijire personala</strong>
si <strong>ingrijirea mediului</strong>.</p>

<h2>Ce gasesti in catalogul Snep</h2>

<h3>Nutritie</h3>
<ul>
  <li><a href="/produse/suplimente-alimentare">Suplimente alimentare</a> pe baza de vitamine, minerale si extracte din plante.</li>
  <li><a href="/produse/alimente-functionale">Alimente functionale</a> — shake-uri, pulberi, baruri cu ingrediente active.</li>
  <li><a href="/produse/cafea">Cafea functionala</a> cu ganoderma si alte adaptogene.</li>
</ul>

<h3>Ingrijire personala</h3>
<ul>
  <li>Cosmetice naturale — ingrijire fata, corp, par, protectie solara (<a href="/produse/beauty-snep">Beauty Snep</a>).</li>
  <li>Make-up cu ingrediente blande (<a href="/produse/make-up">Make-up</a>).</li>
  <li><a href="/produse/parfumuri">Parfumuri inspirate</a> — compozitii premium la pret corect.</li>
  <li><a href="/produse/uleiuri-esentiale">Uleiuri esentiale</a> pure, 100% naturale.</li>
</ul>

<h3>Ingrijirea mediului</h3>
<ul>
  <li><a href="/produse/parfumuri-de-camera">Parfumuri de camera</a> si difuzoare pentru o casa placuta.</li>
  <li>Produse pentru curatenia casei cu ingrediente blande.</li>
</ul>

<h2>De ce Olivox ca distribuitor</h2>
<ul>
  <li><strong>Stoc pe teritoriul Romaniei</strong> — livrari in 3-5 zile lucratoare.</li>
  <li><strong>Factura fiscala</strong> pentru orice comanda, inclusiv persoane juridice.</li>
  <li><strong>Suport in limba romana</strong> pentru intrebari despre produse si administrare.</li>
  <li><strong>Retur</strong> conform OUG 34/2014 (14 zile).</li>
  <li><strong>Pret corect</strong> — fara scheme MLM care umfla pretul final.</li>
</ul>

<h2>Ghiduri utile inainte sa comanzi</h2>
<ul>
  <li><a href="/ghid/suplimente-alimentare-naturale">Ghidul suplimentelor alimentare naturale</a></li>
  <li><a href="/ghid/cum-alegi-supliment">Cum alegi un supliment alimentar de calitate</a></li>
  <li><a href="/ghid/uleiuri-esentiale-utilizari">Uleiuri esentiale: utilizari si beneficii</a></li>
  <li><a href="/ghid/cafea-functionala-ganoderma">Cafea functionala cu Ganoderma</a></li>
</ul>

<h2>Intrebari frecvente</h2>
<h3>Cum imi dau seama ca produsul este autentic?</h3>
<p>Fiecare comanda de pe olivox.ro este livrata direct din stocul nostru, cu factura fiscala si cu produse etichetate in conformitate cu legislatia din Romania.</p>

<h3>Pot comanda intregul catalog sau doar o parte?</h3>
<p>Intregul catalog Snep este disponibil pe olivox.ro. Daca nu gasesti un produs in listing, contacteaza-ne si putem verifica disponibilitatea.</p>

<h3>Faceti livrari si pentru clienti persoane juridice (B2B)?</h3>
<p>Da, emitem factura cu datele firmei si putem discuta conditii pentru comenzi recurente mai mari.</p>
        `}} />

        <section style={{ marginTop: 32, textAlign: "center", padding: "28px 16px" }}>
          <h2>Exploreaza catalogul Snep</h2>
          <p>Peste cateva sute de referinte din gamele de nutritie, beauty si home care.</p>
          <p style={{ marginTop: 16 }}>
            <a
              href="/categorii"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                background: "#4a6b3a",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Vezi toate categoriile
            </a>
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}
