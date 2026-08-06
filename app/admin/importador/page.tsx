import { requireAdmin } from "@/lib/auth";
import { ImportReview } from "@/components/import-review";

export default async function ImporterPage() {
  await requireAdmin();

  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <span style={{color:"#d6a6ff",fontWeight:800}}>IMPORTADOR</span>
      <h1>Proveedor → borrador de producto</h1>
      <p className="muted">
        El sistema analiza el enlace y prepara una ficha. Nada se publica automáticamente.
      </p>
      <ImportReview />
    </main>
  );
}
