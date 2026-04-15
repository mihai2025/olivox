/**
 * Olivox — populate SEO content for product_categories.
 *
 * Writes description (lead + body), meta_title, meta_description
 * for every row in product_categories. Idempotent: skips categories whose
 * existing description is already > 200 chars, unless `--force` is passed.
 *
 * Usage:
 *   npx tsx scripts/write-category-content.ts            # run, respect existing content
 *   npx tsx scripts/write-category-content.ts --force    # overwrite everything
 *
 * Schema note: product_categories has (description, meta_title, meta_description)
 * but no seo_text column. The extended SEO body is therefore embedded in
 * description as <p class="lead">intro</p><p>body1</p>... (3-5 paragraphs total).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---------- env ----------
const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const FORCE = process.argv.includes("--force");

// ---------- content builders ----------
type Cat = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  description: string | null;
  product_count: number | null;
};
type Product = { name: string; slug: string; short_description: string | null };

type Content = {
  lead: string;      // 80-150 words
  body: string[];    // 2-4 paragraphs, total 300-500 words
  meta_title: string;
  meta_description: string;
};

const SHIP = "Livrare 3-5 zile lucratoare in Romania";

/** Normalizes & title-cases a product name for inline use. */
function clean(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

/** Picks up to N product names to mention. */
function pick(prods: Product[], n: number) {
  return prods.slice(0, n).map(p => clean(p.name));
}

/** Generic builder used when we have enough info to interpolate products. */
function genericBuilder(
  cat: Cat,
  prods: Product[],
  opts: {
    h1: string;
    benefit: string;     // short benefit line used in lead
    audience: string;    // who it is for
    whatsInside: string; // what this category contains (plural noun phrase)
    bodyTheme: string;   // paragraph 2 theme (how to choose)
    signatureLine?: string; // sentence mentioning signature products
  },
): Content {
  const samples = pick(prods, 3);
  const hasSamples = samples.length > 0;
  const signatureLine =
    opts.signatureLine ??
    (hasSamples
      ? `Printre produsele reprezentative din aceasta categorie se numara ${samples.join(", ")} — formule apreciate pentru consistenta rezultatelor si calitatea ingredientelor folosite.`
      : "");

  const lead =
    `<p class="lead">${opts.h1} de la Snep aduce in catalogul olivox.ro ${opts.whatsInside}, ` +
    `produse dezvoltate in Italia dupa standarde stricte de calitate. ${opts.benefit} ` +
    `Gama este gandita pentru ${opts.audience} si completeaza un stil de viata atent la detalii. ` +
    `Fiecare referinta din aceasta sectiune este selectata pentru ingredientele curate, ` +
    `pentru trasabilitatea materiilor prime si pentru echilibrul intre eficienta si placere de utilizare. ` +
    `Comanzi rapid online, primesti produsele in cateva zile lucratoare si beneficiezi de asistenta ` +
    `pentru alegerea variantei potrivite nevoilor tale.</p>`;

  const body: string[] = [];

  body.push(
    `<p>Catalogul Snep distribuit de olivox.ro este construit in jurul unei filosofii simple: ` +
    `ingrediente de calitate, formule verificate si respect pentru consumator. ${signatureLine} ` +
    `Produsele sunt fabricate in Italia, in unitati certificate, si ajung la tine prin canalul ` +
    `oficial Olivox — distribuitor autorizat al Snep SpA pentru Romania.</p>`
  );

  body.push(
    `<p>${opts.bodyTheme} Daca ai nevoie de indrumare suplimentara, echipa olivox.ro te ` +
    `poate ajuta sa alegi varianta potrivita in functie de obiectivul tau si de rutina zilnica. ` +
    `Iti recomandam sa citesti descrierea fiecarui produs, lista de ingrediente si modul de utilizare ` +
    `inainte de a plasa comanda, pentru a te asigura ca selectezi formula corecta.</p>`
  );

  body.push(
    `<p>Toate produsele din categoria <strong>${cat.name.toLowerCase()}</strong> sunt livrate direct ` +
    `din stocul Olivox, in ambalaje sigilate de producator. ${SHIP}, cu posibilitate de plata la livrare ` +
    `sau online. Pentru intrebari despre compozitie, utilizare sau comenzi mai mari, ne poti contacta ` +
    `oricand — suntem aici sa te ajutam sa descoperi ce inseamna cu adevarat calitatea italiana Snep.</p>`
  );

  const meta_title = truncateTitle(`${opts.h1} Snep | olivox.ro`);
  // meta: ensure SHIP line fits inside 160 chars by trimming benefit if needed
  const metaShort = `${opts.h1} Snep, fabricate in Italia. ${SHIP}.`;
  const metaFull = `${opts.h1} Snep originale, fabricate in Italia. ${opts.benefit.replace(/\.$/, "")}. ${SHIP}.`;
  const meta_description = metaFull.length <= 160
    ? metaFull
    : truncateMetaWithShip(opts.h1, opts.benefit, metaShort);

  return { lead, body, meta_title, meta_description };
}

function truncateTitle(t: string) {
  if (t.length <= 65) return t;
  // try to fit within 65 chars while preserving suffix
  const suffix = " | olivox.ro";
  const head = t.replace(suffix, "");
  const maxHead = 65 - suffix.length;
  return head.slice(0, maxHead).replace(/[\s,;:-]+$/, "") + suffix;
}
function truncateMetaWithShip(h1: string, benefit: string, fallback: string) {
  // Build from parts, trimming benefit to fit 160 including SHIP sentence.
  const prefix = `${h1} Snep originale, fabricate in Italia. `;
  const suffix = `. ${SHIP}.`;
  const budget = 160 - prefix.length - suffix.length;
  if (budget < 20) return fallback;
  let b = benefit.replace(/\.$/, "");
  if (b.length > budget) {
    const cut = b.slice(0, budget);
    const lastSpace = cut.lastIndexOf(" ");
    b = (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:-]+$/, "");
    // drop any trailing conjunction/preposition
    b = b.replace(/\s+(si|pentru|cu|la|in|de|din|pe)$/i, "");
  }
  // strip trailing punctuation so we don't get ",." etc
  b = b.replace(/[\s,;:-]+$/, "");
  const out = `${prefix}${b}${suffix}`;
  return out.length <= 160 ? out : fallback;
}

