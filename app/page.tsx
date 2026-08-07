import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/catalog";
import motionStyles from "./home.module.css";

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

const CATEGORY_LINKS = [
  {
    eyebrow: "NUEVA TEMPORADA",
    title: "26/27",
    description: "Los nuevos diseños antes que nadie.",
    href: "/catalogo?season=2026%2F27",
    key: "new",
  },
  {
    eyebrow: "CLUBES",
    title: "LALIGA",
    description: "Madrid, Barça, Atlético y mucho más.",
    href: "/catalogo?category=laliga",
    key: "laliga",
  },
  {
    eyebrow: "MUNDIAL",
    title: "SELECCIONES",
    description: "Prepárate para vivir cada partido.",
    href: "/catalogo?category=selecciones",
    key: "national",
  },
  {
    eyebrow: "HISTORIA",
    title: "RETRO",
    description: "Camisetas que nunca pasan de moda.",
    href: "/catalogo?type=retro",
    key: "retro",
  },
];


const LALIGA_TEAMS = new Set([
  "Real Madrid",
  "Barcelona",
  "Atlético de Madrid",
  "Athletic Club",
  "UD Almería",
  "Sevilla",
  "Valencia",
  "Real Betis",
]);

const NATIONAL_TEAMS = new Set([
  "España",
  "Argentina",
  "Brasil",
  "Francia",
  "Alemania",
  "Portugal",
  "Inglaterra",
  "Italia",
  "Países Bajos",
  "Japón",
  "México",
  "Estados Unidos",
]);

const BENEFITS = [
  {
    title: "PERSONALIZACIÓN",
    text: "Añade nombre, dorsal y parche desde la propia ficha del producto.",
  },
  {
    title: "PAGO SEGURO",
    text: "Proceso de compra claro, rápido y adaptado al móvil.",
  },
  {
    title: "ENTREGA EN MADRID",
    text: "Recibe tu pedido con atención cercana y seguimiento.",
  },
];

