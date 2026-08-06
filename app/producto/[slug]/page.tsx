import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import { ProductConfigurator } from "@/components/product-configurator";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find(item => item.slug === slug);
  if (!product) notFound();
  return <ProductConfigurator product={product} />;
}
