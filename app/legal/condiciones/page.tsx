export default function TermsPage() {
  return (
    <main className="container" style={{padding:"50px 0 90px",maxWidth:900}}>
      <h1>Condiciones de compra</h1>
      <div className="card" style={{padding:24,lineHeight:1.7}}>
        <h2>Precios y pagos</h2>
        <p>Los precios finales y métodos de pago disponibles se mostrarán antes de confirmar el pedido.</p>
        <h2>Entrega</h2>
        <p>Los plazos dependerán de la disponibilidad. Cuando no exista stock inmediato, deberá indicarse claramente el plazo estimado.</p>
        <h2>Personalización</h2>
        <p>Los artículos personalizados pueden quedar sujetos a excepciones legales al derecho de desistimiento, sin perjuicio de productos defectuosos o errores imputables al vendedor.</p>
        <h2>Devoluciones</h2>
        <p>Completar procedimiento, dirección de devolución, costes y plazos antes de publicar.</p>
        <p className="muted">Plantilla pendiente de revisión legal y adaptación al modelo comercial real.</p>
      </div>
    </main>
  );
}
