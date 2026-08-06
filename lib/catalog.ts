import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products";
import { products as fallbackProducts } from "@/lib/products";

export async function getPublishedProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fallbackProducts;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,name,team,season,type,price_eur,supplier_cost_usd,product_images(url,position),product_variants(size,stock)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return fallbackProducts;

  return data.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    team: row.team,
    season: row.season ?? "",
    type: row.type,
    price: Number(row.price_eur),
    costUsd: Number(row.supplier_cost_usd),
    images: (row.product_images ?? [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((image: any) => image.url),
    sizes: (row.product_variants ?? [])
      .filter((variant: any) => variant.stock > 0)
      .map((variant: any) => variant.size),
  }));
}
