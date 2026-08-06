import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const { supabase, user } = await requireUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id,number,status,total_eur,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" }}>
        <div>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>ÁREA DE CLIENTE</span>
          <h1>Mi cuenta</h1>
          <p className="muted">{user.email}</p>
        </div>
        <form action={signOut}><button className="btn-secondary">CERRAR SESIÓN</button></form>
      </div>

      <section className="card" style={{ padding: 24, marginTop: 22 }}>
        <h2>Mis pedidos</h2>
        {!orders?.length ? (
          <p className="muted">Todavía no tienes pedidos.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {orders.map(order => (
              <article key={order.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between" }}>
                <div><strong>{order.number}</strong><div className="muted">{order.status}</div></div>
                <strong>{Number(order.total_eur).toFixed(2).replace(".", ",")} €</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
