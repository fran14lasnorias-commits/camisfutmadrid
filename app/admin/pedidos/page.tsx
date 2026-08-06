import { requireAdmin } from "@/lib/auth";
import { AdminOrderActions } from "@/components/admin-order-actions";

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,number,status,total_eur,supplier_cost_usd,estimated_profit_eur,
      payment_method,payment_reference,paid_at,shipping_address,created_at,
      order_items(
        id,quantity,unit_price_eur,product_name_snapshot,size_snapshot,
        personalization_name,personalization_number,patch
      )
    `)
    .order("created_at",{ascending:false});

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <span style={{color:"#d6a6ff",fontWeight:800}}>ADMINISTRACIÓN</span>
      <h1>Pedidos</h1>

      <div style={{display:"grid",gap:16}}>
        {(orders ?? []).map(order=>(
          <article key={order.id} className="card" style={{padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:18}}>
              <div>
                <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  <h2 style={{margin:0}}>{order.number}</h2>
                  <span style={{padding:"6px 10px",borderRadius:999,background:"#25103e",color:"#d6a6ff",fontSize:12,fontWeight:800}}>
                    {order.status}
                  </span>
                </div>
                <p className="muted">
                  {new Date(order.created_at).toLocaleString("es-ES")} · {order.payment_method}
                </p>

                <div className="card" style={{padding:14,background:"#0d0d12"}}>
                  {(order.order_items ?? []).map((item:any)=>(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",gap:14,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                      <span>
                        {item.product_name_snapshot} · {item.size_snapshot}
                        {item.personalization_name ? ` · ${item.personalization_name} ${item.personalization_number ?? ""}` : ""}
                        {item.patch ? ` · ${item.patch}` : ""}
                      </span>
                      <strong>{Number(item.unit_price_eur).toFixed(2).replace(".",",")} €</strong>
                    </div>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:14}}>
                  <div className="card" style={{padding:12}}>
                    <span className="muted">Total</span>
                    <strong style={{display:"block"}}>{Number(order.total_eur).toFixed(2).replace(".",",")} €</strong>
                  </div>
                  <div className="card" style={{padding:12}}>
                    <span className="muted">Coste proveedor</span>
                    <strong style={{display:"block"}}>{Number(order.supplier_cost_usd).toFixed(2)} $</strong>
                  </div>
                  <div className="card" style={{padding:12}}>
                    <span className="muted">Referencia</span>
                    <strong style={{display:"block"}}>{order.payment_reference || "—"}</strong>
                  </div>
                </div>
              </div>

              <AdminOrderActions
                orderId={order.id}
                currentStatus={order.status}
                paymentMethod={order.payment_method}
              />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
