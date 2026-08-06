"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export function Header() {
  const { itemCount } = useCart();

  return (
    <header style={{
      position:"sticky", top:0, zIndex:20, backdropFilter:"blur(16px)",
      background:"rgba(8,8,11,.9)", borderBottom:"1px solid var(--border)"
    }}>
      <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",gap:24}}>
        <Link href="/" style={{fontWeight:900,fontSize:22}}>CAMISFUT<span style={{color:"var(--purple-2)"}}>MADRID</span></Link>
        <nav style={{display:"flex",gap:20,fontSize:14,alignItems:"center"}}>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo?type=retro">Retro</Link>
          <Link href="/cuenta">Mi cuenta</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/carrito" style={{display:"inline-flex",gap:7,alignItems:"center"}}>
            Carrito <span style={{minWidth:22,height:22,borderRadius:999,display:"grid",placeItems:"center",background:"var(--purple)",fontSize:12,fontWeight:900}}>{itemCount}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