export default async function HomePage() {
  const products = await getPublishedProducts({ limit: 40 });
  const featured = products[0];
  const secondaryFeatured = products[1] ?? featured;

  const categoryCards = CATEGORY_LINKS.map((category) => {
    const product =
      category.key === "new"
        ? products.find((item) => item.season?.includes("2026/27"))
        : category.key === "laliga"
          ? products.find((item) => LALIGA_TEAMS.has(item.team))
          : category.key === "national"
            ? products.find((item) => NATIONAL_TEAMS.has(item.team))
            : products.find((item) => item.type === "retro");

    return {
      ...category,
      product: product ?? featured,
    };
  });

  return (
    <main style={{ overflow: "hidden" }}>
      <section
        style={{
          position: "relative",
          minHeight: "min(780px, calc(100vh - 110px))",
          display: "grid",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          background:
            "radial-gradient(circle at 75% 30%, rgba(139,44,255,.34), transparent 30rem), linear-gradient(180deg, rgba(255,255,255,.018), transparent)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,.6), transparent 90%)",
            pointerEvents: "none",
          }}
        />

        <div
          className={`container ${motionStyles.heroGrid}`}
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(0,1.02fr) minmax(320px,.98fr)",
            gap: "clamp(30px,6vw,90px)",
            alignItems: "center",
            padding: "clamp(54px,8vw,104px) 0",
          }}
        >
          <div className={motionStyles.heroContent}>
            <span
              className={motionStyles.heroBadge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(195,92,255,.24)",
                background: "rgba(139,44,255,.10)",
                color: "#e0bfff",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: ".12em",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--purple-2)",
                  boxShadow: "0 0 14px var(--purple-2)",
                }}
              />
              NUEVA TEMPORADA 2026/27
            </span>

            <h1
              className={motionStyles.heroTitle}
              style={{
                maxWidth: 760,
                margin: "24px 0 20px",
                fontSize: "clamp(4rem,10vw,8.4rem)",
                lineHeight: 0.78,
                letterSpacing: "-.025em",
              }}
            >
              TU EQUIPO.
              <br />
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,.72)",
                }}
              >
                TU CAMISETA.
              </span>
              <br />
              <span style={{ color: "var(--purple-2)" }}>TU HISTORIA.</span>
            </h1>

            <p
              className={`muted ${motionStyles.heroText}`}
              style={{
                maxWidth: 620,
                margin: 0,
                fontSize: "clamp(17px,2vw,21px)",
                lineHeight: 1.6,
              }}
            >
              Camisetas de fútbol premium, personalizadas con nombre, dorsal y
              parche. Compra rápida, diseño cuidado y una experiencia hecha para
              auténticos aficionados.
            </p>

            <div
              className={motionStyles.heroActions}
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginTop: 30,
              }}
            >
              <Link className="btn-primary" href="/catalogo">
                VER COLECCIÓN
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

            <div
              className={motionStyles.heroStats}
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                marginTop: 34,
                paddingTop: 24,
                borderTop: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <Stat value="+600" label="MODELOS" />
              <Stat value="7–13" label="DÍAS DE ENTREGA" />
              <Stat value="100%" label="COMPRA SEGURA" />
            </div>
          </div>

          {featured ? (
            <Link
              href={`/producto/${featured.slug}`}
              aria-label={`Ver ${featured.name}`}
              className={motionStyles.featuredCard}
              style={{
                position: "relative",
                minHeight: 580,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                border: "1px solid rgba(195,92,255,.18)",
                borderRadius: 34,
                background:
                  "radial-gradient(circle at 50% 42%, rgba(139,44,255,.42), transparent 42%), #0d0d12",
                boxShadow:
                  "0 34px 90px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.05)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 22,
                  left: 22,
                  zIndex: 2,
                  padding: "8px 11px",
                  borderRadius: 999,
                  background: "rgba(8,8,12,.72)",
                  border: "1px solid rgba(255,255,255,.10)",
                  backdropFilter: "blur(12px)",
                  color: "#e3c7ff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".09em",
                }}
              >
                ELECCIÓN CAMISFUT
              </span>

              <div
                aria-hidden="true"
                className={motionStyles.glowPulse}
                style={{
                  position: "absolute",
                  width: "72%",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: "1px solid rgba(195,92,255,.14)",
                  boxShadow:
                    "0 0 0 60px rgba(195,92,255,.025), 0 0 0 120px rgba(195,92,255,.018)",
                }}
              />

              <img
                src={featured.images[0] || "/placeholder-shirt.svg"}
                alt={featured.name}
                className={motionStyles.featuredImage}
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "84%",
                  height: 430,
                  objectFit: "contain",
                  filter: "drop-shadow(0 42px 38px rgba(0,0,0,.72))",
                  transform: "rotate(-2deg)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  bottom: 18,
                  zIndex: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  padding: "17px 18px",
                  border: "1px solid rgba(255,255,255,.10)",
                  borderRadius: 18,
                  background: "rgba(8,8,12,.82)",
                  backdropFilter: "blur(18px)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      color: "#d8b4ff",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: ".12em",
                    }}
                  >
                    CAMISETA DESTACADA
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 18,
                      lineHeight: 1.25,
                    }}
                  >
                    {featured.name}
                  </strong>
                </div>

                <strong
                  style={{
                    flex: "0 0 auto",
                    color: "var(--purple-2)",
                    fontSize: 21,
                  }}
                >
                  {featured.price.toFixed(2).replace(".", ",")} €
                </strong>
              </div>
            </Link>
          ) : (
            <div
              className={`card ${motionStyles.benefitCard}`}
              style={{
                minHeight: 580,
                display: "grid",
                placeItems: "center",
                padding: 30,
              }}
            >
              <strong>Próximamente nuevas camisetas</strong>
            </div>
          )}
        </div>
      </section>

      <section className={`container ${motionStyles.sectionReveal}`} style={{ padding: "78px 0 22px" }}>
        <SectionHeader
          eyebrow="ENCUENTRA LA TUYA"
          title="COMPRA POR CATEGORÍA"
          description="Entra directamente en la colección que buscas."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 16,
            marginTop: 28,
          }}
        >
          {categoryCards.map((category, index) => (
            <Link
              key={category.title}
              href={category.href}
              className={motionStyles.categoryCard}
              style={{
                position: "relative",
                minHeight: index === 0 || index === 3 ? 300 : 250,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                overflow: "hidden",
                padding: "clamp(22px,4vw,36px)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 26,
                background:
                  index % 2 === 0
                    ? "radial-gradient(circle at 85% 12%, rgba(139,44,255,.30), transparent 18rem), #111116"
                    : "radial-gradient(circle at 15% 10%, rgba(195,92,255,.22), transparent 18rem), #111116",
              }}
            >
              {category.product && (
                <img
                  src={
                    category.product.images[0] ||
                    "/placeholder-shirt.svg"
                  }
                  alt=""
                  aria-hidden="true"
                  className={motionStyles.categoryImage}
                />
              )}

              <div
                className={motionStyles.categoryShade}
                aria-hidden="true"
              />
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(145deg, transparent 10%, rgba(255,255,255,.025) 48%, transparent 49%)",
                  backgroundSize: "22px 22px",
                  opacity: 0.7,
                }}
              />

              <div className={motionStyles.categoryContent}>
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: "#d6a6ff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                }}
              >
                {category.eyebrow}
              </span>

              <strong
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "block",
                  marginTop: 7,
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.8rem,7vw,5.2rem)",
                  lineHeight: 0.85,
                }}
              >
                {category.title}
              </strong>

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 18,
                }}
              >
                <span className="muted">{category.description}</span>
                <span className={motionStyles.categoryArrow} style={{ color: "var(--purple-2)", fontWeight: 900 }}>
                  VER →
                </span>
              </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={`container ${motionStyles.sectionReveal}`} style={{ padding: "82px 0 30px" }}>
        <SectionHeader
          eyebrow="LO QUE MÁS GUSTA"
          title="MÁS VENDIDAS"
          description="Una selección de las camisetas que más están buscando los aficionados."
          action={
            <Link
              href="/catalogo"
              style={{
                color: "#d6a6ff",
                fontWeight: 900,
                letterSpacing: ".04em",
              }}
            >
              VER TODO →
            </Link>
          }
        />

        <div
          className={motionStyles.productGrid}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: 18,
            marginTop: 28,
          }}
        >
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {secondaryFeatured && (
        <section className={`container ${motionStyles.sectionReveal}`} style={{ padding: "78px 0 20px" }}>
          <div
            className={motionStyles.personalizationCard}
            style={{
              position: "relative",
              minHeight: 450,
              display: "grid",
              gridTemplateColumns: "minmax(0,.9fr) minmax(320px,1.1fr)",
              alignItems: "center",
              gap: 30,
              overflow: "hidden",
              padding: "clamp(28px,6vw,70px)",
              border: "1px solid rgba(195,92,255,.15)",
              borderRadius: 32,
              background:
                "radial-gradient(circle at 70% 50%, rgba(139,44,255,.40), transparent 28rem), linear-gradient(135deg,#111116,#0a0a0e)",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <span
                style={{
                  color: "#d6a6ff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".14em",
                }}
              >
                HAZLA TUYA
              </span>

              <h2
                style={{
                  maxWidth: 620,
                  margin: "12px 0 18px",
                  fontSize: "clamp(3rem,7vw,6.4rem)",
                }}
              >
                NOMBRE.
                <br />
                DORSAL.
                <br />
                <span style={{ color: "var(--purple-2)" }}>PARCHE.</span>
              </h2>

              <p
                className="muted"
                style={{ maxWidth: 520, fontSize: 18, lineHeight: 1.6 }}
              >
                Personaliza tu camiseta desde la ficha del producto y mira el
                precio actualizado al instante.
              </p>

              <Link
                href={`/producto/${secondaryFeatured.slug}`}
                className="btn-primary"
                style={{ marginTop: 22 }}
              >
                PERSONALIZAR AHORA
              </Link>
            </div>

            <img
              src={
                secondaryFeatured.images[1] ||
                secondaryFeatured.images[0] ||
                "/placeholder-shirt-back.svg"
              }
              alt={`${secondaryFeatured.name}, vista trasera`}
              className={motionStyles.personalizationImage}
              style={{
                width: "100%",
                height: 390,
                objectFit: "contain",
                filter: "drop-shadow(0 35px 36px rgba(0,0,0,.62))",
              }}
            />
          </div>
        </section>
      )}

      <section className={`container ${motionStyles.sectionReveal}`} style={{ padding: "88px 0 26px" }}>
        <SectionHeader
          eyebrow="COMPRA CON CONFIANZA"
          title="POR QUÉ CAMISFUTMADRID"
          description="Todo pensado para que elegir y personalizar tu camiseta sea fácil."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 16,
            marginTop: 28,
          }}
        >
          {BENEFITS.map((benefit, index) => (
            <article
              key={benefit.title}
              className={`card ${motionStyles.benefitCard}`}
              style={{
                minHeight: 220,
                padding: 26,
                background:
                  "linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--surface)",
              }}
            >
              <span
                style={{
                  display: "grid",
                  width: 42,
                  height: 42,
                  placeItems: "center",
                  borderRadius: 12,
                  background: "rgba(139,44,255,.14)",
                  color: "#d6a6ff",
                  fontFamily: "var(--font-display)",
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                0{index + 1}
              </span>

              <h3 style={{ margin: "24px 0 10px", fontSize: 29 }}>
                {benefit.title}
              </h3>

              <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>
                {benefit.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${motionStyles.sectionReveal}`} style={{ padding: "88px 0 96px" }}>
        <div
          className={motionStyles.ctaCard}
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "clamp(36px,8vw,84px)",
            border: "1px solid rgba(195,92,255,.18)",
            borderRadius: 32,
            textAlign: "center",
            background:
              "radial-gradient(circle at 50% 0%, rgba(139,44,255,.42), transparent 30rem), #111116",
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
            TU PRÓXIMA CAMISETA ESTÁ AQUÍ
          </span>

          <h2
            style={{
              maxWidth: 850,
              margin: "14px auto 18px",
              fontSize: "clamp(3.2rem,8vw,7.4rem)",
            }}
          >
            ELIGE TU EQUIPO.
            <br />
            <span style={{ color: "var(--purple-2)" }}>NOSOTROS HACEMOS EL RESTO.</span>
          </h2>

          <p
            className="muted"
            style={{
              maxWidth: 620,
              margin: "0 auto",
              fontSize: 18,
              lineHeight: 1.65,
            }}
          >
            Explora el catálogo, personaliza tu modelo y prepara la camiseta
            para el próximo partido.
          </p>

          <Link className="btn-primary" href="/catalogo" style={{ marginTop: 26 }}>
            IR AL CATÁLOGO
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong
        style={{
          display: "block",
          fontFamily: "var(--font-display)",
          fontSize: 27,
          lineHeight: 1,
        }}
      >
        {value}
      </strong>
      <span
        className="muted"
        style={{
          display: "block",
          marginTop: 5,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: ".1em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 20,
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
          {eyebrow}
        </span>

        <h2
          style={{
            margin: "8px 0 10px",
            fontSize: "clamp(2.8rem,7vw,5.5rem)",
          }}
        >
          {title}
        </h2>

        <p className="muted" style={{ maxWidth: 630, margin: 0, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}
