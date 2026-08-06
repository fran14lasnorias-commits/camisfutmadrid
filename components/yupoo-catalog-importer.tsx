"use client";

import { useMemo, useState } from "react";

type Album = {
  albumId: string;
  sourceUrl: string;
  title: string;
  coverImage: string | null;
  eligible: boolean;
  exclusionReason: string | null;
};

type CatalogBatch = {
  catalogUrl: string;
  page: number;
  discovered: number;
  eligible: Album[];
  excluded: Album[];
  warnings: string[];
};

const DEFAULT_CATALOG =
  "https://y199111.x.yupoo.com/categories/";

export function YupooCatalogImporter() {
  const [url, setUrl] = useState(DEFAULT_CATALOG);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [batch, setBatch] = useState<CatalogBatch | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const allEligibleSelected =
    !!batch?.eligible.length &&
    batch.eligible.every((album) => selected.includes(album.albumId));

  const selectedAlbums = useMemo(
    () =>
      batch?.eligible.filter((album) =>
        selected.includes(album.albumId)
      ) ?? [],
    [batch, selected]
  );

  async function analyzeCatalog() {
    setLoading(true);
    setMessage("");
    setBatch(null);
    setSelected([]);

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "catalog",
          url,
          page,
          limit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No se pudo leer el catálogo de Yupoo."
        );
      }

      setBatch(data);
      setSelected(data.eligible.map((album: Album) => album.albumId));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo leer el catálogo."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleAlbum(albumId: string) {
    setSelected((current) =>
      current.includes(albumId)
        ? current.filter((id) => id !== albumId)
        : [...current, albumId]
    );
  }

  function toggleAll() {
    if (!batch) return;

    setSelected(
      allEligibleSelected
        ? []
        : batch.eligible.map((album) => album.albumId)
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="card" style={{ padding: 22 }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
          CATÁLOGO MASIVO
        </span>

        <h2 style={{ marginBottom: 8 }}>
          Leer una página de Yupoo
        </h2>

        <p className="muted" style={{ lineHeight: 1.6 }}>
          El sistema mostrará primero las camisetas detectadas. Todavía no se
          guardará ni publicará ningún producto.
        </p>

        <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
          <div>
            <label htmlFor="catalog-url" style={labelStyle}>
              Dirección del catálogo
            </label>

            <input
              id="catalog-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14,
            }}
          >
            <div>
              <label htmlFor="catalog-page" style={labelStyle}>
                Página
              </label>

              <input
                id="catalog-page"
                type="number"
                min={1}
                max={500}
                value={page}
                onChange={(event) =>
                  setPage(Math.max(1, Number(event.target.value) || 1))
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="catalog-limit" style={labelStyle}>
                Máximo de camisetas
              </label>

              <select
                id="catalog-limit"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                style={inputStyle}
              >
                <option value={10}>10 productos</option>
                <option value={25}>25 productos</option>
                <option value={40}>40 productos</option>
                <option value={50}>50 productos</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={analyzeCatalog}
            disabled={loading || !url.trim()}
            className="btn-primary"
          >
            {loading ? "LEYENDO CATÁLOGO..." : "ANALIZAR PÁGINA"}
          </button>
        </div>
      </section>

      {message && (
        <div
          className="card"
          style={{
            padding: 16,
            border: "1px solid rgba(255,80,105,.35)",
            color: "#ff9aaa",
          }}
        >
          {message}
        </div>
      )}

      {batch && (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(190px,1fr))",
              gap: 14,
            }}
          >
            <div className="card" style={{ padding: 18 }}>
              <span className="muted">Álbumes detectados</span>
              <strong style={metricStyle}>{batch.discovered}</strong>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <span className="muted">Camisetas válidas</span>
              <strong style={metricStyle}>{batch.eligible.length}</strong>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <span className="muted">Apartados</span>
              <strong style={metricStyle}>{batch.excluded.length}</strong>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <span className="muted">Seleccionados</span>
              <strong style={metricStyle}>{selectedAlbums.length}</strong>
            </div>
          </section>

          {batch.warnings.length > 0 && (
            <section
              className="card"
              style={{
                padding: 16,
                background: "#2f2410",
                borderColor: "#72571a",
              }}
            >
              {batch.warnings.map((warning) => (
                <div key={warning}>⚠️ {warning}</div>
              ))}
            </section>
          )}

          <section className="card" style={{ padding: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Camisetas detectadas</h2>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Revisa y desmarca cualquier producto que no quieras importar.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAll}
                className="btn-secondary"
              >
                {allEligibleSelected
                  ? "DESMARCAR TODAS"
                  : "SELECCIONAR TODAS"}
              </button>
            </div>

            {!batch.eligible.length ? (
              <div
                style={{
                  marginTop: 18,
                  padding: 20,
                  borderRadius: 14,
                  background: "#0d0d12",
                  border: "1px solid var(--border)",
                }}
              >
                No se han encontrado camisetas válidas en esta página.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(240px,1fr))",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {batch.eligible.map((album) => {
                  const checked = selected.includes(album.albumId);

                  return (
                    <article
                      key={album.albumId}
                      style={{
                        overflow: "hidden",
                        borderRadius: 16,
                        border: checked
                          ? "1px solid #a335ff"
                          : "1px solid var(--border)",
                        background: checked
                          ? "rgba(163,53,255,.08)"
                          : "#0d0d12",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAlbum(album.albumId)}
                        style={{
                          width: "100%",
                          padding: 0,
                          border: 0,
                          background: "transparent",
                          color: "inherit",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            height: 230,
                            display: "grid",
                            placeItems: "center",
                            background: "#15151c",
                          }}
                        >
                          {album.coverImage ? (
                            <img
                              src={album.coverImage}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span className="muted">Sin portada</span>
                          )}
                        </div>

                        <div style={{ padding: 15 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              aria-label={`Seleccionar ${album.title}`}
                              style={{ marginTop: 4 }}
                            />

                            <strong style={{ lineHeight: 1.45 }}>
                              {album.title}
                            </strong>
                          </div>

                          <span
                            className="muted"
                            style={{
                              display: "block",
                              marginTop: 10,
                              fontSize: 12,
                            }}
                          >
                            Álbum {album.albumId}
                          </span>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {batch.excluded.length > 0 && (
            <details className="card" style={{ padding: 20 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Ver {batch.excluded.length} productos apartados
              </summary>

              <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
                {batch.excluded.map((album) => (
                  <div
                    key={album.albumId}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "#0d0d12",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <strong>{album.title}</strong>
                    <span
                      className="muted"
                      style={{ display: "block", marginTop: 4 }}
                    >
                      {album.exclusionReason}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <section
            className="card"
            style={{
              padding: 20,
              border: "1px solid rgba(163,53,255,.35)",
            }}
          >
            <strong>
              {selectedAlbums.length} camisetas preparadas para la siguiente
              fase
            </strong>

            <p className="muted" style={{ marginBottom: 0, lineHeight: 1.6 }}>
              En el siguiente paso añadiremos el botón para importarlas como
              borradores, con 1.000 unidades por talla y sin publicarlas
              automáticamente.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
  fontSize: 16,
};

const metricStyle = {
  display: "block",
  marginTop: 7,
  fontSize: 29,
};
