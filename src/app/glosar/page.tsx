import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Glosar — termeni naturisti explicati | Olivox",
  description:
    "Peste 30 de termeni din lumea suplimentelor naturiste explicati simplu: adaptogeni, ganoderma, oleuropeina, probiotice, nutraceutice si altele.",
  alternates: { canonical: "https://olivox.ro/glosar" },
};

type Term = { term: string; definition: string };

const terms: Term[] = [
  { term: "Adaptogen", definition: "Planta sau extract care ajuta organismul sa se adapteze la stres fizic, psihic sau de mediu. Exemple: rhodiola, ashwagandha, ginseng." },
  { term: "Antioxidant", definition: "Compus care neutralizeaza radicalii liberi si reduce stresul oxidativ celular. Exemple: vitamina C, vitamina E, polifenoli." },
  { term: "Biodisponibilitate", definition: "Procentul dintr-un nutrient ingerat care ajunge efectiv in circulatia sanguina si poate fi folosit de organism." },
  { term: "Colostru", definition: "Primul lapte secretat dupa nastere, bogat in imunoglobuline si factori de crestere, folosit ca supliment pentru imunitate." },
  { term: "Coenzima Q10", definition: "Molecula produsa natural de organism, implicata in productia de energie mitocondriala. Scade cu varsta si la consum crescut." },
  { term: "Curcumina", definition: "Principiu activ din turmeric (Curcuma longa), cu efecte antiinflamatorii si antioxidante documentate clinic." },
  { term: "Detoxifiere", definition: "Procesul fiziologic prin care ficatul si rinichii elimina metabolitii si toxinele. Suplimentele pot sustine acest proces, dar nu il inlocuiesc." },
  { term: "Enzima digestiva", definition: "Proteina care descompune alimentele in moleculele lor componente. Suplimentele enzimatice pot ajuta digestia la persoane cu deficit." },
  { term: "Extract standardizat", definition: "Extract de planta cu un continut minim garantat al principiului activ (ex. oleuropeina 18%). Asigura consistenta efectului." },
  { term: "Fitoterapie", definition: "Utilizarea plantelor si extractelor vegetale in scop terapeutic, pe baza unor principii active documentate." },
  { term: "Ganoderma", definition: "Ciuperca medicinala (Ganoderma lucidum, reishi) folosita traditional in Asia pentru sustinerea imunitatii si reducerea stresului." },
  { term: "Glutation", definition: "Tripeptida antioxidanta majora din organism, produsa de ficat, implicata in detoxifiere si protectie celulara." },
  { term: "Imunomodulator", definition: "Substanta care regleaza raspunsul imun, fara a-l stimula excesiv sau a-l suprima — ajusteaza dupa nevoi." },
  { term: "Lactobacillus", definition: "Gen de bacterii probiotice prezente natural in intestin si in alimente fermentate (iaurt, chefir, varza murata)." },
  { term: "Macronutrient", definition: "Nutrient necesar in cantitati mari: proteine, carbohidrati, lipide. Furnizeaza energie si substraturi pentru tesuturi." },
  { term: "Micronutrient", definition: "Vitamine si minerale necesare in cantitati mici, dar esentiale pentru functii biologice (ex. fier, zinc, vitamina D)." },
  { term: "Nutraceutic", definition: "Aliment sau supliment cu beneficii pentru sanatate dincolo de nutritia de baza. Termen intre aliment si medicament." },
  { term: "Omega-3", definition: "Acizi grasi esentiali (EPA, DHA, ALA) cu rol antiinflamator, cardioprotector si in sanatatea creierului." },
  { term: "Oleuropeina", definition: "Polifenol gasit in frunzele si fructele maslinului, cu proprietati antioxidante si imunomodulatoare. Ingredient central in linia Olivol Snep." },
  { term: "Polifenoli", definition: "Compusi vegetali cu actiune antioxidanta — prezenti in ceai verde, struguri, masline, fructe de padure." },
  { term: "Prebiotic", definition: "Fibra alimentara care hraneste bacteriile benefice din colon (inulina, fructo-oligozaharide)." },
  { term: "Probiotic", definition: "Microorganisme vii care, administrate in cantitati adecvate, contribuie la echilibrul florei intestinale." },
  { term: "Propolis", definition: "Rasina produsa de albine, folosita traditional pentru proprietatile antimicrobiene si de sustinere a sistemului imunitar." },
  { term: "Quercetina", definition: "Flavonoid prezent in ceapa, mere, capere, cu actiune antioxidanta si antihistaminica usoara." },
  { term: "Resveratrol", definition: "Polifenol din pielita strugurilor, studiat pentru efecte asupra longevitatii celulare si sanatatii cardiovasculare." },
  { term: "Simbiotic", definition: "Combinatie de probiotice si prebiotice intr-un singur produs, pentru efect sinergic asupra florei intestinale." },
  { term: "Sinergie", definition: "Efect combinat al mai multor ingrediente, mai mare decat suma efectelor individuale." },
  { term: "Spirulina", definition: "Microalga bogata in proteine (60-70%), fier, clorofila si vitamine B, folosita ca supraliment nutritional." },
  { term: "Standardizare", definition: "Procesul prin care un extract este ajustat pentru a contine o cantitate garantata de principiu activ." },
  { term: "Turmeric", definition: "Radacina de Curcuma longa, sursa principala de curcumina — folosita traditional in medicina ayurvedica." },
  { term: "Vitamina D3", definition: "Forma activa a vitaminei D (colecalciferol), sintetizata in piele la expunere solara. Esentiala pentru oase si imunitate." },
  { term: "Zinc", definition: "Mineral esential pentru imunitate, piele, gustul si vederea. Deficit frecvent in diete sarace in carne si seminte." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Glosar Olivox — termeni naturisti",
  url: "https://olivox.ro/glosar",
  hasDefinedTerm: terms.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.definition,
    inDefinedTermSet: "https://olivox.ro/glosar",
  })),
};

export default function GlosarPage() {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, "ro"));
  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="static-page">
        <header className="static-page__hero">
          <div className="eyebrow">Resurse</div>
          <h1>Glosar — termeni naturisti explicati</h1>
          <p className="lead">
            Un ghid scurt cu peste 30 de termeni pe care ii vei intalni in fise de produs si in articole: de la
            adaptogeni si antioxidanti pana la oleuropeina si probiotice.
          </p>
        </header>

        <dl className="glossary">
          {sorted.map((t) => (
            <div key={t.term} className="glossary__row" id={t.term.toLowerCase().replace(/\s+/g, "-")}>
              <dt>{t.term}</dt>
              <dd>{t.definition}</dd>
            </div>
          ))}
        </dl>
      </article>
      <Footer />
    </div>
  );
}
