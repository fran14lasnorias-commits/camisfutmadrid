import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://camisfutmadrid.com";
  const products = await getPublishedProducts();

  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/acceso`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${site}/legal/aviso-legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site}/legal/condiciones`, changeFrequency: "yearly", priority: 0.3 },
    ...products.map(product => ({
      url: `${site}/producto/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
