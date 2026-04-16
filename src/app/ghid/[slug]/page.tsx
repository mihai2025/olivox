import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ slug: string }>;
}

type GuideEntry = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  intro: string;
  body: string; // HTML
  faq?: { q: string; a: string }[];
  relatedCategories: { label: string; href: string }[];
  relatedProducts: { label: string; href: string }[];
  relatedArticles?: { label: string; href: string }[];
};

// Static registry — one place to edit/extend pillar guides.
const GUIDES: Record<string, GuideEntry> = {
  "suplimente-alimentare-naturale": {
    slug: "suplimente-alimentare-naturale",
    title: "Ghidul suplimentelor alimentare naturale",
    metaTitle: "Ghid suplimente alimentare naturale | Olivox",
    metaDescription:
      "Ghid complet despre suplimente alimentare naturale: cum le alegi, cand sunt utile, ce certificari conteaza si ce produse Snep recomandam.",
    keywords:
      "suplimente alimentare naturale, suplimente pe baza de plante, suplimente calitate Snep, suplimente Romania, ghid suplimente",
    h1: "Ghidul suplimentelor alimentare naturale",
    intro:
      "Suplimentele alimentare au devenit parte din rutina zilnica a tot mai multor romani. Corect alese si dozate, ele completeaza o alimentatie echilibrata si sustin functii fiziologice importante — de la imunitate la tonus si sanatate cardiovasculara. Acest ghid te ajuta sa intelegi ce sunt, cum functioneaza si cum le alegi in siguranta.",
    body: `
<h2>Ce sunt suplimentele alimentare?</h2>
<p>Suplimentele alimentare sunt produse concepute pentru a <strong>completa dieta</strong> cu nutrienti care, in anumite perioade sau conditii de viata, pot fi insuficienti: vitamine, minerale, aminoacizi, acizi grasi esentiali, fibre, extracte vegetale sau probiotice. Ele nu inlocuiesc medicamentele si nu sunt destinate tratarii bolilor, dar sustin procesele naturale ale organismului.</p>
<p>In UE, suplimentele alimentare sunt reglementate strict prin Directiva 2002/46/CE si prin normele ANSVSA/ANMDMR din Romania. Fiecare produs trebuie sa fie notificat inainte de comercializare.</p>

<h2>Cand au sens suplimentele?</h2>
<ul>
  <li><strong>Deficite confirmate</strong> (ex. vitamina D iarna, fier in anemie feripriva, B12 la vegetarieni).</li>
  <li><strong>Perioade de efort fizic sau mental</strong> (sesiune, sport intens, convalescenta).</li>
  <li><strong>Sarcina si alaptare</strong> (acid folic, iod, DHA — intotdeauna sub indrumarea medicului).</li>
  <li><strong>Schimbari de sezon</strong> — tranzitia primavara/toamna solicita sistemul imunitar.</li>
  <li><strong>Alimentatie restrictiva</strong> — dieta vegana, alergii, intolerante.</li>
</ul>

<h2>Ce categorii gasesti in catalogul Snep distribuit de Olivox</h2>
<h3>Vitamine si minerale</h3>
<p>Formulari cu biodisponibilitate ridicata (ex. forme chelate pentru magneziu si zinc, vitamina D3 in ulei, metilfolat in loc de acid folic). Verifica <a href="/produse/suplimente-alimentare">categoria Suplimente Alimentare</a> pentru gama completa.</p>

<h3>Extracte din plante (fitoterapice)</h3>
<p>Echinacea, ganoderma, aloe, propolis — folosite traditional in Romania pentru sustinerea imunitatii si a confortului digestiv. Vezi si <a href="/produse/alimente-functionale">alimentele functionale</a> care combina extracte active cu baze alimentare (ceaiuri, shake-uri, cafea).</p>

<h3>Acizi grasi esentiali (Omega 3)</h3>
<p>Formule EPA/DHA purificate, fara contaminanti grei. Citeste articolul dedicat: <a href="/articole/omega-3-functie-cardiaca">Cum sprijina omega 3 functia cardiaca</a>.</p>

<h3>Probiotice si fibre</h3>
<p>Pentru echilibrul florei intestinale, mai ales dupa antibioterapie sau in perioade de stres.</p>

<h2>Cum alegi un supliment de calitate</h2>
<p>Nu orice pilula "naturala" de pe piata respecta standarde farmaceutice. Principalele repere:</p>
<ul>
  <li><strong>Producator cunoscut</strong> cu certificari ISO/GMP — catalogul Snep este fabricat in Italia in unitati certificate.</li>
  <li><strong>Forma chimica a ingredientului activ</strong> (ex. citrat / bisglicinat de magneziu vs oxid de magneziu — absorbtie foarte diferita).</li>
  <li><strong>Dozaj clar afisat</strong> pe eticheta, in mg/UI, nu doar in "proprietary blend".</li>
  <li><strong>Excipienti curati</strong> — fara coloranti inutili, fara dioxid de titan.</li>
  <li><strong>Data de expirare si lot</strong> lizibile.</li>
</ul>
<p>Pentru detalii, citeste ghidul dedicat: <a href="/ghid/cum-alegi-supliment">Cum alegi un supliment alimentar de calitate</a>.</p>

<h2>Cum se administreaza corect</h2>
<p>Respecta doza recomandata pe eticheta si momentul administrarii:</p>
<ul>
  <li>Vitaminele <strong>liposolubile</strong> (A, D, E, K) — cu o masa care contine grasimi.</li>
  <li>Vitaminele <strong>hidrosolubile</strong> (C, grupul B) — pe stomacul gol sau cu apa.</li>
  <li>Magneziul seara, pentru efectul de relaxare.</li>
  <li>Probioticele dimineata, inainte de micul dejun.</li>
</ul>
<p>Daca urmezi tratamente medicamentoase sau ai conditii cronice, consulta medicul sau farmacistul inainte de a incepe orice supliment.</p>

<h2>Greseli frecvente</h2>
<ul>
  <li>Megadoze fara indicatie — vitaminele liposolubile se pot acumula.</li>
  <li>Amestec de multe suplimente cu ingrediente suprapuse.</li>
  <li>Asteptari nerealiste — suplimentele functioneaza in <em>saptamani</em>, nu in <em>ore</em>.</li>
  <li>Ignorarea interactiunilor (ex. fier + calciu in aceeasi priza isi reduc reciproc absorbtia).</li>
</ul>

<h2>De ce Snep si de ce Olivox</h2>
<p>Snep SpA este un producator italian cu peste doua decenii de experienta in suplimente, alimente functionale si cosmetice naturale. Olivox.ro este distribuitorul oficial in Romania: livram in 3-5 zile lucratoare, cu facturare corecta si suport in limba romana. Afla mai multe pe pagina <a href="/brand/snep">brand Snep</a>.</p>
`,
    faq: [
      {
        q: "Pot lua mai multe suplimente in acelasi timp?",
        a: "Da, dar cu atentie la interactiuni. De exemplu, fierul si calciul se administreaza la ore diferite. Cel mai sigur este sa construiesti rutina treptat si sa discuti cu un specialist daca iei deja medicamente.",
      },
      {
        q: "In cat timp se vad efectele unui supliment?",
        a: "Pentru vitamine si minerale in deficit, efectele se resimt in 2-6 saptamani. Extractele din plante (ex. ganoderma) necesita uneori 1-3 luni de administrare constanta.",
      },
      {
        q: "Sunt suplimentele Snep certificate?",
        a: "Da. Produsele sunt fabricate in Italia in unitati cu certificare GMP, cu materii prime trasabile si notificate conform legislatiei UE. Olivox distribuie exclusiv catalogul oficial.",
      },
      {
        q: "Pot da suplimente copiilor?",
        a: "Doar suplimentele formulate expres pentru copii, la dozajul indicat pe eticheta si — ideal — cu avizul medicului pediatru.",
      },
    ],
    relatedCategories: [
      { label: "Suplimente alimentare", href: "/produse/suplimente-alimentare" },
      { label: "Alimente functionale", href: "/produse/alimente-functionale" },
      { label: "Cafea functionala", href: "/produse/cafea" },
    ],
    relatedProducts: [
      { label: "Vezi gama Snep Suplimente", href: "/produse/suplimente-alimentare" },
      { label: "Alimente functionale Snep", href: "/produse/alimente-functionale" },
    ],
    relatedArticles: [
      { label: "Cum sprijina omega 3 functia cardiaca", href: "/articole/omega-3-functie-cardiaca" },
      { label: "Programe detox: cand ai nevoie", href: "/articole/programe-detox-cand-ai-nevoie" },
    ],
  },

  "uleiuri-esentiale-utilizari": {
    slug: "uleiuri-esentiale-utilizari",
    title: "Uleiuri esentiale: utilizari, beneficii, ghid complet",
    metaTitle: "Uleiuri esentiale: utilizari, beneficii, ghid | Olivox",
    metaDescription:
      "Ghid complet uleiuri esentiale: cum le folosesti in aromaterapie, pe piele, in casa. Beneficii, diluari, reteta esentiala pentru incepatori.",
    keywords:
      "uleiuri esentiale, uleiuri esentiale utilizari, uleiuri esentiale beneficii, aromaterapie, ulei esential lavanda, ulei esential tea tree",
    h1: "Uleiuri esentiale: utilizari, beneficii si ghid complet",
    intro:
      "Uleiurile esentiale sunt esente volatile obtinute din plante aromatice prin distilare cu abur sau presare la rece. Folosite corect, ele pot transforma atmosfera unei camere, pot sustine relaxarea, somnul si confortul pielii. Folosite gresit, pot irita. Acest ghid te ajuta sa eviti greselile clasice.",
    body: `
<h2>Ce este un ulei esential — si ce NU este</h2>
<p>Un <strong>ulei esential pur</strong> este un extract concentrat al unei plante: o singura planta, un singur chemotip, fara diluanti. Ruleta comerciala contine insa multe "uleiuri parfumate" sau "fragrance oils" care sunt compusi sintetici — acestia au <em>doar parfum</em>, nu proprietatile fitochimice ale plantei.</p>
<p>Cand cumperi, verifica pe eticheta: denumirea latina (ex. <em>Lavandula angustifolia</em>), lotul, tara de origine, metoda de extractie (distilare/presare la rece) si mentiunea "100% pur". <a href="/produse/uleiuri-esentiale">Uleiurile esentiale din catalogul Snep</a> respecta aceste criterii.</p>

<h2>Principalele metode de utilizare</h2>

<h3>1. Difuzor cu ultrasunete</h3>
<p>Cel mai simplu mod de a beneficia de aromaterapie. 3-6 picaturi la 200 ml apa, 20-30 de minute de difuzare, pauza de macar o ora. Aerisiti incaperea intre sesiuni.</p>

<h3>2. Aplicare topica (pe piele)</h3>
<p>Niciodata nepur. Dilueaza in ulei purtator (migdale dulci, jojoba, cocos fractionat):</p>
<ul>
  <li>Adulti: 2-3% (aprox. 12-18 picaturi la 30 ml ulei purtator).</li>
  <li>Fata si pielea sensibila: 0,5-1%.</li>
  <li>Copii peste 6 ani: 0,5-1%, doar uleiuri blande (lavanda, mandarina).</li>
</ul>
<p>Fa intotdeauna <strong>test patch</strong> pe antebrat si asteapta 24h.</p>

<h3>3. Inhalatii uscate</h3>
<p>1-2 picaturi pe un sartulet de hartie sau pe palme (palme cupa, respiratie adanca) — metoda rapida pentru congestie sau stres acut.</p>

<h3>4. Bai aromatice</h3>
<p>5-8 picaturi amestecate intr-o lingura de sare Epsom sau ulei, apoi in apa calda. Nu pune uleiul direct in apa — pluteste la suprafata si irita.</p>

<h3>5. Produse de curatenie naturale</h3>
<p>Citric (lamaie, portocala) si tea tree adauga putere antimicrobiana spray-urilor DIY pe baza de otet si bicarbonat. Combina frumos cu gama <a href="/produse/parfumuri-de-camera">Parfumuri de camera Snep</a> pentru o casa cu aer curat si placut.</p>

<h2>Top uleiuri esentiale pentru incepatori</h2>

<h3>Lavanda (<em>Lavandula angustifolia</em>)</h3>
<p>Regina aromaterapiei: relaxare, somn, piele iritata. Citeste articolul dedicat: <a href="/articole/ulei-esential-lavanda-beneficii">Beneficiile uleiului esential de lavanda</a>.</p>

<h3>Tea Tree (<em>Melaleuca alternifolia</em>)</h3>
<p>Proprietati antimicrobiene recunoscute. Util pentru imperfectiuni cutanate, dezinfectanti naturali, ingrijirea scalpului.</p>

<h3>Eucalipt (<em>Eucalyptus globulus</em>)</h3>
<p>Decongestionant natural — difuzor in timpul raceli, inhalatii, masaj piept (diluat).</p>

<h3>Menta piperita (<em>Mentha piperita</em>)</h3>
<p>Racoritor, revigorant, util pentru oboseala si dureri de cap tensionale (aplicat pe tample, bine diluat).</p>

<h3>Lamaie (<em>Citrus limon</em>)</h3>
<p>Refreshing, purificator de aer. Atentie — citricele sunt fotosensibilizante: nu aplica pe piele expusa la soare 12 ore dupa utilizare.</p>

<h2>Precautii esentiale</h2>
<ul>
  <li><strong>Sarcina si alaptare</strong>: multe uleiuri (salvie, rozmarin, ienupar) sunt contraindicate.</li>
  <li><strong>Copii sub 3 ani</strong>: evita mentol, eucalipt 1,8-cineol puternic — pot declansa spasm respirator.</li>
  <li><strong>Animale de companie</strong>: pisicile metabolizeaza prost uleiurile esentiale. Difuzor doar in camere separate si bine ventilate.</li>
  <li><strong>Niciodata intern</strong> fara supraveghere calificata.</li>
</ul>

<h2>Cum le depozitezi</h2>
<p>Sticle din sticla bruna sau albastra, loc racoros, intunecat, capac bine inchis. Citricele se oxideaza in 1-2 ani; lavanda si lemnoasele pot rezista 3-5 ani.</p>

<h2>Reteta de start — 3 formule practice</h2>
<ul>
  <li><strong>Somn linistit</strong>: 3 picaturi lavanda + 2 picaturi mandarina in difuzor, cu 30 min inainte de culcare.</li>
  <li><strong>Focus lucru</strong>: 2 picaturi menta + 2 picaturi lamaie + 1 picatura rozmarin.</li>
  <li><strong>Ulei de masaj relaxant</strong>: 30 ml ulei de migdale + 5 picaturi lavanda + 3 picaturi portocala + 2 picaturi musetel roman.</li>
</ul>
`,
    faq: [
      {
        q: "Pot pune uleiul esential direct pe piele?",
        a: "Cu foarte rare exceptii (lavanda, tea tree, pe zone foarte mici), nu. Dilueaza intotdeauna in ulei purtator (migdale, jojoba, cocos fractionat) la 1-3%.",
      },
      {
        q: "Uleiurile esentiale sunt sigure pentru copii?",
        a: "Da, dar cu restrictii: sub 6 ani doar uleiuri blande (lavanda, mandarina), diluare maxima 0,5-1%, niciodata direct pe fata. Sub 3 ani — difuzor la distanta, fara contact cutanat.",
      },
      {
        q: "Cat timp rezista un ulei esential?",
        a: "Lavanda, lemnoasele si patchouli — 3-5 ani. Citricele (lamaie, portocala, bergamota) — 1-2 ani, apoi se oxideaza.",
      },
      {
        q: "Ce diferenta este intre ulei esential si ulei parfumat?",
        a: "Uleiul esential este extras din planta si contine compusi fitochimici activi. Uleiul parfumat (fragrance oil) este sintetic — are doar aroma, fara efectele plantei.",
      },
    ],
    relatedCategories: [
      { label: "Uleiuri esentiale", href: "/produse/uleiuri-esentiale" },
      { label: "Parfumuri de camera", href: "/produse/parfumuri-de-camera" },
      { label: "Cosmetice naturale", href: "/produse/beauty-snep" },
    ],
    relatedProducts: [
      { label: "Vezi toate uleiurile esentiale Snep", href: "/produse/uleiuri-esentiale" },
      { label: "Difuzoare si parfumuri de camera", href: "/produse/parfumuri-de-camera" },
    ],
    relatedArticles: [
      { label: "Beneficiile uleiului esential de lavanda", href: "/articole/ulei-esential-lavanda-beneficii" },
    ],
  },

  "cum-alegi-supliment": {
    slug: "cum-alegi-supliment",
    title: "Cum alegi un supliment alimentar de calitate",
    metaTitle: "Cum alegi un supliment alimentar de calitate | Olivox",
    metaDescription:
      "Checklist practic: 10 criterii pentru a alege un supliment alimentar sigur si eficient — forma chimica, dozaj, certificari, producator.",
    keywords:
      "cum alegi un supliment, supliment de calitate, supliment biodisponibilitate, certificari suplimente, eticheta supliment",
    h1: "Cum alegi un supliment alimentar de calitate",
    intro:
      "Pe rafturi sunt mii de suplimente. Unele sunt excelente, multe sunt mediocre, altele sunt mai rele decat inutile. Acest ghid iti ofera un <strong>checklist de 10 criterii</strong> pe care sa le verifici inainte sa cumperi orice supliment alimentar.",
    body: `
<h2>1. Cine este producatorul?</h2>
<p>Prima intrebare nu este "ce contine?", ci "cine l-a fabricat?". Un producator cu istoric lung, cu unitati certificate GMP (Good Manufacturing Practice) si cu trasabilitate pe lot ofera o siguranta mult mai mare decat un brand anonim care foloseste productie in regim de marca privata. Catalogul <a href="/brand/snep">Snep SpA</a> este fabricat in Italia, in unitati certificate.</p>

<h2>2. Forma chimica a ingredientului activ</h2>
<p>Acelasi element are forme diferite, cu absorbtii diferite:</p>
<ul>
  <li><strong>Magneziu</strong>: bisglicinat / citrat (absorbtie buna) vs oxid (absorbtie slaba, efect laxativ).</li>
  <li><strong>Zinc</strong>: picolinat / bisglicinat vs sulfat.</li>
  <li><strong>Vitamina B9</strong>: metilfolat (forma activa) vs acid folic.</li>
  <li><strong>Vitamina D</strong>: D3 (colecalciferol) > D2 (ergocalciferol).</li>
</ul>
<p>Daca pe eticheta scrie doar "magneziu 200 mg" fara forma, este semnal de intrebat.</p>

<h2>3. Dozaj clar, nu "proprietary blend"</h2>
<p>Formulele tip "blend" listeaza ingredientele amestecate, cu o singura greutate totala. Asta ascunde cat anume ai din fiecare. Etichetele serioase indica mg/UI pe ingredient si procentul din doza zilnica de referinta (DZR).</p>

<h2>4. Exista studii pe doza propusa?</h2>
<p>Multe extracte din plante au efecte dovedite doar la doze specifice (ex. curcumina — peste 500 mg/zi cu piperina; ganoderma — extract standardizat cu minim 20% polizaharide). Daca produsul ofera un sfert din doza din studii, efectul va fi proportional.</p>

<h2>5. Excipienti si aditivi</h2>
<p>Aditivii nu sunt toti "rai" — unii sunt necesari pentru forma de comprimat. Dar evita:</p>
<ul>
  <li>Dioxid de titan (E171) — controversat in UE.</li>
  <li>Coloranti azoici (E102, E110, E129).</li>
  <li>Grasimi partial hidrogenate.</li>
  <li>Indulcitori artificiali daca exista alternativa naturala.</li>
</ul>

<h2>6. Forma galenica</h2>
<p>Capsule vegetale, comprimate, lichide, pulbere — fiecare are avantaje:</p>
<ul>
  <li>Capsule — protectie stomac, dozare precisa.</li>
  <li>Lichid — absorbtie rapida, util pentru copii si varstnici.</li>
  <li>Pulbere — flexibilitate, ideala pentru proteine si pudre superalimentare.</li>
</ul>

<h2>7. Certificari relevante</h2>
<ul>
  <li><strong>GMP</strong> — productia respecta standarde farmaceutice.</li>
  <li><strong>ISO 22000 / HACCP</strong> — siguranta alimentara.</li>
  <li><strong>Non-GMO, BIO</strong> — daca te intereseaza.</li>
  <li><strong>Notificare ANSVSA/ANMDMR</strong> — obligatorie pentru comercializare in Romania.</li>
</ul>

<h2>8. Prospect & avertismente</h2>
<p>Un supliment bine documentat are prospect clar: doza, mod de administrare, avertismente (sarcina, alaptare, medicatie concurenta), data de expirare vizibila, lot.</p>

<h2>9. Pretul — foarte mic sau foarte mare?</h2>
<p>Un pret suspect de mic inseamna de regula ingrediente ieftine, doze mici sau fabricatie low-cost. Un pret foarte mare nu garanteaza insa calitate — uneori platesti doar brandul. Compara pretul pe doza efectiva (nu pe cutie), si raporteaza la o luna de tratament.</p>

<h2>10. Reputatia distribuitorului</h2>
<p>Ai nevoie de un distribuitor care:</p>
<ul>
  <li>Ofera factura si documente conforme.</li>
  <li>Are suport in limba romana.</li>
  <li>Livreaza rapid (3-5 zile lucratoare).</li>
  <li>Accepta retur conform OUG 34/2014.</li>
</ul>
<p>Olivox.ro este distribuitorul oficial <a href="/brand/snep">Snep</a> in Romania si respecta toate aceste criterii.</p>

<h2>Bonus — ce NU face un supliment de calitate</h2>
<ul>
  <li>NU promite "vindecari miraculoase" — legea interzice asemenea afirmatii.</li>
  <li>NU se administreaza "cat vrei tu" — respecta doza.</li>
  <li>NU inlocuieste un tratament prescris.</li>
</ul>

<p>Citeste si <a href="/ghid/suplimente-alimentare-naturale">Ghidul suplimentelor alimentare naturale</a> pentru contextul mai larg si <a href="/produse/suplimente-alimentare">catalogul complet de suplimente Snep</a>.</p>
`,
    faq: [
      {
        q: "Cum imi dau seama daca un supliment este autentic?",
        a: "Cumpara de la distribuitor oficial, verifica lotul si data de expirare, urmareste sigiliul intact al ambalajului si cere factura fiscala. Pentru Snep in Romania, distribuitorul oficial este olivox.ro.",
      },
      {
        q: "Suplimentele ieftine sunt automat slabe?",
        a: "Nu neaparat, dar daca pretul este semnificativ sub media categoriei, verifica dozajul si forma chimica — de regula acolo se face economie.",
      },
      {
        q: "Cat timp ar trebui sa iau un supliment inainte sa evaluez efectul?",
        a: "Minim 4-8 saptamani pentru vitamine si minerale, 8-12 saptamani pentru extracte din plante (adaptogene, ganoderma).",
      },
    ],
    relatedCategories: [
      { label: "Suplimente alimentare", href: "/produse/suplimente-alimentare" },
      { label: "Alimente functionale", href: "/produse/alimente-functionale" },
    ],
    relatedProducts: [
      { label: "Catalog suplimente Snep", href: "/produse/suplimente-alimentare" },
    ],
    relatedArticles: [
      { label: "Beneficiile uleiului esential de lavanda", href: "/articole/ulei-esential-lavanda-beneficii" },
      { label: "Cum sprijina omega 3 functia cardiaca", href: "/articole/omega-3-functie-cardiaca" },
    ],
  },

  "cafea-functionala-ganoderma": {
    slug: "cafea-functionala-ganoderma",
    title: "Cafea functionala cu Ganoderma: beneficii si utilizari",
    metaTitle: "Cafea cu Ganoderma: beneficii, utilizari, ghid | Olivox",
    metaDescription:
      "Ce este cafeaua functionala cu ganoderma lucidum (reishi), ce beneficii are, cum se prepara si cum o integrezi in rutina zilnica.",
    keywords:
      "cafea cu ganoderma, cafea functionala, ganoderma lucidum, reishi cafea, cafea cu ciuperci, cafea Snep",
    h1: "Cafea functionala cu Ganoderma: beneficii si utilizari",
    intro:
      "Cafeaua cu Ganoderma combina energia placuta a cafelei cu proprietatile adaptogene ale ciupercii Reishi (<em>Ganoderma lucidum</em>), folosita de mii de ani in medicina traditionala asiatica. Rezultatul: o cafea cu gust familiar, dar cu un profil mai echilibrat — mai putin agitatie, mai mult focus.",
    body: `
<h2>Ce este Ganoderma Lucidum (Reishi)?</h2>
<p><em>Ganoderma lucidum</em>, cunoscuta si ca Reishi sau Lingzhi, este o ciuperca medicinala folosita de peste 2000 de ani in Asia pentru sustinerea imunitatii, a energiei si a longevitatii. Compusii activi — <strong>polizaharide (beta-glucani), triterpene si peptide</strong> — sunt considerati adaptogeni: ajuta organismul sa raspunda mai bine la stres.</p>

<h2>Ce este "cafeaua functionala"?</h2>
<p>Cafeaua functionala este o cafea clasica la care se adauga ingrediente cu <strong>efect fiziologic documentat</strong>: extracte de ciuperci (ganoderma, chaga, leu de leu), adaptogene (ashwagandha, rhodiola), MCT sau colagen. Ideea nu este sa inlocuiasca cafeaua, ci sa adauge beneficii si sa atenueze efectele mai putin placute ale cafeinei pure.</p>

<h2>Beneficiile posibile</h2>
<ul>
  <li><strong>Energie mai constanta</strong> — mai putine "crash-uri" dupa ora 11.</li>
  <li><strong>Focus mental</strong> — cafeina + polizaharidele din ganoderma lucreaza impreuna.</li>
  <li><strong>Sustinere imunitara</strong> — beta-glucanii din Reishi sunt studiati pentru modularea raspunsului imun.</li>
  <li><strong>Gust mai rotund</strong> — nota usor pamantie a ciupercii echilibreaza amareala.</li>
  <li><strong>Antioxidanti</strong> — atat din cafea, cat si din ganoderma.</li>
</ul>
<p>Nota: aceste beneficii sunt raportate in literatura si in traditia asiatica; nu sunt alegatii medicale. Cafeaua functionala nu trateaza boli.</p>

<h2>Cum se prepara cafeaua cu Ganoderma</h2>
<ol>
  <li>Un plic (de obicei 3-5 g pudra premium).</li>
  <li>150-180 ml apa fierbinte (nu clocotita — aprox. 85-90°C).</li>
  <li>Amesteca bine. Poti adauga lapte vegetal, scortisoara sau un varf de cocos rasa.</li>
  <li>Evita zaharul rafinat — mic de tot (miere, sirop de arar) daca ai nevoie.</li>
</ol>
<p>1-2 cesti pe zi sunt suficiente. Evita consumul dupa ora 16-17 daca esti sensibil la cafeina.</p>

<h2>Cui i se potriveste</h2>
<ul>
  <li>Celor care vor energie fara "jitters".</li>
  <li>Persoanelor cu program solicitat care cauta focus mental.</li>
  <li>Celor care vor sa reduca gradual cantitatea de cafea clasica.</li>
  <li>Iubitorilor de adaptogene si alimentatie functionala.</li>
</ul>

<h2>Cui NU i se recomanda (sau cu atentie)</h2>
<ul>
  <li>Persoane cu hipertensiune necontrolata sau aritmii.</li>
  <li>Femei insarcinate sau care alapteaza — cafeina limitata.</li>
  <li>Persoane sub anticoagulante — ganoderma poate potenta efectul; discuta cu medicul.</li>
  <li>Alergie la ciuperci.</li>
</ul>

<h2>Cafeaua cu Ganoderma din catalogul Snep</h2>
<p>Catalogul Snep include cafele functionale cu extract standardizat de Ganoderma Lucidum, ambalate in plicuri monodoza pentru o preparare rapida si o dozare constanta. Vezi <a href="/produse/cafea">cafeaua functionala Snep</a> in pagina dedicata si integreaza-o in rutina ta alaturi de <a href="/produse/alimente-functionale">restul alimentelor functionale</a>.</p>

<h2>Intrebari pe care si le pun consumatorii</h2>
<p>Gustul nu este foarte diferit de cafeaua obisnuita — ciuperca adauga o nota usor pamantie, amaruie, care se estompeaza cu lapte sau scortisoara. Cantitatea de cafeina este mai mica decat intr-un espresso dublu, comparabila cu o cafea filtru medie.</p>

<h2>Rutina recomandata pentru incepatori</h2>
<ul>
  <li><strong>Saptamana 1</strong>: 1 plic dimineata, inlocuind cafeaua obisnuita.</li>
  <li><strong>Saptamana 2-4</strong>: continui cu 1-2 plicuri pe zi. Observa energia, calitatea somnului, concentrarea.</li>
  <li><strong>Dupa o luna</strong>: faci o pauza de 7 zile si evaluezi diferenta.</li>
</ul>

<p>Pentru contextul mai larg al alimentelor functionale si al ghidului de suplimente citeste si <a href="/ghid/suplimente-alimentare-naturale">Ghidul suplimentelor alimentare naturale</a>.</p>
`,
    faq: [
      {
        q: "Cafeaua cu ganoderma te ajuta sa slabesti?",
        a: "Nu in mod direct. Ganoderma poate sustine metabolismul si reduce inflamatia sistemica, dar pierderea in greutate depinde de deficitul caloric total. Nu este un produs de slabit.",
      },
      {
        q: "Are cafeina?",
        a: "Da, contine cafeina naturala din cafea — in general mai putin decat un espresso dublu si ceva mai mult decat un ceai verde tare.",
      },
      {
        q: "O pot bea seara?",
        a: "Nu este recomandat daca esti sensibil la cafeina. Ideal inainte de ora 16:00.",
      },
      {
        q: "Pot combina cu alte suplimente?",
        a: "Da, majoritatea suplimentelor sunt compatibile. Atentie la anticoagulante (aspirina, warfarina) — ganoderma poate potenta efectul; intreaba medicul.",
      },
    ],
    relatedCategories: [
      { label: "Cafea functionala", href: "/produse/cafea" },
      { label: "Alimente functionale", href: "/produse/alimente-functionale" },
      { label: "Suplimente alimentare", href: "/produse/suplimente-alimentare" },
    ],
    relatedProducts: [
      { label: "Vezi cafeaua cu Ganoderma Snep", href: "/produse/cafea" },
    ],
    relatedArticles: [
      { label: "Cafea cu Ganoderma: ce este si cum se foloseste", href: "/articole/cafea-ganoderma-ce-este" },
      { label: "Programe detox: cand ai nevoie", href: "/articole/programe-detox-cand-ai-nevoie" },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES[slug];
  if (!g) return { title: "Ghid negasit | Olivox" };
  const url = `https://olivox.ro/ghid/${g.slug}`;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    keywords: g.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: g.metaTitle,
      description: g.metaDescription,
      url,
      siteName: "olivox.ro",
      type: "article",
      locale: "ro_RO",
      images: [{ url: "https://olivox.ro/husapersonalizata.webp", alt: g.title }],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = GUIDES[slug];
  if (!g) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.metaDescription,
    image: "https://olivox.ro/husapersonalizata.webp",
    author: { "@type": "Organization", name: "Olivox" },
    publisher: {
      "@type": "Organization",
      name: "olivox.ro",
      logo: { "@type": "ImageObject", url: "https://olivox.ro/favicon.ico" },
    },
    mainEntityOfPage: `https://olivox.ro/ghid/${g.slug}`,
    inLanguage: "ro-RO",
  };

  const faqJsonLd = g.faq && g.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: g.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasa", item: "https://olivox.ro" },
      { "@type": "ListItem", position: 2, name: "Ghiduri", item: "https://olivox.ro/articole" },
      { "@type": "ListItem", position: 3, name: g.title, item: `https://olivox.ro/ghid/${g.slug}` },
    ],
  };

  return (
    <div className="page-wrapper">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className="breadcrumb">
        <a href="/">Acasa</a> / <a href="/articole">Ghiduri</a> / <span>{g.title}</span>
      </nav>

      <article className="article-detail" style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
        <h1 className="article-detail__title">{g.h1}</h1>
        <p style={{ fontSize: "1.05rem", lineHeight: 1.65, margin: "16px 0 24px" }}>{g.intro}</p>
        <div className="article-detail__body" dangerouslySetInnerHTML={{ __html: g.body }} />

        {g.faq && g.faq.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2>Intrebari frecvente</h2>
            {g.faq.map((f, i) => (
              <div key={i} style={{ margin: "14px 0" }}>
                <h3 style={{ marginBottom: 4 }}>{f.q}</h3>
                <p style={{ margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </section>
        )}

        <section style={{ marginTop: 32, padding: 20, background: "#f7f5f0", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>Vezi si</h2>
          <h3>Categorii recomandate</h3>
          <ul>
            {g.relatedCategories.map((c) => (
              <li key={c.href}><a href={c.href}>{c.label}</a></li>
            ))}
          </ul>
          {g.relatedArticles && g.relatedArticles.length > 0 && (
            <>
              <h3>Articole conexe</h3>
              <ul>
                {g.relatedArticles.map((a) => (
                  <li key={a.href}><a href={a.href}>{a.label}</a></li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section style={{ marginTop: 32, textAlign: "center", padding: "28px 16px" }}>
          <h2>Gata sa explorezi catalogul Snep?</h2>
          <p>Livrare 3-5 zile lucratoare in toata Romania, factura fiscala si suport in limba romana.</p>
          <p style={{ marginTop: 16 }}>
            {g.relatedProducts.map((p, i) => (
              <a
                key={p.href}
                href={p.href}
                style={{
                  display: "inline-block",
                  margin: "6px 8px",
                  padding: "12px 22px",
                  background: i === 0 ? "#4a6b3a" : "#fff",
                  color: i === 0 ? "#fff" : "#4a6b3a",
                  border: "1px solid #4a6b3a",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {p.label}
              </a>
            ))}
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}
