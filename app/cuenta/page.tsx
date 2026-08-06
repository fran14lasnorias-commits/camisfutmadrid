import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  packed: "Preparado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const ORDER_FLOW = [
  { key: "pending", label: "Recibido" },
  { key: "paid", label: "Pagado" },
  { key: "preparing", label: "Preparando" },
  { key: "packed", label: "Preparado" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregado" },
];

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toFixed(2).replace(".", ",") + " €";
}

function orderDate(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AccountPage() {
  const { supabase, user } = await requireUser();

  // Recupera automáticamente los pedidos realizados como invitado
  // que tengan el mismo correo que la cuenta iniciada.
  const { error: claimError } = await supabase.rpc("claim_guest_orders");

  if (claimError) {
    console.error("No se pudieron vincular los pedidos de invitado:", claimError.message);
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,number,status,total_eur,payment_method,shipping_method,
      shipping_address,carrier,tracking_number,tracking_url,
      shipped_at,delivered_at,created_at,
      order_items(
        id,quantity,unit_price_eur,product_name_snapshot,size_snapshot,
        personalization_name,personalization_number,patch
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as any[];

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            ÁREA DE CLIENTE
          </span>
          <h1 style={{ marginBottom: 6 }}>Mi cuenta</h1>
          <p className="muted" style={{ margin: 0 }}>
            {user.email}
          </p>
        </div>

        <form action={signOut}>
          <button className="btn-secondary">CERRAR SESIÓN</button>
        </form>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2>Mis pedidos</h2>

        {error ? (
          <div className="card" style={{ padding: 22 }}>
            <strong>No hemos podido cargar tus pedidos.</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Vuelve a intentarlo dentro de unos minutos.
            </p>
          </div>
        ) : !orders.length ? (
          <div className="card" style={{ padding: 24 }}>
            <strong>Todavía no tienes pedidos.</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Cuando realices una compra, podrás consultar aquí su estado.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {orders.map((order) => {
              const address = order.shipping_address ?? {};
              const statusIndex = ORDER_FLOW.findIndex(
                (step) => step.key === order.status
              );
              const isCancelled = order.status === "cancelled";

              return (
                <article
                  key={order.id}
                  className="card"
                  style={{ padding: 22, overflow: "hidden" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span className="muted">Pedido</span>
                      <h2 style={{ margin: "4px 0 5px" }}>{order.number}</h2>
                      <span className="muted">{orderDate(order.created_at)}</span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 12px",
                          borderRadius: 999,
                          background: isCancelled ? "#3a1519" : "#25103e",
                          color: isCancelled ? "#ffb4b4" : "#d6a6ff",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 22,
                          marginTop: 9,
                        }}
                      >
                        {money(order.total_eur)}
                      </strong>
                    </div>
                  </div>

                  {!isCancelled && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(92px, 1fr))",
                        gap: 8,
                        marginTop: 24,
                      }}
                    >
                      {ORDER_FLOW.map((step, index) => {
                        const completed =
                          statusIndex >= 0 && index <= statusIndex;

                        return (
                          <div
                            key={step.key}
                            style={{
                              padding: "10px 8px",
                              borderRadius: 12,
                              border: completed
                                ? "1px solid #9b36ff"
                                : "1px solid var(--border)",
                              background: completed
                                ? "rgba(155,54,255,.13)"
                                : "#0d0d12",
                              textAlign: "center",
                              fontSize: 12,
                              fontWeight: completed ? 800 : 600,
                              color: completed ? "#e0b5ff" : "#8f8f9a",
                            }}
                          >
                            {step.label}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 16,
                      marginTop: 20,
                    }}
                  >
                    <section
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        padding: 16,
                        background: "#0d0d12",
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>Artículos</h3>

                      <div style={{ display: "grid", gap: 12 }}>
                        {(order.order_items ?? []).map((item: any) => (
                          <div
                            key={item.id}
                            style={{
                              paddingBottom: 12,
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                              }}
                            >
                              <strong>{item.product_name_snapshot}</strong>
                              <strong>
                                {money(
                                  Number(item.unit_price_eur) *
                                    Number(item.quantity)
                                )}
                              </strong>
                            </div>

                            <div
                              className="muted"
                              style={{ marginTop: 5, lineHeight: 1.6 }}
                            >
                              Talla: {item.size_snapshot} · Cantidad:{" "}
                              {item.quantity}
                              {item.personalization_name && (
                                <>
                                  <br />
                                  Nombre: {item.personalization_name}
                                  {item.personalization_number
                                    ? ` · Dorsal: ${item.personalization_number}`
                                    : ""}
                                </>
                              )}
                              {item.patch && (
                                <>
                                  <br />
                                  Parche: {item.patch}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 16,
                        padding: 16,
                        background: "#0d0d12",
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>Entrega y seguimiento</h3>

                      <div style={{ lineHeight: 1.65 }}>
                        <span className="muted">Dirección</span>
                        <strong style={{ display: "block" }}>
                          {address.address ??
                            address.addressLine ??
                            address.line1 ??
                            "—"}
                        </strong>
                        <span>
                          {[
                            address.postalCode ?? address.postal_code,
                            address.city,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <span className="muted">Empresa de transporte</span>
                        <strong style={{ display: "block", marginTop: 3 }}>
                          {order.carrier || "Pendiente de asignar"}
                        </strong>
                      </div>

                      {order.tracking_number && (
                        <div style={{ marginTop: 16 }}>
                          <span className="muted">Número de seguimiento</span>
                          <strong style={{ display: "block", marginTop: 3 }}>
                            {order.tracking_number}
                          </strong>
                        </div>
                      )}

                      {order.tracking_url && (
                        <a
                          href={order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{
                            display: "inline-flex",
                            marginTop: 18,
                            textDecoration: "none",
                          }}
                        >
                          VER SEGUIMIENTO
                        </a>
                      )}

                      {order.status === "shipped" &&
                        !order.tracking_number &&
                        !order.tracking_url && (
                          <p className="muted" style={{ marginBottom: 0 }}>
                            El pedido ya ha salido. Si es una entrega en mano,
                            no necesita número de seguimiento.
                          </p>
                        )}

                      {order.status === "delivered" && (
                        <p
                          style={{
                            marginBottom: 0,
                            marginTop: 16,
                            color: "#d6a6ff",
                            fontWeight: 800,
                          }}
                        >
                          Pedido entregado. ¡Gracias por confiar en
                          CamisfutMadrid!
                        </p>
                      )}
                    </section>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
