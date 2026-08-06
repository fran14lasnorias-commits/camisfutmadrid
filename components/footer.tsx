import Link from "next/link";

export function Footer() {
  return (
    <footer style={{borderTop:"1px solid var(--border)",marginTop:50}}>
      <div className="container" style={{padding:"34px 0",display:"grid",gap:18}}>
        <strong>CAMISFUT<span style={{color:"var(--purple-2)"}}>MADRID</span></strong>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:14}}>
          <Link href="/legal/aviso-legal">Aviso legal</Link>
          <Link href="/legal/privacidad">Privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
          <Link href="/legal/condiciones">Condiciones de compra</Link>
          <Link href="/contacto">Contacto</Link>
        </div>
        <span className="muted">© 2026 CamisfutMadrid</span>
      </div>
    </footer>
  );
}
