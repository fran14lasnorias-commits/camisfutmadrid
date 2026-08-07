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
  original_price_eur: number | string | null;
  supplier_cost_usd: number | string;
  product_images?: Array<{ url: string; position: number }> | null;
  product_variants?: Array<{ size: string; stock: number }> | null;
};

function orderedImages(
  images: Array<{ url: string; position: number }> | null | undefined
) {
  return [...(images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => image.url)
    .filter(Boolean);
}

function orderedSizes(
  variants: Array<{ size: string; stock: number }> | null | undefined
) {
  const order = [
    "16","18","20","22","24","26","28",
    "XS","S","M","L","XL","2XL","3XL","4XL","5XL",
  ];

  return [...(variants ?? [])]
    .filter((variant) => Number(variant.stock) > 0)
    .sort((a, b) => {
      const aIndex = order.indexOf(a.size);
      const bIndex = order.indexOf(b.size);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    })
    .map((variant) => variant.size);
}

function mapProduct(row: ProductRow, includeRealSizes = false): Product {
  const images = orderedImages(row.product_images);
  const sizes = includeRealSizes
    ? orderedSizes(row.product_variants)
    : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    team: row.team,
    season: row.season ?? "",
    type: row.type,
    price: Number(row.price_eur),
    originalPrice:
      row.original_price_eur != null &&
      Number(row.original_price_eur) > Number(row.price_eur)
        ? Number(row.original_price_eur)
        : undefined,
    costUsd: Number(row.supplier_cost_usd),
    images: images.length
      ? images
      : ["/placeholder-shirt.svg", "/placeholder-shirt-back.svg"],
    // Las listas públicas no necesitan descargar miles de filas de stock.
    // Las tallas reales se cargan únicamente en la ficha del producto.
    sizes: sizes.length
      ? sizes
      : row.type === "kids"
        ? ["16", "18", "20", "22", "24", "26", "28"]
        : ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  };
}

const listProductSelect = `
  id,
  slug,
  name,
  team,
  season,
  type,
  price_eur,
  original_price_eur,
  supplier_cost_usd,
  product_images(url,position)
`;

const detailProductSelect = `
  ${listProductSelect},
  product_variants(size,stock)
`;

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getPublishedProducts(
  options: { limit?: number } = {}
): Promise<Product[]> {
  if (!hasSupabaseConfig()) {
    return options.limit
      ? fallbackProducts.slice(0, options.limit)
      : fallbackProducts;
  }

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(listProductSelect)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return options.limit
      ? fallbackProducts.slice(0, options.limit)
      : fallbackProducts;
  }

  return (data as ProductRow[]).map((row) => mapProduct(row, false));
}

export async function getPublishedProductBySlug(
  slug: string
): Promise<Product | null> {
  if (!hasSupabaseConfig()) {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(detailProductSelect)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }

  return mapProduct(data as ProductRow, true);
}
