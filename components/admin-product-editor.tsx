"use client";

import { useState } from "react";
import { deleteProduct, updateProduct } from "@/app/admin/productos/actions";
import { ImageUploader } from "@/components/image-uploader";

type EditorProduct = {
  id: string;
  name: string;
  slug: string;
  team: string;
  season: string | null;
  type: string;
  price_eur: number;
  supplier_cost_usd: number;
  description: string | null;
  supplier_url: string | null;
  published: boolean;
  product_images: { url: string; position: number }[];
  product_variants: { size: string; stock: number }[];
};

export function AdminProductEditor({ product }: { product: EditorProduct }) {
  const [open,setOpen] = useState(false);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  const [images,setImages] = useState(
    [...(product.product_images ?? [])]
      .sort((a,b)=>a.position-b.position)
      .map(image=>image.url)
  );
  const [variants,setVariants] = useState(product.product_variants ?? []);

  async function save(formData: FormData) {
    setLoading(true);
    setMessage("");

    try {
      await updateProduct(product.id,{
        name:String(formData.get("name") ?? ""),
        slug:String(formData.get("slug") ?? ""),
        team:String(formData.get("team") ?? ""),
        season:String(formData.get("season") ?? ""),
        type:String(formData.get("type") ?? "fan"),
        priceEur:Number(formData.get("priceEur") ?? 0),
        supplierCostUsd:Number(formData.get("supplierCostUsd") ?? 0),
        description:String(formData.get("description") ?? ""),
        supplierUrl:String(formData.get("supplierUrl") ?? ""),
        published:formData.get("published")==="on",
        images,
        variants,
      });
      setMessage("Cambios guardados");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar definitivamente ${product.name}?`)) return;
    setLoading(true);
    try {
      await deleteProduct(product.id);
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar");
      setLoading(false);
    }
  }

  return (
    <article className="card" style={{padding:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:16,alignItems:"center"}}>
        <div>
          <strong>{product.name}</strong>
          <div className="muted">{product.team} · {product.season} · {product.type}</div>
          <div className="muted" style={{fontSize:13}}>
            Stock: {variants.reduce((sum,item)=>sum+Number(item.stock),0)}
          </div>
        </div>
        <strong>{Number(product.price_eur).toFixed(2).replace(".",",")} €</strong>
        <button className="btn-secondary" onClick={()=>setOpen(value=>!value)}>
          {open ? "CERRAR" : "EDITAR"}
        </button>
      </div>

      {open && (
        <form action={save} style={{display:"grid",gap:14,marginTop:18,borderTop:"1px solid var(--border)",paddingTop:18}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <input name="name" defaultValue={product.name} style={input}/>
            <input name="slug" defaultValue={product.slug} style={input}/>
            <input name="team" defaultValue={product.team} style={input}/>
            <input name="season" defaultValue={product.season ?? ""} style={input}/>
            <select name="type" defaultValue={product.type} style={input}>
              <option value="fan">Fan</option>
              <option value="player">Player</option>
              <option value="retro">Retro</option>
              <option value="kids">Niño</option>
              <option value="adult_kit">Kit adulto</option>
              <option value="polo">Polo</option>
              <option value="shorts">Shorts</option>
              <option value="socks">Calcetines</option>
              <option value="training">Entrenamiento</option>
              <option value="nba">NBA</option>
            </select>
            <input name="supplierUrl" defaultValue={product.supplier_url ?? ""} style={input}/>
            <input name="priceEur" type="number" step="0.01" defaultValue={product.price_eur} style={input}/>
            <input name="supplierCostUsd" type="number" step="0.01" defaultValue={product.supplier_cost_usd} style={input}/>
          </div>

          <textarea name="description" defaultValue={product.description ?? ""} rows={4} style={input}/>

          <ImageUploader onUploaded={url=>setImages(current=>[...current,url])}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
            {images.map((url,index)=>(
              <div key={`${url}-${index}`} className="card" style={{padding:8}}>
                <img src={url} alt="" style={{width:"100%",height:150,objectFit:"cover",borderRadius:10}}/>
                <button type="button" className="btn-secondary" style={{width:"100%",marginTop:8}} onClick={()=>setImages(current=>current.filter((_,i)=>i!==index))}>QUITAR</button>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
            {variants.map((variant,index)=>(
              <label key={variant.size} className="card" style={{padding:10}}>
                <strong>{variant.size}</strong>
                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={e=>setVariants(current=>current.map((item,i)=>i===index?{...item,stock:Number(e.target.value)}:item))}
                  style={{...input,marginTop:8}}
                />
              </label>
            ))}
          </div>

          <label style={{display:"flex",gap:10}}>
            <input name="published" type="checkbox" defaultChecked={product.published}/> Publicado
          </label>

          {message && <p style={{color:message.includes("guardados")?"#79f2ad":"#ff8c9c"}}>{message}</p>}

          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button disabled={loading} className="btn-primary">{loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}</button>
            <button type="button" disabled={loading} className="btn-secondary" onClick={remove} style={{color:"#ff8c9c"}}>ELIMINAR PRODUCTO</button>
          </div>
        </form>
      )}
    </article>
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
