import productHoney from "@/assets/product-honey.jpg";
import productWalnuts from "@/assets/product-walnuts.jpg";
import productAlmonds from "@/assets/product-almonds.jpg";
import storyMountains from "@/assets/story-mountains.jpg";

export type Variant = { weight: string; price: number };
export type NutritionRow = { label: string; value: string };

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  meta: string;
  images: string[];
  alt: string;
  variants: Variant[];
  shortDesc: string;
  description: string;
  origin: string;
  nutrition: NutritionRow[];
  category: "honey" | "nuts";
  soldOut?: boolean;
};

export type CartItem = {
  product: Product;
  variant: Variant;
  quantity: number;
};

export const fmtPrice = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ALL";

export const products: Product[] = [
  {
    id: "honey",
    name: "Mjaltë Gështenje Premium",
    subtitle: "Raw Chestnut Honey · Unfiltered & Unheated",
    meta: "Malësia e Madhe · Shqipëri Veriore",
    images: [productHoney, storyMountains],
    alt: "Kavanoz artizanal i mjaltit të gështenjës",
    category: "honey",
    variants: [
      { weight: "250g", price: 1300 },
      { weight: "500g", price: 2400 },
      { weight: "1kg", price: 4500 },
    ],
    shortDesc:
      "Mjaltë i papastërtuar nga gështanjat e egra të Alpeve Shqiptare. Mbledhur me dorë nga bletarë lokalë që ruajnë traditat e lashta bletare.",
    description: `Mjalti ynë i gështenjës vjen nga kosheret tradicionale të vendosura mbi 1,200 metra, midis pyjeve të dendura të Alpeve Shqiptare. Ky mjaltë i errët, i pasur, ka aromë të thellë e komplekse me nota bimore unike — karakteristikë e rajonit.

Ndryshe nga mjalti industrial, ky nuk kalon proceset e ngrohjes ose filtrimit. Mbetet raw dhe i gjallë — duke ruajtur të gjitha enzimat, polenet dhe vlerat e tij natyrale. Kristalizimi natyral me kalimin e kohës është shenjë e cilësisë, jo e defektit.`,
    origin: `Bletarët tanë janë familje vendase nga rajoni i Tropojës dhe Kukësit, tradita e të cilëve daton mbi tri breza. Ata punojnë me koshere tradicionale druri, duke respektuar ciklin natyror të bletëve dhe lulëzimin e pyjeve.

Ne bashkëpunojmë drejtpërdrejt me prodhuesit, pa asnjë ndërmjetës. Kjo garanton çmim të drejtë për bletarin dhe cilësi absolute për ju.`,
    nutrition: [
      { label: "Energji", value: "304 kcal / 100g" },
      { label: "Karbohidrate", value: "82.4g" },
      { label: "nga të cilat sheqerna", value: "79.0g" },
      { label: "Proteina", value: "0.3g" },
      { label: "Yndyrna", value: "0g" },
      { label: "Fibra", value: "0.2g" },
      { label: "Natriumi", value: "4mg" },
    ],
  },
  {
    id: "walnuts",
    name: "Arra të Qëruara Premium",
    subtitle: "Halved Walnuts · Naturally Sun-Dried",
    meta: "Shqipëri Qendrore · Varietet Autokton",
    images: [productWalnuts, storyMountains],
    alt: "Gjysma arrash premium në tas qeramike",
    category: "nuts",
    variants: [
      { weight: "250g", price: 1200 },
      { weight: "500g", price: 2200 },
      { weight: "1kg", price: 4000 },
    ],
    shortDesc:
      "Varietete autoktone shqiptare, të thara natyrshëm në diell dhe të qëruara me dorë. Asnjë trajtim kimik, asnjë konservant — vetëm arra e mirë.",
    description: `Varietetet tona autoktone dallojnë nga arrat industriale me luspa të holla, mish të bollshëm dhe aromë të pasur. Copat e gjysmave (halves) janë të zgjedhura me kujdes — vetëm pjesë të plota, pa thyerje.

Tharja bëhet natyrshëm nën diell mbi shtretër guri, ashtu si bëhej dikur. Procesi i gjatë i tharjes natyrale intensifikon aromën dhe ruan të gjithë vlerat ushqyese. Perfekte si meze, në ëmbëlsira ose si rostiçeri i shëndetshëm.`,
    origin: `Kopshtet tona gjenden në ultësirat pjellore të Shqipërisë qendrore, ku kombinimi i diellit mesdhetar me ujërat e maleve krijon kushte ideale për rritjen e arrës.

Pronarët janë fermerë të vegjël që kultivojnë tokat familjare prej brezash. Mbledhja bëhet me dorë në tetor, kur luspa bie natyrshëm nga pema.`,
    nutrition: [
      { label: "Energji", value: "654 kcal / 100g" },
      { label: "Yndyrna", value: "65.2g" },
      { label: "nga të cilat të ngopura", value: "6.1g" },
      { label: "Karbohidrate", value: "13.7g" },
      { label: "nga të cilat sheqerna", value: "2.6g" },
      { label: "Proteina", value: "15.2g" },
      { label: "Fibra", value: "6.7g" },
      { label: "Omega-3", value: "9.08g" },
    ],
  },
  {
    id: "almonds",
    name: "Bajame Sulltane të Papërpunuara",
    subtitle: "Raw Sultan Almonds · Hand-Selected",
    meta: "Shqipëri Jugore · Varietet Sulltane",
    images: [productAlmonds, storyMountains],
    alt: "Bajame Sulltane të papërpunuara në qese liri",
    category: "nuts",
    variants: [
      { weight: "250g", price: 1800 },
      { weight: "500g", price: 3200 },
      { weight: "1kg", price: 6000 },
    ],
    shortDesc:
      "Varieteti Sulltane shqiptar — i njohur ndërkombëtarisht për formën e tij elegante dhe shijen e pasur, pak të ëmbël. 100% i papërpunuar.",
    description: `Bajamja Sulltane (Prunus dulcis var. Sultana) është varieteti shqiptar më i çmuar. Ndryshe nga varietetet e tjera, Sulltaneja ka luspa të holla, mish të bardhë kremoze dhe shije delikate — pothuajse si pasta e buta amandine.

Bajamet tona janë 100% raw — pa zbardhje, pa ngrohje, pa asnjë trajtim. Mund të hahen direkt, të ngjyhen gjatë natës ose të shndërrohen në qumësht bajamesh shtëpiak.`,
    origin: `Pemët tona Sulltane gjenden në faqe të ekspozuara jugore të maleve të Gjirokastrës dhe Tepelenës — rajon me verë të gjata dhe diell të bollshëm, ideal për pjekurinë e plotë të bajames.

Vjelja bëhet në shtator kur bajamet kanë arritur pjekurinë e plotë. Procesi manual garanton se vetëm frytet optimale zgjidhen.`,
    nutrition: [
      { label: "Energji", value: "579 kcal / 100g" },
      { label: "Yndyrna", value: "49.9g" },
      { label: "nga të cilat të ngopura", value: "3.8g" },
      { label: "Karbohidrate", value: "21.6g" },
      { label: "nga të cilat sheqerna", value: "4.4g" },
      { label: "Proteina", value: "21.2g" },
      { label: "Fibra", value: "12.5g" },
      { label: "Vitamina E", value: "25.6mg" },
    ],
  },
];
