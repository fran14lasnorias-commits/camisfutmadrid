"use client";

import { FormEvent, useMemo, useState } from "react";

type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

type PublicOrder = {
  number: string;
  status: OrderStatus;
  totalEur: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

const STEPS: Array<{
  status: Exclude<OrderStatus, "cancelled">;
  title: string;
  description: string;
}> = [
  {
    status: "pending",
    title: "Pedido recibido",
    description: "Hemos registrado tu pedido.",
  },
  {
    status: "paid",
    title: "Pago confirmado",
    description: "El pago está confirmado.",
  },
  {
    status: "preparing",
    title: "Preparando camiseta",
    description: "Estamos preparando tu pedido.",
  },
  {
    status: "packed",
    title: "Pedido empaquetado",
    description: "Tu pedido está listo para salir.",
  },
  {
    status: "shipped",
    title: "Enviado",
    description: "Tu camiseta ya está en camino.",
  },
  {
    status: "delivered",
    title: "Entregado",
    description: "El pedido figura como entregado.",
  },
];

const ORDER_INDEX: Record<Exclude<OrderStatus, "cancelled">, number> = {
  pending: 0,
  paid: 1,
  preparing: 2,
  packed: 3,
  shipped: 4,
  delivered: 5,
};

export function OrderTracker() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentIndex = useMemo(() => {
    if (!order || order.status === "cancelled") return -1;
    return ORDER_INDEX[order.status] ?? 0;
  }, [order]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/pedido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber,
          email,
        }),
      });

      const result = (await response.json()) as {
        order?: PublicOrder;
        error?: string;
      };

      if (!response.ok || !result.order) {
        throw new Error(result.error || "No se pudo consultar el pedido.");
      }

      setOrder(result.order);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo consultar el pedido."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <form
        onSubmit={submit}
        className="card"
        style={{
          display: "grid",
          gap: 16,
          padding: "clamp(20px,5vw,30px)",
          borderColor: "rgba(195,92,255,.18)",
          background:
            "radial-gradient(circle at 10% 0%,rgba(139,44,255,.12),transparent 22rem),var(--surface)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(240px,100%),1fr))",
            gap: 14,
          }}
        >
          <Field label="Número de pedido">
            <input
              value={orderNumber}
              onChange={(event) =>
                setOrderNumber(event.target.value.toUpperCase())
              }
              placeholder="CFM-123456-ABC123"
              autoComplete="off"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="Email utilizado en la compra">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              style={inputStyle}
            />
          </Field>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "CONSULTANDO…" : "VER ESTADO DEL PEDIDO"}
        </button>

        {error && (
          <p
            role="alert"
            style={{
              margin: 0,
              padding: "12px 14px",
              border: "1px solid rgba(255,86,111,.34)",
              borderRadius: 12,
              background: "rgba(255,86,111,.08)",
              color: "#ff9cab",
            }}
          >
            {error}
          </p>
        )}
      </form>

      {order && (
        <section
          className="card"
          style={{
            overflow: "hidden",
            borderColor: "rgba(195,92,255,.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 18,
              flexWrap: "wrap",
              padding: "clamp(22px,5vw,32px)",
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(135deg,rgba(139,44,255,.11),transparent)",
            }}
          >
            <div>
              <span
                style={{
                  color: "#d6a6ff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".12em",
                }}
              >
                TU PEDIDO
              </span>

              <h2
                style={{
                  margin: "7px 0 0",
                  fontSize: "clamp(2rem,6vw,3.7rem)",
                }}
              >
                {order.number}
              </h2>
            </div>

            <div style={{ textAlign: "right" }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Total
              </span>
              <strong
                style={{
                  display: "block",
                  marginTop: 3,
                  color: "var(--purple-2)",
                  fontFamily: "var(--font-display)",
                  fontSize: 27,
                }}
              >
                {order.totalEur.toFixed(2).replace(".", ",")} €
              </strong>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div style={{ padding: "clamp(22px,5vw,32px)" }}>
              <div
                style={{
                  padding: 18,
                  border: "1px solid rgba(255,86,111,.32)",
                  borderRadius: 15,
                  background: "rgba(255,86,111,.07)",
                }}
              >
                <strong style={{ color: "#ff9cab" }}>Pedido cancelado</strong>
                <p className="muted" style={{ margin: "5px 0 0" }}>
                  Este pedido figura como cancelado.
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 0,
                padding: "clamp(20px,5vw,32px)",
              }}
            >
              {STEPS.map((step, index) => {
                const completed = index <= currentIndex;
                const current = index === currentIndex;

                return (
                  <div
                    key={step.status}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "38px minmax(0,1fr)",
                      gap: 14,
                      minHeight: 82,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        display: "grid",
                        justifyItems: "center",
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          zIndex: 2,
                          display: "grid",
                          width: 30,
                          height: 30,
                          placeItems: "center",
                          borderRadius: "50%",
                          border: completed
                            ? "1px solid rgba(195,92,255,.55)"
                            : "1px solid rgba(255,255,255,.12)",
                          background: completed
                            ? "linear-gradient(135deg,var(--purple),var(--purple-2))"
                            : "#15151d",
                          color: completed ? "white" : "var(--muted)",
                          boxShadow: current
                            ? "0 0 0 5px rgba(139,44,255,.12)"
                            : "none",
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        {completed ? "✓" : index + 1}
                      </span>

                      {index < STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            top: 30,
                            bottom: 0,
                            width: 2,
                            background:
                              index < currentIndex
                                ? "linear-gradient(var(--purple),var(--purple-2))"
                                : "rgba(255,255,255,.08)",
                          }}
                        />
                      )}
                    </div>

                    <div style={{ paddingBottom: 20 }}>
                      <strong
                        style={{
                          display: "block",
                          color: completed ? "white" : "#777784",
                          fontSize: 16,
                        }}
                      >
                        {step.title}
                      </strong>
                      <span
                        className="muted"
                        style={{ display: "block", marginTop: 3, fontSize: 13 }}
                      >
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {order.status !== "cancelled" &&
            (order.carrier ||
              order.trackingNumber ||
              order.trackingUrl) && (
              <div
                style={{
                  display: "grid",
                  gap: 9,
                  padding: "22px clamp(20px,5vw,32px)",
                  borderTop: "1px solid var(--border)",
                  background: "#0d0d12",
                }}
              >
                <strong>Seguimiento del envío</strong>

                {order.carrier && (
                  <span className="muted">
                    Transportista: <strong>{order.carrier}</strong>
                  </span>
                )}

                {order.trackingNumber && (
                  <span className="muted">
                    Número de seguimiento:{" "}
                    <strong>{order.trackingNumber}</strong>
                  </span>
                )}

                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ marginTop: 5 }}
                  >
                    SEGUIR ENVÍO →
                  </a>
                )}
              </div>
            )}
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          color: "#d8b4ff",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 52,
  padding: "13px 14px",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 13,
  outline: "none",
  background: "#0d0d12",
  color: "white",
  fontSize: 15,
};
