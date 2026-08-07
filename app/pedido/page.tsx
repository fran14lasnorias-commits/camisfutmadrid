import type { Metadata } from "next";
import { OrderTracker } from "@/components/order-tracker";

export const metadata: Metadata = {
  title: "Seguimiento de pedido",
  description:
    "Consulta el estado y seguimiento de tu pedido de CamisfutMadrid.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function OrderTrackingPage() {
  return (
    <main className="container" style={{ padding: "52px 0 92px" }}>
      <span
        style={{
          color: "#d6a6ff",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".14em",
        }}
      >
        SEGUIMIENTO
      </span>

      <h1
        style={{
          margin: "8px 0 12px",
          fontSize: "clamp(3.2rem,9vw,7rem)",
        }}
      >
        ¿DÓNDE ESTÁ TU PEDIDO?
      </h1>

      <p
        className="muted"
        style={{
          maxWidth: 700,
          margin: "0 0 30px",
          fontSize: 17,
          lineHeight: 1.65,
        }}
      >
        Introduce el número de pedido y el mismo email que utilizaste al
        comprar. Solo mostraremos el estado y los datos necesarios para el
        seguimiento.
      </p>

      <OrderTracker />
    </main>
  );
}
