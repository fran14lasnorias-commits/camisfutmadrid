import { notFound } from "next/navigation";
import { ProductConfigurator } from "@/components/product-configurator";
import { getPublishedProductBySlug } from "@/lib/catalog";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) notFound();

  return <ProductConfigurator product={product} />;
}
