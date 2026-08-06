import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products";
import { products as fallbackProducts } from "@/lib/products";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  team: string;
  season: string | null;
  type: Product["type"];
  price_eur: number | string;
  supplier_cost_usd: number | string;
  product_images?: Array<{ url: string; position: number }> | null;
  product_variants?: Array<{ size: string; stock: number }> | null;
};

function mapProduct(row: ProductRow): Product {
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(image => image.url)
    .filter(Boolean);

  const sizes = [...(row.product_variants ?? [])]
    .filter(variant => Number(variant.stock) > 0)
    .sort((a, b) => {
      const order = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
      return order.indexOf(a.size) - order.indexOf(b.size);
    })
    .map(variant => variant.size);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    team: row.team,
    season: row.season ?? "",
    type: row.type,
    price: Number(row.price_eur),
    costUsd: Number(row.supplier_cost_usd),
    images: images.length ? images : ["/placeholder-shirt.svg", "/placeholder-shirt-back.svg"],
    sizes: sizes.length ? sizes : ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  };
}

const productSelect = `
  id,
  slug,
  name,
  team,
  season,
  type,
  price_eur,
  supplier_cost_usd,
  product_images(url,position),
  product_variants(size,stock)
`;

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!hasSupabaseConfig()) return fallbackProducts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return fallbackProducts;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  if (!hasSupabaseConfig()) {
    return fallbackProducts.find(product => product.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) {
    return fallbackProducts.find(product => product.slug === slug) ?? null;
  }

  return mapProduct(data as ProductRow);
}
