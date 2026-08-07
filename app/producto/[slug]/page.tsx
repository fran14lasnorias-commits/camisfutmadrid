import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/product-configurator";
import { ProductCard } from "@/components/product-card";
import {
  getPublishedProductBySlug,
  getPublishedProducts,
} from "@/lib/catalog";
import type { Product } from "@/lib/products";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.camisfutmadrid.com"
).replace(/\/$/, "");

const getProduct = cache(getPublishedProductBySlug);

const TYPE_LABELS: Record<Product["type"], string> = {
  fan: "versión fan",
  player: "versión player",
  retro: "estilo retro",
  kids: "versión infantil",
};

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function productDescription(product: Product) {
  const season = product.season ? ` de la temporada ${product.season}` : "";

  return `${product.name}: camiseta de fútbol ${TYPE_LABELS[product.type]} de ${product.team}${season}. Disponible en varias tallas, personalizable con nombre, dorsal y parche. Pago seguro y entrega en Madrid.`;
}

function chooseRelatedProducts(
  currentProduct: Product,
  products: Product[]
): Product[] {
  const candidates = products
    .filter((product) => product.id !== currentProduct.id)
    .map((product) => {
      let score = 0;

      if (product.team === currentProduct.team) score += 8;
      if (product.type === currentProduct.type) score += 5;
      if (
        product.season &&
        currentProduct.season &&
        product.season === currentProduct.season
      ) {
        score += 3;
      }

      if (product.price <= currentProduct.price + 5) score += 1;

      return { product, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.product.name.localeCompare(b.product.name, "es")
    );

  return candidates.slice(0, 4).map(({ product }) => product);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = productDescription(product);
  const productUrl = `${SITE_URL}/producto/${product.slug}`;
  const images = product.images
    .filter(Boolean)
    .slice(0, 4)
    .map((image) => absoluteUrl(image));

  return {
    title: product.name,
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: productUrl,
      siteName: "CamisfutMadrid",
      title: `${product.name} | CamisfutMadrid`,
      description,
      images: images.map((url) => ({
        url,
        alt: product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | CamisfutMadrid`,
      description,
      images: images.length ? [images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, products] = await Promise.all([
    getProduct(slug),
    getPublishedProducts(),
  ]);

  if (!product) notFound();

  const description = productDescription(product);
  const productUrl = `${SITE_URL}/producto/${product.slug}`;
  const images = product.images.filter(Boolean).map(absoluteUrl);
  const relatedProducts = chooseRelatedProducts(product, products);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: images,
    sku: product.id,
    category: "Camisetas de fútbol",
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability:
        product.sizes.length > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "CamisfutMadrid",
        url: SITE_URL,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <ProductConfigurator product={product} />

      <section
        style={{
          borderTop: "1px solid rgba(255,255,255,.07)",
          background:
            "linear-gradient(180deg,rgba(139,44,255,.035),transparent 22rem)",
        }}
      >
        <div className="container" style={{ padding: "70px 0 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <TrustItem
              number="01"
              title="PAGO SEGURO"
              text="Compra protegida y proceso claro."
            />
            <TrustItem
              number="02"
              title="PERSONALIZACIÓN"
              text="Nombre, dorsal y parche a tu gusto."
            />
            <TrustItem
              number="03"
              title="ENTREGA 7–13 DÍAS"
              text="Seguimiento y atención cercana."
            />
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="container" style={{ padding: "64px 0 92px" }}>
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
                  TAMBIÉN TE PUEDEN GUSTAR
                </span>

                <h2
                  style={{
                    margin: "8px 0 0",
                    fontSize: "clamp(2.8rem,7vw,5.2rem)",
                  }}
                >
                  CAMISETAS RELACIONADAS
                </h2>
              </div>

              <a
                href="/catalogo"
                style={{
                  color: "#d6a6ff",
                  fontWeight: 900,
                  letterSpacing: ".04em",
                }}
              >
                VER TODO →
              </a>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
                gap: 18,
                marginTop: 28,
              }}
            >
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function TrustItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article
      className="card"
      style={{
        minHeight: 150,
        padding: 22,
        background:
          "linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--surface)",
      }}
    >
      <span
        style={{
          color: "#d6a6ff",
          fontFamily: "var(--font-display)",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        {number}
      </span>

      <h3 style={{ margin: "18px 0 7px", fontSize: 25 }}>{title}</h3>

      <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
        {text}
      </p>
    </article>
  );
}
