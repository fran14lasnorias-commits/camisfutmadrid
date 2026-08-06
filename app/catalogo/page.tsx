import { CatalogBrowser } from "@/components/catalog-browser";
import { getPublishedProducts } from "@/lib/catalog";

export default async function CatalogPage() {
  const products = await getPublishedProducts();

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        CAMISFUTMADRID
      </span>

      <h1 style={{ fontSize: 46, marginBottom: 8 }}>Catálogo</h1>

      <p className="muted" style={{ marginTop: 0 }}>
        Encuentra tu camiseta por equipo, temporada o versión.
      </p>

      <CatalogBrowser products={products} />
    </main>
  );
}
