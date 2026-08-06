"use client";

import { useState } from "react";
import {
  cancelOrderAndReleaseStock,
  confirmTransfer,
  updateOrderStatus,
} from "@/app/admin/pedidos/actions";

export function AdminOrderActions({
  orderId,
  currentStatus,
  paymentMethod,
}: {
  orderId: string;
  currentStatus: string;
  paymentMethod: string | null;
}) {
  const [status,setStatus] = useState(currentStatus);
  const [reference,setReference] = useState("");
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  async function run(task: ()=>Promise<void>, success: string) {
    setLoading(true);
    setMessage("");
    try {
      await task();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{display:"grid",gap:10,minWidth:230}}>
      <select value={status} onChange={e=>setStatus(e.target.value)} style={input}>
        <option value="pending">Pendiente</option>
        <option value="paid">Pagado</option>
        <option value="preparing">Preparando</option>
        <option value="packed">Empaquetado</option>
        <option value="shipped">Enviado</option>
        <option value="delivered">Entregado</option>
        <option value="cancelled">Cancelado</option>
      </select>

      <button disabled={loading} className="btn-secondary" onClick={()=>run(()=>updateOrderStatus(orderId,status),"Estado actualizado")}>
        ACTUALIZAR ESTADO
      </button>

      {paymentMethod === "transfer" && currentStatus === "pending" && (
        <>
          <input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Referencia bancaria" style={input}/>
          <button disabled={loading} className="btn-primary" onClick={()=>run(()=>confirmTransfer(orderId,reference),"Transferencia confirmada")}>
            CONFIRMAR TRANSFERENCIA
          </button>
        </>
      )}

      {currentStatus !== "cancelled" && currentStatus !== "delivered" && (
        <button
          disabled={loading}
          className="btn-secondary"
          style={{color:"#ff8c9c"}}
          onClick={()=>{
            if (confirm("¿Cancelar el pedido y devolver el stock?")) {
              run(()=>cancelOrderAndReleaseStock(orderId),"Pedido cancelado");
            }
          }}
        >
          CANCELAR Y DEVOLVER STOCK
        </button>
      )}

      {message && <span style={{color:message.includes("Error")?"#ff8c9c":"#79f2ad",fontSize:13}}>{message}</span>}
    </div>
  );
}

const input = {
  width:"100%",
  padding:11,
  borderRadius:10,
  border:"1px solid var(--border)",
  background:"#0d0d12",
  color:"white",
};
