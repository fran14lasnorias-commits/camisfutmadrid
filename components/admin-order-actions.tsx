"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelOrderAndReleaseStock,
  confirmTransfer,
  saveOrderManagement,
} from "@/app/admin/pedidos/actions";

type Props = {
  orderId: string;
  currentStatus: string;
  paymentMethod: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  adminNotes: string | null;
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

export function AdminOrderActions({
  orderId,
  currentStatus,
  paymentMethod,
  carrier: initialCarrier,
  trackingNumber: initialTrackingNumber,
  trackingUrl: initialTrackingUrl,
  adminNotes: initialAdminNotes,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [carrier, setCarrier] = useState(initialCarrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber ?? "",
  );
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl ?? "");
  const [adminNotes, setAdminNotes] = useState(initialAdminNotes ?? "");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function run(task: () => Promise<unknown>, success: string) {
    setLoading(true);
    setMessage("");

    try {
      await task();
      setMessage(success);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? `Error: ${error.message}` : "Error inesperado",
      );
    } finally {
      setLoading(false);
    }
  }

  async function save(nextStatus = status) {
    if (
      nextStatus === "shipped" &&
      !trackingNumber.trim() &&
      carrier.toLowerCase() !== "entrega en mano"
    ) {
      const accepted = window.confirm(
        "No has indicado número de seguimiento. ¿Marcar el pedido como enviado igualmente?",
      );

      if (!accepted) return;
    }

    setStatus(nextStatus);

    await run(
      () =>
        saveOrderManagement({
          orderId,
          status: nextStatus,
          carrier,
          trackingNumber,
          trackingUrl,
          adminNotes,
        }),
      nextStatus === currentStatus
        ? "Datos guardados"
        : `Pedido marcado como ${STATUS_LABELS[nextStatus].toLowerCase()}`,
    );
  }

  const finished =
    currentStatus === "cancelled" || currentStatus === "delivered";

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        minWidth: 280,
        flex: "1 1 310px",
      }}
    >
      <div
        className="card"
        style={{
          padding: 14,
          background: "#0d0d12",
          display: "grid",
          gap: 10,
        }}
      >
        <strong>Gestión del pedido</strong>

        <label style={label}>
          Estado
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={input}
            disabled={loading || currentStatus === "cancelled"}
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="preparing">Preparando</option>
            <option value="packed">Empaquetado</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            {currentStatus === "cancelled" && (
              <option value="cancelled">Cancelado</option>
            )}
          </select>
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 8,
          }}
        >
          <button
            type="button"
            disabled={loading || finished}
            className="btn-secondary"
            style={quickButton}
            onClick={() => save("preparing")}
          >
            PREPARANDO
          </button>

          <button
            type="button"
            disabled={loading || finished}
            className="btn-secondary"
            style={quickButton}
            onClick={() => save("shipped")}
          >
            ENVIADO
          </button>

          <button
            type="button"
            disabled={loading || currentStatus === "cancelled"}
            className="btn-secondary"
            style={quickButton}
            onClick={() => save("delivered")}
          >
            ENTREGADO
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 14,
          background: "#0d0d12",
          display: "grid",
          gap: 10,
        }}
      >
        <strong>Envío y seguimiento</strong>

        <label style={label}>
          Empresa de transporte
          <input
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            placeholder="GLS, entrega en mano..."
            list={`carriers-${orderId}`}
            style={input}
            disabled={loading}
          />
          <datalist id={`carriers-${orderId}`}>
            <option value="GLS" />
            <option value="Correos Express" />
            <option value="SEUR" />
            <option value="MRW" />
            <option value="DHL" />
            <option value="UPS" />
            <option value="Entrega en mano" />
          </datalist>
        </label>

        <label style={label}>
          Número de seguimiento
          <input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Ej. 123456789"
            style={input}
            disabled={loading}
          />
        </label>

        <label style={label}>
          Enlace de seguimiento
          <input
            value={trackingUrl}
            onChange={(event) => setTrackingUrl(event.target.value)}
            placeholder="https://..."
            inputMode="url"
            style={input}
            disabled={loading}
          />
        </label>

        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ textAlign: "center" }}
          >
            ABRIR SEGUIMIENTO
          </a>
        )}
      </div>

      <label style={label}>
        Notas internas
        <textarea
          value={adminNotes}
          onChange={(event) => setAdminNotes(event.target.value)}
          placeholder="Incidencias, fecha prevista, observaciones..."
          rows={4}
          style={{ ...input, resize: "vertical" }}
          disabled={loading}
        />
        <span className="muted" style={{ fontSize: 11 }}>
          Estas notas solo se ven dentro del panel de administración.
        </span>
      </label>

      <button
        type="button"
        disabled={loading || currentStatus === "cancelled"}
        className="btn-primary"
        onClick={() => save()}
      >
        {loading ? "GUARDANDO..." : "GUARDAR Y ACTUALIZAR"}
      </button>

      {paymentMethod === "transfer" && currentStatus === "pending" && (
        <div
          className="card"
          style={{
            padding: 14,
            background: "#0d0d12",
            display: "grid",
            gap: 10,
          }}
        >
          <strong>Transferencia bancaria</strong>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Referencia bancaria"
            style={input}
            disabled={loading}
          />
          <button
            type="button"
            disabled={loading}
            className="btn-primary"
            onClick={() =>
              run(
                () => confirmTransfer(orderId, reference),
                "Transferencia confirmada",
              )
            }
          >
            CONFIRMAR TRANSFERENCIA
          </button>
        </div>
      )}

      {!finished && (
        <button
          type="button"
          disabled={loading}
          className="btn-secondary"
          style={{ color: "#ff8c9c" }}
          onClick={() => {
            if (
              window.confirm(
                "¿Cancelar el pedido y devolver las unidades al stock?",
              )
            ) {
              run(
                () => cancelOrderAndReleaseStock(orderId),
                "Pedido cancelado y stock devuelto",
              );
            }
          }}
        >
          CANCELAR Y DEVOLVER STOCK
        </button>
      )}

      {message && (
        <span
          role="status"
          style={{
            color: message.startsWith("Error") ? "#ff8c9c" : "#79f2ad",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}

const label = {
  display: "grid",
  gap: 6,
  color: "#bdbdc8",
  fontSize: 13,
  fontWeight: 700,
} as const;

const input = {
  width: "100%",
  padding: 11,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
  font: "inherit",
} as const;

const quickButton = {
  padding: "10px 5px",
  fontSize: 10,
} as const
