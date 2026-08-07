import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminProductsBrowser } from "@/components/admin-products-browser";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,name,slug,team,season,type,price_eur,original_price_eur,supplier_cost_usd,
      description,supplier_url,published,created_at,
      product_images(url,position),
      product_variants(size,stock)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los productos: ${error.message}`);
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

      <AdminProductsBrowser products={(products ?? []) as any} />
    </main>
  );
}
