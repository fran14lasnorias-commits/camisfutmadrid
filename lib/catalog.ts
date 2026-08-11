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

export type CatalogQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  team?: string;
  season?: string;
  type?: Product["type"] | null;
  teams?: string[];
  sort?: "newest" | "price_asc" | "price_desc" | "name";
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
      const ai = order.indexOf(a.size);
      const bi = order.indexOf(b.size);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map((variant) => variant.size);
}

function mapProduct(
  row: ProductRow,
  includeRealSizes = false,
  includeFullGallery = true
): Product {
  const allImages = orderedImages(row.product_images);
  const images = includeFullGallery ? allImages : allImages.slice(0, 1);
  const sizes = includeRealSizes ? orderedSizes(row.product_variants) : [];

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
    images: images.length ? images : ["/placeholder-shirt.svg"],
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

function cleanSearch(value?: string) {
  return String(value ?? "")
    .trim()
    .slice(0, 80)
    .replace(/[,%()]/g, " ");
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
    .eq("product_images.position", 0)
    .order("created_at", { ascending: false });

  query = query.limit(Math.min(options.limit ?? 120, 250));

  const { data, error } = await query;

  if (error || !data) {
    return options.limit
      ? fallbackProducts.slice(0, options.limit)
      : fallbackProducts;
  }

  return (data as ProductRow[]).map((row) =>
    mapProduct(row, false, false)
  );
}

export async function getPublishedProductsPage(
  options: CatalogQuery = {}
): Promise<{
  products: Product[];
  count: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(Math.max(options.pageSize ?? 48, 12), 60);
  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));
  const q = cleanSearch(options.q);
  const team = cleanSearch(options.team);
  const season = cleanSearch(options.season);

  if (!hasSupabaseConfig()) {
    let rows = [...fallbackProducts];

    if (q) {
      const value = q.toLocaleLowerCase("es");
      rows = rows.filter((item) =>
        `${item.name} ${item.team} ${item.season}`
          .toLocaleLowerCase("es")
          .includes(value)
      );
    }
    if (team) rows = rows.filter((item) => item.team === team);
    if (season) rows = rows.filter((item) => item.season === season);
    if (options.type) rows = rows.filter((item) => item.type === options.type);
    if (options.teams?.length) {
      const allowed = new Set(
        options.teams.map((item) => item.toLocaleLowerCase("es"))
      );
      rows = rows.filter((item) =>
        allowed.has(item.team.toLocaleLowerCase("es"))
      );
    }

    const count = rows.length;
    const from = (requestedPage - 1) * pageSize;
    return {
      products: rows.slice(from, from + pageSize),
      count,
      page: requestedPage,
      pageSize,
    };
  }

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(listProductSelect, { count: "exact" })
    .eq("published", true)
    .eq("product_images.position", 0);

  if (q) {
    const search = `%${q}%`;
    query = query.or(
      `name.ilike.${search},team.ilike.${search},slug.ilike.${search},season.ilike.${search}`
    );
  }

  if (team) query = query.eq("team", team);
  if (season) query = query.eq("season", season);
  if (options.type) query = query.eq("type", options.type);

  if (options.teams?.length) {
    query = query.in("team", options.teams);
  }

  switch (options.sort) {
    case "price_asc":
      query = query.order("price_eur", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_eur", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error || !data) {
    return {
      products: [],
      count: 0,
      page: requestedPage,
      pageSize,
    };
  }

  return {
    products: (data as ProductRow[]).map((row) =>
      mapProduct(row, false, false)
    ),
    count: count ?? 0,
    page: requestedPage,
    pageSize,
  };
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

  return mapProduct(data as ProductRow, true, true);
}
