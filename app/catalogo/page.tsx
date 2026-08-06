import { CatalogBrowser } from "@/components/catalog-browser";
import { getPublishedProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";

const ALLOWED_TYPES: Product["type"][] = [
  "fan",
  "player",
  "retro",
  "kids",
];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    team?: string;
  }>;
}) {
  const products = await getPublishedProducts();
  const params = await searchParams;

  const requestedType = params.type?.toLowerCase();
  const initialType: "Todos" | Product["type"] =
    requestedType &&
    ALLOWED_TYPES.includes(requestedType as Product["type"])
      ? (requestedType as Product["type"])
      : "Todos";

  const availableTeams = new Set(products.map((product) => product.team));
  const requestedTeam = params.team?.trim();
  const initialTeam =
    requestedTeam && availableTeams.has(requestedTeam)
      ? requestedTeam
      : "Todos";

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        CAMISFUTMADRID
      </span>

      <h1 style={{ fontSize: 46, marginBottom: 8 }}>Catálogo</h1>

      <p className="muted" style={{ marginTop: 0 }}>
        Encuentra tu camiseta por equipo, temporada o versión.
      </p>

      <CatalogBrowser
        products={products}
        initialType={initialType}
        initialTeam={initialTeam}
      />
    </main>
  );
}
