/**
 * Seeds 6 SEO-ready starter articles into the Supabase `articles` table.
 * Idempotent: uses upsert on `slug` (unique).
 *
 * Run:
 *   npx tsx scripts/seed-articles.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

type SeedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  weeksBack: number;
};

const ARTICLES: SeedArticle[] = [
  {
    slug: "ulei-esential-lavanda-beneficii",
    title: "Beneficiile uleiului esential de lavanda",
    excerpt:
      "Lavanda este cel mai studiat ulei esential. Afla 7 beneficii reale, cum se foloseste corect si ce erori sa eviti in aromaterapie.",
    tags: ["uleiuri esentiale", "lavanda", "aromaterapie", "somn", "piele"],
    meta_title: "Ulei esential de lavanda: 7 beneficii si utilizari | Olivox",
    meta_description:
      "Beneficiile uleiului esential de lavanda: somn mai bun, reducerea anxietatii, piele calmata. Cum se foloseste corect si ce diluare folosesti.",
    weeksBack: 1,
    body: `
<p>Uleiul esential de lavanda (<em>Lavandula angustifolia</em>) este probabil cel mai studiat ulei esential. Are un profil blând, se potriveste pentru incepatori si este util in atat de multe situatii incat merita sa il ai in casa. Acest articol iti prezinta cele mai solide 7 beneficii si cum se foloseste corect.</p>

<h2>1. Sustine un somn mai odihnitor</h2>
<p>Cele mai multe studii se concentreaza aici: inhalarea de lavanda cu 30-60 minute inainte de culcare poate creste procentul de somn profund si reduce numarul treziri nocturne. O reteta simpla: 3-4 picaturi de lavanda in difuzor, timp de 20-30 minute, in dormitor. Alternativ, 1 picatura pe perna (in coltul opus fetei).</p>

<h2>2. Reduce stresul si anxietatea usoara</h2>
<p>Linaloolul, compusul principal din lavanda, are efect anxiolitic documentat in cateva studii clinice. Pentru perioadele solicitate, un roll-on cu ulei de migdale si 2% lavanda aplicat pe tample si incheieturi este un instrument practic.</p>

<h2>3. Calmeaza pielea iritata</h2>
<p>Lavanda este unul dintre putinele uleiuri care se poate aplica, cu prudenta, punctual, pe piele — dupa intepaturi de insecte sau zone usor iritate. Pentru suprafete mai mari, dilueaza in ulei purtator la 1-2%.</p>

<h2>4. Ingrijirea scalpului</h2>
<p>Adaugata in sampon (2-3 picaturi la portia de spalare) sau intr-un masaj al scalpului cu ulei de jojoba, lavanda ajuta la echilibrarea sebumului si la reducerea mancarimilor.</p>

<h2>5. Refresh natural pentru casa</h2>
<p>In difuzor sau in spray-uri DIY (apa distilata + 1% lavanda + 1% tea tree + polisorbat pentru emulgare), lavanda curata aerul si adauga un parfum curat, natural.</p>

<h2>6. Sustinere in dureri de cap tensionale</h2>
<p>Aplicata pe tample diluata la 1-2%, in masaj usor, lavanda poate atenua durerile tensionale provocate de stres sau oboseala oculara.</p>

<h2>7. Sursa de inspiratie pentru parfumuri</h2>
<p>In note de inima sau baza, lavanda este un ingredient clasic. Daca iti place profilul aromatic, vezi si <a href="/produse/parfumuri">parfumurile inspirate</a> si <a href="/produse/parfumuri-de-camera">parfumurile de camera</a> din catalogul Snep.</p>

<h2>Cum se foloseste corect</h2>
<ul>
  <li><strong>Difuzor</strong>: 3-6 picaturi la 200 ml apa, maxim 30 min/sesiune.</li>
  <li><strong>Pe piele</strong>: dilueaza la 1-3% in ulei purtator.</li>
  <li><strong>Baie</strong>: 5-8 picaturi in sare Epsom sau ulei inainte sa adaugi in apa.</li>
  <li><strong>Perna</strong>: maxim 1-2 picaturi, la distanta de fata.</li>
</ul>

<h2>Precautii</h2>
<ul>
  <li>In primul trimestru de sarcina, evita sau consulta medicul.</li>
  <li>La copii sub 2 ani — doar difuzor, la distanta.</li>
  <li>Daca iei medicatie sedativa, discuta cu medicul.</li>
</ul>

<h2>Cum il depozitezi</h2>
<p>Sticla bruna, inchisa bine, intr-un loc racoros si ferit de lumina. Lavanda se pastreaza bine 3-4 ani.</p>

<p>Pentru contextul complet citeste si <a href="/ghid/uleiuri-esentiale-utilizari">ghidul uleiurilor esentiale</a> si vezi <a href="/produse/uleiuri-esentiale">catalogul de uleiuri Snep</a>.</p>
`,
  },
  {
    slug: "omega-3-functie-cardiaca",
    title: "Cum sprijina omega 3 functia cardiaca",
    excerpt:
      "Rolul EPA si DHA in sanatatea inimii, doza zilnica recomandata, cum alegi un omega 3 de calitate si cand sa il iei.",
    tags: ["omega 3", "suplimente", "EPA", "DHA", "cardiovascular"],
    meta_title: "Omega 3 si sanatatea inimii: ghid EPA/DHA | Olivox",
    meta_description:
      "Cum sprijina omega 3 functia cardiaca, cat EPA/DHA ai nevoie zilnic si cum alegi un supliment de calitate, fara oxidare.",
    weeksBack: 2,
    body: `
<p>Acizii grasi omega 3 — in special EPA (acid eicosapentaenoic) si DHA (acid docosahexaenoic) — sunt printre cei mai bine studiati nutrienti in relatie cu sanatatea cardiovasculara. Acest articol iti arata ce spun datele, cat ai nevoie si cum alegi un omega 3 de calitate.</p>

<h2>Ce sunt EPA si DHA?</h2>
<p>EPA si DHA sunt acizi grasi polinesaturati pe care organismul ii sintetizeaza ineficient din ALA (din in, canepa, nuci). Principala lor sursa alimentara este <strong>pestele gras</strong>: somon, sardine, macrou, hering. Cantitatea necesara este greu de atins doar din dieta, iar suplimentele sunt o solutie practica.</p>

<h2>Ce fac EPA si DHA la nivel cardiovascular</h2>
<ul>
  <li><strong>Reduc trigliceridele</strong> serice — efect solid, dependent de doza.</li>
  <li><strong>Sustin functia endoteliala</strong> (captuseala interioara a vaselor).</li>
  <li><strong>Modereaza inflamatia</strong> sistemica, mediata de citokine.</li>
  <li><strong>Suport pentru ritm cardiac</strong> — DHA este esential pentru membranele cardiomiocitelor.</li>
  <li>Nu inlocuiesc tratamentul — sunt complement la stilul de viata si la terapia medicala.</li>
</ul>

<h2>Cata doza zilnica?</h2>
<p>Recomandarile variaza, dar un reper folosit in literatura:</p>
<ul>
  <li><strong>Mentenanta</strong>: 250-500 mg EPA+DHA/zi (EFSA).</li>
  <li><strong>Trigliceride ridicate</strong>: 1000-2000 mg EPA+DHA/zi, sub supraveghere medicala.</li>
  <li><strong>Sarcina</strong>: minim 200 mg DHA/zi pentru dezvoltarea fetala.</li>
</ul>
<p>Atentie: doza se refera la <em>EPA+DHA efectiv</em>, nu la greutatea totala a capsulei de "ulei de peste".</p>

<h2>Cum alegi un omega 3 bun</h2>
<ol>
  <li><strong>Concentratie EPA/DHA pe capsula</strong> clar afisata pe eticheta.</li>
  <li><strong>Forma chimica</strong>: rTG (reesterificat trigliceride) si EE (etil ester). rTG are biodisponibilitate mai mare.</li>
  <li><strong>Puritate</strong> — certificate IFOS, Friend of the Sea, sau teste interne pentru metale grele si PCB.</li>
  <li><strong>Indice de oxidare (TOTOX)</strong> scazut — uleiurile ranced nu fac bine.</li>
  <li><strong>Ambalaj</strong> din sticla bruna sau capsule tip softgel etans.</li>
</ol>

<h2>Cand il iei</h2>
<p>Ideal cu o masa care contine grasimi — cresti absorbtia de 2-4 ori fata de stomacul gol. Pranz sau cina functioneaza bine. Impartirea in 2 prize este utila la doze mari (&gt; 2 g).</p>

<h2>Interactiuni si precautii</h2>
<ul>
  <li>Persoanele pe <strong>anticoagulante</strong> (aspirina, warfarina, rivaroxaban) sa discute cu medicul — omega 3 in doze mari poate prelungi timpul de sangerare.</li>
  <li><strong>Inainte de interventii chirurgicale</strong>, multi medici recomanda pauza 7-14 zile.</li>
  <li><strong>Alergie la peste</strong> — alege alternativa din alge (vegan).</li>
</ul>

<h2>Omega 3 si stilul de viata</h2>
<p>Suplimentul este o piesa dintr-un puzzle mai mare. Alaturi de el, pentru inima sanatoasa: miscare aerobica de 150 min/saptamana, somn 7-9h, renuntarea la fumat, reducerea ultra-procesate si controlul tensiunii. Pentru un cadru mai larg citeste <a href="/ghid/suplimente-alimentare-naturale">ghidul suplimentelor alimentare</a> si <a href="/ghid/cum-alegi-supliment">cum alegi un supliment</a>.</p>

<p>Catalogul Snep include formule omega 3 in <a href="/produse/suplimente-alimentare">sectiunea de suplimente alimentare</a>.</p>
`,
  },
  {
    slug: "cafea-ganoderma-ce-este",
    title: "Cafea cu Ganoderma: ce este si cum se foloseste",
    excerpt:
      "Cafeaua cu ganoderma lucidum (reishi) combina energia cafelei cu beneficiile unei ciuperci adaptogene. Iata cum o integrezi in rutina.",
    tags: ["cafea functionala", "ganoderma", "reishi", "adaptogene"],
    meta_title: "Cafea cu Ganoderma: ce este si cum se foloseste | Olivox",
    meta_description:
      "Tot ce trebuie sa stii despre cafeaua cu ganoderma (reishi): cum se prepara, ce beneficii are si cui i se potriveste.",
    weeksBack: 3,
    body: `
<p>Cafeaua cu Ganoderma a devenit populara in Romania in ultimii ani, alimentata de interesul pentru alimente functionale si adaptogene. Dincolo de "hype", exista un fundament traditional si cateva studii moderne care explica de ce combinatia cafea + reishi are sens.</p>

<h2>Ce este Ganoderma Lucidum</h2>
<p><em>Ganoderma lucidum</em>, cunoscuta in China ca Lingzhi si in Japonia ca Reishi, este o ciuperca medicinala folosita de peste 2000 de ani. Compusii sai activi sunt <strong>polizaharidele (beta-glucanii)</strong>, <strong>triterpenele</strong> si <strong>peptidele bioactive</strong>. Este considerata un <em>adaptogen</em> — ajuta organismul sa gestioneze mai bine stresul fizic si psihic.</p>

<h2>De ce sa o combini cu cafea</h2>
<p>Cafeina clasica iti da un boost rapid, dar la unii produce anxietate, palpitatii sau un "crash" pe la mijlocul zilei. Ganoderma atenueaza aceste efecte — energia devine mai stabila, fara varfuri si caderi. In plus, nota pamantie a ciupercii echilibreaza amareala cafelei.</p>

<h2>Cum se prepara</h2>
<ol>
  <li>Deschide un plic (de regula 3-5 g).</li>
  <li>Toarna 150-180 ml apa fierbinte, dar nu clocotita (85-90°C).</li>
  <li>Amesteca bine. Optional: lapte vegetal (migdale, ovaz), scortisoara sau miere.</li>
  <li>Bea proaspata. 1-2 cesti/zi, ideal dimineata si eventual la pranz.</li>
</ol>

<h2>Ce poti observa dupa 2-4 saptamani</h2>
<ul>
  <li>Energie mai echilibrata, fara "crash" la ora 14.</li>
  <li>Focus mental putin mai lung.</li>
  <li>Gustul iti devine familiar — multi spun ca nu se mai intorc la cafeaua clasica.</li>
  <li>Cei care erau sensibili la cafeina raporteaza mai putina agitatie.</li>
</ul>

<h2>Cui i se potriveste</h2>
<ul>
  <li>Persoane cu program intens, care vor sa reduca cafeina fara sa renunte la ritualul cafelei.</li>
  <li>Iubitori de alimentatie functionala si adaptogene.</li>
  <li>Cei care au incercat cafea decofeinizata si nu au fost multumiti de gust.</li>
</ul>

<h2>Cui NU i se recomanda</h2>
<ul>
  <li>Persoane sub anticoagulante — ganoderma poate potenta efectul; intreaba medicul.</li>
  <li>Alergici la ciuperci.</li>
  <li>Sarcina, alaptare — restrictia de cafeina oricum se aplica.</li>
</ul>

<h2>Context — alte alimente functionale</h2>
<p>Cafeaua cu ganoderma este o poarta de intrare in lumea alimentelor functionale. Vezi si <a href="/produse/alimente-functionale">categoria Alimente Functionale Snep</a> pentru shake-uri si pulberi cu alte adaptogene.</p>

<p>Pentru detalii citeste <a href="/ghid/cafea-functionala-ganoderma">ghidul complet al cafelei functionale cu ganoderma</a> si intra direct la <a href="/produse/cafea">cafeaua Snep</a>.</p>
`,
  },
  {
    slug: "programe-detox-cand-ai-nevoie",
    title: "Programe detox: cand ai nevoie si cum le faci corect",
    excerpt:
      "Cand are sens un program detox, ce inseamna detox real vs marketing, si cum sustii ficatul si intestinul intr-o cura de 7-21 zile.",
    tags: ["detox", "programe nutritionale", "ficat", "intestin"],
    meta_title: "Programe detox: cand ai nevoie si cum se fac | Olivox",
    meta_description:
      "Ce este detox-ul real vs marketing, cand ai nevoie de un program si cum sustii ficatul si intestinul in 7-21 de zile.",
    weeksBack: 4,
    body: `
<p>"Detox" este probabil cel mai folosit si cel mai abuzat cuvant in industria wellness. In acelasi timp, exista un nucleu real: organismul detoxifica permanent prin ficat, rinichi, intestine, piele si plamani. Un "program detox" bine gandit sustine aceste procese, nu le "inventeaza".</p>

<h2>Ce NU este detox-ul</h2>
<ul>
  <li>Nu este o "curatare" magica a sangelui in 3 zile.</li>
  <li>Nu inseamna sucuri reci si foame prelungita.</li>
  <li>Nu inlocuieste tratamente medicale.</li>
</ul>

<h2>Ce este detox-ul real</h2>
<p>Sustinere, pe o perioada limitata (7-21 zile), a functiei hepatice, a microbiotei si a nutritiei antioxidante — prin alimentatie curata, hidratare, somn si, optional, suplimente specifice.</p>

<h2>Cand are sens</h2>
<ul>
  <li>Dupa perioade cu exces alimentar (sarbatori, vacante).</li>
  <li>La schimbarea anotimpurilor (primavara, toamna).</li>
  <li>Dupa cure antibiotice lungi (cu sustinerea microbiotei).</li>
  <li>Cand simti <strong>oboseala constanta</strong>, <strong>balonare</strong>, <strong>ten inchis</strong> — semnale subiective, dar valide.</li>
</ul>

<h2>Un program simplu de 14 zile</h2>

<h3>Principii de baza</h3>
<ul>
  <li>Hidratare: 30-35 ml apa/kg/zi.</li>
  <li>Legume crucifere (broccoli, conopida, varza) — sustin faza II hepatica.</li>
  <li>Fibre solubile (ovaz, in, chia) — leaga toxinele in intestin.</li>
  <li>Proteina la fiecare masa (fara acizi aminati suficienti, ficatul nu detoxifica).</li>
  <li>Reducere zahar rafinat, alcool, ultra-procesate.</li>
  <li>Somn 7-9h.</li>
  <li>Miscare zilnica (150 min/saptamana).</li>
</ul>

<h3>Suplimente de sprijin (optional)</h3>
<ul>
  <li>Silimarina (extract de armurariu) — 200-400 mg/zi pentru ficat.</li>
  <li>Magneziu bisglicinat — 200-400 mg/zi pentru tranzit si somn.</li>
  <li>Fibre solubile in plus (psyllium, inulina).</li>
  <li>Probiotice multi-tulpina.</li>
  <li>Vitamina C 500-1000 mg/zi ca antioxidant.</li>
</ul>
<p>Alege suplimente dupa criteriile din <a href="/ghid/cum-alegi-supliment">ghidul nostru</a>.</p>

<h2>Ce <em>sa nu</em> faci</h2>
<ul>
  <li>Sa nu sari peste mese toata ziua doar pentru "a pierde kilograme" — detox nu este dieta de slabit.</li>
  <li>Sa nu folosesti laxative drastice — compromit microbiota.</li>
  <li>Sa nu cumperi "pastile detox" nespecifice cu pretentii de "curatare in 3 zile".</li>
</ul>

<h2>Semnale ca programul functioneaza</h2>
<ul>
  <li>Tranzit mai regulat.</li>
  <li>Somn mai bun in saptamana 2.</li>
  <li>Energie mai stabila.</li>
  <li>Ten mai luminos.</li>
</ul>

<h2>Dupa program</h2>
<p>Daca dupa 14 zile revii la obiceiurile vechi, castigul dispare in 2-3 saptamani. Pastreaza 2-3 schimbari: mai multa apa, 5 portii legume/zi, somn consistent. Asta este adevaratul detox.</p>

<p>Vezi <a href="/produse/suplimente-alimentare">suplimentele Snep</a> si <a href="/produse/alimente-functionale">alimentele functionale</a> care pot sustine un program bine construit. Citeste si <a href="/ghid/suplimente-alimentare-naturale">ghidul suplimentelor</a>.</p>
`,
  },
  {
    slug: "suplimente-imunitate-iarna",
    title: "Suplimente pentru imunitate: ce ia sens iarna",
    excerpt:
      "Vitamina D, zinc, vitamina C, propolis, ganoderma — ce spune literatura despre fiecare si cum construiesti o rutina simpla de iarna.",
    tags: ["imunitate", "vitamina D", "zinc", "vitamina C", "propolis"],
    meta_title: "Suplimente pentru imunitate: ce are sens iarna | Olivox",
    meta_description:
      "Vitamina D, zinc, vitamina C, propolis, ganoderma pentru imunitate: dozaj si cum construiesti o rutina de iarna.",
    weeksBack: 5,
    body: `
<p>In Romania, lunile octombrie-martie aduc mai putin soare, aer uscat in casa si circulatie virala intensa. O rutina de suplimente bine construita nu "te face imun", dar inclina balanta in favoarea ta. Iata ce are fundament si cum se combina.</p>

<h2>Vitamina D3</h2>
<p>Cel mai des deficit la romani. Intre octombrie si martie, la latitudinea noastra, sinteza cutanata este aproape zero. Doza uzuala de mentenanta: <strong>1000-2000 UI/zi</strong> pentru adulti, cu o masa care contine grasimi. Doze mai mari (4000 UI) au sens doar dupa testarea 25-OH D3.</p>

<h2>Zinc</h2>
<p>Esential pentru functia celulelor imune. Formele biodisponibile: picolinat, bisglicinat, citrat. Doza: <strong>10-15 mg/zi</strong> in mentenanta; 25-40 mg/zi pentru 7-10 zile la debut de infectie virala.</p>

<h2>Vitamina C</h2>
<p>Nu "previne raceala" dar poate scurta durata cu 8-14%. Doza: <strong>500-1000 mg/zi</strong>, fractionat in 2 prize. Preferabil forme buffered (ascorbat de sodiu / calciu) sau liposomala la doze mari.</p>

<h2>Propolis</h2>
<p>Traditional romanesc, cu studii moderne pe activitate antimicrobiana. Tincturi sau spray-uri cu propolis pentru gat sunt utile la primele semne. Atentie la alergia la produse apicole.</p>

<h2>Ganoderma / Reishi</h2>
<p>Imunomodulator adaptogen. In extract standardizat cu beta-glucani. Efectele se resimt dupa 6-12 saptamani de utilizare constanta. Poate fi consumat si sub forma de <a href="/produse/cafea">cafea functionala</a>.</p>

<h2>Probiotice</h2>
<p>70-80% din sistemul imun este in intestin. O tulpina multi-specie, 10-20 miliarde UFC/zi, in cure de 1-2 luni, mai ales dupa antibiotice.</p>

<h2>Rutina practica de iarna</h2>
<ul>
  <li>Dimineata: vitamina D3 + zinc + probiotic (cu masa).</li>
  <li>Pranz: vitamina C 500 mg.</li>
  <li>Seara: magneziu bisglicinat 300 mg (pentru somn, care sustine imunitatea).</li>
  <li>La nevoie (primele semne): spray propolis gat + zinc 25 mg 7 zile.</li>
</ul>

<h2>Ce nu uita</h2>
<p>Suplimentele sunt stratul 3. Stratul 1 este <strong>somnul</strong> (7-9h). Stratul 2 este <strong>alimentatia</strong> (5 portii legume/fructe/zi, proteina la fiecare masa). Fara ele, suplimentele lucreaza in gol.</p>

<p>Pentru alegerea unui supliment de calitate citeste <a href="/ghid/cum-alegi-supliment">checklist-ul nostru</a> si vezi <a href="/produse/suplimente-alimentare">catalogul Snep</a>.</p>
`,
  },
  {
    slug: "cosmetice-naturale-fara-parabeni",
    title: "Cosmetice naturale fara parabeni: ce sa cauti pe eticheta",
    excerpt:
      "Ce sunt parabenii, de ce cauti alternative, si care sunt INCI-urile pe care sa le eviti vs cele curate — ghid practic pentru beauty naturala.",
    tags: ["cosmetice naturale", "parabeni", "ingrediente", "beauty"],
    meta_title: "Cosmetice naturale fara parabeni: ghid etichete | Olivox",
    meta_description:
      "Cum citesti eticheta unui cosmetic natural. Ce ingrediente eviti (parabeni, SLS, siliconi) si ce alternative cauti.",
    weeksBack: 6,
    body: `
<p>"Fara parabeni" a devenit un claim de marketing aproape universal. Dar asta nu inseamna ca produsul e si "bun". Acest ghid iti arata cum sa citesti eticheta unui cosmetic cu atentie, ce sa eviti real si ce sa cauti pozitiv.</p>

<h2>Ce sunt parabenii si de ce au proasta reputatie</h2>
<p>Parabenii (metil-, etil-, propil-, butilparaben) sunt conservanti folositi de zeci de ani pentru a preveni cresterea bacteriilor si mucegaiurilor in cosmetice. Controversele vin din studii care au detectat parabeni in tesuturi si au ridicat intrebari despre activitate estrogenica slaba. UE a restrictionat butil- si propilparaben si ii considera siguri doar in limite reduse.</p>

<p>Majoritatea brandurilor naturale prefera alternative: alcool benzilic, fenoxietanol (discutat si el), sorbati, extracte naturale cu rol antimicrobian.</p>

<h2>Ingrediente de evitat (sau de verificat cu atentie)</h2>
<ul>
  <li><strong>SLS / SLES</strong> (Sodium Lauryl/Laureth Sulfate) — surfactanti agresivi, iau un ten sensibil si il usuca.</li>
  <li><strong>Dioxid de titan nanoparticule</strong> in forme inhalabile (pudre).</li>
  <li><strong>Siliconi</strong> (Dimethicone, Cyclopentasiloxane) — nu sunt toxici, dar ocluzeaza porii si par "netezire cosmetica" fara hranire reala.</li>
  <li><strong>Parfumuri sintetice</strong> ascunse in "Fragrance" / "Parfum" — principala sursa de alergii cosmetice.</li>
  <li><strong>PEG</strong> in concentratii mari — pot fi contaminati cu 1,4-dioxan.</li>
  <li><strong>Formaldehyde releasers</strong> (DMDM Hydantoin, Imidazolidinyl Urea) — eliberatoare de formaldehida.</li>
</ul>

<h2>Ingrediente de cautat pozitiv</h2>
<ul>
  <li><strong>Uleiuri vegetale</strong> presate la rece: jojoba, migdale dulci, argan, rosehip.</li>
  <li><strong>Vitamina E</strong> (Tocopherol) — antioxidant natural, si conservant partial.</li>
  <li><strong>Hyaluronic acid (Sodium Hyaluronate)</strong> — hidratant eficient.</li>
  <li><strong>Niacinamide</strong> — netezeste textura, uniformizeaza pigmentul.</li>
  <li><strong>Ceramide</strong> — repara bariera cutanata.</li>
  <li><strong>Extracte de plante</strong> (musetel, galbenele, aloe) cu certificari BIO/COSMOS.</li>
</ul>

<h2>Cum citesti o lista INCI</h2>
<p>Ingredientele sunt listate in ordinea descrescatoare a concentratiei. Primele 5-7 definesc produsul. Daca apa (<em>Aqua</em>) este prima si imediat dupa apar siliconi si parfum, ai un produs cu marketing peste substanta.</p>

<h2>Certificari utile</h2>
<ul>
  <li>COSMOS Organic / Natural.</li>
  <li>Ecocert.</li>
  <li>BDIH.</li>
  <li>ICEA.</li>
</ul>

<h2>Rutina minima "curata"</h2>
<ol>
  <li>Demachiant bland (ulei sau lapte).</li>
  <li>Tonic fara alcool.</li>
  <li>Ser cu hyaluronic acid sau niacinamide.</li>
  <li>Crema hidratanta cu uleiuri vegetale + ceramide.</li>
  <li>SPF dimineata.</li>
</ol>

<p>Vezi gama <a href="/produse/beauty-snep">Beauty Snep</a> si <a href="/produse/make-up">Make-up</a> pentru alternative curate. Pentru uleiuri esentiale (cu rol cosmetic diluat), intra in <a href="/produse/uleiuri-esentiale">sectiunea dedicata</a>.</p>
`,
  },
];

async function main() {
  // today comes from environment date used by the assistant; use real today for publish dates
  const now = new Date();

  let inserted = 0;
  let updated = 0;

  for (const a of ARTICLES) {
    const published = new Date(now);
    published.setDate(published.getDate() - a.weeksBack * 7);

    const body = a.body.trim();
    const row = {
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      body,
      tags: a.tags,
      meta_title: a.meta_title,
      meta_description: a.meta_description,
      published_at: published.toISOString(),
      is_published: true,
      author: "Redactia Olivox",
      updated_at: new Date().toISOString(),
    };

    // Check if exists
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", a.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("articles").update(row).eq("slug", a.slug);
      if (error) {
        console.error(`  [UPDATE FAIL] ${a.slug}: ${error.message}`);
        continue;
      }
      updated++;
      console.log(`  [UPDATED] ${a.slug}`);
    } else {
      const { error } = await supabase.from("articles").insert(row);
      if (error) {
        console.error(`  [INSERT FAIL] ${a.slug}: ${error.message}`);
        continue;
      }
      inserted++;
      console.log(`  [INSERTED] ${a.slug}`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Updated: ${updated}, Total: ${ARTICLES.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
