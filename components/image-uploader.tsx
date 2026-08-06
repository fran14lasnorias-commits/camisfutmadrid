"use client";

import { useState } from "react";
import { uploadProductImage } from "@/lib/storage";

export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function onFile(file?: File) {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const result = await uploadProductImage(file);
      onUploaded(result.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{padding:14}}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={event=>onFile(event.target.files?.[0])}
      />
      <div className="muted" style={{fontSize:13,marginTop:8}}>
        JPG, PNG o WEBP.
      </div>
      {loading && <p className="muted">Subiendo...</p>}
      {error && <p style={{color:"#ff8c9c"}}>{error}</p>}
    </div>
  );
}
