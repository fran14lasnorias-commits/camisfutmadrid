import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminProductsBrowser } from "@/components/admin-products-browser";

const PAGE_SIZE = 50;

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  type?: string;
  sort?: string;
};

function safePage(value?: string) {
  const parsed = Number(value ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function safeSearch(value?: string) {
  return String(value ?? "")
    .trim()
    .slice(0, 80)
    .replace(/[,%()]/g, " ");
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const page = safePage(params.page);
  const q = safeSearch(params.q);
  const status =
    params.status === "published" || params.status === "draft"
      ? params.status
      : "all";
  const type = safeSearch(params.type) || "all";
  const sort =
    params.sort === "name" || params.sort === "team"
      ? params.sort
      : "newest";

  let query = supabase
    .from("products")
    .select(
      `
        id,name,slug,team,season,type,price_eur,original_price_eur,supplier_cost_usd,
        description,supplier_url,published,created_at,
        product_images(url,position),
        product_variants(size,stock)
      `,
      { count: "exact" }
    );

  if (q) {
    const search = `%${q}%`;
    query = query.or(
      `name.ilike.${search},team.ilike.${search},slug.ilike.${search},season.ilike.${search}`
    );
  }

  if (status === "published") {
    query = query.eq("published", true);
  } else if (status === "draft") {
    query = query.eq("published", false);
  }

  if (type !== "all") {
    query = query.eq("type", type);
  }

  if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "team") {
    query = query
      .order("team", { ascending: true })
      .order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: products, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`No se pudieron cargar los productos: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            ADMINISTRACIÓN
          </span>
          <h1 style={{ marginBottom: 0 }}>Productos</h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            {total.toLocaleString("es-ES")} productos encontrados · 50 por página
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/stock" className="btn-secondary">
            CONTROL DE STOCK
          </Link>

          <Link href="/admin/importador" className="btn-primary">
            IMPORTAR DESDE PROVEEDOR
          </Link>
        </div>
      </div>

      <AdminProductForm />

      <AdminProductsBrowser
        products={(products ?? []) as any}
        total={total}
        page={currentPage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        initialQuery={q}
        initialStatus={status}
        initialType={type}
        initialSort={sort}
      />
    </main>
  );
}
