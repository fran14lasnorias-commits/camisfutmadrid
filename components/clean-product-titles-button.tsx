"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cleanAllProductTitles } from "@/app/admin/productos/actions";

type CleanResult = {
  analyzed: number;
  updated: number;
  unchanged: number;
  examples: Array<{
    before: string;
    after: string;
  }>;
};

export function CleanProductTitlesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [error, setError] = useState("");

  async function cleanTitles() {
    const accepted = window.confirm(
      "Se limpiarán automáticamente los títulos y slugs. No se modificarán fotos, precios, stock ni variantes. ¿Continuar?"
    );

    if (!accepted) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await cleanAllProductTitles();
      setResult(response);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron limpiar los títulos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={cleanTitles}
        style={{
          whiteSpace: "nowrap",
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading
          ? "LIMPIANDO TÍTULOS…"
          : "LIMPIAR TÍTULOS AUTOMÁTICAMENTE"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            maxWidth: 620,
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,80,105,.45)",
            background: "rgba(255,80,105,.08)",
            color: "#ff9aaa",
            lineHeight: 1.5,
          }}
        >
          <strong>No se pudo completar la limpieza.</strong>
          <div style={{ marginTop: 4 }}>{error}</div>
        </div>
      )}

      {result && (
        <section
          style={{
            maxWidth: 720,
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(61,222,138,.38)",
            background: "rgba(61,222,138,.06)",
          }}
        >
          <strong style={{ color: "#8af3b7" }}>
            Limpieza completada correctamente
          </strong>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginTop: 10,
              fontSize: 14,
            }}
          >
            <span>
              Analizados: <strong>{result.analyzed}</strong>
            </span>
            <span>
              Corregidos: <strong>{result.updated}</strong>
            </span>
            <span>
              Sin cambios: <strong>{result.unchanged}</strong>
            </span>
          </div>

          {result.examples.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <strong style={{ fontSize: 14 }}>Ejemplos corregidos</strong>

              {result.examples.map((example, index) => (
                <div
                  key={`${example.before}-${index}`}
                  style={{
                    display: "grid",
                    gap: 4,
                    padding: 11,
                    borderRadius: 10,
                    background: "rgba(0,0,0,.18)",
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  <span className="muted">
                    Antes: <span style={{ color: "#ffb0bc" }}>{example.before}</span>
                  </span>
                  <span className="muted">
                    Después:{" "}
                    <span style={{ color: "#a8f5c7" }}>{example.after}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
