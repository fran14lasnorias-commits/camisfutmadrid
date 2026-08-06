"use client";

import { useState } from "react";
import { createCoupon } from "@/app/admin/cupones/actions";

export function AdminCouponForm() {
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");
    try {
      await createCoupon({
        code:String(formData.get("code") ?? ""),
        type:String(formData.get("type") ?? "percent"),
        value:Number(formData.get("value") ?? 0),
        minimumOrderEur:Number(formData.get("minimumOrderEur") ?? 0),
        maxUses:formData.get("maxUses") ? Number(formData.get("maxUses")) : null,
        startsAt:formData.get("startsAt") ? String(formData.get("startsAt")) : null,
        endsAt:formData.get("endsAt") ? String(formData.get("endsAt")) : null,
        active:formData.get("active")==="on",
      });
      setMessage("Cupón creado");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="card" style={{padding:20,display:"grid",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        <input name="code" required placeholder="Código" style={input}/>
        <select name="type" style={input}>
          <option value="percent">Porcentaje</option>
          <option value="fixed">Importe fijo</option>
        </select>
        <input name="value" type="number" min="0.01" step="0.01" required placeholder="Valor" style={input}/>
        <input name="minimumOrderEur" type="number" min="0" step="0.01" defaultValue="0" placeholder="Pedido mínimo" style={input}/>
        <input name="maxUses" type="number" min="1" placeholder="Máximo de usos" style={input}/>
        <input name="startsAt" type="datetime-local" style={input}/>
        <input name="endsAt" type="datetime-local" style={input}/>
      </div>
      <label style={{display:"flex",gap:10}}><input name="active" type="checkbox" defaultChecked/> Activo</label>
      {message && <p style={{color:message.includes("creado")?"#79f2ad":"#ff8c9c"}}>{message}</p>}
      <button className="btn-primary" disabled={loading}>{loading?"GUARDANDO...":"CREAR CUPÓN"}</button>
    </form>
  );
}

const input = {
  width:"100%",
  padding:13,
  borderRadius:10,
  border:"1px solid var(--border)",
  background:"#0d0d12",
  color:"white",
};
