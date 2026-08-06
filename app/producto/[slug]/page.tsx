import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/product-configurator";
import { getPublishedProductBySlug } from "@/lib/catalog";
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
  const product = await getProduct(slug);

  if (!product) notFound();

  const description = productDescription(product);
  const productUrl = `${SITE_URL}/producto/${product.slug}`;
  const images = product.images.filter(Boolean).map(absoluteUrl);

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
    </>
  );
}
