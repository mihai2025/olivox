/**
 * Olivox — upgrade category descriptions with rich semantic HTML structure.
 *
 * Replaces the legacy 4-paragraph description with:
 *   - <p class="lead">…</p>       60-120 word editorial intro (drop-cap)
 *   - <p>…</p>                    50-100 word context paragraph
 *   - <h2>Ce gasesti in aceasta categorie</h2>
 *   - <ul><li><strong>…</strong> — …</li> … </ul>
 *   - <h2>Cum alegi produsul potrivit</h2>
 *   - <p>…</p>                    80-150 word guidance
 *   - <h3>Produse semnature in aceasta categorie</h3>  (leaves only)
 *   - <p>…</p>                    signature products
 *   - <h3>Subcategorii</h3> + <ul>                     (parents only)
 *   - <h2>De ce Olivox</h2>
 *   - <p>…</p>                    closing 50-80 words
 *
 * Idempotent: skips categories whose current description already contains
 * both <h2> and <ul>, unless `--force` is passed.
 *
 * Usage:
 *   npx tsx scripts/upgrade-category-content.ts
 *   npx tsx scripts/upgrade-category-content.ts --force
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
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const FORCE = process.argv.includes("--force");

// ---------- types ----------
type Cat = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  description: string | null;
};
type Product = { name: string };

type Block = {
  lead: string; // editorial intro
  context: string; // 2nd paragraph: Snep benefit / positioning
  whatBullets: Array<{ tag: string; line: string }>; // "Ce gasesti"
  howToChoose: string; // "Cum alegi produsul potrivit"
  signature?: string; // optional (leaves only)
  closing: string; // "De ce Olivox"
};

const CLOSING_DEFAULT =
  "Olivox este distribuitorul oficial Snep pentru Romania, cu un catalog complet de suplimente, cosmetice si solutii pentru casa. Livrare in 3-5 zile lucratoare oriunde in tara, plata la livrare sau online, produse in ambalaje sigilate de producator si o echipa de suport care raspunde prompt la intrebarile tale despre ingrediente, utilizare sau comenzi mai mari. Alegi calitate italiana verificata, comanzi simplu, primesti rapid.";

// ---------- helpers ----------
function clean(name: string) {
  // Convert to Title Case-ish and keep it compact for inline use.
  const n = name.replace(/\s+/g, " ").trim();
  // Lowercase if entirely uppercase then Title Case per word.
  if (n === n.toUpperCase() && n.length > 4) {
    return n
      .toLowerCase()
      .split(" ")
      .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  }
  return n;
}

function stripDiacritics(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ĂăÂâÎîȘșȘșȚț]/g, (ch) => {
      const map: Record<string, string> = {
        Ă: "A", ă: "a", Â: "A", â: "a", Î: "I", î: "i",
        Ș: "S", ș: "s", Ț: "T", ț: "t",
      };
      return map[ch] || ch;
    });
}

function firstN(prods: Product[], n: number) {
  return prods.slice(0, n).map((p) => stripDiacritics(clean(p.name)));
}

function signatureLineFor(h1: string, names: string[]) {
  if (names.length === 0) return "";
  const top = names.slice(0, 4);
  const list = top
    .map((n) => `<strong>${n}</strong>`)
    .join(", ");
  return (
    `Printre reperele din ${h1.toLowerCase()} se numara ${list}. ` +
    `Sunt formule alese pentru consistenta rezultatelor, pentru ingredientele curate si pentru usurinta cu care se integreaza in rutina ta zilnica.`
  );
}

// ---------- builders: one spec per slug ----------
type Spec = {
  h1: string;
  lead: string;
  context: string;
  bullets: Array<{ tag: string; line: string }>;
  howToChoose: string;
  // if provided, overrides auto "signature" paragraph; return empty string to suppress.
  signatureOverride?: (prods: Product[]) => string;
};

const SPECS: Record<string, Spec> = {
  // ===================================================================
  // ROOTS — parents with subcategories, no direct products
  // ===================================================================
  nutritie: {
    h1: "Nutritie",
    lead:
      "Sectiunea Nutritie a olivox.ro aduna formulele Snep care sustin un ritm de viata echilibrat: suplimente, alimente functionale, programe dedicate si produse pentru controlul greutatii. Este un catalog construit in Italia, dupa standarde stricte de calitate, si gandit pentru adultii activi, pentru sportivi si pentru familiile care pun accent pe ingrediente curate si pe o alimentatie atenta. Gasesti aici atat multivitamine de uz zilnic, cat si extracte standardizate, Omega 3, proteine vegetale si kit-uri complete cu obiective clare. Fiecare produs are fise detaliate, mod de administrare si informatii despre origine — astfel incat alegerea sa ramana simpla.",
    context:
      "Snep dezvolta produsele in unitati certificate din Italia si lucreaza cu materii prime trasabile. Filosofia este una simpla: compozitii verificate, fara ingrediente inutile, cu focus pe absorbtie si pe usurinta in utilizare. Olivox aduce acest catalog in Romania prin canal oficial, cu stoc intretinut si suport pentru alegerea corecta a formulei.",
    bullets: [
      { tag: "Suplimente alimentare", line: "vitamine, minerale, extracte din plante, Omega 3 si ciuperci medicinale pentru uz zilnic." },
      { tag: "Alimente functionale", line: "cafea cu ganoderma, ciocolate Choco, ceaiuri si batoane proteice cu profil nutritional atent." },
      { tag: "Programe nutritionale", line: "kit-uri pe obiectiv — detoxifiere, energie, slabit, introducere in universul Snep." },
      { tag: "Controlul greutatii", line: "batoane, shake-uri si snack-uri care inlocuiesc mesele fara sa compromita gustul." },
    ],
    howToChoose:
      "Porneste de la nevoia concreta: vrei mai multa energie in zilele solicitante, suport pentru imunitate, o digestie mai echilibrata sau vrei sa pierzi cateva kilograme fara diete severe. Daca vrei ceva de uz zilnic, alege un multivitaminic din Linia Real sau o formula Omega. Pentru un obiectiv de cateva saptamani, programele complete (Real Detox, Kit Kalo Sprint, Program Strong) sunt varianta simpla. Cei care prefera gustarile functionale pot incepe cu cafeaua cu ganoderma sau cu batoanele Protine si Snack Plus. Citeste lista de ingrediente si modul de administrare inainte de comanda — si, daca ai dubii, echipa olivox.ro iti raspunde in cateva ore.",
    signatureOverride: () => "", // root — skip signature
  },

  "ingrijire-personala": {
    h1: "Ingrijire Personala",
    lead:
      "Ingrijirea personala Snep reuneste liniile cosmetice italienesti pe care le gasesti pe olivox.ro: Beauty Snep, NAT, SnepLumax, Reinature, OIL, protectie solara, ingrijire par, make-up si parfumuri inspirate. Sunt produse formulate in Italia, cu extracte naturale si active cosmetice moderne, destinate celor care construiesc ritualuri simple, dar atent alese. Gasesti solutii pentru toate tipurile de ten, rutine complete pentru par, uleiuri pentru corp, SPF-uri de zi si variante premium pentru ingrijire avansata. Accent pe textura placuta, pe ingrediente trasabile si pe compatibilitate cu pielea sensibila.",
    context:
      "Diferenta Snep este data de atentia la detaliu: formule testate, mirosuri discrete, ambalaje ergonomice si preturi care fac experimentarea usoara. Olivox aduce intreg catalogul prin canal oficial, cu termene de valabilitate clare si cu suport pentru recomandari personalizate. Indiferent daca esti la prima rutina sau ai deja produse preferate, gasesti aici variante consistente.",
    bullets: [
      { tag: "Ingrijire fata", line: "Reinature, SnepLumax si Dream Vision pentru curatare, tratament si hidratare." },
      { tag: "Ingrijire par", line: "sampoane, masti si kit-uri anti-cadere Trico-Salus si Sneplumina." },
      { tag: "Corp si protectie solara", line: "geluri de dus, Master, Fanpaste si gama SPF Tanning Pro pentru vara." },
      { tag: "Make-up si parfumuri", line: "Matt Lip, Cover 5K, Matt Shadow si parfumurile inspirate 101 si 201." },
    ],
    howToChoose:
      "Cel mai util punct de plecare este tipul de ten si rutina actuala. Pentru un ten mixt sau gras, combina un ser usor (Reinature Drop) cu o crema matifianta. Pentru piele matura, SnepLumax Serum si Dream Vision ofera concentratie mai mare de active. Pentru par, incepe cu un sampon potrivit tipului tau (Snep Ice pentru blond, Trico-Salus pentru cadere) si adauga o masca saptamanala. Pentru corp, Muscolease si Exvasi sunt alegeri logice daca ai sporturi intense, in timp ce Mandorle Dolci se foloseste zilnic. In sezonul cald, SPF-ul este obligatoriu — alege Stick SPF 50+ pentru zone sensibile si spray pentru zi.",
    signatureOverride: () => "",
  },

  "ingrijirea-mediului": {
    h1: "Ingrijirea Mediului",
    lead:
      "Ingrijirea mediului Snep este despre cum arata casa, aerul si apa cu care intri in contact zilnic. Catalogul olivox.ro pentru aceasta zona include sistemul de filtrare Hydropura, solutiile probiotice BioEffective pentru curatenie, gradina si compost, plus parfumurile de camera italienesti in flacoane de 250ml cu betisoare din bambus. Sunt alegeri bune pentru familiile cu copii, pentru cei sensibili la mirosuri puternice si pentru oricine doreste o casa mai curata, cu mai putin plastic si mai putina chimie agresiva.",
    context:
      "Filosofia Snep pentru aceasta categorie este una practica: produse reutilizabile (sticle de sticla, pulverizatoare), formule probiotice care inlocuiesc detergentii agresivi si parfumuri de ambient cu difuzare lenta, fara aerosoli. Olivox livreaza intreg catalogul prin canal oficial si ofera suport pentru instalarea sistemului Hydropura.",
    bullets: [
      { tag: "Filtrare apa Hydropura", line: "osmoza inversa cu 5 ani garantie, sticle de sticla reutilizabile si filtre de schimb." },
      { tag: "BioEffective", line: "solutii probiotice pentru curatenie, gradina si compost, cu pulverizatoare practice." },
      { tag: "Parfumuri de camera", line: "Giardino di Boboli, Porto Azzurro, Prato Fiorito, Fiesole si alte note italienesti." },
      { tag: "Accesorii casa", line: "pulverizatoare, betisoare din bambus si refill-uri care reduc risipa." },
    ],
    howToChoose:
      "Daca apa de la robinet este o preocupare (gust, calcar, microplastice), Hydropura este investitia cu impact imediat — sistem complet cu filtru principal si sticla de sticla. Daca vrei sa reduci detergentii agresivi, BioEffective Home acopera curatenia generala, Garden ajuta plantele, iar Compost accelereaza reciclarea organica. Pentru ambient, alege parfumul in functie de camera: floral (Giardino di Boboli) in living, marin (Porto Azzurro) in baie, lemnos (Fiesole) in dormitor. Betisoarele de bambus dureaza saptamani intregi si nu necesita priza.",
    signatureOverride: () => "",
  },

  // ===================================================================
  // NUTRITIE — subcategories (some parents, some leaves)
  // ===================================================================
  "suplimente-alimentare": {
    h1: "Suplimente Alimentare",
    lead:
      "Suplimentele alimentare Snep distribuite prin olivox.ro acopera nevoile zilnice ale unui adult activ: vitamine, minerale, Omega 3, extracte din plante, ciuperci medicinale si formule dedicate unor nevoi specifice. Sunt produse formulate in Italia, cu materii prime trasabile si cu instructiuni clare de administrare. Gama este organizata pe subcategorii — Linia Real pentru multivitamine de familie, PUR pentru extracte pure, Omega si Perle pentru acizi grasi, Nevoi Specifice pentru situatii concrete — astfel incat sa gasesti rapid formula potrivita obiectivului tau.",
    context:
      "Ce diferentiaza catalogul Snep este combinatia dintre ingrediente standardizate si formule simple, bine dozate. Nu gasesti adaosuri inutile, iar etichetele explica clar ce faci si cand. Olivox aduce intreaga gama prin canal oficial, cu termene de valabilitate corecte si stoc permanent pentru cele mai cautate referinte.",
    bullets: [
      { tag: "Linia Real", line: "RealVita, RealComplex, RealFibre si RealVita Kids — multivitamine si fibre pentru uz zilnic." },
      { tag: "Linia PUR", line: "Maca, Reishi, Shiitake, Quercetina Max si Moringa — extracte pure, monodoza." },
      { tag: "Omega si Perle", line: "Omega 3, Omega Tris, Snep Krill si Cuore di Grano pentru acizi grasi esentiali." },
      { tag: "Aloe si Uleiuri esentiale", line: "Aloe Drink, Aloe 100 Bio si uleiuri pure de lavanda, rozmarin, menta, lamaie." },
    ],
    howToChoose:
      "Porneste de la obiectiv: energie zilnica si aport nutritional general (alege din Linia Real), imunitate si vitalitate (Reishi, Shiitake, Vitamina C, Quercetina Max), sanatate cardiovasculara si cognitiva (Omega 3, Omega Tris, Snep Krill), echilibru emotional si somn (Olimind, AM & PM), digestie (RealFibre, Aloe Drink). Pentru inceput, un multivitaminic si un Omega 3 acopera baza. Adauga tintit in functie de situatia ta: sport intens, perioada solicitanta, convalescenta, sezon rece. Respecta dozajele de pe eticheta si, daca urmezi tratamente, cere sfatul medicului inainte de a adauga suplimente noi.",
  },

  "alimente-functionale": {
    h1: "Alimente Functionale",
    lead:
      "Alimentele functionale Snep aduc gustul bun si beneficiul simultan: cafea italieneasca cu extract de ganoderma, ceaiuri echilibrate, ciocolate Choco cu profil mai prietenos, batoane proteice si snack-uri cu cereale, produse pentru sportivi si accesorii pentru servire. Catalogul disponibil pe olivox.ro este gandit pentru cei care nu vor sa renunte la pauza de cafea, la ciocolata sau la ceaiul de seara, dar cauta variante cu ingrediente curate si cu informatie nutritionala clara pe ambalaj.",
    context:
      "Snep combina traditia italiana a cafelei cu extracte orientale apreciate (ganoderma, oleuropeina) si cu formule moderne pentru nutritie sportiva. Fiecare produs are un scop clar — energie, concentrare, recuperare, placere — si este fabricat in unitati certificate. Olivox livreaza intreg catalogul cu stoc permanent si reaprovizionari rapide.",
    bullets: [
      { tag: "Cafea cu ganoderma", line: "capsule compatibile Nespresso si Lavazza Point, Mokaccino, Cappuccino solubil si kit-uri promo." },
      { tag: "Ceaiuri si Choco", line: "The Mix, The Peach, Snep Choco Moon, Choco Block si Choco Cup." },
      { tag: "Sport si recuperare", line: "Energy Boost, Upgrate, Creatina, Brain, Protein Bar si Kit Sport for All." },
      { tag: "Snack-uri", line: "Protine in variante sarate, Snack Plus cu cereale si gustari Pauze Dulci." },
    ],
    howToChoose:
      "Pentru rutina de dimineata, cafeaua cu ganoderma in capsule este inlocuirea cea mai usoara — pastrezi aparatul si obiceiul, schimbi doar capsula. Daca faci sport, Energy Boost sau Upgrate inainte de antrenament si Protein Bar dupa sunt combinatii eficiente. Pentru pauze de lucru sau deplasari, Protine si Snack Plus sunt gustarile compacte potrivite. In locul ciocolatei clasice, Choco Moon si Choco Cup ofera experienta dulce cu profil nutritional mai atent. Seara, un The Peach sau o ciocolata Choco Block calmeaza pofta fara cafeina. Verifica etichetele pentru alergeni si pentru aportul caloric, in functie de obiectivul tau.",
  },

  "controlul-greutatii": {
    h1: "Controlul Greutatii",
    lead:
      "Controlul greutatii cu Snep nu inseamna diete agresive, ci inlocuirea inteligenta a unora dintre mesele zilei cu produse cu profil nutritional atent: batoane, shake-uri vegane, snack-uri Crockis si plicuri Plus. Catalogul disponibil pe olivox.ro este gandit pentru cei care vor sa mentina sau sa reduca greutatea fara sa piarda gustul si fara a se simti flamanzi intre mese. Fiecare produs este fabricat in Italia, cu ingrediente clar listate si cu informatii nutritionale complete pe ambalaj.",
    context:
      "Logica Snep pentru aceasta categorie este simpla: mese de inlocuire satioase, cu aport proteic bun si cu arome placute, care se integreaza usor in ritmul zilnic. Nu gasesti formule miraculoase — gasesti instrumente consistente pentru un plan pe care il decizi tu, cu sprijinul echipei olivox.ro daca ai nevoie.",
    bullets: [
      { tag: "Batoane", line: "cocos si ciocolata, alune de padure, banana, crema si biscuit — gustari compacte pentru traseu." },
      { tag: "Shake-uri Plus", line: "Plus Cacao si Capsuni Vegan, Plus Vegan Cacao, Plus Cappuccino — pentru inlocuirea mesei." },
      { tag: "Snack-uri", line: "Crockis pentru pofta de ceva crocant, cu profil caloric controlat." },
      { tag: "Plicuri portionate", line: "Plus Vegan Cacao 30 plicuri — cantitati fixe, ideale pentru a nu depasi portia." },
    ],
    howToChoose:
      "Foloseste shake-urile Plus ca inlocuire pentru masa de pranz sau cina, cand stii ca nu ai timp sa gatesti. Batoanele sunt mai potrivite ca gustare de dupa-amiaza, cand foamea apare intre mese si tendinta este sa cumperi ceva necontrolat. Crockis functioneaza ca alternativa la chipsuri, iar plicurile monodoza ajuta daca tinzi sa depasesti portia. Pentru rezultate, planifica o saptamana cu doua shake-uri pe zi maximum si o masa solida echilibrata; combina cu miscare regulata si hidratare. Daca ai afectiuni cronice sau urmezi tratamente, discuta cu medicul inainte de a reduce aportul caloric.",
  },

  programe: {
    h1: "Programe Nutritionale",
    lead:
      "Programele nutritionale Snep sunt kit-uri gandite pentru obiective clare, cu durata definita si cu instructiuni explicite. Pe olivox.ro gasesti Real Detox pentru curatare digestiva, Starting Point ca introducere in catalogul Snep, Program Strong si Extra Strong pentru obiective mai ambitioase, Kit Kalo Sprint pentru controlul rapid al greutatii si mai multe variante Fit9 cu shake-uri vegane si Aloe. Fiecare pachet vine cu produsele necesare si cu un plan simplu — nu trebuie sa construiesti singur combinatia.",
    context:
      "Avantajul unui program este ca elimina decizia zilnica: stii exact ce consumi, cand si de ce. Snep a dezvoltat aceste kit-uri pornind de la feedback-ul clientilor, iar olivox.ro le livreaza complete, cu toate referintele in acelasi colet.",
    bullets: [
      { tag: "Real Detox", line: "program de detoxifiere cu Aloe, fibre si plante pentru reset digestiv." },
      { tag: "Starting Point", line: "kit de intrare in universul Snep — multivitamine, Omega si fibre." },
      { tag: "Program Strong / Extra Strong", line: "pachete pentru energie, performanta si sprijin nutritional intens." },
      { tag: "Kit Kalo Sprint si Fit9", line: "pentru controlul greutatii in cateva saptamani, cu shake-uri Plus si Aloe." },
    ],
    howToChoose:
      "Intreaba-te ce vrei sa rezolvi in urmatoarele 2-6 saptamani. Daca revii din sarbatori sau dupa o perioada dezechilibrata, Real Detox este alegerea naturala. Daca e prima ta expunere la suplimentatie Snep, Starting Point iti arata rapid ce functioneaza pentru tine. Daca ai un obiectiv de slabit clar si vrei rezultate intr-un interval scurt, Kit Kalo Sprint sau Fit9 Detox Vegan Cacao + Aloe Piersica sunt optiunile directe. Pentru performanta sportiva sustinuta, Program Strong sau Extra Strong ofera combinatia de energie, recuperare si vitaminizare. Respecta duratele si pauzele indicate in instructiuni — kit-urile sunt gandite sa fie ciclate, nu folosite permanent.",
  },

  suplimente: {
    h1: "Suplimente",
    lead:
      "Sectiunea Suplimente a olivox.ro reuneste formulele Snep care nu se incadreaza strict intr-o subcategorie clasica si care aduc combinatii mai putin obisnuite de ingrediente. Aici gasesti produse hibride, de la VENERE cu ingrediente pentru echilibru si vitalitate pana la ECDEFENSE pentru sprijin specific in perioade solicitante. Sunt formule italienesti, cu etichete clare si cu un rol bine definit, potrivite pentru adultii care au deja experienta cu suplimentatia si cauta solutii peste multivitaminele clasice.",
    context:
      "Abordarea Snep pentru aceasta categorie este una de precizie: produse cu scop concret, compozitii unice si dozaje gandite pe efect. Olivox aduce toate referintele prin canal oficial si poate oferi informatii suplimentare despre diferentele dintre produse si alternativele din Linia Real sau PUR.",
    bullets: [
      { tag: "VENERE", line: "formula dedicata sustinerii echilibrului si vitalitatii, cu ingrediente combinate atent." },
      { tag: "ECDEFENSE", line: "sprijin pentru sistemul imunitar in perioadele solicitante sau sezoniere." },
      { tag: "Formule complexe", line: "combinatii care acopera mai multe directii simultan, fara sa necesite multiple produse." },
      { tag: "Referinte de specialitate", line: "produse pentru nevoi concrete, bine descrise pe etichete." },
    ],
    howToChoose:
      "Citeste intai descrierea produsului si lista de ingrediente. Daca formula deja acopera o nevoie specifica pe care ai abordat-o pana acum cu doua-trei produse diferite, suplimentul hibrid poate simplifica rutina. Daca esti nou in suplimentatie, iti recomandam sa incepi cu un multivitaminic din Linia Real si un Omega 3 inainte de a adauga combinatii mai complexe. Pentru situatii punctuale — imunitate in sezonul rece, perioade stresante, convalescenta — ECDEFENSE si VENERE sunt punctele de plecare. Administreaza conform etichetei si, daca esti sub tratament, discuta cu medicul.",
  },

  aloe: {
    h1: "Aloe",
    lead:
      "Aloe Vera este unul dintre cele mai apreciate ingrediente din intreg catalogul Snep, iar aceasta categorie de pe olivox.ro reuneste toate variantele: drink-uri cu fructe, concentrate pure certificate bio si combinatii cu glucozamina pentru sustinerea articulatiilor. Sunt produse italienesti obtinute din frunze de Aloe Vera cultivate controlat, cu procesare atenta pentru pastrarea intrega a fitocomplexului. Potrivite ca adaos zilnic in rutina oricui vrea hidratare, sprijin digestiv si o sursa buna de antioxidanti naturali.",
    context:
      "Snep lucreaza cu Aloe Vera selectata, iar versiunea 100 Bio este certificata organic. Drink-urile sunt aromatizate cu fructe reale si au concentratii bine calibrate pentru consum zilnic, iar combinatiile functionale aduc beneficii suplimentare fara aditivi inutili.",
    bullets: [
      { tag: "Aloe Drink 7 Fructe", line: "drink aromat cu 7 fructe, potrivit pentru consum zilnic; disponibil si la 6 sticle." },
      { tag: "Aloe & Piersica Drink", line: "varianta cu nota dulce de piersica italiana, pentru cei care prefera un gust mai rotund." },
      { tag: "Aloe 100 Bio", line: "concentrat pur certificat bio, pentru cei care vor intensitate maxima." },
      { tag: "Aloe + Glucozamina", line: "formula combinata pentru sustinerea articulatiilor si a mobilitatii." },
    ],
    howToChoose:
      "Daca integrezi aloe in rutina zilnica pentru hidratare si confort digestiv, Aloe Drink 7 Fructe sau Aloe & Piersica sunt cele mai usor de consumat — gust placut, volum suficient pentru o luna. Pentru cure scurte si concentrate, Aloe 100 Bio ofera un nivel mai ridicat de activi si certificarea bio. Daca ai disconfort articular sau faci efort fizic regulat, Aloe + Glucozamina este un sprijin consistent. Cantitatea recomandata este de obicei o portie pe zi, dimineata, inainte de masa, iar efectul se construieste in timp, cu utilizare consecventa timp de cel putin 3-4 saptamani.",
  },

  "uleiuri-esentiale": {
    h1: "Uleiuri Esentiale",
    lead:
      "Uleiurile esentiale Snep sunt pure, obtinute prin distilare sau presare la rece din plante aromatice selectate — lavanda Monte Bianco, rozmarin, menta, lamaie, salvie, origan, mirt, mandarin, arbore de ceai, portocala amara. Catalogul disponibil pe olivox.ro acopera aromaterapia, masajul, ingrijirea pielii si parfumarea naturala a casei. Fiecare flacon pastreaza profilul aromatic intact si poate fi folosit in difuzor, diluat in ulei de baza sau adaugat in produse de curatare naturala.",
    context:
      "Calitatea unui ulei esential se simte imediat — intensitatea mirosului, claritatea notei de varf, absenta notelor sintetice. Snep selecteaza culturi controlate si metode de extractie care pastreaza compozitia chimica a plantei. Olivox aduce intreaga gama in flacoane sigilate, cu informatii clare despre origine si utilizari.",
    bullets: [
      { tag: "Florale si relaxante", line: "Monte Bianco Lavender pentru somn si calm, Mirt pentru echilibru." },
      { tag: "Citrice si tonifiante", line: "Lamaie, Mandarin, Portocala Amara — note proaspete pentru energie." },
      { tag: "Aromatice si purificatoare", line: "Rozmarin, Menta, Salvie, Origan — concentrare, respiratie, curatenie." },
      { tag: "Special", line: "Arbor de Ceai pentru ingrijirea pielii si igiena naturala." },
    ],
    howToChoose:
      "Alege dupa efectul dorit: lavanda pentru seara si somn, menta si lamaie pentru dimineata si concentrare, rozmarin pentru studiu sau munca, arbore de ceai pentru ingrijirea punctuala a pielii. Pentru difuzor, 5-8 picaturi la 100ml apa sunt suficiente. Pentru masaj, diluaza 2-3 picaturi in 10ml ulei de baza (Mandorle Dolci este o alegere excelenta). Nu aplica niciodata uleiuri esentiale direct pe piele nediluate si evita contactul cu ochii. La copii mici si in sarcina, consulta un specialist inainte de utilizare.",
  },

  pur: {
    h1: "Linia PUR",
    lead:
      "Linia PUR de la Snep este varianta minimalista si concentrata din catalogul de suplimente: extracte pure de Maca, Reishi, Shiitake, Maitake, Agaricus, Moringa, Quercetina si Vitamina C, in capsule sau plicuri monodoza. Fiecare produs contine un singur ingredient principal, standardizat, fara amestecuri inutile. Disponibila pe olivox.ro pentru cei care stiu exact ce cauta si prefera sa isi construiasca singuri combinatia potrivita, in functie de obiectivul zilei sau al perioadei.",
    context:
      "Filosofia PUR este simpla: un ingredient, o forma, o doza. Snep lucreaza cu extracte titrate, din culturi controlate, iar calitatea materiei prime face diferenta in aceste formule unde nu exista alte elemente care sa mascheze o sursa mediocra. Olivox aduce gama completa, cu stoc mentinut pentru cele mai cautate referinte (Reishi, Maca, Quercetina).",
    bullets: [
      { tag: "Ciuperci medicinale", line: "Reishi 90 Capsule, Shiitake, Maitake, Agaricus — traditia orientala pentru imunitate." },
      { tag: "Adaptogene si plante", line: "Maca pentru energie si rezistenta, Moringa bogata in nutrienti." },
      { tag: "Antioxidanti", line: "Quercetina Max si Vitamina C — suport pentru stresul oxidativ." },
      { tag: "Forme simple", line: "capsule standardizate, pudra liofilizata, fara umpluturi inutile." },
    ],
    howToChoose:
      "Pentru imunitate si sustinere generala, Reishi 90 Capsule este punctul de plecare clasic — se poate lua continuu, cu pauze periodice. Daca ai nevoie de energie si rezistenta fizica sustinuta, Maca este alegerea logica. Pentru perioade de stres oxidativ (sport intens, poluare, sezon rece), combina Quercetina Max cu Vitamina C. Moringa si Agaricus sunt optiuni mai specifice, recomandate celor cu experienta in suplimentatie sau dupa consultarea unui specialist. Respecta dozajele de pe eticheta — extractele PUR sunt concentrate si nu necesita cantitati mari pentru efect.",
  },

  "omega-si-perle": {
    h1: "Omega si Perle",
    lead:
      "Omega si Perle este categoria Snep dedicata acizilor grasi esentiali si formulelor asociate — Omega 3, Omega Tris, Snep Krill si Cuore di Grano. Sunt produse fabricate in Italia, cu ulei de peste purificat sau cu ulei de krill cu fosfolipide pentru absorbtie superioara, plus combinatii care adauga antioxidanti vegetali pentru sanatatea cardiovasculara. Disponibile pe olivox.ro pentru adultii care vor sa-si completeze aportul de grasimi bune, in special pentru cei cu diete sarace in peste sau cu nevoi crescute in perioade active.",
    context:
      "Diferenta o face calitatea sursei: Omega 3-ul Snep este purificat pentru a elimina metalele grele, iar Krill-ul aduce forma fosfolipidica apreciata pentru absorbtie directa. Cuore di Grano combina Omega cu elemente vegetale, oferind o formula completa intr-un singur produs. Olivox livreaza toate variantele cu stoc regulat si termene de valabilitate ample.",
    bullets: [
      { tag: "Omega 3", line: "formula clasica purificata, cu EPA si DHA pentru sustinerea cardiovasculara." },
      { tag: "Omega Tris", line: "varianta combinata, cu raport optim intre acizii grasi esentiali." },
      { tag: "Snep Krill", line: "ulei de krill cu fosfolipide, pentru absorbtie si biodisponibilitate mai mare." },
      { tag: "Cuore di Grano", line: "Omega plus antioxidanti vegetali — sustinere cardiovasculara completa." },
    ],
    howToChoose:
      "Daca mananci peste de 2-3 ori pe saptamana, o suplimentare de intretinere cu Omega 3 clasic este suficienta. Daca ai o dieta saraca in peste sau faci sport intens, Omega Tris ofera un profil mai bogat. Pentru absorbtie maxima si pentru cei cu probleme digestive legate de uleiul de peste, Snep Krill este alternativa eleganta — doza mai mica, efect comparabil. Cuore di Grano este ales pentru beneficii cardiovasculare combinate, cand vrei un singur produs care sa bifeze mai multe directii. Administreaza constant, cel putin 8-12 saptamani, si pastreaza capsulele la loc racoros, ferit de lumina directa.",
  },

  "nevoi-specifice": {
    h1: "Nevoi Specifice",
    lead:
      "Nevoi Specifice este categoria Snep dedicata formulelor care raspund unor situatii concrete: ritm circadian dezechilibrat, echilibru emotional, confort digestiv, sprijin imunitar, sustinere in perioade solicitante. Pe olivox.ro gasesti AM & PM pentru dimineata si seara, Olimind pentru calm si concentrare, Superelease si Ergovir pentru situatii de stres fizic sau sezonier, Kalosnep si Collagen pentru ingrijire specifica, plus alte formule cu scop bine definit.",
    context:
      "Avantajul acestei sectiuni este ca nu te pune sa cauti printre zeci de produse — fiecare referinta aici tinteste o situatie clara, cu indicatii si dozaje concrete. Snep testeaza aceste formule si olivox.ro le aduce in stoc permanent pentru cei care le integreaza in rutina periodic.",
    bullets: [
      { tag: "Ritm si echilibru", line: "AM & PM pentru energie dimineata si relaxare seara, Olimind pentru calm mental." },
      { tag: "Imunitate si rezistenta", line: "Ergovir si Superelease pentru perioade solicitante si sezon rece." },
      { tag: "Ingrijire specifica", line: "Collagen, Vegan Collagen, Q10 - Snep 200 si Vinci pentru piele si vitalitate." },
      { tag: "Formule unice", line: "Kalosnep Capsule, Morinda Piu si alte produse dedicate nevoilor clar definite." },
    ],
    howToChoose:
      "Identifica intai situatia pe care vrei sa o abordezi: dormi prost sau te trezesti obosit (AM & PM, Olimind), ai perioade agitate sau lucrezi sub presiune (Olimind), imunitatea scade in anotimpul rece (Ergovir, Superelease), vrei sa sustii pielea si parul (Collagen, Vegan Collagen), ai nevoie de antioxidanti in sport intens (Q10 - Snep 200). Fiecare produs are indicatii precise pe eticheta si durata recomandata. Aceste formule se iau de obicei in cure de 4-8 saptamani, cu pauze, nu permanent. Daca urmezi alte tratamente, consulta medicul inainte de a le adauga.",
  },

  "linia-real": {
    h1: "Linia REAL",
    lead:
      "Linia REAL este coloana vertebrala a suplimentatiei Snep — multivitamine, complexe de minerale si fibre pentru uz zilnic al intregii familii. Pe olivox.ro gasesti RealVita in comprimate si varianta lichida, RealComplex pentru un profil mai bogat de vitamine B si minerale, RealFibre in plicuri si comprimate pentru digestie, RealVita Kids pentru copii, plus Vitup pentru energie rapida. Sunt produse gandite sa completeze o alimentatie variata si sa simplifice rutina zilnica.",
    context:
      "Ce face REAL diferita este accesibilitatea — dozaje moderate, forme usor de administrat, arome placute la variantele lichide. Snep o pozitioneaza ca linia de intretinere, potrivita pentru cei care nu au nevoi speciale si vor sa asigure baza. Olivox pastreaza stoc permanent pentru RealVita, RealComplex si RealFibre — cele mai cautate referinte.",
    bullets: [
      { tag: "RealVita", line: "multivitaminic clasic in comprimate sau solutie, pentru aport nutritional zilnic." },
      { tag: "RealComplex", line: "vitamine si minerale mai bogat dozate, cu accent pe complexul B." },
      { tag: "RealFibre", line: "fibre pentru sustinerea digestiei, in plicuri sau comprimate." },
      { tag: "RealVita Kids si Vitup", line: "variante pentru copii si formula de energie rapida pentru adulti." },
    ],
    howToChoose:
      "Pentru adultii cu ritm normal, RealVita in comprimate sau solutie este alegerea simpla — o doza pe zi, dimineata, cu micul dejun. Daca urmezi diete mai restrictive, faci sport intens sau ai perioade solicitante, RealComplex acopera mai bine nevoile. RealFibre este util daca tranzitul intestinal nu este regulat sau daca dieta este saraca in legume si cereale integrale. Pentru copii, RealVita Kids este formulat special, cu arome si dozaje adaptate. Vitup ofera un boost scurt de energie, potrivit in zilele aglomerate. Administreaza constant pentru efect, iar dupa 2-3 luni ia o pauza de o saptamana.",
  },

  "necesitatile-energetice": {
    h1: "Necesitatile Energetice",
    lead:
      "Necesitatile Energetice este categoria Snep pentru momente care cer performanta: antrenament, studiu intens, zile lungi la birou, calatorii pe distante mari. Pe olivox.ro gasesti Total Energy Drink pentru un boost rapid lichid, Total Energy Capsule pentru varianta portabila, BCAA Amino Acid pentru recuperare musculara si Tribux Blue pentru un profil functional complet. Sunt produse italienesti cu ingrediente curate, fara zahar adaugat in exces si fara aditivi inutili.",
    context:
      "Logica aici este simpla: ai nevoie de energie cand o ceri, nu tot timpul. Snep dezvolta formule care actioneaza rapid, se metabolizeaza curat si nu lasa acel \"caderea\" tipica energizantelor comerciale. Olivox aduce toata gama in stoc permanent pentru sportivi si profesionisti.",
    bullets: [
      { tag: "Total Energy Drink", line: "boost lichid rapid, ideal inainte de antrenament sau de o sedinta lunga." },
      { tag: "Total Energy Capsule", line: "varianta practica pentru drumeti, calatori si cei fara acces la bucatarie." },
      { tag: "BCAA Amino Acid", line: "aminoacizi ramificati pentru recuperare musculara dupa antrenament intens." },
      { tag: "Tribux Blue", line: "formula complexa cu profil functional, pentru cei care cauta energie sustinuta." },
    ],
    howToChoose:
      "Pentru antrenament scurt si intens (60-90 min), Total Energy Drink cu 20-30 min inainte este combinatia clasica. Daca sesiunea e mai lunga sau e sport de rezistenta, Tribux Blue ofera sustinere mai durabila. Pentru zile aglomerate fara sport, Total Energy Capsule e mai practica — o iei din buzunar si bei cu apa. BCAA Amino Acid e pentru dupa efort, cand recuperarea este prioritara. Nu depasi dozele recomandate si hidrateaza-te suplimentar. Daca ai probleme cardiovasculare sau esti sensibil la cofeina, consulta medicul inainte de folosire.",
  },

  proteina: {
    h1: "Proteine Vegane",
    lead:
      "Proteinele vegane Snep sunt formulate din lupin si orez, doua surse vegetale care, combinate, ofera un profil aminoacid complet — apropiat de cel al proteinei din zer, dar fara lactate si fara ingrediente de origine animala. Pe olivox.ro gasesti Vegan Lupine Protein cu aroma de portocale si zmeura pentru varianta fructata si Cacao Protein de Rice si Lupine Vegan pentru cei care prefera nota de cacao. Sunt potrivite pentru sportivi, vegetarieni, persoane cu intoleranta la lactate si oricine vrea un aport proteic curat.",
    context:
      "Combinatia lupin-orez este apreciata pentru digestibilitate, continut proteic ridicat si profil complet de aminoacizi esentiali. Snep foloseste surse selectate si arome naturale, fara indulcitori artificiali agresivi. Olivox livreaza ambele variante cu termene de valabilitate ample.",
    bullets: [
      { tag: "Vegan Lupine Protein Orange & Raspberry", line: "profil fructat, ideal post-antrenament, cu aroma proaspata." },
      { tag: "Cacao Protein Rice & Lupine Vegan", line: "varianta cu cacao, pentru dimineti sau smoothie-uri consistente." },
      { tag: "Profil complet", line: "aminoacizi esentiali din doua surse vegetale complementare." },
      { tag: "Fara lactate si fara gluten", line: "potrivit pentru dietele restrictive si alergici." },
    ],
    howToChoose:
      "Pentru imediat dupa antrenament, varianta Orange & Raspberry se absoarbe rapid si are un gust racoritor care merge cu apa rece sau cu lapte vegetal. Varianta Cacao e mai consistenta si se potriveste dimineata, in terci de ovaz, smoothie cu banana sau amestec cu lapte vegetal. Doza standard este de 25-30g de pudra, o portie pe zi pentru adulti cu nivel moderat de activitate; 2 portii daca antrenamentele sunt intense. Depoziteaza intr-un loc racoros, uscat, si foloseste doza incorporata in ambalaj pentru portionare corecta.",
  },

  // ===================================================================
  // ALIMENTE FUNCTIONALE — leaves
  // ===================================================================
  cafea: {
    h1: "Cafea cu Ganoderma",
    lead:
      "Cafeaua cu ganoderma Snep este combinatia dintre traditia italiana a espresso-ului si extractul de ganoderma (Reishi), ciuperca apreciata in medicina orientala pentru sustinerea vitalitatii. Pe olivox.ro gasesti capsule compatibile cu Nespresso si Lavazza Point, pod-uri ESE 44 cu oleuropeina, variante solubile precum Mokaccino si Cappuccino, plus kit-uri promo care includ aparatul espresso. Este modalitatea cea mai simpla de a adauga un plus functional in rutina de dimineata fara a schimba obiceiurile.",
    context:
      "Snep selecteaza boabele de cafea pentru aroma rotunda si le combina cu extract de ganoderma dozat atent, astfel incat gustul sa ramana cel asteptat, cu o nota discreta suplimentara. Olivox pastreaza stoc permanent pentru variantele Nespresso si Lavazza Point — cele mai cautate — si aduce reaprovizionari rapide pentru pod-urile cu oleuropeina.",
    bullets: [
      { tag: "Capsule compatibile Nespresso", line: "cea mai populara varianta, pentru aparatele de casa si birou." },
      { tag: "Capsule compatibile Lavazza Point", line: "pentru sistemele Lavazza din cafenele si birouri." },
      { tag: "Variante solubile", line: "Mokaccino, Soluble Cappuccino, Cafea solubila speciala — rapide, fara aparat." },
      { tag: "Cafea cu oleuropeina", line: "pod ESE 44 si capsule Nespresso cu extract de oleuropeina din masline." },
    ],
    howToChoose:
      "Daca ai deja un espressor Nespresso, capsulele compatibile sunt schimbarea zero — aceeasi experienta, plus ganoderma. Pentru birouri sau pauze de masa, pod-urile ESE 44 cu oleuropeina sunt o alternativa interesanta, cu profil antioxidant din extractul de masline. Variantele solubile (Mokaccino, Soluble Cappuccino) sunt pentru calatorii, hotel, birou fara aparat — turnezi, amesteci, bei. Daca nu ai inca un espressor, kit-ul promo 2Espresso + cafea cu ganoderma este solutia completa, pret-avantaj. Administreaza 1-3 cafele pe zi, ca in rutina clasica; ganoderma nu inlocuieste cofeina si nu produce dependenta.",
  },

  ceaiuri: {
    h1: "Ceaiuri",
    lead:
      "Ceaiurile Snep sunt amestecuri italienesti construite pentru echilibru intre arome si taninuri, potrivite pentru ceaiul de dupa-amiaza, pentru seri linistite sau ca alternativa la cafea in ritualul de dimineata. Pe olivox.ro gasesti The Mix in plicuri practice si in varianta loose leaf, plus The Peach cu nota dulce de piersica italiana. Sunt produse curate, cu ingrediente selectate si fara arome sintetice agresive.",
    context:
      "Snep lucreaza cu ceaiuri selectate, iar amestecurile sunt gandite sa mearga cu apa sau cu putin lapte vegetal, fara zahar adaugat in exces. Olivox aduce ambele variante in stoc permanent si reaprovizioneaza cand cererea creste, in sezonul rece.",
    bullets: [
      { tag: "The Mix plicuri", line: "amestec echilibrat, portionat pentru rapiditate — perfect pentru birou." },
      { tag: "The Mix loose leaf", line: "aceeasi compozitie, in varianta vrac pentru ritualul complet." },
      { tag: "The Peach", line: "nota dulce de piersica italiana, plicuri aromate, pentru dupa-amiezi relaxate." },
    ],
    howToChoose:
      "Alege plicurile daca ai un ritm rapid la birou sau nu ai filtre pentru vrac. Alege loose leaf daca apreciezi ritualul — ceainic, filtru, timp de infuzare controlat; aroma rezultata este mai intensa si mai rotunda. The Peach e cel mai potrivit pentru dupa-amiaza sau ca bautura racoritoare in varianta rece, cu gheata. Pentru seara, infuzeaza 3-4 minute, fara a depasi timpul — taninurile devin amare. Conserva ceaiurile in recipiente inchise, ferite de lumina, pentru a pastra aroma pana la 12 luni dupa deschidere.",
  },

  choco: {
    h1: "Choco — Ciocolate Functionale",
    lead:
      "Choco este linia Snep de ciocolate functionale — Snep Choco Moon, Choco Block si Choco Cup — care aduce placerea dulciurilor cu un profil nutritional mai prietenos decat ciocolatele clasice din supermarket. Pe olivox.ro le gasesti in variante de portie, pentru familie si pentru a le purta cu tine. Sunt facute in Italia, cu ingrediente selectate si fara aditivii tipici produselor de masa, potrivite pentru cei care vor sa-si satisfaca pofta fara compromisuri nutritionale majore.",
    context:
      "Snep a dezvoltat aceasta gama pentru a oferi o alternativa reala celor care construiesc rutine alimentare controlate, dar nu vor sa renunte complet la dulciuri. Profilul caloric este gestionat atent, iar ambalajele sunt gandite pentru consum ocazional, nu pentru snacking compulsiv.",
    bullets: [
      { tag: "Snep Choco Moon", line: "gustare dulce, portionata individual, cu profil nutritional atent." },
      { tag: "Choco Block", line: "bucati generoase pentru familie sau pentru momente de impartasit." },
      { tag: "Choco Cup", line: "forma mica, perfecta pentru geanta sau pentru birou, cand apare pofta." },
    ],
    howToChoose:
      "Pentru snacking la birou sau in drumetii, Choco Cup este cea mai practica — mica, sigilata, usor de purtat. Pentru familie si consum partajat, Choco Block ofera mai mult produs la un pret mai bun per portie. Choco Moon este alegerea echilibrata — portie individuala, cantitate moderata, potrivit pentru dupa-amiaza. Pentru rezultate legate de greutate, limiteaza-te la o portie pe zi si alege sortimentul in functie de nevoile momentului. Pastreaza produsele la loc racoros, sub 20 grade Celsius, pentru a evita texturile nedorite.",
  },

  alimente: {
    h1: "Alimente Snep",
    lead:
      "Alimentele Snep sunt gustari practice cu profil nutritional atent, pentru birou, scoala, calatorie sau pauze active: batoane Protine in variantele Barbeque, Branza si Ierburi Aromatice si Snack Plus cu cereale integrale. Disponibile pe olivox.ro in ambalaje portionate, sunt alegeri mai bune decat gustarile clasice din distribuitoare automate, cu ingrediente clar listate si fara conservanti inutili.",
    context:
      "Snep a dezvoltat gama pornind de la nevoia reala: gustari sanatoase, usor de purtat, cu gust bun. Protine aduce varianta sarata, perfecta pentru adultii activi care evita dulciurile, iar Snack Plus este varianta dulce cu cereale integrale, potrivita pentru copii si adulti deopotriva.",
    bullets: [
      { tag: "Protine Barbeque", line: "baton sarat cu aroma clasica barbeque, potrivit dupa antrenament sau intre mese." },
      { tag: "Protine Branza", line: "nota de branza, perfect pentru cei care prefera gusturile moderate." },
      { tag: "Protine Ierburi Aromatice", line: "varianta mediteraneana, cu ierburi clasice italienesti." },
      { tag: "Snack Plus cu cereale", line: "gustare dulce cu cereale integrale, ideala pentru copii si pentru pauze de dimineata." },
    ],
    howToChoose:
      "Daca ai antrenamente regulate si mananci sarat, Protine Barbeque si Protine Ierburi Aromatice sunt alegerile naturale — aport proteic si nota de savoare, fara a induce pofta de dulce. Protine Branza e varianta mai moderata, pentru cei care prefera gusturile rotunde. Snack Plus cu cereale este gustarea dulce echilibrata pentru pauzele de dupa-amiaza sau pentru micul dejun pe fuga. Pastreaza cateva batoane in geanta sau in sertarul de la birou — cand apare foamea intre mese, alegerea devine automata, evitand snacking-ul nesanatos.",
  },

  "pauze-dulci": {
    h1: "Pauze Dulci",
    lead:
      "Pauze Dulci este sectiunea olivox.ro dedicata alternativelor mai bune la dulciurile clasice — produse Snep cu ingrediente selectate, zahar controlat si fara aditivi artificiali. Este zona pentru momentele in care vrei ceva dulce fara sa renunti la criterii nutritionale. Fie ca e cafeaua de dimineata, ceaiul de seara sau pofta dintre mese, aici gasesti optiuni cu profil mai prietenos, potrivite pentru familii cu copii si pentru adulti care isi controleaza aportul de zahar adaugat.",
    context:
      "Snep construieste aceasta categorie ca punte intre placere si rigoare nutritionala — formule care aduc gust fara sa depaseasca limitele. Catalogul se imbogateste cu referinte sezoniere si cu variante adaptate cererii. Olivox urmareste noutatile si le aduce in stoc rapid.",
    bullets: [
      { tag: "Gustari dulci echilibrate", line: "alternativa la dulciurile clasice, cu ingrediente mai curate." },
      { tag: "Profil caloric gestionat", line: "portii gandite pentru a nu depasi cu usurinta necesarul zilnic." },
      { tag: "Fara aditivi inutili", line: "etichete clare, fara coloranti si indulcitori artificiali agresivi." },
      { tag: "Potrivite pentru intreaga familie", line: "de la copii la adulti, in portii adecvate." },
    ],
    howToChoose:
      "Identifica ocazia: gustarea din pauza de birou, reteta de weekend cu cei mici sau cadoul pentru cineva atent la ce consuma. Pentru consum zilnic, alege formatele monodoza — ajuta la controlul portiei. Pentru impartit in familie, variantele mai mari sunt economice per gram. Citeste etichetele pentru alergeni, in special daca sunt copii cu sensibilitati, si verifica data de valabilitate. Sectiunea se schimba sezonier — intra periodic pe olivox.ro pentru a descoperi noile referinte adaugate si pachetele promotionale.",
  },

  sport: {
    h1: "Sport",
    lead:
      "Sectiunea Sport de pe olivox.ro aduce intregul arsenal Snep pentru performanta sportiva: Energy Boost pentru pre-antrenament, Upgrate si Creatina pentru putere si masa musculara, Brain pentru concentrare, Protein Bar si Energy Bar pentru recuperare si energie, Hydra pentru rehidratare si Revelop pentru refacere. Plus Kit Sport for All — pachetul complet pentru cei care incep organizat, cu produse care lucreaza bine impreuna. Toate formulate in Italia, cu ingrediente curate si fara excipienti inutili.",
    context:
      "Snep gandeste suplimentatia sportiva ca sistem, nu ca produse izolate. Fiecare referinta are un rol clar in ciclul antrenament-recuperare-performanta, iar kit-urile sunt construite pentru a acoperi coerent toate etapele. Olivox mentine stoc permanent pentru referintele cele mai folosite: Energy Boost, Creatina, Protein Bar.",
    bullets: [
      { tag: "Pre-antrenament", line: "Energy Boost pentru energie rapida si Tribux Blue pentru sustinere prelungita." },
      { tag: "Intra-antrenament", line: "Upgrate, BCAA si Hydra pentru performanta si hidratare in timpul efortului." },
      { tag: "Post-antrenament", line: "Creatina, Protein Bar, Revelop si proteinele vegane pentru recuperare musculara." },
      { tag: "Suport cognitiv si kit complet", line: "Brain pentru concentrare, Kit Sport for All cu produsele esentiale." },
    ],
    howToChoose:
      "Daca incepi cu suplimentatia sportiva, Kit Sport for All iti da totul intr-un singur pachet — e cel mai simplu mod de a intelege cum functioneaza impreuna. Daca ai deja rutina, concentreaza-te pe rol: Energy Boost cu 20 min inainte de antrenament, Upgrate si Hydra in timpul efortului intens, Creatina zilnic si Protein Bar imediat dupa. Brain este util in perioadele de studiu sau pre-competitie, cand ai nevoie de focus. Pentru sporturi de rezistenta, adauga Athletive si Energy Bar la jumatatea sesiunii. Respecta dozajele si hidrateaza-te constant — rezultatele apar in 6-8 saptamani de utilizare consecventa.",
  },

  "masina-de-cafea": {
    h1: "Masina de Cafea",
    lead:
      "Aparatele de cafea Snep sunt gandite pentru cei care folosesc zilnic capsulele cu ganoderma sau oleuropeina — design italian compact, functionare silentioasa si compatibilitate garantata cu intregul catalog de cafea Snep. Potrivite pentru casa, birou sau spatii comerciale mici, aceste espressoare fac trecerea la cafeaua functionala foarte simpla: acelasi ritual, aceeasi viteza, doar capsula se schimba.",
    context:
      "Cand alegi un aparat dedicat pentru capsulele Snep, obtii consistenta maxima — temperatura, presiune si extractie optimizate pentru aceste capsule specifice. Olivox ofera si pachete promo care combina aparatul cu o cantitate initiala de cafea, la un pret avantajos fata de achizitia separata.",
    bullets: [
      { tag: "Design italian compact", line: "potrivit pentru bucatarie, birou sau spatii mici." },
      { tag: "Compatibilitate garantata", line: "functioneaza cu intregul catalog de capsule Snep." },
      { tag: "Functionare silentioasa", line: "potrivit pentru birouri open-space si apartamente." },
      { tag: "Pachete promo disponibile", line: "aparatul plus cafea in kit, la pret redus." },
    ],
    howToChoose:
      "Daca bei cafea zilnic si esti deja obisnuit cu un sistem cu capsule, alegerea unui aparat Snep dedicat are sens — scapi de incompatibilitati si obtii extractie optima pentru capsulele cu ganoderma. Pentru birou mic sau casa, un espressor compact este suficient; pentru volum mai mare sau spatii comerciale, verifica specificatiile tehnice (capacitate rezervor, presiune, auto-oprire). Pachetele promo 2Espresso + cafea cu ganoderma sunt cea mai avantajoasa intrare — primesti aparatul si prima luna de capsule la pret combinat. Intretinerea este simpla: detartrare periodica si curatare a rezervorului.",
  },

  "accesorii-pentru-cafenea": {
    h1: "Accesorii pentru Cafenea",
    lead:
      "Accesoriile pentru cafenea Snep sunt pentru locurile in care cafeaua se serveste in volum — cafenele, birouri mari, restaurante, evenimente. Pe olivox.ro gasesti Kit de Servicii de Cafea 100pz, care rezolva intr-o singura comanda tot ce ai nevoie pentru servire: pahare, agitatoare, zahar portionat. Completeaza capsulele si pod-urile din catalogul Snep si simplifica aprovizionarea pentru locurile cu trafic constant.",
    context:
      "Ideea este practicitatea: o comanda, un colet, toate consumabilele esentiale pentru o suta de servicii. Snep alege componente de calitate — pahare rezistente, agitatoare ergonomice, portii de zahar dozate corect. Olivox livreaza rapid si poate adapta cantitatile pentru comenzi recurente.",
    bullets: [
      { tag: "Kit de Servicii de Cafea 100pz", line: "set complet: pahare, agitatoare si zahar pentru 100 de servicii." },
      { tag: "Aprovizionare simplificata", line: "o singura comanda pentru toate consumabilele esentiale." },
      { tag: "Calitate consistenta", line: "componente verificate, potrivite pentru utilizare profesionala." },
      { tag: "Potrivit pentru volum mare", line: "cafenele, birouri, evenimente si servicii de catering." },
    ],
    howToChoose:
      "Calculeaza consumul saptamanal — un kit de 100 de servicii acopera aproximativ o saptamana de activitate pentru o cafenea mica sau o luna pentru un birou de 10-15 persoane. Pentru consum constant, comenzile recurente (lunare sau la doua saptamani) asigura stoc fara gol. Daca ai si clienti la masa, adauga agitatoare suplimentare si portii de zahar de rezerva. Verifica compatibilitatea paharelor cu aparatul tau (dimensiune, rezistenta termica) si pastreaza kitul intr-un loc curat, uscat, la temperatura constanta. Pentru comenzi mai mari, contacteaza echipa olivox.ro pentru conditii speciale.",
  },

  // ===================================================================
  // INGRIJIRE PERSONALA — leaves
  // ===================================================================
  "beauty-snep": {
    h1: "Beauty Snep",
    lead:
      "Beauty Snep este semnatura cosmetica a brandului — linia de ingrijire italieneasca pentru ten, corp si par care aduna creme, seruri, lotiuni si tratamente tintite. Pe olivox.ro gasesti gama completa, destinata celor care vor cosmetice cu profil curat, cu ingrediente active bine selectate si cu texturi placute. Acopera atat nevoi de baza (curatare, hidratare, protectie) cat si tratamente specifice (anti-aging, iluminare, egalizare), in formule care se integreaza usor in rutinele existente.",
    context:
      "Snep combina extracte naturale cu active cosmetice moderne, in proportii gandite pentru eficienta si toleranta. Formulele sunt testate dermatologic, fara parfumuri agresive si cu ambalaje ergonomice. Olivox aduce intreaga gama prin canal oficial, cu termene de valabilitate clare si cu recomandari personalizate la cerere.",
    bullets: [
      { tag: "Ingrijire fata", line: "creme, seruri si tratamente pentru curatare, hidratare si reducerea semnelor de imbatranire." },
      { tag: "Ingrijire corp", line: "lotiuni, uleiuri si produse dedicate zonelor specifice." },
      { tag: "Ingrijire par", line: "sampoane, balsamuri si masti pentru toate tipurile de par." },
      { tag: "Tratamente tintite", line: "solutii pentru ten obosit, lipsa stralucirii sau zone sensibile." },
    ],
    howToChoose:
      "Pentru inceput, identifica nevoia principala: hidratare, anti-aging, luminozitate, sensibilitate. Apoi alege maxim 3-4 produse care acopera etapele esentiale (curatare, tratament, hidratare, protectie). Pentru ten mixt sau gras, prefera texturi usoare (geluri, fluide). Pentru ten matur sau uscat, alege texturi bogate (creme dense, uleiuri). Aplica seruri inainte de crema, dimineata inchizi rutina cu SPF, iar seara cu o crema de noapte. Rezultatele devin vizibile in 4-8 saptamani de utilizare consecventa. Pentru intrebari specifice, echipa olivox.ro iti poate recomanda combinatii adecvate tipului tau de ten.",
  },

  nat: {
    h1: "NAT",
    lead:
      "NAT este linia Snep pentru cei care vor cosmetice cu liste scurte de ingrediente, formule simple si respect pentru piele. Pe olivox.ro gasesti gama NAT destinata utilizatorilor care prefera produsele fara parfumuri sintetice agresive, fara coloranti artificiali si cu focus pe functionalitate de baza: hidratare, calmare, protectie. Este alegerea logica pentru pielea sensibila, pentru cei care reactioneaza la ingrediente puternice sau pentru cei care construiesc rutine minimaliste.",
    context:
      "Filosofia NAT este una directa: mai putine ingrediente, mai multa claritate asupra a ceea ce aplici pe piele. Snep construieste formulele in jurul unor active de baza bine tolerate, cu excipienti simpli si cu ambalaje discrete. Olivox livreaza intreaga gama prin canal oficial, cu termene de valabilitate generoase.",
    bullets: [
      { tag: "Ingrediente transparente", line: "liste scurte, recognoscibile, fara amestecuri complexe." },
      { tag: "Fara parfumuri agresive", line: "potrivit pentru piele reactiva si sensibilitati olfactive." },
      { tag: "Functii esentiale", line: "hidratare, calmare si protectie, fara trucuri cosmetice." },
      { tag: "Rutine minimaliste", line: "produse gandite sa se completeze simplu, fara complexitate." },
    ],
    howToChoose:
      "NAT este alegerea potrivita daca ai piele sensibila, reactiva sau sub tratament dermatologic si vrei sa reduci numarul de variabile. Pentru inceput, 2-3 produse NAT sunt suficiente: un produs de curatare blanda, o hidratanta, eventual un ulei sau un ser calmant. Introdu cate un produs pe rand, la 3-4 zile distanta, pentru a testa toleranta. Daca ai deja o rutina cu produse mai active (acizi, retinol), NAT este varianta perfecta pentru zilele in care pielea are nevoie de pauza. Citeste lista de ingrediente pentru fiecare produs si evita combinatiile cu active puternice in perioadele sensibile.",
  },

  sneplumax: {
    h1: "SnepLumax",
    lead:
      "SnepLumax este linia premium Snep pentru ingrijirea avansata a tenului — seruri concentrate, creme bogate si tratamente care se adreseaza semnelor vizibile ale timpului, lipsei de stralucire si nevoilor pielii mature sau obosite. Pe olivox.ro gasesti SnepLumax Serum, Dream Vision si celelalte produse ale liniei, formulate in Italia cu active cosmetice moderne in concentratii relevante. Este treapta superioara intr-o rutina deja bine stabilita, pentru cei care vor rezultate vizibile.",
    context:
      "Snep diferentiaza SnepLumax prin dozaje mai mari ale activelor si prin texturi construite pentru confort maxim pe piele matura. Formulele sunt testate dermatologic, iar ambalajele pastreaza stabilitatea ingredientelor sensibile la lumina si aer. Olivox aduce linia in stoc permanent pentru cele mai cautate referinte.",
    bullets: [
      { tag: "SnepLumax Serum", line: "concentrat de active pentru hidratare profunda si luminozitate." },
      { tag: "Dream Vision", line: "ingrijire tintita pentru zona delicata a ochilor — cearcane, oboseala." },
      { tag: "Creme bogate", line: "texturi generoase pentru piele uscata sau matura, cu efect vizibil." },
      { tag: "Tratamente concentrate", line: "produse pentru utilizare periodica, in cure de 4-8 saptamani." },
    ],
    howToChoose:
      "Daca ai peste 35 de ani sau observi pierderea elasticitatii, semne de fatigue sau ten lipsit de stralucire, SnepLumax Serum este investitia cu impact imediat — se aplica seara, dupa curatare, inainte de crema de noapte. Dream Vision se foloseste dimineata si seara pe zona ochilor, tamponat usor, niciodata frecat. Cremele bogate SnepLumax inlocuiesc hidratantele de baza in lunile reci sau dupa 40 de ani. Pentru efect maxim, combina cu un SPF in timpul zilei si mentine rutina cel putin 8 saptamani — semnele devin vizibile treptat. Evita layering excesiv: maxim ser plus crema, nu mai mult.",
  },

  "make-up": {
    h1: "Make-Up",
    lead:
      "Make-Up-ul Snep aduce machiajul italienesc profesional in catalogul olivox.ro — fonduri Cover 5K, rujuri Matt Lip, farduri Matt Shadow si Pearl Shadow, pudre Shimmer, creioane de sprancene Eyebrow Pencil si Eye Pencil. Sunt produse cu pigmenti de calitate, texturi placute si finisaj potrivit atat pentru look-uri de zi, cat si pentru seara. Numerotarea clara pe nuante face alegerea rapida si permite re-comanda precisa.",
    context:
      "Calitatea machiajului Snep se simte de la prima aplicare — pigment ridicat, difuzare uniforma si persistenta decenta, la preturi accesibile fata de brandurile premium. Snep testeaza produsele si le formuleaza cu ingrediente care respecta pielea, in ambalaje ergonomice. Olivox pastreaza stoc regulat pentru nuantele cele mai cautate.",
    bullets: [
      { tag: "Cover 5K", line: "fond de ten cu acoperire medie spre ridicata, finisaj natural." },
      { tag: "Matt Lip si Lip Pencil", line: "rujuri matte si creioane de buze — Electric Brown, Garnet si alte nuante." },
      { tag: "Matt Shadow, Pearl Shadow si HD Shadow", line: "farduri pentru ochi in finisaje mate, sidefate si de inalta definitie." },
      { tag: "Eyebrow Pencil si Eye Pencil", line: "creioane de sprancene si ochi cu texturi fine, usor de modelat." },
    ],
    howToChoose:
      "Pentru baza, Cover 5K N.1 este punctul de plecare pentru tenurile medii — verifica nuanta pe linia maxilarului inainte de a comanda. Rujurile Matt Lip sunt mai rezistente; N.1 Electric Brown este o nuanta versatila pentru zi si seara. Pentru ochi, combina Matt Shadow (nuanta de baza) cu Pearl Shadow pentru luminozitate in zona ducturala si colt intern. Eyebrow Pencil N.08 Quincy este alegerea pentru sprancene brunete; Eye Pencil N.07 Raisin Brown este mai bland decat negru si ideal pentru zi. Completeaza cu Shimmer pentru finisaj iluminator pe pometi.",
  },

  makeup: {
    h1: "MakeUp Snep",
    lead:
      "MakeUp este sectiunea care aduna toate produsele de machiaj Snep pe olivox.ro: baza (Cover 5K), ochi (Matt Shadow, Pearl Shadow, HD Shadow, Eyebrow Pencil, Eye Pencil), buze (Matt Lip, Lip Pencil), finisaj (Shimmer) si kit-uri gata formate (Get Ready). Numerotarea clara pe nuante face alegerea usoara, iar calitatea italiana se simte de la prima aplicare — pigment bogat, texturi fine, persistenta decenta.",
    context:
      "Snep construieste make-up-ul pentru utilizare reala — pigmenti care nu migreaza, finisaje care rezista, ambalaje care functioneaza. Pentru utilizatorii pasionati si pentru make-up artist-ii care cauta produse profesionale accesibile, gama acopera toate etapele unei rutine complete.",
    bullets: [
      { tag: "Baza si finisaj", line: "Cover 5K N.1 pentru ten si Shimmer pentru finisaj iluminator." },
      { tag: "Ochi", line: "Matt Shadow N.1 Coal, Pearl Shadow Blast-Off Bronze, HD Shadow N.1 Timberwolf." },
      { tag: "Sprancene si linie", line: "Eyebrow Pencil N.08 Quincy, Eye Pencil N.07 Raisin Brown." },
      { tag: "Buze si kit-uri", line: "Matt Lip N.1 Electric Brown, Lip Pencil N.01 Garnet, kit Get Ready." },
    ],
    howToChoose:
      "Pentru un look complet de zi, incepe cu Cover 5K pe fata, aplicat cu buretele umed pentru finisaj natural. Pe ochi, HD Shadow Timberwolf este neutru si usor de purtat zilnic. Definesti linia cu Eye Pencil Raisin Brown si sprancenele cu Eyebrow Pencil Quincy. Pe buze, Lip Pencil Garnet conturat si Matt Lip Electric Brown pentru intensitate. Shimmer pe pometi si colt intern al ochiului inchide rutina. Pentru seara, schimba Matt Shadow Coal pe pleoapa mobila si intareste linia ochiului. Get Ready este kit-ul pentru calatorii — contine esentialele intr-un format compact.",
  },

  parfumuri: {
    h1: "Parfumuri",
    lead:
      "Parfumurile Snep aduc note rafinate inspirate de compozitii celebre, la preturi accesibile si cu persistenta buna pe piele. Pe olivox.ro gasesti 101 — inspirat de notele lui Creed Aventus, cu ananas, mosc si vanilie — si 201 — inspirat de notele lui Alien, cu accente florale orientale. Sunt alegeri inteligente pentru rutina zilnica sau pentru evenimente, cand vrei parfum de calitate fara investitia majora necesara pentru originalele designer.",
    context:
      "Parfumurile inspirate Snep reproduc profilul aromatic al unor parfumuri celebre folosind esente de calitate si concentratie buna. Nu sunt copii — sunt reinterpretari fidele construite cu materie prima comparabila. Olivox aduce toate referintele in ambalaje originale Snep.",
    bullets: [
      { tag: "Parfum 101", line: "inspirat de Creed Aventus — ananas, mosc, vanilie, profil masculin modern." },
      { tag: "Parfum 201", line: "inspirat de Alien — floral oriental, profil feminin intens." },
      { tag: "Persistenta buna", line: "fixare decenta pe piele, comparabila cu parfumurile premium." },
      { tag: "Preturi accesibile", line: "experienta unui parfum de designer la o fractiune din cost." },
    ],
    howToChoose:
      "Testeaza intai pe piele (nu pe hartie) si asteapta 15-20 minute pentru a evalua nota de mijloc — aceasta defineste caracterul parfumului. Daca iti place profilul Aventus — citric, fructat, cu baza masculina — 101 este alegerea directa. Pentru gusturi feminine intense, cu lemn aromat si floral, 201 functioneaza bine seara si la evenimente. Aplica pe puncte calde (incheieturi, spatele urechii, gat) si evita frecarea — distruge notele volatile. Pastreaza sticla la loc racoros, departe de lumina solara directa, pentru a mentine compozitia intacta pana la 2-3 ani.",
  },

  "parfumuri-inspirate": {
    h1: "Parfumuri Inspirate",
    lead:
      "Parfumurile inspirate Snep sunt reinterpretari ale unor compozitii de designer celebre, la preturi mult mai prietenoase. Pe olivox.ro gasesti 101 — inspirat de Aventus (Creed) pentru barbati — si 201 — inspirat de Alien (Mugler) pentru femei. Sunt alegeri bune pentru cei care vor sa experimenteze profiluri premium fara investitie mare si pentru cei care cumpara parfum zilnic, pentru rutina sau purtare intensa.",
    context:
      "Filosofia este simpla: profil aromatic fidel, esente de calitate, fixare buna, sticla ergonomica. Snep construieste fiecare parfum inspirat pornind de la nota originala, pastrand caracterul dar adaptand componentele pentru a oferi o experienta de valoare comparabila. Olivox pastreaza stoc permanent pentru 101 si 201, cele mai cautate referinte.",
    bullets: [
      { tag: "101 (inspirat de Aventus)", line: "citric, fructat, mosc si vanilie — profil masculin modern si rezistent." },
      { tag: "201 (inspirat de Alien)", line: "floral oriental, lemn aromat — profil feminin intens si memorabil." },
      { tag: "Fixare decenta", line: "persistenta de 6-8 ore pe piele, compatibila cu purtare zilnica." },
      { tag: "Numerotare clara", line: "sistem simplu de identificare — comenzi re-repetabile fara confuzii." },
    ],
    howToChoose:
      "Decide intai genul aromatic care te defineste: citric-fructat cu baza masculina (101) sau floral oriental feminin (201). Testeaza pe piele la magazin sau comanda formatul mic intai, daca esti incepator. Aplica inainte de a te imbraca, pe puncte calde, pentru a permite notelor sa se dezvolte natural. Evita combinatiile cu creme puternic parfumate care pot modifica profilul. Pentru evenimente seara, aplica ceva mai generos; pentru birou, o pulverizare discreta e suficienta. Persistenta este mai buna pe pielea hidratata — o crema neutra dedesubt poate prelungi experienta.",
  },

  fata: {
    h1: "Ingrijire Fata",
    lead:
      "Ingrijirea fetei cu Snep acopera toate etapele unei rutine complete — curatare, tratament, hidratare, protectie si ingrijire zone specifice. Pe olivox.ro gasesti Reinature Cream, Reinature Stick, Reinature Drop, SnepLumax Serum, Dream Vision, Aqua 3.0 Spray, Cream 3.0 si alte produse italienesti cu formule curate. Sunt potrivite pentru toate tipurile de ten si pentru toate varstele, cu texturi si concentratii gandite sa raspunda nevoilor reale ale pielii.",
    context:
      "Rutina ideala pentru fata urmeaza trei pasi: curatare, tratament cu ingrediente active (seruri, creme tintite) si hidratare cu protectie. Snep construieste fiecare produs sa functioneze atat individual cat si in combinatie cu celelalte din gama. Olivox mentine stoc constant pentru cele mai cautate referinte: Reinature si SnepLumax.",
    bullets: [
      { tag: "Reinature", line: "Cream, Stick si Drop — linie de hidratare si regenerare cu textura ajustabila nevoilor." },
      { tag: "SnepLumax Serum", line: "concentrat de active pentru piele matura, ten obosit sau lipsit de stralucire." },
      { tag: "Dream Vision", line: "tratament tintit pentru zona ochilor — cearcane, oboseala, riduri fine." },
      { tag: "Aqua 3.0 si Cream 3.0", line: "spray hidratant si crema cu formule moderne pentru rutina zilnica." },
    ],
    howToChoose:
      "Pentru ten normal-mixt, rutina simpla cu Reinature Drop dimineata si Cream seara este eficienta. Pentru semne de imbatranire sau ten obosit, adauga SnepLumax Serum in etapa de tratament. Zona ochilor beneficiaza de Dream Vision aplicat tamponat, nu frecat, dimineata si seara. Aqua 3.0 Spray este util pentru re-hidratare in timpul zilei sau dupa fix de machiaj. Pentru ten sensibil, prefera linia NAT. Introdu produsele pe rand, la 3-4 zile distanta, pentru a identifica ce functioneaza. Combina obligatoriu cu SPF in timpul zilei, mai ales daca folosesti seruri cu active luminoase.",
  },

  par: {
    h1: "Ingrijire Par",
    lead:
      "Ingrijirea parului cu Snep aduce rutine complete pentru toate tipurile de par — de la sampoane si balsamuri la masti profunde si tratamente specifice anti-cadere. Pe olivox.ro gasesti Trico-Salus pentru scalp si cadere, Sneplumina pentru hidratare intensiva, Snep Ice sampon anti-galben pentru parul blond, Gel de dus si sampon reparator dupa plaja, plus balsamuri restructurante. Formulele sunt italienesti, cu extracte vegetale si fara ingredientele agresive care sensibilizeaza parul pe termen lung.",
    context:
      "Snep gandeste ingrijirea parului ca o rutina structurata: sampon potrivit tipului tau, balsam pentru hidratare zilnica, masca saptamanala pentru reparare profunda si, dupa caz, tratamente specifice (scrub, anti-cadere). Rezultatele devin vizibile in 3-4 saptamani de utilizare consecventa. Olivox mentine stoc regulat pentru liniile Sneplumina, Snep Ice si Trico-Salus.",
    bullets: [
      { tag: "Trico-Salus", line: "scrub purificator, sampon anti-cadere si sampon pentru spalare frecventa." },
      { tag: "Sneplumina", line: "masca hidratanta si sampon cu efect de matase pentru par tratat sau uscat." },
      { tag: "Snep Ice", line: "sampon anti-galben pentru parul blond, decolorat sau grizonat." },
      { tag: "Reparator dupa plaja", line: "gel de dus si sampon pentru neutralizarea efectelor sarii si soarelui." },
    ],
    howToChoose:
      "Identifica tipul si problema principala a parului: cadere sau scalp sensibil (Trico-Salus), uscat-deteriorat (Sneplumina), blond care virеaza pe galben (Snep Ice), afectat de soare si sare (Reparator dupa plaja). Pentru o rutina completa, foloseste samponul zilnic sau la 2 zile, balsam dupa fiecare spalare, si masca o data pe saptamana. Trico-Salus scrub este potrivit la 7-10 zile, pentru detox al scalpului. Kit-ul anti-cadere este o cura de 3-4 luni, cu rezultate vizibile dupa 8 saptamani. Aplica mastile pe varfurile umede, fara a atinge radacina, si clateste bine. Pastreaza produsele la loc racoros pentru a mentine stabilitatea formulelor.",
  },

  oil: {
    h1: "OIL — Uleiuri pentru Corp",
    lead:
      "OIL este linia Snep de uleiuri functionale pentru corp — Muscolease pentru relaxarea muschilor, Exvasi pentru circulatia in picioare, Mandorle Dolci ca ulei clasic de ingrijire si Top Finger pentru aplicari tintite. Pe olivox.ro gasesti si kit-uri combinate care aduna toate variantele, ideale cadou sau pentru incepatori care vor sa incerce mai multe formule. Sunt uleiuri italienesti cu extracte vegetale, texturi generoase si absorbtie controlata.",
    context:
      "Uleiurile Snep sunt construite pentru utilizare reala: cantitate generoasa, absorbtie care nu lasa pielea lipicioasa, parfumuri discrete. Fiecare formula tinteste o nevoie specifica, iar combinatia kit aduce toate variantele la un pret avantajos fata de achizitia separata.",
    bullets: [
      { tag: "Muscolease", line: "ulei pentru relaxarea muschilor incordati dupa efort sau la sfarsitul zilei." },
      { tag: "Exvasi", line: "sustine circulatia in picioare, util pentru cei care stau mult in picioare sau calatoresc." },
      { tag: "Mandorle Dolci", line: "ulei de migdale dulci — clasicul ingrijirii zilnice, pentru piele uscata." },
      { tag: "Top Finger si Kit combinat", line: "aplicare tintita si pachet complet cu toate variantele." },
    ],
    howToChoose:
      "Dupa antrenamente intense sau o zi lunga pe picioare, Muscolease aplicat cu masaj pe zonele incordate ofera relief vizibil. Exvasi se aplica seara pe picioare, de jos in sus, pentru a sustine circulatia — efectul se simte mai ales dupa calatorii lungi. Mandorle Dolci este ulеiul zilnic pentru intreg corpul, mai ales pentru piele uscata si iarna, cand incalzirea centrala deshidrateaza. Top Finger se foloseste tintit, pe zone mici, cand ai nevoie de aplicare precisa. Daca nu stii de unde sa incepi, Kit Mandorle Dolci — Top Finger — Muscolease — Exvasi iti da intreaga experienta la un pret redus.",
  },

  corp: {
    h1: "Ingrijire Corp",
    lead:
      "Ingrijirea corpului cu Snep aduce rutine complete pentru toata familia — Master pentru barbati, Fanpaste si Fanfresh pentru igiena orala, Vimana pentru rasfat, Gel de Dus Reducator, Belove sapun intim, Cell-Up pentru tratament corporal tintit, plus accesorii precum periuta de dinti din bambus. Pe olivox.ro gasesti intregul catalog Snep pentru nevoile zilnice: dus, igiena, hidratare, ingrijire specifica. Formule italienesti cu extracte vegetale, texturi placute si parfumuri discrete.",
    context:
      "Logica Snep pentru corp este rutina integrata — produse care functioneaza impreuna, cu ingrediente compatibile si cu impact minim asupra mediului (ambalaje reutilizabile, formule biodegradabile la multe produse). Olivox aduce intreg catalogul prin canal oficial, cu suport pentru alegerea corecta in functie de tipul pielii.",
    bullets: [
      { tag: "Igiena orala", line: "Fanpaste, Fanfresh si periuta de bambus — rutina completa pentru dinti sanatosi." },
      { tag: "Dus si corp", line: "Gel de Dus Reducator, Gel de Dus clasic si Aloe Box pentru ingrijire zilnica." },
      { tag: "Specifice", line: "Master pentru barbati, Belove sapun intim, Vimana pentru rasfat si Cell-Up pentru tratament." },
      { tag: "Accesorii eco", line: "periute de bambus si alte produse care reduc impactul plastic." },
    ],
    howToChoose:
      "Pentru rutina de dus, Gel de Dus clasic este varianta universala; Gel de Dus Reducator aduce un plus energizant pentru dimineti sau dupa sport. Master este dedicat barbatilor, cu parfum masculin discret, si rezolva igiena cu un singur produs. Fanpaste si Fanfresh acopera igiena orala — Fanpaste pentru curatare, Fanfresh pentru respiratie proaspata. Belove este sapunul delicat pentru zona intima, cu pH echilibrat. Vimana este pentru seri relaxate, cand vrei un produs placut la atins. Periutele de bambus completeaza rutina cu o nota eco, important pentru cei atenti la amprenta de plastic.",
  },

  "protectie-solara": {
    h1: "Protectie Solara",
    lead:
      "Protectia solara Snep acopera vara intreaga — de la pregatirea pielii (Bronze Prepare) la protectie propriu-zisa (Spray SPF 25, Spray SPF 50+, Stick SPF 50+, Crema SPF 50+ pentru fata) si la ingrijirea dupa soare (After Sun iluminator, Tanning Pro pentru bronzare intensa). Pe olivox.ro gasesti formule italienesti cu filtre eficiente, texturi placute care nu lipesc si pochette sau geanta practica pentru plaja. Potrivite pentru intreaga familie, sportivi si calatori in zone insorite.",
    context:
      "Snep construieste gama SPF ca sistem complet — fiecare produs acopera o nevoie specifica, iar impreuna formeaza rutina completa pentru zile insorite. Filtrele sunt de generatie noua, rezistente la apa si cu textura transparenta care nu lasa urme albe. Olivox mentine stoc sezonier pentru intreaga gama, cu reaprovizionari frecvente in lunile de vara.",
    bullets: [
      { tag: "Spray-uri SPF", line: "Spray Transparent SPF 25 pentru zi, SPF 50+ pentru plaja si sport in soare." },
      { tag: "Stick SPF 50+", line: "pentru nas, umeri, urechi si cicatrici — zone sensibile care ard usor." },
      { tag: "Fata si decolteu", line: "Crema SPF 50+ dedicata, cu textura fina, sub machiaj sau singura." },
      { tag: "Bronzare si after-sun", line: "Tanning Pro pentru activare, After Sun pentru prelungirea bronzului." },
    ],
    howToChoose:
      "Pentru activitati urbane zilnice, Spray Transparent SPF 25 aplicat dimineata este suficient — reaplica dupa 4-5 ore daca stai mult afara. Pentru plaja, sport acvatic sau zile cu expunere lunga, urmeaza regula SPF 50+: spray-ul pe corp, crema dedicata pe fata si decolteu, stick-ul pe zonele critice (nas, umeri, cicatrici). Reaplica la fiecare 2 ore si dupa fiecare intrare in apa. Bronze Prepare inaintea vacantei ajuta pielea sa se adapteze treptat. Tanning Pro accelereaza bronzarea pentru cei care vor un ton mai intens, iar After Sun aplicat seara hidrateaza, calmeaza si prelungeste bronzul pana la 2 saptamani in plus.",
  },

  "ingrijirea-corpului": {
    h1: "Ingrijirea Corpului",
    lead:
      "Ingrijirea corpului in catalogul Snep reuneste produsele cu impact multi-directie — cele care ofera mai mult decat o singura functie. Pe olivox.ro gasesti Beauty Fit 9 si alte referinte de ingrijire generala, formulate pentru a acoperi hidratare, fermitate si confort al pielii intr-o singura aplicare. Sunt alegeri eficiente pentru cei care vor sa simplifice rutina fara a renunta la rezultate.",
    context:
      "Snep construieste aceasta sectiune pentru utilizatorii care apreciaza multifunctionalitatea — formule care actioneaza pe mai multe directii simultan, cu ingrediente bine selectate si cu texturi placute. Olivox aduce referintele prin canal oficial si pastreaza stoc regulat.",
    bullets: [
      { tag: "Beauty Fit 9", line: "produs multifunctional pentru ingrijirea generala a corpului, cu efect vizibil." },
      { tag: "Formule multi-directie", line: "hidratare, fermitate si confort intr-o singura aplicare." },
      { tag: "Rutina simplificata", line: "mai putine produse, acelasi rezultat — pentru cei cu ritm alert." },
      { tag: "Texturi placute", line: "absorbtie buna, parfum discret, ambalaje ergonomice." },
    ],
    howToChoose:
      "Daca vrei sa reduci numarul de produse din rutina fara a sacrifica ingrijirea, Beauty Fit 9 este optiunea naturala — aplicat dupa dus, acopera hidratare si tratament general intr-o singura miscare. Foloseste zilnic, masand delicat in zonele cu nevoi specifice (abdomen, coapse, brate), si combina cu rutina ta de dus si igiena corporala. Rezultatele vizibile apar in 4-6 saptamani de utilizare consecventa. Pentru zone cu nevoi punctuale (celulita, piele mai lasata), combina cu produsele din sectiunea Corp sau cu uleiurile din gama OIL pentru un plus de actiune tintita.",
  },

  "bio-molecule": {
    h1: "Bio Molecule",
    lead:
      "Bio Molecule este categoria Snep care aduce articole textile functionale Easeline — tricouri, maiouri, pants, leggings, esarfe, genunchiere si fete de perna, tesute cu tehnologii speciale ce urmaresc sa ofere confort pe termen lung. Pe olivox.ro gasesti gama completa, gandita atat pentru utilizare zilnica acasa sau la birou, cat si pentru momente de odihna. Este o alegere neconventionala, dar apreciata de utilizatorii fideli ai brandului.",
    context:
      "Easeline reprezinta intersectia dintre textile si wellness — tesaturi construite sa interactioneze atent cu pielea, cu constructii care mentin temperatura si confortul. Snep dezvolta aceste articole in Italia, cu focus pe calitate si durabilitate. Olivox aduce gama completa cu marimi diverse pentru intreaga familie.",
    bullets: [
      { tag: "Imbracaminte zilnica", line: "tricouri, maiouri, pants si leggings pentru uz acasa sau seara." },
      { tag: "Accesorii", line: "esarfe, genunchiere si incalzitoare de gat pentru sustinere punctuala." },
      { tag: "Fata de perna Easeline", line: "pentru calitatea somnului — textila speciala pe zona de contact." },
      { tag: "Confort pe termen lung", line: "tesaturi construite pentru utilizare indelungata." },
    ],
    howToChoose:
      "Pentru inceput, fata de perna Easeline este investitia cu impact imediat — dormi pe ea noapte de noapte si beneficiezi de tesatura speciala fara a-ti schimba garderoba. Maioul sau tricoul Easeline este pentru uz zilnic acasa sau la birou, iar leggingsii si pantsii sunt ideali seara, in timpul liber sau in perioade de recuperare. Esarfele, genunchierele si incalzitoarele de gat sunt pentru sustinere punctuala in zilele reci sau pentru zone sensibile. Verifica marimea conform tabelului dedicat, deoarece tesatura tehnica functioneaza optim cand articolul este ajustat corect pe corp.",
  },

  // ===================================================================
  // INGRIJIREA MEDIULUI — leaves
  // ===================================================================
  hydropura: {
    h1: "Hydropura",
    lead:
      "Hydropura este sistemul Snep de filtrare a apei direct la robinet — osmoza inversa cu 5 ani garantie, sticle de sticla reutilizabile si filtre de schimb disponibile separat. Pe olivox.ro gasesti kit-ul complet, filtru de inlocuire, contor de hidrogen si variante de sticle pentru stocarea apei filtrate. Este solutia logica pentru familiile care vor apa de calitate acasa, fara sticle de plastic, cu costuri mici pe termen lung si cu un impact redus asupra mediului.",
    context:
      "Snep foloseste tehnologie de osmoza inversa, proces care elimina microplasticele, metalele grele si majoritatea contaminantilor dizolvati, mentinand apa proaspata si cu gust curat. Sistemul are 5 ani garantie la componenta principala, iar filtrele se schimba la intervale recomandate. Olivox ofera suport pentru instalare si pentru mentenanta periodica.",
    bullets: [
      { tag: "Kit Hydropura complet", line: "sistem principal cu filtru de osmoza inversa — instalare sub chiuveta." },
      { tag: "Filtre de inlocuire", line: "filtre de schimb pentru mentinerea performantei in timp." },
      { tag: "Sticle de sticla Hydropura", line: "reutilizabile, elegante, perfecte pentru apa filtrata la masa." },
      { tag: "Contor de hidrogen", line: "pentru masurarea calitatii apei si verificarea performantei filtrului." },
    ],
    howToChoose:
      "Incepe cu Kit-ul Hydropura complet daca nu ai inca un sistem — acopera totul: filtru principal, conectori, sticle. Filtrele de inlocuire sunt pentru utilizatorii existenti, care au nevoie de schimb periodic (la 6-12 luni in functie de utilizare). Sticlele de sticla sunt pentru prezentare la masa sau pentru a inlocui recipientele de plastic — compatibile cu apa filtrata proaspata. Contorul de hidrogen este pentru utilizatorii avansati care vor sa monitorizeze performanta sistemului. Pentru instalare, echipa olivox.ro poate recomanda un tehnician sau poti urma ghidul inclus — este o interventie simpla pentru majoritatea chiuvetelor moderne.",
  },

  "bio-effective": {
    h1: "BioEffective",
    lead:
      "BioEffective este linia Snep de solutii probiotice pentru casa, gradina si compost — o alternativa prietenoasa la detergentii agresivi si la pesticidele clasice. Pe olivox.ro gasesti BioEffective Home pentru curatenia suprafetelor, Garden pentru sustinerea plantelor, Compost pentru accelerarea descompunerii organice, plus pulverizatoarele necesare pentru aplicare — inclusiv pachete de 5 buc pentru utilizare constanta. Alegerea logica pentru familiile cu copii, pentru gradinari si pentru cei care vor sa reduca chimicalele din casa.",
    context:
      "Principiul BioEffective este utilizarea microorganismelor benefice — bacterii probiotice care curata natural suprafetele si mentin echilibrul microbian al solului. Solutiile sunt biodegradabile, fara fosfati si fara substante agresive. Snep dezvolta gama in Italia, iar Olivox o aduce in stoc permanent pentru intreg catalogul.",
    bullets: [
      { tag: "BioEffective Home", line: "solutie probiotica pentru curatenia suprafetelor, inlocuind detergentii agresivi." },
      { tag: "BioEffective Garden", line: "pentru sustinerea plantelor, cresterea recoltei si sanatatea solului." },
      { tag: "BioEffective Compost", line: "accelereaza descompunerea resturilor organice si imbunatateste compostul." },
      { tag: "Pulverizatoare", line: "individual si pachete de 5 buc pentru aplicare practica si economica." },
    ],
    howToChoose:
      "Pentru curatenia generala in casa, BioEffective Home este punctul de pornire — se dilueaza conform instructiunilor si se aplica cu pulverizatorul pe suprafete. Inlocuieste spray-urile clasice si poate fi folosit si pe suprafete unde copiii sau animalele ating des. Garden este pentru cei cu plante de apartament sau gradina — cresterea este vizibila in 4-6 saptamani de utilizare regulata. Compost este esential daca gestionezi propriul compost pentru gradina — reduce mirosul si accelereaza transformarea. Pentru familii cu utilizare constanta, pachetul de 5 pulverizatoare este mai economic decat achizitia individuala. Pastreaza sticlele la loc racoros, ferit de lumina directa.",
  },

  "parfumuri-de-camera": {
    h1: "Parfumuri de Camera",
    lead:
      "Parfumurile de camera Snep sunt esente italienesti pentru ambient — in flacoane de 250ml cu betisoare din bambus, plus variante mari de 3L pentru spatii comerciale. Pe olivox.ro gasesti Giardino di Boboli, Porto Azzurro, Prato Fiorito, Fiesole, Colline Senesi, Castelli in Chianti, Limonaia dei Medici si Estate al Forte — toate inspirate din locatii italienesti clasice, cu profiluri aromatice distincte. Difuzarea lenta prin betisoare mentine parfumul placut saptamani intregi, fara aerosoli si fara priza.",
    context:
      "Fiecare parfum Snep pentru camera e construit in jurul unei emotii geografice italiene — gradini florale, coasta Mediteraneana, dealuri toscane. Esentele sunt de calitate, concentratia este potrivita pentru camere de 20-40 mp, iar sticlele sunt elegante, pregatite pentru zona de zi sau dormitor. Olivox mentine stoc regulat pentru Giardino di Boboli, Porto Azzurro si Prato Fiorito — cele mai populare.",
    bullets: [
      { tag: "Florale", line: "Giardino di Boboli si Prato Fiorito — parfumuri clasice pentru living si dormitor." },
      { tag: "Marine", line: "Porto Azzurro si Estate al Forte — note proaspete, potrivite pentru baie si birou." },
      { tag: "Lemnoase", line: "Fiesole si Castelli in Chianti — seri linistite, nota calda." },
      { tag: "Citrice", line: "Limonaia dei Medici — profil energizant, potrivit pentru bucatarie si hol." },
    ],
    howToChoose:
      "Alege parfumul in functie de camera si de atmosfera dorita. Living si dormitor — note florale (Giardino di Boboli, Prato Fiorito) sau lemnoase (Fiesole, Castelli in Chianti). Baie si hol — note marine sau citrice (Porto Azzurro, Estate al Forte, Limonaia dei Medici). Birou — un parfum care sustine concentrarea, fie marin, fie floral moderat. Pentru spatii mari (peste 40 mp) sau comerciale, varianta de 3L Limonaia dei Medici este cea mai potrivita. Introdu betisoarele de bambus in flacon si intoarce-le o data la cateva zile pentru difuzare optima. Nu amesteca parfumuri diferite in aceeasi camera — creeaza disonanta olfactiva.",
  },

  "parfum-de-camera": {
    h1: "Parfum de Camera",
    lead:
      "Parfumul de camera Snep este difuzorul cu betisoare din bambus pentru cei care prefera mirosurile discrete si constante fata de spray-uri sau lumanari. Pe olivox.ro gasesti flacoane de 250ml in diverse note italienesti — Giardino di Boboli, Porto Azzurro, Prato Fiorito, Fiesole, Colline Senesi, Castelli in Chianti, Estate al Forte — plus Limonaia dei Medici in format mare de 3L pentru spatii comerciale. Difuzarea lenta mentine casa parfumata natural, fara gaze propulsoare si fara fum.",
    context:
      "Snep foloseste esente italienesti de calitate si sticle decorative, astfel incat parfumul de camera sa fie atat util cat si estetic. Difuzarea se face prin betisoarele de bambus, care absorb parfumul din flacon si il elibereaza in aer treptat. Olivox aduce intreaga gama prin canal oficial, cu stoc permanent pentru cele mai cautate note.",
    bullets: [
      { tag: "Flacoane 250ml", line: "format standard pentru camere medii (20-40 mp), durabilitate saptamani." },
      { tag: "Note florale si marine", line: "Giardino di Boboli, Porto Azzurro, Prato Fiorito — potrivite pentru casa." },
      { tag: "Note lemnoase", line: "Fiesole, Castelli in Chianti, Colline Senesi — seri linistite si dormitoare." },
      { tag: "Format mare 3L", line: "Limonaia dei Medici — pentru spatii comerciale si zone de trafic mare." },
    ],
    howToChoose:
      "Selecteaza nota dupa camera si anotimp. Primavara-vara — florale si marine (Giardino di Boboli, Porto Azzurro, Prato Fiorito) pentru prospetime. Toamna-iarna — lemnoase si calde (Fiesole, Castelli in Chianti, Colline Senesi) pentru atmosfera rotunda. Pentru camere mari sau cu trafic intens (living, hol principal), foloseste mai multe betisoare. Pentru dormitor sau camera copilului, 4-5 betisoare sunt suficiente. Inlocuieste betisoarele la 4-6 saptamani sau cand simti ca aroma s-a estompat. Nu pune flaconul in locuri cu lumina solara directa — accelereaza evaporarea. Limonaia dei Medici 3L este investitia inteligenta pentru cafenele, saloane sau birouri.",
  },

  // ===================================================================
  // MISC — root-level leaf
  // ===================================================================
  "promotii-si-kit-uri": {
    h1: "Promotii si Kit-uri",
    lead:
      "Promotii si Kit-uri este sectiunea olivox.ro dedicata ofertelor curente, pachetelor speciale si merchandise-ului Snep. Aici gasesti kit-uri cu reducere fata de achizitia separata, bratari Snep, SnepCard cu beneficii suplimentare, abtibilduri, Magic Towel, tricouri si alte produse dedicate fanilor brandului. Catalogul se schimba periodic — merita sa revii pentru a descoperi cele mai recente oferte si produsele sezoniere.",
    context:
      "Logica sectiunii este simpla: valoare mai buna per produs in pachetele kit, acces la editii limitate sau produse de marca pentru cei care-si asuma identitatea Snep. Olivox actualizeaza oferta regulat si aduce noi referinte pe masura ce catalogul Snep se extinde.",
    bullets: [
      { tag: "Kit-uri cu reducere", line: "pachete multiple din catalogul Snep, la preturi avantajoase." },
      { tag: "Merchandise Snep", line: "bratari, tricouri, abtibilduri si caciuli — pentru fani si cei fideli brandului." },
      { tag: "SnepCard", line: "card cu beneficii pentru clienti recurenti si acces la promotii dedicate." },
      { tag: "Gadget-uri practice", line: "Magic Towel, catalog general, agitator cu suport si alte accesorii utile." },
    ],
    howToChoose:
      "Verifica intai kit-urile — sunt cele mai avantajoase pentru cei care cumpara mai multe produse deodata. Kit Saptamanal de Cocos este un exemplu de pachet cu durata definita, iar kit-urile din nutritie combina suplimentele esentiale. Merchandise-ul (bratari, tricouri, caciuli) este pentru cei care apreciaza brandul si vor sa-l poarte. SnepCard este o investitie pe termen lung daca planuiesti comenzi regulate. Magic Towel si agitatorul cu suport sunt gadget-uri utile pentru rutina zilnica. Sectiunea se actualizeaza — intra periodic pentru a prinde ofertele limitate si produsele noi in format promotional.",
  },
};

// ---------- HTML construction ----------
function buildHtml(spec: Spec, cat: Cat, prods: Product[], children: Cat[]): string {
  const h1 = spec.h1;

  // lead
  const lead = `<p class="lead">${spec.lead}</p>`;

  // context
  const context = `<p>${spec.context}</p>`;

  // what's inside bullets
  const bullets = spec.bullets
    .map(
      (b) =>
        `  <li><strong>${b.tag}</strong> &mdash; ${b.line}</li>`
    )
    .join("\n");
  const whatInside =
    `<h2>Ce gasesti in aceasta categorie</h2>\n<ul>\n${bullets}\n</ul>`;

  // how to choose
  const howBlock = `<h2>Cum alegi produsul potrivit</h2>\n<p>${spec.howToChoose}</p>`;

  // signature OR subcategorii
  let middleExtra = "";
  if (spec.signatureOverride) {
    // root: subcategorii block
    if (children.length > 0) {
      const liItems = children
        .map((c) => `  <li><strong>${stripDiacritics(clean(c.name))}</strong></li>`)
        .join("\n");
      middleExtra = `<h3>Subcategorii</h3>\n<ul>\n${liItems}\n</ul>`;
    }
    const overrideText = spec.signatureOverride(prods);
    if (overrideText) {
      middleExtra += `\n<h3>Produse semnature in aceasta categorie</h3>\n<p>${overrideText}</p>`;
    }
  } else if (prods.length > 0) {
    const names = firstN(prods, 4);
    const sig = signatureLineFor(h1, names);
    middleExtra = `<h3>Produse semnature in aceasta categorie</h3>\n<p>${sig}</p>`;
  }

  // closing
  const closing = `<h2>De ce Olivox</h2>\n<p>${CLOSING_DEFAULT}</p>`;

  return [lead, context, whatInside, howBlock, middleExtra, closing]
    .filter(Boolean)
    .join("\n");
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function countWords(s: string) {
  const t = stripHtml(s);
  return t ? t.split(/\s+/).length : 0;
}

// ---------- run ----------
async function main() {
  const { data: cats, error } = await supabase
    .from("product_categories")
    .select("id,slug,name,parent_id,description")
    .order("parent_id", { nullsFirst: true })
    .order("slug");
  if (error) throw error;

  const allCats = (cats || []) as Cat[];
  const childrenByParent: Record<number, Cat[]> = {};
  for (const c of allCats) {
    if (c.parent_id != null) {
      (childrenByParent[c.parent_id] ||= []).push(c);
    }
  }

  let updated = 0;
  let skipped = 0;
  let missingBuilder = 0;
  let errors = 0;
  const skipList: string[] = [];
  const missingList: string[] = [];
  const errorList: string[] = [];

  let sumBefore = 0;
  let sumAfter = 0;
  let countBefore = 0;
  let countAfter = 0;

  for (const cat of allCats) {
    const existing = cat.description || "";
    const existingWords = countWords(existing);
    if (existingWords > 0) {
      sumBefore += existingWords;
      countBefore++;
    }

    const hasStructure =
      /<h2/i.test(existing) && /<ul/i.test(existing);
    if (!FORCE && hasStructure) {
      skipped++;
      skipList.push(`${cat.slug} (has structure)`);
      continue;
    }

    const spec = SPECS[cat.slug];
    if (!spec) {
      missingBuilder++;
      missingList.push(cat.slug);
      continue;
    }

    // pull up to 10 products for the category
    const { data: prodsRaw } = await supabase
      .from("products")
      .select("name")
      .contains("category_slugs", [cat.slug])
      .limit(10);
    const prods = (prodsRaw || []) as Product[];

    const children = childrenByParent[cat.id] || [];
    const html = buildHtml(spec, cat, prods, children);

    const afterWords = countWords(html);
    sumAfter += afterWords;
    countAfter++;

    const { error: upErr } = await supabase
      .from("product_categories")
      .update({ description: html })
      .eq("id", cat.id);

    if (upErr) {
      errors++;
      errorList.push(`${cat.slug}: ${upErr.message}`);
      console.error(`  x ${cat.slug}: ${upErr.message}`);
    } else {
      updated++;
      console.log(
        `  > ${cat.slug} (${prods.length}p, ${children.length}sub, ${afterWords}w)`
      );
    }
  }

  console.log("\n=== Report ===");
  console.log(`Total categories: ${allCats.length}`);
  console.log(`Updated:          ${updated}`);
  console.log(`Skipped:          ${skipped}`);
  console.log(`Missing builder:  ${missingBuilder}`);
  console.log(`Errors:           ${errors}`);
  if (countBefore)
    console.log(
      `Avg words before: ${Math.round(sumBefore / countBefore)} (n=${countBefore})`
    );
  if (countAfter)
    console.log(
      `Avg words after:  ${Math.round(sumAfter / countAfter)} (n=${countAfter})`
    );
  if (skipList.length)
    console.log(`  Skipped: ${skipList.join(", ")}`);
  if (missingList.length)
    console.log(`  Missing builders for: ${missingList.join(", ")}`);
  if (errorList.length)
    console.log(`  Errors:\n   ${errorList.join("\n   ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