function truncateMeta(t: string) {
  if (t.length <= 160) {
    if (t.length < 140) {
      // pad with a CTA but only at word boundaries
      const options = [
        " Comanda acum online!",
        " Comanda acum pe olivox.ro!",
        " Comanda online acum!",
        " Comanda acum.",
      ];
      for (const cta of options) {
        if ((t + cta).length <= 160) return t + cta;
      }
      return t;
    }
    return t;
  }
  // too long: cut at last space before 157 chars and add ellipsis
  const cut = t.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 120 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s,;:-]+$/, "") + "...";
}

// ---------- category-specific content map ----------
type BuildFn = (cat: Cat, prods: Product[]) => Content;

const BUILDERS: Record<string, BuildFn> = {
  // ===== ROOTS =====
  nutritie: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Nutritie",
      benefit:
        "Suplimente alimentare, alimente functionale si programe dedicate pentru energie, echilibru si o alimentatie atenta.",
      audience:
        "persoanele active, sportivii, familiile care vor sa-si imbogateasca dieta si pentru oricine cauta produse nutritive de calitate",
      whatsInside:
        "suplimente alimentare, alimente functionale, programe nutritionale, cafea cu ganoderma si solutii pentru controlul greutatii",
      bodyTheme:
        "Sectiunea Nutritie este organizata pe subcategorii — suplimente alimentare, alimente functionale, programe si controlul greutatii — pentru a gasi rapid produsul potrivit. Fie ca vrei sa sustii imunitatea, sa optimizezi performanta fizica sau sa ai mese functionale practice in ritmul zilnic, aici descoperi o selectie completa.",
    }),

  "ingrijire-personala": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijire Personala",
      benefit:
        "Cosmetice, produse pentru fata, corp, par, make-up si parfumuri inspirate — toate cu semnatura Snep.",
      audience:
        "cei care cauta ingrijire zilnica de calitate, rutine naturale si produse testate dermatologic",
      whatsInside:
        "cosmetice pentru fata si corp, produse pentru par, machiaj profesional, parfumuri inspirate si linii dedicate precum Beauty Snep, NAT si SnepLumax",
      bodyTheme:
        "Liniile Snep de ingrijire personala combina extracte naturale, active cosmetice moderne si texturi placute. Descoperi ritualuri complete pentru ten, par si corp, precum si produse de machiaj si parfumuri inspirate de compozitii celebre, la preturi accesibile.",
    }),

  "ingrijirea-mediului": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijirea Mediului",
      benefit:
        "Solutii pentru casa si mediu — parfumuri de camera, filtrare a apei Hydropura si gama BioEffective pentru curatenie si gradina.",
      audience:
        "familiile care vor o casa curata, aer proaspat si solutii eco pentru cresterea plantelor sau intretinerea gospodariei",
      whatsInside:
        "parfumuri de camera italienesti, sistemul Hydropura pentru filtrarea apei si produsele BioEffective pentru curatenie, gradina si compost",
      bodyTheme:
        "Categoria Ingrijirea Mediului aduce in casa ta parfumuri italienesti, apa filtrata de calitate si solutii probiotice BioEffective care inlocuiesc produsele chimice agresive. Sunt alegeri bune pentru familii cu copii, pentru cei sensibili la mirosuri puternice si pentru oricine doreste o casa mai sanatoasa.",
    }),

  // ===== NUTRITIE — SUBCATEGORIES =====
  "suplimente-alimentare": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Suplimente Alimentare",
      benefit:
        "Formule italiene cu vitamine, minerale, extracte din plante, Omega 3 si ingrediente functionale, pentru sustinerea zilnica a organismului.",
      audience:
        "adultii care vor sa-si completeze dieta, sportivii si cei cu nevoi specifice — imunitate, somn, digestie sau energie",
      whatsInside:
        "vitamine, minerale, extracte din plante, Omega 3, aloe, uleiuri esentiale si linii dedicate precum Pur, Real si Linia Nevoi Specifice",
      bodyTheme:
        "Pentru a alege corect, porneste de la obiectivul tau: energie zilnica, sustinerea sistemului imunitar, digestie echilibrata sau sprijin in perioade solicitante. Seria Linia Real ofera multivitamine complete, gama Pur include extracte standardizate (Maca, Reishi, Shiitake), iar Omega si Perle aduce acizi grasi esentiali de calitate farmaceutica.",
    }),

  "alimente-functionale": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Alimente Functionale",
      benefit:
        "Cafea cu ganoderma, ceaiuri, ciocolate, batoane proteice si snack-uri sanatoase — gustul bun intalneste beneficii reale.",
      audience:
        "cei care vor sa mentina un ritm alimentar echilibrat fara sa renunte la placeri — pauza de cafea, ciocolata, ceaiul sau snack-ul dintre mese",
      whatsInside:
        "cafea cu ganoderma (capsule si solubila), ciocolate Choco, ceaiuri, batoane si linii sportive dedicate",
      bodyTheme:
        "Alimentele functionale Snep sunt concepute sa ofere gust si beneficii simultan: cafeaua cu ganoderma aduce rigoarea extractului de ciuperca japoneza, produsele Choco inlocuiesc gustarile dulci clasice, iar sectiunea Sport acopera nevoile de energie si recuperare. Totul, cu ingrediente italienesti si formule verificate.",
    }),

  // ===== NUTRITIE — LEAF CATEGORIES =====
  "controlul-greutatii": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Controlul Greutatii",
      benefit:
        "Batoane, shake-uri, capsule si snack-uri pentru a sustine o greutate echilibrata, cu gust placut si ingrediente functionale.",
      audience:
        "cei care vor sa gestioneze greutatea printr-o alimentatie controlata, fara diete agresive, si pentru sportivi in perioade de definire",
      whatsInside:
        "batoane proteice cu diverse arome, shake-uri vegane, snack-uri Crockis si programe Kalo pentru reducerea aportului caloric",
      bodyTheme:
        "Produsele din aceasta categorie inlocuiesc una sau doua mese pe zi fara sa compromita gustul: batoane cu cocos si ciocolata, Plus Cacao si Capsuni vegan, sau Crockis pentru momentele de pofta. Alege in functie de ritmul tau si de preferinte — ideal este sa combini produsele cu miscare regulata si hidratare.",
    }),

  programe: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Programe Nutritionale",
      benefit:
        "Kit-uri complete pentru detoxifiere, slabit, energie si echilibru — totul intr-un singur pachet, cu instructiuni clare.",
      audience:
        "cei care vor o abordare structurata, cu produse gata selectate pentru un obiectiv concret",
      whatsInside:
        "programe de detoxifiere (Real Detox), pachete Strong, Basic, Kalo Sprint si alte kit-uri concepute de echipa Snep",
      bodyTheme:
        "Fiecare program este gandit pentru o perioada determinata — cateva zile pana la cateva saptamani — si combina suplimentele cu alimente functionale pentru un efect coerent. Starting Point este o introducere buna in universul Snep, iar Program Strong si Kalo Sprint tintesc obiective mai specifice, de la performanta la controlul greutatii.",
    }),

  suplimente: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Suplimente",
      benefit:
        "Formule italienesti pentru imunitate, echilibru si vitalitate, de la VENERE la ECDEFENSE si alte solutii clasice Snep.",
      audience:
        "adultii care cauta suplimente de incredere, cu ingrediente standardizate si origine transparenta",
      whatsInside:
        "suplimente clasice Snep, formule pentru imunitate, echilibru hormonal si energie zilnica",
      bodyTheme:
        "Sectiunea Suplimente reuneste produsele care nu se incadreaza intr-o subcategorie specifica — formule hibride, combinatii complexe sau solutii unice. VENERE si ECDEFENSE sunt doar doua exemple. Fiecare eticheta contine lista completa de ingrediente, iar modul de administrare este detaliat in descrierea produsului.",
    }),

  aloe: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Aloe",
      benefit:
        "Sucuri si formule concentrate cu Aloe Vera de calitate — ajutor pentru digestie, hidratare si echilibru intern.",
      audience:
        "cei care vor sa includa aloe in rutina zilnica, fie sub forma de drink, fie in combinatii functionale",
      whatsInside:
        "drink-uri Aloe Vera cu fructe, Aloe 100 Bio, combinatii cu glucozamina si pachete economice",
      bodyTheme:
        "Aloe Vera este ingredientul-cheie al acestei categorii — recunoscut pentru proprietatile sale de hidratare si suport digestiv. Aloe Drink 7 Fructe si Aloe & Piersica Drink sunt variante cu gust placut, potrivite pentru consum zilnic, in timp ce Aloe 100 Bio ofera un concentrat mai intens, certificat bio.",
    }),

  "uleiuri-esentiale": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Uleiuri Esentiale",
      benefit:
        "Uleiuri esentiale pure, presate la rece si distilate, pentru aromaterapie, masaj si ingrijire personala.",
      audience:
        "pasionatii de aromaterapie, cei care vor sa-si parfumeze natural casa si oricine cauta puritate in rutina de wellness",
      whatsInside:
        "uleiuri esentiale de rozmarin, lavanda Monte Bianco, menta, lamaie, salvie si multe alte plante aromatice",
      bodyTheme:
        "Uleiurile esentiale Snep provin din culturi selectate si sunt extrase prin metode care pastreaza intreg profilul aromatic. Uleiul de Monte Bianco Lavender are o nota florala clasica relaxanta, Rozmarinul sustine concentrarea, iar Menta improspateaza aerul si calmeaza. Folosite in difuzor, diluate in ulei de baza sau adaugate in produse de curatare, aduc un plus de naturalete in casa.",
    }),

  pur: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Linia PUR",
      benefit:
        "Extracte vegetale standardizate — Maca, Reishi, Shiitake, Moringa, Quercetina — pentru sustinerea vitalitatii si a imunitatii.",
      audience:
        "cei care cauta suplimente naturale, monodoza, cu extracte puternice si fara ingrediente inutile",
      whatsInside:
        "extracte vegetale pure din ciuperci medicinale (Reishi, Shiitake), plante adaptogene (Maca) si antioxidanti (Quercetina, Moringa)",
      bodyTheme:
        "Linia PUR se concentreaza pe ingrediente unice, bine dozate. Reishi 90 Capsule este un clasic pentru sustinerea imunitatii, Maca ofera suport pentru energie si rezistenta, iar Quercetina Max aduce o concentratie ridicata de antioxidanti. Fiecare produs este insotit de informatii clare despre origine si mod de administrare.",
    }),

  "omega-si-perle": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Omega si Perle",
      benefit:
        "Acizi grasi Omega 3 si formule cu ulei de krill — sustin sistemul cardiovascular, creierul si pielea.",
      audience:
        "adultii care doresc sa-si completeze aportul de grasimi bune din alimentatie, persoanele cu diete sarace in peste",
      whatsInside:
        "Omega 3 de calitate, Snep Krill, combinatii Omega Tris si formule dedicate Cuore di Grano",
      bodyTheme:
        "Omega 3 sustine functia cardiaca, concentrarea si confortul articular. Omega 3 si Omega Tris ofera variante clasice purificate, iar Snep Krill adauga fosfolipide pentru absorbtie mai buna. Cuore di Grano combina acizi grasi cu antioxidanti vegetali, oferind o formula completa pentru sanatatea cardiovasculara.",
    }),

  "nevoi-specifice": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Nevoi Specifice",
      benefit:
        "Formule adresate unor nevoi concrete: somn, digestie, confort urinar, echilibru mental, sustinere hormonala.",
      audience:
        "cei care cauta solutii tintite pentru situatii clar definite, recomandate de specialisti in suplimentatie",
      whatsInside:
        "AM & PM pentru ritm circadian, Superelease, Ergovir, Olimind 2x500ml, Kalosnep si alte formule dedicate",
      bodyTheme:
        "Sectiunea Nevoi Specifice aduna produse care raspund unor nevoi concrete, adesea sezoniere sau legate de un anumit ritm de viata. AM & PM sustine energia de dimineata si relaxarea seara, Olimind ofera suport pentru echilibrul emotional, iar Ergovir si Superelease tintesc imunitatea si confortul digestiv.",
    }),

  "linia-real": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Linia REAL",
      benefit:
        "Multivitamine, complexe de vitamine si fibre — sustin aportul nutritional zilnic al intregii familii.",
      audience:
        "familiile, adultii cu ritm alert si oricine vrea o solutie simpla pentru a compensa lipsurile din alimentatie",
      whatsInside:
        "RealComplex, RealVita comprimate si solutie, RealFibre si alte variante pentru consum zilnic",
      bodyTheme:
        "Linia REAL este conceputa pentru uz zilnic si aduce elementele esentiale intr-o singura formula. RealVita exista in doua forme (comprimate si lichid), pentru preferinte diferite, RealComplex adauga minerale si elemente de tip B-complex, iar RealFibre sprijina sanatatea digestiva.",
    }),

  "necesitatile-energetice": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Necesitatile Energetice",
      benefit:
        "Bauturi si capsule energizante pentru antrenament, studiu sau zile solicitante — cu ingrediente curate.",
      audience:
        "sportivii, studentii, soferii pe distante lungi si oricine are nevoie de un boost energetic natural",
      whatsInside:
        "Tribux Blue, BCAA Amino Acid, Total Energy Drink si Total Energy Capsule",
      bodyTheme:
        "Total Energy Drink ofera un plus rapid de energie sub forma lichida, in timp ce Total Energy Capsule este varianta practica pentru iesiri sau calatorii. BCAA sustine recuperarea in antrenamentele intense, iar Tribux Blue adauga un profil functional pentru performanta.",
    }),

  proteina: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Proteine Vegane",
      benefit:
        "Proteine vegetale din orez si lupin, cu arome naturale — pentru recuperare, sport si alimentatie echilibrata.",
      audience:
        "sportivii vegani, vegetarienii si cei cu intoleranta la lactate care cauta proteine complete de origine vegetala",
      whatsInside:
        "Vegan Lupine Protein cu aroma de portocale si zmeura si Cacao Protein de Rice si Lupine Vegan",
      bodyTheme:
        "Proteinele vegane Snep combina lupinul si orezul pentru un profil aminoacid complet. Varianta Orange & Raspberry este excelenta dupa antrenament, iar Cacao Rice & Lupine se potriveste dimineata, in smoothie-uri sau terci de ovaz. Fara ingrediente de origine animala, fara adaosuri inutile.",
    }),

  // ===== ALIMENTE FUNCTIONALE — LEAVES =====
  cafea: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Cafea cu Ganoderma",
      benefit:
        "Cafea italiana imbogatita cu extract de ganoderma si oleuropeina, in variante solubile sau capsule compatibile Nespresso si Lavazza.",
      audience:
        "amatorii de cafea care vor un gust bogat plus un plus functional din extractul de ganoderma",
      whatsInside:
        "Capsule Nespresso si Lavazza Point cu ganoderma, Mokaccino solubil, Soluble Cappuccino, variante cu oleuropeina",
      bodyTheme:
        "Ganoderma (Reishi) este o ciuperca japoneza apreciata in traditia orientala pentru sustinerea vitalitatii. Adaugata in cafeaua de calitate italiana, ofera o aroma rotunda si un plus de beneficii. Capsulele compatibile Nespresso si Lavazza Point integreaza aceasta traditie in rutina ta de dimineata, fara alte schimbari.",
    }),

  ceaiuri: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ceaiuri",
      benefit:
        "Amestecuri italienesti de ceai pentru relaxare, hidratare si gust rafinat, in plicuri si loose leaf.",
      audience:
        "iubitorii de ceai, cei care vor sa reduca cofeina sau sa aiba bauturi calde de calitate in casa",
      whatsInside:
        "The Mix in plicuri si vrac, The Peach si alte compozitii echilibrate",
      bodyTheme:
        "Ceaiurile Snep sunt alese pentru echilibrul dintre arome si taninuri. The Mix combina mai multe tipuri de frunze pentru un gust rotund, iar The Peach aduce o nota dulce de piersica italiana. Perfecte pentru dupa-amieze linistite sau ca alternativa la cafea, in ritualul de seara.",
    }),

  choco: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Choco — Ciocolate Functionale",
      benefit:
        "Ciocolate cu ingrediente functionale, gustare placuta si mai bine dozata caloric.",
      audience:
        "cei care vor sa-si satisfaca pofta de dulce fara sa compromita obiectivele nutritionale",
      whatsInside:
        "Snep Choco Moon, Choco Block si Choco Cup — variante diverse de ciocolate functionale Snep",
      bodyTheme:
        "Choco Moon este o gustare dulce cu profil mai prietenos, Choco Block ofera bucati mai generoase pentru familie, iar Choco Cup este forma mica, perfecta pentru a lua cu tine. Toate au ingrediente selectate si inlocuiesc cu succes ciocolatele clasice incarcate cu aditivi.",
    }),

  alimente: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Alimente Snep",
      benefit:
        "Snack-uri si batoane cu gust bun si profil nutritional atent — de la Protine cu barbeque la Snack Plus cu cereale.",
      audience:
        "cei care vor gustari practice pentru birou, scoala sau calatorie, fara conservanti inutili",
      whatsInside:
        "batoane Protine cu diverse arome (barbeque, branza, ierburi aromatice) si Snack Plus cu cereale integrale",
      bodyTheme:
        "Protine in variantele Barbeque, Branza si Ierburi Aromatice ofera gustari sarate usoare, potrivite intre mese. Snack Plus cu cereale este alegerea dulce, ideala pentru copii si adulti activi. Fiecare produs are informatii nutritionale clare pe ambalaj.",
    }),

  "pauze-dulci": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Pauze Dulci",
      benefit:
        "Gustari dulci cu ingrediente selectate — pentru cafeaua de la birou, ceaiul de seara sau pofta de ceva bun.",
      audience:
        "familiile, copiii si adultii care vor sa inlocuiasca dulciurile clasice cu alternative mai bune",
      whatsInside:
        "gustari dulci Snep, bomboane si batoane dulci din catalog",
      bodyTheme:
        "Categoria Pauze Dulci este gandita ca alternativa la dulciurile standard din supermarket. Ingrediente simple, zahar gestionat atent si formule fara aditivi artificiali. Perfecta pentru cei care vor placere fara compromis major.",
    }),

  sport: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Sport",
      benefit:
        "Suplimente si alimente pentru sportivi — energie, recuperare, masa musculara si concentrare.",
      audience:
        "sportivii amatori si profesionisti, cei care merg regulat la sala sau practica sporturi de rezistenta",
      whatsInside:
        "Energy Boost, Upgrate, Brain, Creatina si Kit-ul Sport for All, conceput pentru rutine complete",
      bodyTheme:
        "Energy Boost sustine performanta in antrenament, Upgrate si Creatina ajuta la refacerea musculara si puterea maxima, iar Brain este conceput pentru concentrare sustinuta. Kit Sport for All este o introducere completa pentru cei care vor sa inceapa organizat, cu produse care lucreaza bine impreuna.",
    }),

  "masina-de-cafea": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Masina de Cafea",
      benefit:
        "Aparate de cafea Snep pentru casa si birou, compatibile cu capsulele de cafea cu ganoderma.",
      audience:
        "amatorii de cafea functionala care vor un espressor dedicat pentru capsulele Snep",
      whatsInside:
        "aparate de cafea si accesorii oficiale Snep, compatibile cu capsulele din catalog",
      bodyTheme:
        "Masinile de cafea Snep sunt alegerea logica daca folosesti zilnic capsulele cu ganoderma sau oleuropeina. Design italian compact, functionare silentioasa si compatibilitate garantata cu intregul catalog de cafea Snep. Perfecte pentru birou sau bucatarie.",
    }),

  "accesorii-pentru-cafenea": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Accesorii pentru Cafenea",
      benefit:
        "Kit-uri de cafea, pahare, linguri si consumabile pentru cafenele si utilizatori intensi acasa.",
      audience:
        "cafenele, restaurante si utilizatori casnici care vor un set complet pentru servirea cafelei",
      whatsInside:
        "Kit de servicii de cafea 100 pz si alte accesorii pentru servire profesionala",
      bodyTheme:
        "Kit-ul de servicii de cafea 100 pz este solutia practica pentru cafenele sau reuniuni: pahare, agitatoare, zahar si tot ce este necesar pentru o servire profesionala. Se livreaza in cantitati generoase, economic si eficient.",
    }),

  // ===== INGRIJIRE PERSONALA =====
  "beauty-snep": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Beauty Snep",
      benefit:
        "Linia cosmetica Snep pentru ten, corp si par — formule cu extracte naturale si texturi placute.",
      audience:
        "cei care vor cosmetice italienesti cu profil curat, pentru rutine zilnice de ingrijire",
      whatsInside:
        "creme, seruri, lotiuni si tratamente Beauty Snep pentru ten si corp",
      bodyTheme:
        "Beauty Snep este semnatura cosmetica a Snep — produse italienesti cu ingrediente active bine alese. Gama acopera atat nevoi de baza (curatare, hidratare) cat si tratamente tintite (anti-aging, antipete, iluminare). Pentru rezultate vizibile, combina doua-trei produse intr-o rutina scurta si consecventa.",
    }),

  nat: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "NAT",
      benefit:
        "Gama NAT — ingrijire personala cu accent pe naturalete si formule simple, respectuoase cu pielea.",
      audience:
        "cei care cauta cosmetice minimaliste, fara parfumuri puternice si cu liste scurte de ingrediente",
      whatsInside:
        "produse NAT pentru ingrijirea zilnica a pielii, cu formule clare si texturi discrete",
      bodyTheme:
        "Linia NAT se adreseaza persoanelor care prefera produsele cu liste de ingrediente scurte si recognoscibile. Fara parfumuri sintetice agresive, fara coloranti artificiali, doar formule simple care fac exact ce promit: hidrateaza, calmeaza si protejeaza.",
    }),

  sneplumax: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "SnepLumax",
      benefit:
        "Gama SnepLumax pentru ingrijirea avansata a tenului — iluminare, anti-aging si texturi premium.",
      audience:
        "tenurile mature, obosite sau lipsite de stralucire care au nevoie de tratamente concentrate",
      whatsInside:
        "seruri, creme si tratamente din linia SnepLumax, inclusiv Sneplumax Serum si Dream Vision",
      bodyTheme:
        "SnepLumax este linia premium a catalogului Snep pentru ingrijirea fetei. Seruri concentrate, texturi bogate si active cosmetice moderne care abordeaza semnele vizibile ale timpului. Ideal ca treapta superioara intr-o rutina deja bine stabilita.",
    }),

  "make-up": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Make-Up",
      benefit:
        "Machiaj profesional Snep — fonduri, rujuri, farduri si creioane cu pigmenti de calitate.",
      audience:
        "cei care vor machiaj italienesc accesibil, potrivit atat pentru zi cat si pentru seara",
      whatsInside:
        "fonduri Cover 5K, rujuri Matt Lip, farduri Matt Shadow, pudre Shimmer si creioane de sprancene",
      bodyTheme:
        "Make-up-ul Snep combina pigmenti ridicati cu texturi placute. Cover 5K N.1 este un fond de ten cu acoperire medie, Matt Lip N.1 Electric Brown este o nuanta clasica rujata, iar Matt Shadow N.1 Coal se foloseste si ca eyeliner cremos. Eyebrow Pencil N.08 Quincy completeaza rutina.",
    }),

  makeup: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "MakeUp",
      benefit:
        "Toate produsele de machiaj Snep intr-un singur loc — fonduri, farduri, rujuri, pudre si accesorii.",
      audience:
        "make-up artist-ii si utilizatorii pasionati de machiaj italienesc",
      whatsInside:
        "Shimmer, Cover 5K, Matt Lip, Matt Shadow, Eyebrow Pencil si alte produse MakeUp Snep",
      bodyTheme:
        "Sectiunea MakeUp aduna toate produsele de machiaj Snep: baza (Cover 5K), ochi (Matt Shadow, Eyebrow Pencil), buze (Matt Lip) si finisaj (Shimmer). Numerotarea pe nuante face alegerea usoara, iar calitatea italiana se simte de la prima aplicare.",
    }),

  parfumuri: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Parfumuri",
      benefit:
        "Parfumuri Snep si parfumuri inspirate de compozitii celebre, la preturi accesibile, cu persistenta buna.",
      audience:
        "cei care vor note rafinate fara sa plateasca pretul unui parfum de designer",
      whatsInside:
        "parfumuri inspirate (ex. 101 inspirat de Aventus, 201 inspirat de Alien) si colectii originale Snep",
      bodyTheme:
        "Parfumurile inspirate Snep reproduc profilul aromatic al unor parfumuri celebre, cu esente de calitate si concentratie buna. 101 este inspirat din notele Creed Aventus — ananas, mosc, vanilie — iar 201 aduce universul feminin Alien. O alegere inteligenta pentru rutina zilnica.",
    }),

  "parfumuri-inspirate": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Parfumuri Inspirate",
      benefit:
        "Reinterpretari ale parfumurilor celebre, la un pret mult mai prietenos, cu fixare buna pe piele.",
      audience:
        "cei care vor sa experimenteze note premium fara investitie mare",
      whatsInside:
        "parfumurile Snep numerotate (101, 201 etc.) care se inspira din compozitii de designer",
      bodyTheme:
        "Fiecare parfum inspirat Snep este construit pornind de la profilul aromatic al unui original celebru. Numerotarea clara (101 pentru barbati inspirat de Aventus, 201 pentru femei inspirat de Alien) face alegerea rapida. Fixare decenta, sticla ergonomica si un pret care face experimentarea posibila.",
    }),

  fata: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijire Fata",
      benefit:
        "Creme, seruri si sticks pentru ten — hidratare, iluminare, anti-aging si protectie.",
      audience:
        "cei care construiesc o rutina zilnica pentru fata, indiferent de varsta sau tip de ten",
      whatsInside:
        "Reinature Cream, Reinature Stick, Reinature Drop, Sneplumax Serum si Dream Vision",
      bodyTheme:
        "Rutina ideala pentru fata urmeaza trei pasi: curatare, tratament si hidratare. Reinature Drop se aplica dupa curatare, Sneplumax Serum adauga ingrediente active concentrate, iar Reinature Cream inchide rutina cu o textura bogata. Dream Vision abordeaza zona delicata a ochilor, semnele de oboseala si cearcanele.",
    }),

  par: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijire Par",
      benefit:
        "Sampoane, balsamuri, masti si tratamente pentru toate tipurile de par, inclusiv solutii anti-cadere.",
      audience:
        "cei cu par sensibil, tratat, colorat sau cu tendinta de cadere",
      whatsInside:
        "gel de dus si sampon reparator dupa plaja, kit anti-caderea parului, Trico-Salus scrub purificator, Sneplumina masca hidratanta si Snep Ice sampon anti-galben",
      bodyTheme:
        "Rutina completa pentru par incepe cu un scrub ocazional (Trico-Salus), sampon potrivit tipului tau (Snep Ice pentru parul blond, sampon reparator dupa plaja), urmat de masca Sneplumina si, in cazuri specifice, kit-ul anti-cadere. Rezultatele sunt mai vizibile la utilizare regulata, timp de cateva saptamani.",
    }),

  oil: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "OIL — Uleiuri pentru Corp",
      benefit:
        "Uleiuri functionale pentru masaj, ingrijire si confort muscular — Muscolease, Exvasi, Mandorle Dolci si Top Finger.",
      audience:
        "sportivii, cei cu tensiuni musculare si cei care iubesc ritualurile de masaj acasa",
      whatsInside:
        "Muscolease pentru muschi, Exvasi pentru circulatie, Mandorle Dolci ulei de migdale dulci si Top Finger, inclusiv kit-uri combinate",
      bodyTheme:
        "Muscolease relaxeaza muschii dupa efort, Exvasi sustine circulatia in picioare, iar Mandorle Dolci este un clasic al ingrijirii pielii. Top Finger se aplica tintit, iar kit-ul combinat aduce toate variantele intr-un singur pachet, ideal cadou sau pentru incepatori.",
    }),

  corp: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijire Corp",
      benefit:
        "Geluri de dus, lotiuni, produse de igiena orala si accesorii — rutina completa pentru corp.",
      audience:
        "intreaga familie, de la copii la adulti, cu nevoi diverse de ingrijire zilnica",
      whatsInside:
        "gel de dus reducator, Master, Fanpaste, Vimana, periute de dinti din bambus si alte produse pentru corp",
      bodyTheme:
        "Rutina zilnica de corp poate include gelul de dus reducator pentru efectul improspatator, Master pentru ingrijire barbatesca, Fanpaste pentru igiena orala si Vimana pentru momente de rasfat. Periutele din bambus adauga o nota eco, important pentru cei care-si urmaresc amprenta asupra mediului.",
    }),

  "protectie-solara": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Protectie Solara",
      benefit:
        "Creme, spray-uri si stick-uri SPF pentru fata si corp, plus produse after-sun pentru intretinerea bronzului.",
      audience:
        "intreaga familie in sezonul cald, sportivii de aer liber si calatorii in zone insorite",
      whatsInside:
        "Tanning Pro spray activator, spray transparent SPF 25, stick transparent SPF 50+, pochette suncare si after sun iluminator",
      bodyTheme:
        "Pentru o protectie completa, alege SPF-ul potrivit situatiei: Stick SPF 50+ pentru zonele sensibile (nas, umeri, cicatrici), Spray Transparent SPF 25 pentru utilizare zilnica urbana si Tanning Pro pentru accelerarea bronzului. After Sun hidrateaza si prelungeste bronzul, iar Pochette Suncare este gata de plaja.",
    }),

  "ingrijirea-corpului": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Ingrijirea Corpului",
      benefit:
        "Produse Snep dedicate ingrijirii generale a corpului — de la Beauty Fit 9 la creme si tratamente corp.",
      audience:
        "cei care vor rutine integrate pentru piele, de la hidratare la fermitate",
      whatsInside:
        "Beauty Fit 9 si alte produse de ingrijire generala a corpului din catalogul Snep",
      bodyTheme:
        "Beauty Fit 9 este un exemplu de produs multifunctional din aceasta sectiune — ingrediente care actioneaza pe mai multe directii simultan. Pentru rezultate bune, combina cu rutina ta zilnica de dus si hidratare si aplica regulat, in zonele cu nevoi concrete.",
    }),

  "bio-molecule": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Bio Molecule",
      benefit:
        "Articole textile functionale Easeline — maiouri, leggings, pants si fete de perna cu tesatura speciala.",
      audience:
        "cei care cauta textile tehnice pentru confort si sanatate, la domiciliu sau in timpul odihnei",
      whatsInside:
        "Maiou femeie Easeline S, Fata de perna Easeline, Pants Easeline pentru barbati M, Pants Easeline femei S si Leggings Easeline XS",
      bodyTheme:
        "Gama Easeline (Bio Molecule) include articole textile tesute cu tehnologii speciale, concepute sa ofere confort pe termen lung. Fata de perna Easeline are impact asupra calitatii somnului, iar pantsii si leggingsii sunt pentru uz zilnic sau seara, acasa. O alegere neconventionala, dar apreciata de utilizatori fideli.",
    }),

  // ===== INGRIJIREA MEDIULUI =====
  hydropura: (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Hydropura",
      benefit:
        "Sisteme de filtrare a apei prin osmoza inversa si sticle speciale, pentru apa curata direct la robinet.",
      audience:
        "familiile care vor apa de calitate acasa, fara sticle de plastic si cu costuri mici pe termen lung",
      whatsInside:
        "kit Hydropura complet, filtru de inlocuire, sistem de filtrare prin osmoza inversa cu 5 ani garantie si sticle de sticla reutilizabile",
      bodyTheme:
        "Hydropura este o investitie logica: filtru de osmoza inversa cu 5 ani garantie, sticle de sticla elegante si refill-uri accesibile. Cantitatea de plastic redusa si calitatea apei imbunatatita fac sistemul atractiv pentru familii mai ales cu copii mici. Instalarea este simpla si suportul tehnic este disponibil prin olivox.ro.",
    }),

  "bio-effective": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "BioEffective",
      benefit:
        "Solutii probiotice pentru curatenie, gradina si compost — o alternativa mai prietenoasa pentru casa si mediu.",
      audience:
        "cei care vor sa reduca chimicalele din casa si sa sustina o gradina sanatoasa",
      whatsInside:
        "BioEffective Home pentru curatenie, Garden pentru plante, Compost pentru descompunere, pulverizatoare si pachete multiple",
      bodyTheme:
        "BioEffective Home inlocuieste detergentii agresivi cu microorganisme benefice care curata si mentin echilibrul suprafetelor. Garden ajuta plantele sa prospere, Compost accelereaza transformarea resturilor organice. Pulverizatoarele fac aplicarea usoara, iar pachetele de 5 buc sunt economice pentru utilizare constanta.",
    }),

  "parfumuri-de-camera": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Parfumuri de Camera",
      benefit:
        "Parfumuri de ambient italienesti pentru casa si spatii comerciale, cu betisoare din bambus si sticle elegante.",
      audience:
        "cei care vor sa aiba un miros placut si discret in casa, fara aerosoli artificiali",
      whatsInside:
        "Giardino di Boboli, Porto Azzurro, Prato Fiorito, Fiesole si alte parfumuri de camera Snep de 250ml, plus betisoare din bambus",
      bodyTheme:
        "Giardino di Boboli aduce note florale clasice italienesti, Porto Azzurro are un profil proaspat si marin, Prato Fiorito este o invitatie de primavara, iar Fiesole ofera o nota mai calda, lemnoasa. Betisoarele din bambus de 250ml difuzeaza parfumul lent, timp de saptamani intregi.",
    }),

  "parfum-de-camera": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Parfum de Camera",
      benefit:
        "Difuzoare cu betisoare din bambus si esente italienesti pentru o casa parfumata discret.",
      audience:
        "cei care prefera parfumurile de ambient fata de spray-uri sau lumanari",
      whatsInside:
        "flacoane de 250ml in diverse note (Giardino di Boboli, Porto Azzurro, Prato Fiorito, Fiesole) si betisoare din bambus",
      bodyTheme:
        "Alegerea unui parfum de camera tine de atmosfera pe care o vrei. Notele florale (Giardino di Boboli, Prato Fiorito) sunt potrivite pentru living si dormitor, cele marine (Porto Azzurro) aduc vigoare in birou sau baie, iar notele lemnoase (Fiesole) sunt ideale pentru seri linistite.",
    }),

  // ===== MISC =====
  "promotii-si-kit-uri": (cat, prods) =>
    genericBuilder(cat, prods, {
      h1: "Promotii si Kit-uri",
      benefit:
        "Kit-uri dedicate, merchandise Snep si oferte speciale — descopera cele mai avantajoase pachete din catalog.",
      audience:
        "cei care vor sa descopere mai multe produse Snep intr-un singur pachet si fanii brandului",
      whatsInside:
        "bratari Snep, SnepCard, abtibilduri, Magic Towel, tricouri Snep si kit-uri promotionale cu reducere",
      bodyTheme:
        "Sectiunea Promotii si Kit-uri este locul unde gasesti ofertele curente, merchandise-ul Snep si pachetele speciale. SnepCard aduce beneficii suplimentare, bratarile si tricourile sunt pentru fani, iar Magic Towel este un gadget practic. Pachetele se schimba periodic — verifica sectiunea pentru cele mai recente oferte.",
    }),
};

