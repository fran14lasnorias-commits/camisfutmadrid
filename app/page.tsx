import { CatalogBrowser } from "@/components/catalog-browser";
import {
  getPublishedProductsPage,
} from "@/lib/catalog";
import type { Product } from "@/lib/products";

const ALLOWED_TYPES: Product["type"][] = [
  "fan",
  "player",
  "retro",
  "kids",
  "adult_kit",
  "polo",
  "shorts",
  "socks",
  "training",
];

const NATIONAL_TEAMS = [
  "España","Spain","Argentina","Brasil","Brazil","Francia","France",
  "Alemania","Germany","Portugal","Inglaterra","England","Italia","Italy",
  "Países Bajos","Netherlands","Holland","Bélgica","Belgium","Croacia","Croatia",
  "Uruguay","Colombia","México","Mexico","Estados Unidos","USA","United States",
  "Canadá","Canada","Japón","Japan","Corea del Sur","South Korea","Korea",
  "Marruecos","Morocco","Senegal","Ghana","Nigeria","Camerún","Cameroon",
  "Costa de Marfil","Ivory Coast","Argelia","Algeria","Egipto","Egypt",
  "Túnez","Tunisia","Australia","Ecuador","Chile","Perú","Peru","Paraguay",
  "Venezuela","Bolivia","Costa Rica","Panamá","Panama","Jamaica",
  "Arabia Saudita","Saudi Arabia","Qatar","Irán","Iran","Turquía","Turkey",
  "Suiza","Switzerland","Austria","Dinamarca","Denmark","Suecia","Sweden",
  "Noruega","Norway","Polonia","Poland","Serbia","Ucrania","Ukraine",
  "Escocia","Scotland","Gales","Wales","Irlanda","Ireland","Rumanía","Romania",
  "Grecia","Greece","República Checa","Czech","Hungría","Hungary",
];

const LALIGA_TEAMS = [
  "Real Madrid","Barcelona","FC Barcelona","Atletico Madrid","Atlético Madrid",
  "Atlético de Madrid","Athletic Club","Athletic Bilbao","Real Betis","Betis",
  "Sevilla","Valencia","Villarreal","Real Sociedad","Celta Vigo","Celta",
  "Osasuna","Mallorca","Getafe","Girona","Rayo Vallecano","Espanyol",
  "Alaves","Alavés","Deportivo Alaves","Elche","Levante","Real Oviedo",
  "Oviedo","UD Almeria","UD Almería","Almeria","Almería","Las Palmas",
];

function categoryTitle(category?: string) {
  if (category === "selecciones") return "Selecciones";
  if (category === "laliga") return "LaLiga";
  return "Catálogo";
}

function categoryTeams(category?: string) {
  if (category === "selecciones") return NATIONAL_TEAMS;
  if (category === "laliga") return LALIGA_TEAMS;
  return undefined;
}

function safePage(value?: string) {
  const number = Number(value ?? 1);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 1;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    team?: string;
    season?: string;
    type?: string;
    sort?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;
  const category = params.category?.trim().toLowerCase();

  const requestedType = params.type?.trim().toLowerCase();
  const type =
    requestedType &&
    ALLOWED_TYPES.includes(requestedType as Product["type"])
      ? (requestedType as Product["type"])
      : null;

  const sort =
    params.sort === "price_asc" ||
    params.sort === "price_desc" ||
    params.sort === "name"
      ? params.sort
      : "newest";

  const result = await getPublishedProductsPage({
    page: safePage(params.page),
    pageSize: 24,
    q: params.q,
    team: params.team,
    season: params.season,
    type,
    teams: categoryTeams(category),
    sort,
  });

  const totalPages = Math.max(1, Math.ceil(result.count / result.pageSize));
  const title = categoryTitle(category);

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        CAMISFUTMADRID
      </span>

      <h1 style={{ fontSize: 46, marginBottom: 8 }}>{title}</h1>

      <p className="muted" style={{ marginTop: 0 }}>
        Carga rápida: solo se descargan 48 productos por página.
      </p>

      <CatalogBrowser
        products={result.products}
        total={result.count}
        page={result.page}
        totalPages={totalPages}
        initialQuery={params.q?.trim() ?? ""}
        initialTeam={params.team?.trim() ?? ""}
        initialSeason={params.season?.trim() ?? ""}
        initialType={type ?? "Todos"}
        initialSort={sort}
        category={category}
      />
    </main>
  );
}
