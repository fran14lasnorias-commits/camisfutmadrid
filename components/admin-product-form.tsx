"use client";

import { useState } from "react";
import { createProduct } from "@/app/admin/productos/actions";
import { slugify } from "@/lib/admin-products";
import { ImageUploader } from "@/components/image-uploader";

const DEFAULT_SIZES = ["S","M","L","XL","2XL","3XL","4XL"];

export function AdminProductForm() {
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  const [name,setName] = useState("");
  const [slug,setSlug] = useState("");
  const [images,setImages] = useState<string[]>([]);
  const [variants,setVariants] = useState(DEFAULT_SIZES.map(size=>({size,stock:0})));

  function onName(value: string) {
    setName(value);
    if (!slug) setSlug(slugify(value));
  }

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");

    try {
      await createProduct({
        name,
        slug,
        team: String(formData.get("team") ?? ""),
        season: String(formData.get("season") ?? ""),
        type: String(formData.get("type") ?? "fan"),
        priceEur: Number(formData.get("priceEur") ?? 0),
        supplierCostUsd: Number(formData.get("supplierCostUsd") ?? 0),
        description: String(formData.get("description") ?? ""),
        supplierUrl: String(formData.get("supplierUrl") ?? ""),
        published: formData.get("published") === "on",
        images,
        variants,
      });
      setMessage("Producto creado correctamente");
      setName("");
      setSlug("");
      setImages([]);
      setVariants(DEFAULT_SIZES.map(size=>({size,stock:0})));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="card" style={{padding:22,display:"grid",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <input value={name} onChange={e=>onName(e.target.value)} required placeholder="Nombre del producto" style={input}/>
        <input value={slug} onChange={e=>setSlug(slugify(e.target.value))} required placeholder="slug-del-producto" style={input}/>
        <input name="team" required placeholder="Equipo" style={input}/>
        <input name="season" placeholder="Temporada" style={input}/>
        <select name="type" style={input}>
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
        <input name="supplierUrl" type="url" placeholder="URL del proveedor" style={input}/>
        <input name="priceEur" type="number" step="0.01" min="0" required placeholder="Precio de venta €" style={input}/>
        <input name="supplierCostUsd" type="number" step="0.01" min="0" required placeholder="Coste proveedor $" style={input}/>
      </div>

      <textarea name="description" placeholder="Descripción" rows={5} style={input}/>

      <div>
        <h3>Imágenes</h3>
        <ImageUploader onUploaded={url=>setImages(current=>[...current,url])}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginTop:12}}>
          {images.map((url,index)=>(
            <div key={url} className="card" style={{padding:10}}>
              <img src={url} alt="" style={{width:"100%",height:170,objectFit:"cover",borderRadius:10}}/>
              <button type="button" className="btn-secondary" style={{width:"100%",marginTop:8}} onClick={()=>setImages(current=>current.filter((_,i)=>i!==index))}>
                QUITAR
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3>Stock por talla</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
          {variants.map((variant,index)=>(
            <label key={variant.size} className="card" style={{padding:12}}>
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
      </div>

      <label style={{display:"flex",gap:10}}>
        <input name="published" type="checkbox"/> Publicar inmediatamente
      </label>

      {message && <p style={{color:message.includes("correctamente")?"#79f2ad":"#ff8c9c"}}>{message}</p>}
      <button disabled={loading} className="btn-primary">
        {loading ? "GUARDANDO..." : "CREAR PRODUCTO"}
      </button>
    </form>
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
