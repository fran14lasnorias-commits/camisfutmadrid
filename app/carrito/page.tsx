"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { cartSubtotal } from "@/lib/cart";

export default function CartPage() {
  const { items, removeItem } = useCart();
  const subtotal = cartSubtotal(items);

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <h1>Tu carrito</h1>
      {!items.length ? (
        <section className="card" style={{padding:24}}>
          <p className="muted">Tu carrito está vacío.</p>
          <Link className="btn-primary" href="/catalogo">VER CATÁLOGO</Link>
        </section>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 360px",gap:24}}>
          <section style={{display:"grid",gap:14}}>
            {items.map((item,index)=>(
              <article className="card" key={`${item.productId}-${index}`} style={{padding:16,display:"grid",gridTemplateColumns:"110px 1fr auto",gap:16,alignItems:"center"}}>
                <img src={item.image} alt={item.name} style={{width:110,height:110,objectFit:"contain",background:"#17171f",borderRadius:12}}/>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted">Talla {item.size}</div>
                  {item.personalizationName && <div className="muted">{item.personalizationName} {item.personalizationNumber}</div>}
                  {item.patch && <div className="muted">Parche {item.patch}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <strong>{item.unitPriceEur.toFixed(2).replace(".",",")} €</strong>
                  <div><button onClick={()=>removeItem(index)} style={{marginTop:10,background:"transparent",border:0,color:"#ff8c9c",cursor:"pointer"}}>Eliminar</button></div>
                </div>
              </article>
            ))}
          </section>
          <aside className="card" style={{padding:20,height:"max-content"}}>
            <h2>Resumen</h2>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Subtotal</span><strong>{subtotal.toFixed(2).replace(".",",")} €</strong></div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}><span>Envío</span><strong>Gratis</strong></div>
            <hr style={{borderColor:"var(--border)",margin:"18px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:24}}><span>Total</span><strong>{subtotal.toFixed(2).replace(".",",")} €</strong></div>
            <Link className="btn-primary" href="/checkout" style={{width:"100%",marginTop:18}}>CONTINUAR</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
