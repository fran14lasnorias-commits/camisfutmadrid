import { requireAdmin } from "@/lib/auth";

export default async function CustomersPage() {
  const { supabase } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,full_name,phone,created_at,
      orders(id,total_eur,status,created_at)
    `)
    .eq("role","customer")
    .order("created_at",{ascending:false});

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <span style={{color:"#d6a6ff",fontWeight:800}}>ADMINISTRACIÓN</span>
      <h1>Clientes</h1>

      <div style={{display:"grid",gap:12}}>
        {(profiles ?? []).map((profile:any)=>{
          const paidOrders=(profile.orders ?? []).filter((order:any)=>["paid","preparing","packed","shipped","delivered"].includes(order.status));
          const spent=paidOrders.reduce((sum:number,order:any)=>sum+Number(order.total_eur),0);
          return (
            <article key={profile.id} className="card" style={{padding:18,display:"grid",gridTemplateColumns:"1fr repeat(3,auto)",gap:18,alignItems:"center"}}>
              <div>
                <strong>{profile.full_name || "Cliente sin nombre"}</strong>
                <div className="muted">{profile.phone || "Sin teléfono"}</div>
              </div>
              <div><span className="muted">Pedidos</span><strong style={{display:"block"}}>{paidOrders.length}</strong></div>
              <div><span className="muted">Gastado</span><strong style={{display:"block"}}>{spent.toFixed(2).replace(".",",")} €</strong></div>
              <div><span className="muted">Alta</span><strong style={{display:"block"}}>{new Date(profile.created_at).toLocaleDateString("es-ES")}</strong></div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