// ---------- run ----------
async function main() {
  const { data: cats, error } = await supabase
    .from("product_categories")
    .select("id,slug,name,parent_id,description,product_count")
    .order("sort_order");

  if (error) throw error;

  let updated = 0, skipped = 0, missingBuilder = 0, errors = 0;
  const skipList: string[] = [];
  const missingList: string[] = [];
  const errorList: string[] = [];

  for (const c of cats || []) {
    const cat = c as Cat;
    const existingLen = (cat.description || "").length;
    if (!FORCE && existingLen > 200) {
      skipped++;
      skipList.push(`${cat.slug} (${existingLen} chars)`);
      continue;
    }

    const builder = BUILDERS[cat.slug];
    if (!builder) {
      missingBuilder++;
      missingList.push(cat.slug);
      continue;
    }

    // pull up to 10 products for context
    const { data: prodsRaw } = await supabase
      .from("products")
      .select("name,slug,short_description")
      .contains("category_slugs", [cat.slug])
      .limit(10);
    const prods = (prodsRaw || []) as Product[];

    const content = builder(cat, prods);
    const fullDescription =
      content.lead + "\n" + content.body.join("\n");

    // sanity-check length bands (log warning only)
    const leadWords = stripHtml(content.lead).split(/\s+/).filter(Boolean).length;
    const totalWords = stripHtml(fullDescription).split(/\s+/).filter(Boolean).length;
    const bandOk = leadWords >= 60 && leadWords <= 170 && totalWords >= 280 && totalWords <= 600;
    if (!bandOk) {
      console.warn(`  ! ${cat.slug}: lead=${leadWords}w total=${totalWords}w`);
    }

    const { error: upErr } = await supabase
      .from("product_categories")
      .update({
        description: fullDescription,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
      })
      .eq("id", cat.id);

    if (upErr) {
      errors++;
      errorList.push(`${cat.slug}: ${upErr.message}`);
      console.error(`  x ${cat.slug}: ${upErr.message}`);
    } else {
      updated++;
      console.log(`  > ${cat.slug} (${prods.length} products, ${totalWords} words)`);
    }
  }

  console.log("\n=== Report ===");
  console.log(`Total categories: ${cats?.length ?? 0}`);
  console.log(`Updated:          ${updated}`);
  console.log(`Skipped:          ${skipped}`);
  console.log(`Missing builder:  ${missingBuilder}`);
  console.log(`Errors:           ${errors}`);
  if (skipList.length) console.log(`  Skipped: ${skipList.join(", ")}`);
  if (missingList.length) console.log(`  Missing builders for: ${missingList.join(", ")}`);
  if (errorList.length) console.log(`  Errors:\n   ${errorList.join("\n   ")}`);
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
