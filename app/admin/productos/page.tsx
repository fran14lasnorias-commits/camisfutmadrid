import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminProductEditor } from "@/components/admin-product-editor";

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,name,slug,team,season,type,price_eur,supplier_cost_usd,
      description,supplier_url,published,
      product_images(url,position),
      product_variants(size,stock)
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
        <div>
          <span style={{color:"#d6a6ff",fontWeight:800}}>ADMINISTRACIÓN</span>
          <h1>Productos</h1>
        </div>
        <Link href="/admin/importador" className="btn-secondary">IMPORTAR DESDE PROVEEDOR</Link>
      </div>

      <AdminProductForm />

      <section style={{marginTop:30}}>
        <h2>Productos existentes</h2>
        <div style={{display:"grid",gap:12}}>
          {(products ?? []).map(product=>(
            <AdminProductEditor key={product.id} product={product as any}/>
          ))}
        </div>
      </section>
    </main>
  );
}
