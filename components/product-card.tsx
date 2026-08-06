import Link from "next/link";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card" style={{overflow:"hidden"}}>
      <div style={{height:300,display:"grid",placeItems:"center",background:"radial-gradient(circle,#28143b,transparent 60%),#17171f"}}>
        <img src={product.images[0]} alt={product.name} style={{width:"85%",height:"85%",objectFit:"contain"}} />
      </div>
      <div style={{padding:18}}>
        <span style={{fontSize:12,fontWeight:800,color:"#d6a6ff"}}>{product.type.toUpperCase()}</span>
        <h3>{product.name}</h3>
        <p className="muted">{product.team} · {product.season}</p>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <strong style={{fontSize:24,color:"var(--purple-2)"}}>{product.price.toFixed(2).replace(".",",")} €</strong>
          <Link className="btn-secondary" href={`/producto/${product.slug}`}>Ver</Link>
        </div>
      </div>
    </article>
  );
}
