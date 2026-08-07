import type { Product } from "@/lib/products";

export type CatalogCategory =
  | "selecciones"
  | "laliga"
  | "premier"
  | "serie-a";

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NATIONAL_TEAM_ALIASES = [
  "espana", "spain",
  "argentina",
  "brasil", "brazil",
  "francia", "france",
  "alemania", "germany",
  "portugal",
  "inglaterra", "england",
  "italia", "italy",
  "paises bajos", "netherlands", "holland",
  "belgica", "belgium",
  "croacia", "croatia",
  "uruguay",
  "colombia",
  "mexico",
  "estados unidos", "usa", "united states",
  "canada",
  "japon", "japan",
  "corea del sur", "south korea", "korea",
  "marruecos", "morocco",
  "senegal",
  "ghana",
  "nigeria",
  "camerun", "cameroon",
  "costa de marfil", "ivory coast",
  "argelia", "algeria",
  "egipto", "egypt",
  "tunez", "tunisia",
  "australia",
  "nueva zelanda", "new zealand",
  "ecuador",
  "chile",
  "peru",
  "paraguay",
  "venezuela",
  "bolivia",
  "costa rica",
  "panama",
  "jamaica",
  "arabia saudita", "saudi arabia",
  "qatar",
  "iran",
  "iraq",
  "turquia", "turkey",
  "suiza", "switzerland",
  "austria",
  "dinamarca", "denmark",
  "suecia", "sweden",
  "noruega", "norway",
  "polonia", "poland",
  "serbia",
  "ucrania", "ukraine",
  "escocia", "scotland",
  "gales", "wales",
  "irlanda", "ireland",
  "rumania", "romania",
  "grecia", "greece",
  "republica checa", "czech",
  "hungria", "hungary",
];

const LALIGA_ALIASES = [
  "real madrid",
  "barcelona", "fc barcelona", "barca",
  "atletico madrid", "atletico de madrid",
  "athletic club", "athletic bilbao",
  "real betis", "betis",
  "sevilla",
  "valencia",
  "villarreal",
  "real sociedad",
  "celta", "celta vigo",
  "osasuna",
  "mallorca",
  "getafe",
  "girona",
  "rayo vallecano",
  "espanyol",
  "alaves", "deportivo alaves",
  "elche",
  "levante",
  "real oviedo", "oviedo",
  "ud almeria", "almeria",
  "las palmas",
];

const PREMIER_ALIASES = [
  "arsenal",
  "chelsea",
  "liverpool",
  "manchester city",
  "manchester united",
  "tottenham", "spurs",
  "newcastle",
  "aston villa",
  "west ham",
  "everton",
  "brighton",
  "fulham",
  "crystal palace",
  "nottingham forest",
  "wolverhampton", "wolves",
  "bournemouth",
  "brentford",
  "leeds united", "leeds",
  "sunderland",
  "burnley",
];

const SERIE_A_ALIASES = [
  "juventus",
  "inter milan", "inter",
  "ac milan", "milan",
  "napoli",
  "roma", "as roma",
  "lazio",
  "atalanta",
  "fiorentina",
  "bologna",
  "torino",
  "genoa",
  "udinese",
  "parma",
  "como",
];

function productText(product: Product) {
  return normalize(`${product.team} ${product.name}`);
}

function containsAlias(text: string, aliases: string[]) {
  return aliases.some((alias) => {
    const value = normalize(alias);
    return text === value || text.startsWith(`${value} `) || text.includes(` ${value} `);
  });
}

export function productMatchesCategory(
  product: Product,
  category?: string | null
) {
  if (!category) return true;

  const text = ` ${productText(product)} `;

  switch (category) {
    case "selecciones":
      return containsAlias(text.trim(), NATIONAL_TEAM_ALIASES);

    case "laliga":
      return containsAlias(text.trim(), LALIGA_ALIASES);

    case "premier":
      return containsAlias(text.trim(), PREMIER_ALIASES);

    case "serie-a":
      return containsAlias(text.trim(), SERIE_A_ALIASES);

    default:
      return true;
  }
}

export function categoryTitle(category?: string | null) {
  switch (category) {
    case "selecciones":
      return "Selecciones";
    case "laliga":
      return "LaLiga";
    case "premier":
      return "Premier League";
    case "serie-a":
      return "Serie A";
    default:
      return "Catálogo";
  }
}
