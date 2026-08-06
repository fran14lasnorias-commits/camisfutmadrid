import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/catalog";

export default async function CatalogPage() {
  const products = await getPublishedProducts();

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <h1 style={{ fontSize: 46 }}>Catálogo</h1>
      <p className="muted">{products.length} productos publicados.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18, marginTop: 26 }}>
        {products.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </main>
  );
}
