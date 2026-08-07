import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { WeeklyCountdown } from "@/components/weekly-countdown";
import { getPublishedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Ofertas",
  description:
    "Camisetas de fútbol rebajadas en CamisfutMadrid. Precios reales de oferta mientras estén activos.",
  alternates: {
    canonical: "/ofertas",
  },
};

export default async function OffersPage() {
  const products = await getPublishedProducts();
  const offers = products.filter(
    (product) =>
      typeof product.originalPrice === "number" &&
      product.originalPrice > product.price
  );

  const bestDiscount = offers.reduce((best, product) => {
    const discount = Math.round(
      ((product.originalPrice! - product.price) / product.originalPrice!) * 100
    );
    return Math.max(best, discount);
  }, 0);

  return (
    <main>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          background:
            "radial-gradient(circle at 75% 20%,rgba(139,44,255,.42),transparent 28rem),linear-gradient(180deg,#0c0c12,#08080b)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(340px,100%),1fr))",
            gap: "clamp(30px,7vw,90px)",
            alignItems: "center",
            padding: "clamp(54px,9vw,100px) 0",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                padding: "8px 11px",
                border: "1px solid rgba(255,72,105,.28)",
                borderRadius: 999,
                background: "rgba(255,72,105,.10)",
                color: "#ff9aaa",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: ".13em",
              }}
            >
              PRECIOS REBAJADOS REALES
            </span>

            <h1
              style={{
                margin: "18px 0 16px",
                fontSize: "clamp(4rem,11vw,9rem)",
                lineHeight: .78,
              }}
            >
              FLASH
              <br />
              <span style={{ color: "var(--purple-2)" }}>SALE.</span>
            </h1>

            <p
              className="muted"
              style={{
                maxWidth: 630,
                margin: 0,
                fontSize: 18,
                lineHeight: 1.65,
              }}
            >
              {offers.length > 0
                ? `${offers.length} productos rebajados${
                    bestDiscount > 0 ? ` · hasta -${bestDiscount}%` : ""
                  }. El precio que ves es el que se cobra en carrito y checkout.`
                : "Ahora mismo no hay productos rebajados. Activa una oferta desde el panel de productos."}
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 26,
              }}
            >
              {offers.length > 0 && (
                <a href="#ofertas" className="btn-primary">
                  VER OFERTAS
                </a>
              )}
              <Link href="/catalogo" className="btn-secondary">
                TODO EL CATÁLOGO
              </Link>
            </div>
          </div>

          <div
            className="card"
            style={{
              display: "grid",
              gap: 18,
              padding: "clamp(22px,5vw,34px)",
              borderColor: "rgba(195,92,255,.20)",
              background:
                "linear-gradient(180deg,rgba(139,44,255,.09),transparent),rgba(17,17,22,.78)",
            }}
          >
            <div>
              <span
                style={{
                  color: "#d8b4ff",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                }}
              >
                SELECCIÓN SEMANAL
              </span>
              <h2 style={{ margin: "7px 0 0", fontSize: 38 }}>
                DOMINGO · 23:59
              </h2>
            </div>

            <WeeklyCountdown />

            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              Puedes cambiar o quitar los precios rebajados desde Admin cuando
              quieras.
            </p>
          </div>
        </div>
      </section>

      <section
        id="ofertas"
        className="container"
        style={{ padding: "74px 0 92px" }}
      >
        <div>
          <span
            style={{
              color: "#d6a6ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".14em",
            }}
          >
            OFERTAS ACTIVAS
          </span>

          <h2
            style={{
              margin: "8px 0 8px",
              fontSize: "clamp(3rem,8vw,6rem)",
            }}
          >
            PRECIO ANTES → AHORA
          </h2>
        </div>

        {offers.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(260px,100%),1fr))",
              gap: 18,
              marginTop: 28,
            }}
          >
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 28, marginTop: 28 }}>
            <strong>No hay ofertas activas todavía.</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              En Admin → Productos, pon por ejemplo Precio de venta 25 € y
              Precio anterior 30 €. Aparecerá aquí automáticamente.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
