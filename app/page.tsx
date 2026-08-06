import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const products = await getPublishedProducts();

  return (
    <main>
      <section className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 30, alignItems: "center", padding: "70px 0" }}>
        <div>
          <span style={{ display: "inline-flex", padding: "8px 12px", borderRadius: 999, background: "#25103e", color: "#d4a6ff", fontWeight: 800, fontSize: 13 }}>NUEVA TEMPORADA 2026/27</span>
          <h1 style={{ fontSize: "clamp(54px,8vw,104px)", lineHeight: .88, letterSpacing: -4, margin: "20px 0" }}>
            CAMISFUT<br/><span style={{ color: "var(--purple-2)" }}>MADRID</span>
          </h1>
          <p className="muted" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 590 }}>
            Camisetas de fútbol premium, personalización, entrega en Madrid y compra rápida desde el móvil.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
            <Link className="btn-primary" href="/catalogo">COMPRAR AHORA</Link>
            <Link className="btn-secondary" href="/acceso">MI CUENTA</Link>
          </div>
        </div>
        <div className="card" style={{ minHeight: 480, display: "grid", placeItems: "center", background: "radial-gradient(circle,#5f199a55,transparent 55%),#0e0e13" }}>
          <img src="/placeholder-shirt.svg" alt="Camiseta destacada" style={{ width: "72%", filter: "drop-shadow(0 30px 34px #000)" }}/>
        </div>
      </section>

      <section className="container" style={{ padding: "30px 0 70px" }}>
        <h2 style={{ fontSize: 32 }}>Más vendidas</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          {products.slice(0, 8).map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </main>
  );
}
