import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { CheckoutSuccessClient } from "@/components/checkout-success-client";

function moneyFromCents(value: number | null | undefined) {
  return `${((value ?? 0) / 100).toFixed(2).replace(".", ",")} €`;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main
        className="container"
        style={{ padding: "48px 0 90px", maxWidth: 760 }}
      >
        <section
          className="card"
          style={{
            padding: "clamp(22px,5vw,34px)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "7px 11px",
              borderRadius: 999,
              background: "rgba(255,184,77,.10)",
              border: "1px solid rgba(255,184,77,.30)",
              color: "#ffd08a",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: ".08em",
            }}
          >
            PAGO NO IDENTIFICADO
          </span>

          <h1 style={{ margin: "18px 0 12px" }}>
            No encontramos la sesión de pago
          </h1>

          <p className="muted" style={{ lineHeight: 1.65 }}>
            Si acabas de pagar y ves este mensaje, no repitas el pago.
            Comprueba tu correo o consulta el seguimiento de tu pedido.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 22,
            }}
          >
            <Link className="btn-primary" href="/pedido">
              SEGUIR MI PEDIDO
            </Link>
            <Link className="btn-secondary" href="/catalogo">
              VOLVER AL CATÁLOGO
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let session;

  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return (
      <main
        className="container"
        style={{ padding: "48px 0 90px", maxWidth: 760 }}
      >
        <section className="card" style={{ padding: "clamp(22px,5vw,34px)" }}>
          <h1>No pudimos comprobar el pago</h1>
          <p className="muted">
            No vuelvas a pagar. Revisa tu correo y, si lo necesitas,
            consulta el pedido con tu número de pedido.
          </p>
          <Link className="btn-primary" href="/pedido">
            CONSULTAR PEDIDO
          </Link>
        </section>
      </main>
    );
  }

  const orderNumber = session.metadata?.order_number ?? "—";
  const email =
    session.customer_details?.email ??
    session.customer_email ??
    "el email utilizado en la compra";
  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";

  return (
    <>
      <CheckoutSuccessClient />

      <main
        className="container"
        style={{ padding: "44px 0 90px", maxWidth: 780 }}
      >
        <section
          className="card"
          style={{
            padding: "clamp(22px,5vw,38px)",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 0%,rgba(139,44,255,.16),transparent 42%),#101016",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: 68,
                height: 68,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 18px",
                borderRadius: "50%",
                background: paid
                  ? "rgba(61,222,138,.12)"
                  : "rgba(255,184,77,.12)",
                border: paid
                  ? "1px solid rgba(61,222,138,.40)"
                  : "1px solid rgba(255,184,77,.40)",
                color: paid ? "#79f2ad" : "#ffd08a",
                fontSize: 34,
                fontWeight: 900,
              }}
            >
              {paid ? "✓" : "⌛"}
            </div>

            <span
              style={{
                color: paid ? "#79f2ad" : "#ffd08a",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: ".12em",
              }}
            >
              {paid ? "PAGO RECIBIDO" : "PAGO EN PROCESO"}
            </span>

            <h1
              style={{
                margin: "10px 0 10px",
                fontSize: "clamp(2.6rem,9vw,5.3rem)",
                lineHeight: .92,
              }}
            >
              GRACIAS POR TU COMPRA
            </h1>

            <p
              className="muted"
              style={{
                maxWidth: 590,
                margin: "0 auto",
                lineHeight: 1.65,
                fontSize: 16,
              }}
            >
              {paid
                ? "Tu pago se ha completado. Ya tenemos tu pedido y empezaremos a gestionarlo."
                : "Stripe ha recibido el pedido y estamos esperando la confirmación definitiva del pago."}
            </p>
          </div>

          <div
            className="card"
            style={{
              display: "grid",
              gap: 13,
              marginTop: 28,
              padding: "clamp(16px,4vw,22px)",
              background: "#0b0b10",
            }}
          >
            <div style={rowStyle}>
              <span className="muted">Número de pedido</span>
              <strong style={{ overflowWrap: "anywhere", textAlign: "right" }}>
                {orderNumber}
              </strong>
            </div>

            <div style={rowStyle}>
              <span className="muted">Importe</span>
              <strong>{moneyFromCents(session.amount_total)}</strong>
            </div>

            <div style={rowStyle}>
              <span className="muted">Estado del pago</span>
              <strong style={{ color: paid ? "#79f2ad" : "#ffd08a" }}>
                {paid ? "Confirmado" : "Procesando"}
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              padding: "16px 18px",
              borderRadius: 14,
              border: "1px solid rgba(195,92,255,.20)",
              background: "rgba(139,44,255,.06)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ display: "block", marginBottom: 5 }}>
              📩 Revisa tu correo
            </strong>
            <span className="muted">
              Te enviaremos la confirmación y las actualizaciones del pedido a{" "}
              <strong style={{ color: "white", overflowWrap: "anywhere" }}>
                {email}
              </strong>
              .
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 10,
              marginTop: 22,
            }}
          >
            <Link
              className="btn-primary"
              href="/pedido"
              style={{ textAlign: "center" }}
            >
              SEGUIR MI PEDIDO
            </Link>

            <Link
              className="btn-secondary"
              href="/catalogo"
              style={{ textAlign: "center" }}
            >
              SEGUIR COMPRANDO
            </Link>
          </div>

          <p
            className="muted"
            style={{
              margin: "20px 0 0",
              textAlign: "center",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Guarda el número <strong>{orderNumber}</strong>. Lo necesitarás
            junto con tu email para consultar el seguimiento.
          </p>
        </section>
      </main>
    </>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
};
