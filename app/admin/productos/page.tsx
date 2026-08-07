import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminProductsBrowser } from "@/components/admin-products-browser";

const PAGE_SIZE = 1000;
const MAX_ADMIN_PRODUCTS = 10_000;

async function loadAllProducts(supabase: any) {
  const products: any[] = [];

  for (
    let from = 0;
    from < MAX_ADMIN_PRODUCTS;
    from += PAGE_SIZE
  ) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,name,slug,team,season,type,price_eur,original_price_eur,supplier_cost_usd,
        description,supplier_url,published,created_at,
        product_images(url,position),
        product_variants(size,stock)
      `)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`No se pudieron cargar los productos: ${error.message}`);
    }

    const batch = data ?? [];
    products.push(...batch);

    if (batch.length < PAGE_SIZE) break;
  }

  return products;
}

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();

  const [
    products,
    { count: totalCount, error: countError },
  ] = await Promise.all([
    loadAllProducts(supabase),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true }),
  ]);

  if (countError) {
    throw new Error(
      `No se pudo contar el total de productos: ${countError.message}`
    );
  }

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
          <p className="muted" style={{ marginTop: 8 }}>
            {Number(totalCount ?? products.length).toLocaleString("es-ES")} productos totales
            {products.length < Number(totalCount ?? products.length)
              ? ` · mostrando los primeros ${products.length.toLocaleString("es-ES")}`
              : ""}
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

      <AdminProductsBrowser products={products as any} />
    </main>
  );
}
