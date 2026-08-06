import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const products = await getPublishedProducts();
  const featured = products[0];

  return (
    <main>
      <section
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 30,
          alignItems: "center",
          padding: "70px 0",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "#25103e",
              color: "#d4a6ff",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            NUEVA TEMPORADA 2026/27
          </span>

          <h1
            style={{
              fontSize: "clamp(54px,8vw,104px)",
              lineHeight: 0.88,
              letterSpacing: -4,
              margin: "20px 0",
            }}
          >
            CAMISFUT
            <br />
            <span style={{ color: "var(--purple-2)" }}>MADRID</span>
          </h1>

          <p
            className="muted"
            style={{ fontSize: 19, lineHeight: 1.55, maxWidth: 590 }}
          >
            Camisetas de fútbol premium, personalización, entrega en Madrid y
            compra rápida desde el móvil.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 26,
              flexWrap: "wrap",
            }}
          >
            <Link className="btn-primary" href="/catalogo">
              VER CATÁLOGO
            </Link>

            {featured && (
              <Link
                className="btn-secondary"
                href={`/producto/${featured.slug}`}
              >
                VER DESTACADA
              </Link>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            minHeight: 500,
            display: "grid",
            placeItems: "center",
            position: "relative",
            overflow: "hidden",
            padding: 28,
            background:
              "radial-gradient(circle at 50% 40%,#6d1dbb66,transparent 58%),#0e0e13",
          }}
        >
          {featured ? (
            <>
              <img
                src={featured.images[0]}
                alt={featured.name}
                style={{
                  width: "82%",
                  height: 390,
                  objectFit: "contain",
                  filter: "drop-shadow(0 32px 38px #000)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 22,
                  right: 22,
                  bottom: 20,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "rgba(8,8,12,.82)",
                  border: "1px solid rgba(255,255,255,.10)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span
                  style={{
                    color: "#d6a6ff",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  CAMISETA DESTACADA
                </span>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "center",
                    marginTop: 5,
                  }}
                >
                  <strong>{featured.name}</strong>
                  <strong
                    style={{
                      color: "var(--purple-2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {featured.price.toFixed(2).replace(".", ",")} €
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <strong>Próximamente nuevas camisetas</strong>
            </div>
          )}
        </div>
      </section>

      <section className="container" style={{ padding: "30px 0 70px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: 32, margin: 0 }}>Más vendidas</h2>
          <Link href="/catalogo" style={{ color: "#d6a6ff", fontWeight: 800 }}>
            VER TODO →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
            marginTop: 22,
          }}
        >
          {products
            .slice(0, 8)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>
    </main>
  );
}
