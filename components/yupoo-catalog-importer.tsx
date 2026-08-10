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

const MAX_TOTAL_PRODUCTS = 10_000;
const MAX_PAGES_TO_SCAN = 500;
const PAGE_REQUEST_LIMIT = 50;
const SAVE_CHUNK_SIZE = 200;
const PHOTO_CHUNK_SIZE = 1;
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeHex(value: string) {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function proxiedYupooImage(sourceUrl: string, refererUrl: string) {
  const source = encodeHex(sourceUrl);
  const referer = encodeHex(refererUrl);

  return `/api/yupoo-image?u=${source}&r=${referer}`;
}

function YupooCover({ album }: { album: Album }) {
  const [failed, setFailed] = useState(false);

  if (!album.coverImage || failed) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          padding: 18,
          color: "#9999a5",
          textAlign: "center",
        }}
      >
        Foto no disponible
      </div>
    );
  }

  return (
    <img
      src={proxiedYupooImage(album.coverImage, album.sourceUrl)}
      alt={album.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}

export function YupooCatalogImporter() {
  const [url, setUrl] = useState(DEFAULT_CATALOG);
  const [scanProgress, setScanProgress] = useState("");
  const [saveProgress, setSaveProgress] = useState("");
  const [batch, setBatch] = useState<CatalogBatch | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingAllPhotos, setUpdatingAllPhotos] = useState(false);
  const [allPhotosProgress, setAllPhotosProgress] = useState("");
  const [allPhotosResult, setAllPhotosResult] = useState<{
    products: number;
    updated: number;
    images: number;
    failed: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [saveResult, setSaveResult] = useState<{
    imported: number;
    skipped: number;
    blockedNba?: number;
    imagesUpdated?: number;
    galleryImages?: number;
    names: string[];
  } | null>(null);

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
    setSaveResult(null);
    setBatch(null);
    setSelected([]);
    setScanProgress("Preparando lectura completa del catálogo...");

    try {
      const eligibleById = new Map<string, Album>();
      const excludedById = new Map<string, Album>();
      const warnings = new Set<string>();

      let totalDiscovered = 0;
      let lastPage = 0;
      let consecutivePagesWithoutNewProducts = 0;

      for (
        let currentPage = 1;
        currentPage <= MAX_PAGES_TO_SCAN &&
        eligibleById.size < MAX_TOTAL_PRODUCTS;
        currentPage += 1
      ) {
        setScanProgress(
          `Leyendo página ${currentPage} · ${eligibleById.size.toLocaleString("es-ES")} productos encontrados`
        );

        const response = await fetch("/api/admin/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "catalog",
            url,
            page: currentPage,
            limit: PAGE_REQUEST_LIMIT,
          }),
        });

        const data: CatalogBatch & { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? `No se pudo leer la página ${currentPage} de Yupoo.`
          );
        }

        lastPage = currentPage;
        totalDiscovered += Number(data.discovered ?? 0);

        let newOnThisPage = 0;

        for (const album of data.eligible ?? []) {
          if (
            !eligibleById.has(album.albumId) &&
            !excludedById.has(album.albumId)
          ) {
            eligibleById.set(album.albumId, album);
            newOnThisPage += 1;
          }

          if (eligibleById.size >= MAX_TOTAL_PRODUCTS) break;
        }

        for (const album of data.excluded ?? []) {
          if (
            !eligibleById.has(album.albumId) &&
            !excludedById.has(album.albumId)
          ) {
            excludedById.set(album.albumId, album);
          }
        }

        for (const warning of data.warnings ?? []) {
          warnings.add(warning);
        }

        if ((data.discovered ?? 0) === 0 || newOnThisPage === 0) {
          consecutivePagesWithoutNewProducts += 1;
        } else {
          consecutivePagesWithoutNewProducts = 0;
        }

        // Dos páginas seguidas sin álbumes nuevos = fin real del catálogo
        // o paginación que Yupoo ha empezado a repetir.
        if (consecutivePagesWithoutNewProducts >= 2) {
          break;
        }
      }

      const eligible = [...eligibleById.values()].slice(
        0,
        MAX_TOTAL_PRODUCTS
      );
      const excluded = [...excludedById.values()];

      const mergedBatch: CatalogBatch = {
        catalogUrl: url,
        page: lastPage || 1,
        discovered: eligible.length + excluded.length,
        eligible,
        excluded,
        warnings: [...warnings],
      };

      setBatch(mergedBatch);
      setSelected(eligible.map((album) => album.albumId));
      setScanProgress(
        `Lectura completa: ${eligible.length.toLocaleString("es-ES")} productos válidos · ${excluded.length.toLocaleString("es-ES")} NBA/baloncesto apartados · ${lastPage} páginas revisadas`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo leer el catálogo completo."
      );
      setScanProgress("");
    } finally {
      setLoading(false);
    }
  }

  async function saveSelectedDrafts() {
    if (!selectedAlbums.length || saving) return;

    if (selectedAlbums.length > MAX_TOTAL_PRODUCTS) {
      setMessage(
        `El máximo por importación es ${MAX_TOTAL_PRODUCTS.toLocaleString("es-ES")} productos.`
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setSaveResult(null);
    setSaveProgress("Preparando importación...");

    try {
      let imported = 0;
      let skipped = 0;
      let blockedNba = 0;
      let imagesUpdated = 0;
      let galleryImages = 0;
      const names: string[] = [];

      // Un solo clic para el usuario; por dentro se guarda en tandas pequeñas
      // para no agotar el tiempo ni el tamaño máximo de una petición.
      for (
        let start = 0;
        start < selectedAlbums.length;
        start += SAVE_CHUNK_SIZE
      ) {
        const chunk = selectedAlbums.slice(start, start + SAVE_CHUNK_SIZE);
        const chunkNumber = Math.floor(start / SAVE_CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(
          selectedAlbums.length / SAVE_CHUNK_SIZE
        );

        setSaveProgress(
          `Guardando tanda ${chunkNumber} de ${totalChunks} · ${Math.min(
            start + chunk.length,
            selectedAlbums.length
          ).toLocaleString("es-ES")} / ${selectedAlbums.length.toLocaleString("es-ES")}`
        );

        const response = await fetch("/api/admin/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "catalog-save",
            albums: chunk.map((album) => ({
              albumId: album.albumId,
              sourceUrl: album.sourceUrl,
              title: album.title,
              coverImage: album.coverImage,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              `No se pudo guardar la tanda ${chunkNumber} de ${totalChunks}.`
          );
        }

        imported += Number(data.imported ?? 0);
        skipped += Number(data.skipped ?? 0);
        blockedNba += Number(data.blockedNba ?? 0);

        if (Array.isArray(data.names)) {
          names.push(...data.names);
        }

        // Segunda fase: abre los álbumes con Chromium real para que Yupoo
        // cargue las fotos lazy y guarda hasta 10 imágenes por producto.
        for (
          let photoStart = 0;
          photoStart < chunk.length;
          photoStart += PHOTO_CHUNK_SIZE
        ) {
          const photoChunk = chunk.slice(
            photoStart,
            photoStart + PHOTO_CHUNK_SIZE
          );

          setSaveProgress(
            `Fotos de detalle · tanda ${Math.floor(photoStart / PHOTO_CHUNK_SIZE) + 1} de ${Math.ceil(chunk.length / PHOTO_CHUNK_SIZE)} · ${Math.min(start + photoStart + photoChunk.length, selectedAlbums.length).toLocaleString("es-ES")} / ${selectedAlbums.length.toLocaleString("es-ES")}`
          );

          const photoResponse = await fetch("/api/admin/import/photos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              albums: photoChunk.map((album) => ({
                albumId: album.albumId,
                sourceUrl: album.sourceUrl,
              })),
            }),
          });

          const photoData = await photoResponse.json();

          if (!photoResponse.ok) {
            throw new Error(
              photoData.error ??
                "No se pudieron guardar las fotos de detalle."
            );
          }

          imagesUpdated += Number(photoData.updated ?? 0);
          galleryImages += Number(photoData.imagesSaved ?? 0);
        }
      }

      setSaveResult({
        imported,
        skipped,
        blockedNba,
        imagesUpdated,
        galleryImages,
        names,
      });
      setSelected([]);
      setSaveProgress(
        `Importación terminada · ${imported.toLocaleString("es-ES")} productos creados`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar todos los borradores."
      );
    } finally {
      setSaving(false);
    }
  }


  async function updateEveryProductPhotoGallery() {
    if (updatingAllPhotos || saving || loading) return;

    setUpdatingAllPhotos(true);
    setAllPhotosProgress("Leyendo progreso real desde Supabase...");
    setAllPhotosResult(null);
    setMessage("");

    try {
      const listResponse = await fetch("/api/admin/import/photos", {
        method: "GET",
        cache: "no-store",
      });
      const listData = await listResponse.json();

      if (!listResponse.ok) {
        throw new Error(listData.error ?? "No se pudo leer el progreso.");
      }

      const albums = Array.isArray(listData.albums) ? listData.albums : [];
      const pendingAlbums = albums.filter(
        (album: { completed?: boolean }) => album.completed !== true
      );

      if (!pendingAlbums.length) {
        setAllPhotosResult({
          products: Number(listData.total ?? 0),
          updated: Number(listData.completed ?? 0),
          images: Number(listData.imagesSaved ?? 0),
          failed: 0,
        });
        setAllPhotosProgress(
          `Terminado · ${Number(listData.completed ?? 0).toLocaleString("es-ES")} completas · 0 pendientes`
        );
        return;
      }

      let failed = 0;

      for (let i = 0; i < pendingAlbums.length; i += 1) {
        const album = pendingAlbums[i];

        setAllPhotosProgress(
          `Procesando ${i + 1} / ${pendingAlbums.length} pendientes · ` +
          `${Number(listData.completed ?? 0).toLocaleString("es-ES")} ya completas`
        );

        let ok = false;
        let lastError = "";

        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 55_000);

            const response = await fetch("/api/admin/import/photos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ albums: [album] }),
              signal: controller.signal,
            });

            window.clearTimeout(timeout);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(data.error ?? `HTTP ${response.status}`);
            }

            if (Number(data.updated ?? 0) > 0) {
              ok = true;
              break;
            }

            const detail = Array.isArray(data.details) ? data.details[0] : null;
            throw new Error(detail?.error ?? "No se pudo guardar la galería.");
          } catch (error) {
            lastError = error instanceof Error ? error.message : "Petición interrumpida.";
            if (attempt < 3) await sleep(attempt * 1500);
          }
        }

        if (!ok) {
          failed += 1;
          setMessage(`Un álbum falló tras 3 intentos: ${lastError}. Continúo con el siguiente.`);
        }

        if ((i + 1) % 10 === 0 || i === pendingAlbums.length - 1) {
          const progressResponse = await fetch("/api/admin/import/photos", {
            method: "GET",
            cache: "no-store",
          });
          const progressData = await progressResponse.json();

          if (progressResponse.ok) {
            setAllPhotosProgress(
              `Progreso real · ${Number(progressData.completed ?? 0).toLocaleString("es-ES")} completas · ` +
              `${Number(progressData.pending ?? 0).toLocaleString("es-ES")} pendientes`
            );
            setAllPhotosResult({
              products: Number(progressData.total ?? 0),
              updated: Number(progressData.completed ?? 0),
              images: Number(progressData.imagesSaved ?? 0),
              failed,
            });
          }
        }

        await sleep(400);
      }

      const finalResponse = await fetch("/api/admin/import/photos", {
        method: "GET",
        cache: "no-store",
      });
      const finalData = await finalResponse.json();

      if (!finalResponse.ok) {
        throw new Error(finalData.error ?? "No se pudo comprobar el resultado final.");
      }

      setAllPhotosResult({
        products: Number(finalData.total ?? 0),
        updated: Number(finalData.completed ?? 0),
        images: Number(finalData.imagesSaved ?? 0),
        failed,
      });

      setAllPhotosProgress(
        `Progreso real · ${Number(finalData.completed ?? 0).toLocaleString("es-ES")} completas · ` +
        `${Number(finalData.pending ?? 0).toLocaleString("es-ES")} pendientes`
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No se pudieron actualizar las galerías."
      );
      setAllPhotosProgress(
        "El proceso se detuvo, pero todo lo guardado en Supabase permanece."
      );
    } finally {
      setUpdatingAllPhotos(false);
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
          Importar todo el catálogo de Yupoo
        </h2>

        <p className="muted" style={{ lineHeight: 1.6 }}>
          Un solo análisis recorrerá automáticamente todas las páginas, hasta
          10.000 productos. Solo se apartarán NBA y baloncesto. Después podrás
          guardarlos todos como borradores con un solo clic.
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
            className="card"
            style={{
              padding: 14,
              background: "rgba(139,44,255,.06)",
              borderColor: "rgba(195,92,255,.16)",
            }}
          >
            <strong>IMPORTACIÓN COMPLETA</strong>
            <p className="muted" style={{ margin: "5px 0 0", lineHeight: 1.5 }}>
              Hasta 10.000 productos · todas las páginas automáticamente ·
              guardado seguro por tandas internas.
            </p>
          </div>

          <button
            type="button"
            onClick={analyzeCatalog}
            disabled={loading || !url.trim()}
            className="btn-primary"
          >
            {loading ? "LEYENDO TODO EL CATÁLOGO..." : "ANALIZAR TODO EL CATÁLOGO"}
          </button>
        </div>
      </section>

      {(loading || scanProgress) && (
        <div
          className="card"
          style={{
            padding: 16,
            border: "1px solid rgba(195,92,255,.24)",
            color: "#e6ccff",
          }}
        >
          {scanProgress || "Leyendo catálogo..."}
        </div>
      )}

      {(saving || saveProgress) && (
        <div
          className="card"
          style={{
            padding: 16,
            border: "1px solid rgba(61,222,138,.24)",
            color: "#8af3b7",
          }}
        >
          {saveProgress || "Guardando productos..."}
        </div>
      )}

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

      
      <div
        className="card"
        style={{
          marginTop: 18,
          padding: 18,
          borderColor: "rgba(195,92,255,.28)",
          background:
            "linear-gradient(135deg,rgba(139,44,255,.11),rgba(195,92,255,.05))",
        }}
      >
        <strong style={{ display: "block", marginBottom: 6 }}>
          GALERÍAS AUTOMÁTICAS
        </strong>
        <p className="muted" style={{ margin: "0 0 14px", lineHeight: 1.55 }}>
          Un solo clic: recorre todos los productos que ya existen y añade a
          cada camiseta las fotos de su propio álbum de Yupoo.
        </p>

        <button
          type="button"
          className="btn-primary"
          onClick={updateEveryProductPhotoGallery}
          disabled={updatingAllPhotos || saving || loading}
          style={{
            width: "100%",
            minHeight: 54,
            fontSize: 15,
          }}
        >
          {updatingAllPhotos
            ? "AÑADIENDO FOTOS A TODAS LAS CAMISETAS..."
            : "AÑADIR TODAS LAS FOTOS A CADA CAMISETA"}
        </button>

        {allPhotosProgress && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(61,222,138,.28)",
              color: "#79f2ad",
              lineHeight: 1.5,
            }}
          >
            {allPhotosProgress}
          </div>
        )}

        {allPhotosResult && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(150px,100%),1fr))",
              gap: 10,
              marginTop: 12,
            }}
          >
            <div className="card" style={{ padding: 14 }}>
              <span className="muted">Productos revisados</span>
              <strong style={{ display: "block", fontSize: 24, marginTop: 4 }}>
                {allPhotosResult.products.toLocaleString("es-ES")}
              </strong>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <span className="muted">Galerías actualizadas</span>
              <strong style={{ display: "block", fontSize: 24, marginTop: 4 }}>
                {allPhotosResult.updated.toLocaleString("es-ES")}
              </strong>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <span className="muted">Fotos guardadas</span>
              <strong style={{ display: "block", fontSize: 24, marginTop: 4 }}>
                {allPhotosResult.images.toLocaleString("es-ES")}
              </strong>
            </div>
          </div>
        )}
      </div>

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
                          <YupooCover album={album} />
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
              {selectedAlbums.length} camisetas seleccionadas
            </strong>

            <p className="muted" style={{ lineHeight: 1.6 }}>
              Se guardarán como borradores. Puedes seleccionar hasta 10.000
              productos y pulsar una sola vez: el sistema los procesará en
              tandas internas para evitar errores o tiempos de espera excesivos.
              No aparecerán en el catálogo hasta que los publiques desde Productos.
            </p>

            <button
              type="button"
              onClick={saveSelectedDrafts}
              disabled={!selectedAlbums.length || saving}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              {saving
                ? "GUARDANDO BORRADORES..."
                : `IMPORTAR ${selectedAlbums.length.toLocaleString("es-ES")} PRODUCTOS DE UNA VEZ`}
            </button>
          </section>

          {saveResult && (
            <section
              className="card"
              style={{
                padding: 20,
                border: "1px solid rgba(61,222,138,.35)",
                background: "rgba(61,222,138,.08)",
              }}
            >
              <strong style={{ color: "#8af3b7" }}>
                Importación terminada
              </strong>

              <p style={{ lineHeight: 1.65, marginBottom: 0 }}>
                Se han creado <strong>{saveResult.imported}</strong> borradores.
                {saveResult.skipped > 0 && (
                  <>
                    {" "}
                    Se han omitido <strong>{saveResult.skipped}</strong> porque
                    ya estaban importados.
                  </>
                )}
                {(saveResult.imagesUpdated ?? 0) > 0 && (
                  <>
                    {" "}
                    Se ha actualizado la galería de{" "}
                    <strong>{saveResult.imagesUpdated}</strong> productos con
                    varias fotos del álbum
                    {typeof saveResult.galleryImages === "number" && (
                      <> ({saveResult.galleryImages} imágenes guardadas)</>
                    )}.
                  </>
                )}
              </p>

              {saveResult.imported > 0 && (
                <a
                  href="/admin/productos"
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    marginTop: 16,
                    textDecoration: "none",
                  }}
                >
                  REVISAR BORRADORES
                </a>
              )}
            </section>
          )}
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
