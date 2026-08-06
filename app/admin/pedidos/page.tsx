import { requireAdmin } from "@/lib/auth";
import { AdminOrderActions } from "@/components/admin-order-actions";

type ShippingAddress = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  packed: "Empaquetado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function money(value: unknown) {
  return `${Number(value ?? 0).toFixed(2).replace(".", ",")} €`;
}

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,number,status,total_eur,supplier_cost_usd,estimated_profit_eur,
      payment_method,payment_reference,paid_at,shipping_address,created_at,
      carrier,tracking_number,tracking_url,shipped_at,delivered_at,admin_notes,
      order_items(
        id,quantity,unit_price_eur,product_name_snapshot,size_snapshot,
        personalization_name,personalization_number,patch
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  }

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        ADMINISTRACIÓN
      </span>
      <h1>Pedidos</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Cambia el estado, guarda el seguimiento y el cliente recibirá el correo
        correspondiente automáticamente.
      </p>

      <div style={{ display: "grid", gap: 18 }}>
        {(orders ?? []).map((order) => {
          const address =
            (order.shipping_address as ShippingAddress | null) ?? null;

          return (
            <article key={order.id} className="card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  gap: 22,
                }}
              >
                <div style={{ minWidth: 0, flex: "3 1 560px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <h2 style={{ margin: 0 }}>{order.number}</h2>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        background:
                          order.status === "cancelled"
                            ? "#35151c"
                            : "#25103e",
                        color:
                          order.status === "cancelled"
                            ? "#ff9ba9"
                            : "#d6a6ff",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>

                  <p className="muted">
                    {new Date(order.created_at).toLocaleString("es-ES")}
                    {" · "}
                    {order.payment_method || "Método no indicado"}
                  </p>

                  {address && (
                    <section
                      className="card"
                      style={{
                        padding: 14,
                        marginBottom: 14,
                        background: "#0d0d12",
                      }}
                    >
                      <strong>Cliente y entrega</strong>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(180px,1fr))",
                          gap: 12,
                          marginTop: 10,
                          fontSize: 14,
                        }}
                      >
                        <div>
                          <span className="muted">Cliente</span>
                          <strong style={{ display: "block" }}>
                            {address.fullName || "Sin nombre"}
                          </strong>
                          <span>{address.email || "Sin correo"}</span>
                          <br />
                          <span>{address.phone || "Sin teléfono"}</span>
                        </div>

                        <div>
                          <span className="muted">Dirección</span>
                          <strong style={{ display: "block" }}>
                            {address.address || "Sin dirección"}
                          </strong>
                          <span>
                            {address.postalCode || ""} {address.city || ""}
                          </span>
                        </div>
                      </div>
                    </section>
                  )}

                  <section
                    className="card"
                    style={{ padding: 14, background: "#0d0d12" }}
                  >
                    <strong>Artículos</strong>

                    {(order.order_items ?? []).map((item) => {
                      const quantity = Number(item.quantity ?? 1);
                      const itemTotal =
                        Number(item.unit_price_eur ?? 0) * quantity;

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                            padding: "11px 0",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <div>
                            <strong>
                              {item.product_name_snapshot} ·{" "}
                              {item.size_snapshot}
                            </strong>
                            <span
                              className="muted"
                              style={{ display: "block", marginTop: 4 }}
                            >
                              Cantidad: {quantity}
                            </span>

                            {item.personalization_name && (
                              <span
                                style={{
                                  display: "block",
                                  color: "#d6a6ff",
                                  marginTop: 5,
                                  fontWeight: 700,
                                }}
                              >
                                Nombre: {item.personalization_name} · Dorsal:{" "}
                                {item.personalization_number || "—"}
                              </span>
                            )}

                            {item.patch && (
                              <span
                                className="muted"
                                style={{ display: "block", marginTop: 3 }}
                              >
                                Parche: {item.patch}
                              </span>
                            )}
                          </div>

                          <strong style={{ whiteSpace: "nowrap" }}>
                            {money(itemTotal)}
                          </strong>
                        </div>
                      );
                    })}
                  </section>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(150px,1fr))",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    <div className="card" style={{ padding: 12 }}>
                      <span className="muted">Total</span>
                      <strong style={{ display: "block" }}>
                        {money(order.total_eur)}
                      </strong>
                    </div>

                    <div className="card" style={{ padding: 12 }}>
                      <span className="muted">Coste proveedor</span>
                      <strong style={{ display: "block" }}>
                        {Number(order.supplier_cost_usd ?? 0).toFixed(2)} $
                      </strong>
                    </div>

                    <div className="card" style={{ padding: 12 }}>
                      <span className="muted">Referencia de pago</span>
                      <strong
                        style={{
                          display: "block",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {order.payment_reference || "—"}
                      </strong>
                    </div>

                    <div className="card" style={{ padding: 12 }}>
                      <span className="muted">Seguimiento</span>
                      <strong style={{ display: "block" }}>
                        {order.tracking_number || "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                <AdminOrderActions
                  orderId={order.id}
                  currentStatus={order.status}
                  paymentMethod={order.payment_method}
                  carrier={order.carrier}
                  trackingNumber={order.tracking_number}
                  trackingUrl={order.tracking_url}
                  adminNotes={order.admin_notes}
                />
              </div>
            </article>
          );
        })}

        {!orders?.length && (
          <div className="card" style={{ padding: 24 }}>
            <strong>Todavía no hay pedidos.</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              Los nuevos pedidos aparecerán aquí automáticamente.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
