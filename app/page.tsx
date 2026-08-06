import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/catalog";

const SITE_URL = "https://www.camisfutmadrid.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CamisfutMadrid | Camisetas de fútbol premium",
  description:
    "Compra camisetas de fútbol, modelos retro y nueva temporada. Personalización con nombre y dorsal, pago seguro y entrega en Madrid.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "CamisfutMadrid",
    title: "CamisfutMadrid | Camisetas de fútbol premium",
    description:
      "Camisetas de fútbol, modelos retro y nueva temporada. Personalización, pago seguro y entrega en Madrid.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CamisfutMadrid · Camisetas de fútbol premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CamisfutMadrid | Camisetas de fútbol premium",
    description:
      "Camisetas de fútbol, modelos retro y nueva temporada. Personalización, pago seguro y entrega en Madrid.",
    images: ["/opengraph-image"],
  },
};

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

        {featured ? (
          <Link
            href={`/producto/${featured.slug}`}
            aria-label={`Ver ${featured.name}`}
            className="card"
            style={{
              minHeight: 500,
              display: "grid",
              placeItems: "center",
              position: "relative",
              overflow: "hidden",
              padding: 28,
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              background:
                "radial-gradient(circle at 50% 40%,#6d1dbb66,transparent 58%),#0e0e13",
            }}
          >
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
                background: "rgba(8,8,12,.88)",
                border: "1px solid rgba(255,255,255,.12)",
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
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>{featured.name}</strong>
                  <strong
                    style={{
                      display: "block",
                      color: "var(--purple-2)",
                      marginTop: 4,
                    }}
                  >
                    {featured.price.toFixed(2).replace(".", ",")} €
                  </strong>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--purple-2)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  VER PRODUCTO →
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div
            className="card"
            style={{
              minHeight: 500,
              display: "grid",
              placeItems: "center",
              padding: 28,
            }}
          >
            <strong>Próximamente nuevas camisetas</strong>
          </div>
        )}
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
