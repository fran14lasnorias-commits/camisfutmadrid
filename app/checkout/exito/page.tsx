import Link from "next/link";
import { stripe } from "@/lib/stripe";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="container" style={{ padding: "60px 0 90px" }}>
        <section className="card" style={{ padding: 28 }}>
          <h1>No encontramos la sesión de pago</h1>
          <Link className="btn-primary" href="/catalogo">VOLVER AL CATÁLOGO</Link>
        </section>
      </main>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  return (
    <main className="container" style={{ padding: "60px 0 90px", maxWidth: 720 }}>
      <section className="card" style={{ padding: 28 }}>
        <span style={{ color: "#79f2ad", fontWeight: 900 }}>PAGO RECIBIDO</span>
        <h1>Gracias por tu compra</h1>
        <p className="muted">
          Pedido: <strong>{session.metadata?.order_number}</strong>
        </p>
        <p className="muted">
          Te enviaremos las actualizaciones al correo {session.customer_details?.email}.
        </p>
        <Link className="btn-primary" href="/cuenta">VER MIS PEDIDOS</Link>
      </section>
    </main>
  );
}
