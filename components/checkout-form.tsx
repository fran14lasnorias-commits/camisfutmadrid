"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { cartSubtotal } from "@/lib/cart";
import { createTransferOrder } from "@/app/checkout/actions";

type PaymentMethod = "transfer" | "stripe";

export function CheckoutForm() {
  const { items, clearCart } = useCart();
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [paymentMethod,setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [couponCode,setCouponCode] = useState("");
  const [discountEur,setDiscountEur] = useState(0);
  const [couponMessage,setCouponMessage] = useState("");
  const [transferData,setTransferData] = useState<null | {
    number: string;
    subtotalEur: number;
    discountEur: number;
    totalEur: number;
    bankAccountHolder: string;
    bankIban: string;
    bankBic: string;
  }>(null);
  const subtotal = cartSubtotal(items);
  const total = Math.max(0,subtotal-discountEur);

  function buildPayload(formData: FormData) {
    return {
      customer: {
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        address: String(formData.get("address") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""),
        city: String(formData.get("city") ?? ""),
      },
      items,
      couponCode: couponCode || undefined,
    };
  }

  async function validateCoupon() {
    setCouponMessage("");
    if (!couponCode.trim()) {
      setDiscountEur(0);
      return;
    }

    const response = await fetch("/api/coupons/validate",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({code:couponCode,subtotal}),
    });
    const data = await response.json();

    if (!response.ok) {
      setDiscountEur(0);
      setCouponMessage(data.error ?? "Cupón no válido");
      return;
    }

    setDiscountEur(Number(data.discount_eur));
    setCouponMessage(`Cupón aplicado: -${Number(data.discount_eur).toFixed(2).replace(".",",")} €`);
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");

    try {
      const payload = buildPayload(formData);

      if (paymentMethod === "stripe") {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo iniciar el pago");
        window.location.href = data.url;
        return;
      }

      const result = await createTransferOrder(payload);
      setTransferData(result);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (transferData) {
    return (
      <section className="card transferSuccess" style={{padding:"clamp(18px,5vw,28px)",maxWidth:720,margin:"0 auto",overflow:"hidden"}}>
        <span style={{color:"#79f2ad",fontWeight:800}}>PEDIDO CREADO</span>
        <h1>{transferData.number}</h1>
        <p className="muted">Realiza la transferencia indicando exactamente el número de pedido en el concepto.</p>
        <div className="card" style={{padding:18,background:"#0d0d12",display:"grid",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>Subtotal</span><strong>{transferData.subtotalEur.toFixed(2).replace(".",",")} €</strong></div>
          {transferData.discountEur > 0 && <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>Descuento</span><strong>-{transferData.discountEur.toFixed(2).replace(".",",")} €</strong></div>}
          <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>Importe final</span><strong>{transferData.totalEur.toFixed(2).replace(".",",")} €</strong></div>
          <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>Titular</span><strong>{transferData.bankAccountHolder || "Pendiente de configurar"}</strong></div>
          <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>IBAN</span><strong>{transferData.bankIban || "Pendiente de configurar"}</strong></div>
          {transferData.bankBic && <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>BIC</span><strong>{transferData.bankBic}</strong></div>}
          <div style={{display:"flex",justifyContent:"space-between",gap:18}}><span>Concepto</span><strong>{transferData.number}</strong></div>
        </div>
      </section>
    );
  }

  return (
    <form action={submit} className="checkoutGrid">
      <section className="card checkoutDetails">
        <h2>Datos de entrega</h2>
        <div className="deliveryGrid">
          <input name="fullName" required placeholder="Nombre y apellidos" style={inputStyle}/>
          <input name="email" type="email" required placeholder="Email" style={inputStyle}/>
          <input name="phone" required placeholder="Teléfono" style={inputStyle}/>
          <input name="postalCode" required placeholder="Código postal" style={inputStyle}/>
        </div>
        <input name="address" required placeholder="Dirección completa" style={{...inputStyle,marginTop:12}}/>
        <input name="city" required placeholder="Ciudad" style={{...inputStyle,marginTop:12}}/>

        <h2 style={{marginTop:26}}>Cupón</h2>
        <div className="couponRow">
          <input value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="Código de descuento" style={inputStyle}/>
          <button type="button" onClick={validateCoupon} className="btn-secondary">APLICAR</button>
        </div>
        {couponMessage && <p style={{color:discountEur>0?"#79f2ad":"#ff8c9c"}}>{couponMessage}</p>}

        <h2 style={{marginTop:26}}>Método de pago</h2>
        <div className="paymentGrid">
          <label className="card" style={{display:"block",padding:16,borderColor:paymentMethod==="stripe"?"var(--purple)":"var(--border)",cursor:"pointer"}}>
            <input type="radio" name="payment" checked={paymentMethod==="stripe"} onChange={()=>setPaymentMethod("stripe")}/> Tarjeta
            <div className="muted" style={{marginTop:6}}>Pago seguro alojado por Stripe.</div>
          </label>
          <label className="card" style={{display:"block",padding:16,borderColor:paymentMethod==="transfer"?"var(--purple)":"var(--border)",cursor:"pointer"}}>
            <input type="radio" name="payment" checked={paymentMethod==="transfer"} onChange={()=>setPaymentMethod("transfer")}/> Transferencia bancaria
            <div className="muted" style={{marginTop:6}}>Usa el número de pedido como concepto.</div>
          </label>
        </div>

        {error && <p style={{color:"#ff8c9c"}}>{error}</p>}
      </section>

      <aside className="card checkoutSummary">
        <h2>Resumen</h2>
        {items.map((item,index)=>(
          <article
            key={`${item.productId}-${index}`}
            className="summaryItem"
            style={{
              padding:"14px 0",
              borderBottom:"1px solid var(--border)",
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              style={{
                width:64,
                height:64,
                objectFit:"contain",
                borderRadius:10,
                background:"#17171f",
              }}
            />

            <div style={{minWidth:0}}>
              <strong style={{display:"block",lineHeight:1.25}}>
                {item.name}
              </strong>

              <span className="muted" style={{display:"block",marginTop:4}}>
                Talla {item.size}
                {item.quantity > 1 ? ` · ${item.quantity} unidades` : ""}
              </span>

              {item.personalizationName && (
                <span
                  style={{
                    display:"block",
                    marginTop:5,
                    color:"#d6a6ff",
                    fontWeight:800,
                    fontSize:13,
                  }}
                >
                  Nombre: {item.personalizationName} · Dorsal: {item.personalizationNumber}
                </span>
              )}

              {item.patch && (
                <span className="muted" style={{display:"block",marginTop:3,fontSize:13}}>
                  Parche: {item.patch}
                </span>
              )}

              {item.personalizationName && (
                <span className="muted" style={{display:"block",marginTop:5,fontSize:11,lineHeight:1.35}}>
                  Producto personalizado según los datos indicados.
                </span>
              )}
            </div>

            <strong className="summaryPrice" style={{whiteSpace:"nowrap"}}>
              {(item.unitPriceEur * item.quantity).toFixed(2).replace(".",",")} €
            </strong>
          </article>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:18}}>
          <span>Subtotal</span><strong>{subtotal.toFixed(2).replace(".",",")} €</strong>
        </div>
        {discountEur > 0 && <div style={{display:"flex",justifyContent:"space-between",marginTop:8,color:"#79f2ad"}}>
          <span>Descuento</span><strong>-{discountEur.toFixed(2).replace(".",",")} €</strong>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:24,marginTop:18}}>
          <span>Total</span><strong>{total.toFixed(2).replace(".",",")} €</strong>
        </div>
        <button disabled={loading || !items.length} className="btn-primary" style={{width:"100%",marginTop:18,opacity:loading?.7:1}}>
          {loading ? "PROCESANDO..." : paymentMethod === "stripe" ? "PAGAR CON TARJETA" : "CREAR PEDIDO"}
        </button>
      </aside>

      <style jsx>{`
        .checkoutGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
          gap: 24px;
          width: 100%;
          min-width: 0;
          align-items: start;
        }

        .checkoutDetails,
        .checkoutSummary {
          min-width: 0;
        }

        .checkoutDetails {
          padding: 24px;
        }

        .checkoutSummary {
          padding: 20px;
          height: max-content;
        }

        .deliveryGrid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 12px;
        }

        .couponRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .paymentGrid {
          display: grid;
          gap: 10px;
        }

        .summaryItem {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .checkoutGrid {
            grid-template-columns: minmax(0, 1fr);
            gap: 16px;
          }

          .checkoutDetails {
            order: 1;
          }

          .checkoutSummary {
            order: 2;
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .checkoutGrid {
            width: 100%;
            max-width: 100%;
            gap: 14px;
          }

          .checkoutDetails,
          .checkoutSummary {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            border-radius: 18px;
          }

          .checkoutDetails {
            padding: 18px 15px;
          }

          .checkoutSummary {
            padding: 18px 15px;
          }

          .deliveryGrid {
            grid-template-columns: minmax(0, 1fr);
            gap: 10px;
          }

          .couponRow {
            grid-template-columns: minmax(0, 1fr);
          }

          .couponRow :global(button) {
            width: 100%;
            min-height: 48px;
          }

          .paymentGrid :global(label) {
            width: 100%;
            box-sizing: border-box;
          }

          .summaryItem {
            grid-template-columns: 56px minmax(0, 1fr);
            gap: 10px;
            align-items: start;
          }

          .summaryItem :global(img) {
            width: 56px !important;
            height: 56px !important;
          }

          .summaryPrice {
            grid-column: 2;
            justify-self: start;
            margin-top: 2px;
          }

          .checkoutDetails :global(h2),
          .checkoutSummary :global(h2) {
            overflow-wrap: normal;
            word-break: normal;
          }
        }

        @media (max-width: 380px) {
          .checkoutDetails,
          .checkoutSummary {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>
    </form>
  );
}

const inputStyle = {
  width:"100%",
  padding:14,
  borderRadius:12,
  border:"1px solid var(--border)",
  background:"#0d0d12",
  color:"white",
};
