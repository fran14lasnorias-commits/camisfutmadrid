import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { WeeklyCountdown } from "@/components/weekly-countdown";
import { getPublishedProducts } from "@/lib/catalog";
import type { Product } from "@/lib/products";

export const metadata: Metadata = {
  title: "Ofertas y selección semanal",
  description:
    "Descubre la selección semanal de camisetas de fútbol de CamisfutMadrid.",
  alternates: {
    canonical: "/ofertas",
  },
};

function weekSeed() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const day = Math.floor(
    (now.getTime() - yearStart.getTime()) / 86_400_000
  );
  return Math.floor(day / 7) + now.getFullYear() * 53;
}

function selectWeeklyProducts(products: Product[], count = 12) {
  if (products.length <= count) return products;

  const seed = weekSeed();

  return [...products]
    .map((product, index) => ({
      product,
      rank:
        ((index + 1) * 9301 + seed * 49297 + product.id.length * 233) %
        233280,
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(({ product }) => product);
}

export default async function OffersPage() {
  const products = await getPublishedProducts();
  const weekly = selectWeeklyProducts(products, 12);

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
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "linear-gradient(to bottom,rgba(0,0,0,.7),transparent 92%)",
          }}
        />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
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
                border: "1px solid rgba(195,92,255,.25)",
                borderRadius: 999,
                background: "rgba(139,44,255,.10)",
                color: "#e0bfff",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: ".13em",
              }}
            >
              SELECCIÓN SEMANAL
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
              <span style={{ color: "var(--purple-2)" }}>WEEK.</span>
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
              Cada semana destacamos una nueva selección de camisetas del
              catálogo. Los precios que ves son siempre los precios reales de
              la tienda.
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 26,
              }}
            >
              <a href="#seleccion" className="btn-primary">
                VER SELECCIÓN
              </a>

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
              backdropFilter: "blur(16px)",
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
                NUEVA SELECCIÓN EN
              </span>

              <h2 style={{ margin: "7px 0 0", fontSize: 38 }}>
                DOMINGO · 23:59
              </h2>
            </div>

            <WeeklyCountdown />

            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              Al terminar la semana, la selección cambia automáticamente.
            </p>
          </div>
        </div>
      </section>

      <section
        id="seleccion"
        className="container"
        style={{ padding: "74px 0 92px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 18,
            flexWrap: "wrap",
          }}
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
              ESTA SEMANA
            </span>

            <h2
              style={{
                margin: "8px 0 8px",
                fontSize: "clamp(3rem,8vw,6rem)",
              }}
            >
              12 DESTACADAS
            </h2>

            <p className="muted" style={{ margin: 0 }}>
              Una selección que cambia cada semana sin tocar tu catálogo.
            </p>
          </div>

          <Link
            href="/catalogo?sort=price_asc"
            style={{ color: "#d6a6ff", fontWeight: 900 }}
          >
            VER POR PRECIO →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(260px,100%),1fr))",
            gap: 18,
            marginTop: 28,
          }}
        >
          {weekly.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "0 0 96px" }}>
        <div
          className="card"
          style={{
            padding: "clamp(28px,7vw,70px)",
            textAlign: "center",
            borderColor: "rgba(195,92,255,.18)",
            background:
              "radial-gradient(circle at 50% 0%,rgba(139,44,255,.28),transparent 26rem),var(--surface)",
          }}
        >
          <span
            style={{
              color: "#d6a6ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".14em",
            }}
          >
            ¿NO ESTÁ AQUÍ LA TUYA?
          </span>

          <h2
            style={{
              maxWidth: 850,
              margin: "12px auto 18px",
              fontSize: "clamp(3rem,8vw,6.6rem)",
            }}
          >
            HAY CIENTOS MÁS
            <br />
            <span style={{ color: "var(--purple-2)" }}>ESPERÁNDOTE.</span>
          </h2>

          <Link href="/catalogo" className="btn-primary">
            EXPLORAR CATÁLOGO
          </Link>
        </div>
      </section>
    </main>
  );
}
