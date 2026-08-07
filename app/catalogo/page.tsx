import { CatalogBrowser } from "@/components/catalog-browser";
import { getPublishedProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";
import {
  categoryTitle,
  productMatchesCategory,
} from "@/lib/catalog-sections";

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
  "nba",
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    team?: string;
    season?: string;
    category?: string;
  }>;
}) {
  const allProducts = await getPublishedProducts();
  const params = await searchParams;

  const requestedType = params.type?.toLowerCase();
  const initialType: "Todos" | Product["type"] =
    requestedType &&
    ALLOWED_TYPES.includes(requestedType as Product["type"])
      ? (requestedType as Product["type"])
      : "Todos";

  const requestedSeason = params.season?.trim();
  const requestedCategory = params.category?.trim().toLowerCase();

  let products = allProducts.filter((product) =>
    productMatchesCategory(product, requestedCategory)
  );

  if (requestedSeason) {
    products = products.filter(
      (product) => product.season === requestedSeason
    );
  }

  const availableTeams = new Set(products.map((product) => product.team));
  const requestedTeam = params.team?.trim();
  const initialTeam =
    requestedTeam && availableTeams.has(requestedTeam)
      ? requestedTeam
      : "Todos";

  const title = categoryTitle(requestedCategory);

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        CAMISFUTMADRID
      </span>

      <h1 style={{ fontSize: 46, marginBottom: 8 }}>{title}</h1>

      <p className="muted" style={{ marginTop: 0 }}>
        {requestedCategory
          ? `${products.length} productos en ${title}.`
          : requestedSeason
            ? `${products.length} productos de la temporada ${requestedSeason}.`
            : "Encuentra tu camiseta por equipo, temporada o versión."}
      </p>

      <CatalogBrowser
        products={products}
        initialType={initialType}
        initialTeam={initialTeam}
      />
    </main>
  );
}
