"use client";

import { useState } from "react";
import { createProduct } from "@/app/admin/productos/actions";
import type { ImportDraft } from "@/lib/importer";

export function ImportReview() {
  const [url,setUrl] = useState("");
  const [draft,setDraft] = useState<ImportDraft | null>(null);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  async function analyze() {
    setLoading(true);
    setMessage("");
    setDraft(null);

    try {
      const response = await fetch("/api/admin/import", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({url}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo analizar");
      setDraft(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setLoading(true);
    setMessage("");

    try {
      await createProduct({
        name:draft.name,
        slug:draft.slug,
        team:draft.team,
        season:draft.season,
        type:draft.type,
        priceEur:draft.suggestedPriceEur,
        supplierCostUsd:draft.supplierCostUsd,
        description:draft.description,
        supplierUrl:draft.sourceUrl,
        published:false,
        images:draft.images,
        variants:["S","M","L","XL","2XL","3XL","4XL"].map(size=>({size,stock:0})),
      });
      setMessage("Producto importado como borrador");
      setDraft(null);
      setUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{display:"grid",gap:18}}>
      <section className="card" style={{padding:20}}>
        <h2>Importar producto</h2>
        <p className="muted">Pega el enlace del álbum o producto. Siempre se guardará como borrador para revisión.</p>
        <div style={{display:"flex",gap:10}}>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." style={input}/>
          <button onClick={analyze} disabled={loading || !url} className="btn-primary">
            {loading ? "ANALIZANDO..." : "ANALIZAR"}
          </button>
        </div>
      </section>

      {draft && (
        <section className="card" style={{padding:22}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16}}>
            <div>
              <span style={{color:"#d6a6ff",fontWeight:800}}>BORRADOR DETECTADO</span>
              <h2>{draft.name}</h2>
            </div>
            <strong>{draft.confidence}% confianza</strong>
          </div>

          {draft.warnings.length > 0 && (
            <div className="card" style={{padding:14,background:"#2f2410",borderColor:"#72571a"}}>
              {draft.warnings.map(warning=><div key={warning}>⚠️ {warning}</div>)}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginTop:18}}>
            <div className="card" style={{padding:14}}><span className="muted">Equipo</span><strong style={{display:"block"}}>{draft.team}</strong></div>
            <div className="card" style={{padding:14}}><span className="muted">Temporada</span><strong style={{display:"block"}}>{draft.season || "Revisar"}</strong></div>
            <div className="card" style={{padding:14}}><span className="muted">Tipo</span><strong style={{display:"block"}}>{draft.type}</strong></div>
            <div className="card" style={{padding:14}}><span className="muted">Precio sugerido</span><strong style={{display:"block"}}>{draft.suggestedPriceEur} €</strong></div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:18}}>
            {draft.images.map(image=><img key={image} src={image} alt="" style={{width:"100%",height:220,objectFit:"cover",borderRadius:14,background:"#17171f"}}/>)}
          </div>

          <button onClick={publish} disabled={loading} className="btn-primary" style={{marginTop:20}}>
            GUARDAR COMO BORRADOR
          </button>
        </section>
      )}

      {message && <p style={{color:message.includes("borrador")?"#79f2ad":"#ff8c9c"}}>{message}</p>}
    </div>
  );
}

const input = {
  width:"100%",
  padding:14,
  borderRadius:12,
  border:"1px solid var(--border)",
  background:"#0d0d12",
  color:"white",
};
