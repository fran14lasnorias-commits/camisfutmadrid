"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useRouter } from "next/navigation";

export function ProductConfigurator({ product }: { product: Product }) {
  const [size,setSize] = useState("M");
  const [personalized,setPersonalized] = useState(false);
  const [name,setName] = useState("");
  const [number,setNumber] = useState("");
  const [patch,setPatch] = useState("");
  const { addItem } = useCart();
  const router = useRouter();

  const total = useMemo(() => {
    return product.price
      + (personalized ? 4 : 0)
      + (patch ? 2 : 0)
      + (size === "4XL" ? 2 : 0);
  }, [product.price,personalized,patch,size]);

  function addToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? "/placeholder-shirt.svg",
      size,
      quantity: 1,
      unitPriceEur: total,
      supplierUnitCostUsd:
        product.costUsd
        + (personalized ? 3 : 0)
        + (patch ? 1 : 0)
        + (size === "2XL" ? 2 : size === "3XL" ? 3 : 0),
      personalizationName: personalized ? name : undefined,
      personalizationNumber: personalized ? number : undefined,
      patch: patch || undefined,
    });
    router.push("/carrito");
  }

  return (
    <main className="container" style={{padding:"46px 0 80px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:28}}>
      <section className="card" style={{padding:20}}>
        <div style={{height:600,display:"grid",placeItems:"center",background:"#17171f",borderRadius:16}}>
          <img src={product.images[0]} alt={product.name} style={{width:"85%",height:"85%",objectFit:"contain"}}/>
        </div>
      </section>
      <section className="card" style={{padding:24}}>
        <span style={{color:"#d6a6ff",fontWeight:800,fontSize:12}}>{product.team.toUpperCase()}</span>
        <h1>{product.name}</h1>
        <p className="muted">Versión {product.type} · {product.season}</p>
        <strong style={{fontSize:30,color:"var(--purple-2)"}}>{total.toFixed(2).replace(".",",")} €</strong>

        <hr style={{borderColor:"var(--border)",margin:"24px 0"}}/>
        <h3>Talla</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {product.sizes.map(item => (
            <button key={item} onClick={()=>setSize(item)} className={size===item?"btn-primary":"btn-secondary"}>{item}</button>
          ))}
        </div>

        <label style={{display:"flex",gap:10,marginTop:24}}>
          <input type="checkbox" checked={personalized} onChange={e=>setPersonalized(e.target.checked)}/>
          Nombre y número (+4 €)
        </label>

        {personalized && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 120px",gap:10,marginTop:12}}>
            <input value={name} onChange={e=>setName(e.target.value.toUpperCase())} placeholder="Nombre" style={inputStyle}/>
            <input value={number} onChange={e=>setNumber(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="Número" style={inputStyle}/>
          </div>
        )}

        <div style={{marginTop:18}}>
          <label htmlFor="patch">Parche</label>
          <select id="patch" value={patch} onChange={e=>setPatch(e.target.value)} style={{...inputStyle,marginTop:8}}>
            <option value="">Sin parche</option>
            <option value="LaLiga">LaLiga (+2 €)</option>
            <option value="Champions">Champions (+2 €)</option>
          </select>
        </div>

        <button onClick={addToCart} className="btn-primary" style={{width:"100%",marginTop:26}}>AÑADIR AL CARRITO</button>
      </section>
    </main>
  );
}

const inputStyle = {
  width:"100%",
  padding:13,
  borderRadius:10,
  border:"1px solid var(--border)",
  background:"#0d0d12",
  color:"white",
};
