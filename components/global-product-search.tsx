"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  team: string;
  season: string | null;
  type: string;
  price_eur: number;
  product_images: { url: string; position: number }[];
};

type GlobalProductSearchProps = {
  open: boolean;
  onClose: () => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreProduct(product: SearchProduct, query: string) {
  const q = normalize(query);
  if (!q) return 0;

  const name = normalize(product.name);
  const team = normalize(product.team);
  const season = normalize(product.season ?? "");
  const type = normalize(product.type);
  const full = `${name} ${team} ${season} ${type}`;

  let score = 0;

  if (name === q) score += 120;
  if (team === q) score += 105;
  if (name.startsWith(q)) score += 80;
  if (team.startsWith(q)) score += 72;
  if (name.includes(q)) score += 50;
  if (team.includes(q)) score += 45;
  if (season.includes(q)) score += 20;
  if (type.includes(q)) score += 15;

  for (const term of q.split(" ").filter(Boolean)) {
    if (full.includes(term)) score += 10;
  }

  return score;
}

export function GlobalProductSearch({
  open,
  onClose,
}: GlobalProductSearchProps) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || loaded || loading) return;

    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("products")
        .select(`
          id,name,slug,team,season,type,price_eur,
          product_images(url,position)
        `)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(1200);

      if (!active) return;

      if (queryError) {
        setError("No se pudo cargar el buscador.");
        setLoading(false);
        return;
      }

      setProducts((data ?? []) as SearchProduct[]);
      setLoaded(true);
      setLoading(false);
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [open, loaded, loading, supabase]);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    return products
      .map((product) => ({
        product,
        score: scoreProduct(product, query),
      }))
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.product.name.localeCompare(b.product.name, "es")
      )
      .slice(0, 8)
      .map(({ product }) => product);
  }, [products, query]);

  if (!open) return null;

  return (
    <div className="searchOverlay" role="dialog" aria-modal="true">
      <button
        type="button"
        className="backdrop"
        aria-label="Cerrar buscador"
        onClick={onClose}
      />

      <section className="searchPanel">
        <div className="container searchInner">
          <div className="topRow">
            <div>
              <span className="eyebrow">BUSCADOR CAMISFUT</span>
              <h2>¿QUÉ CAMISETA BUSCAS?</h2>
            </div>

            <button type="button" className="closeButton" onClick={onClose}>
              CERRAR
            </button>
          </div>

          <div className="inputWrap">
            <SearchIcon />

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Madrid, Barça, España, retro, Player…"
              autoComplete="off"
              inputMode="search"
            />

            {query && (
              <button
                type="button"
                className="clearButton"
                aria-label="Borrar búsqueda"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
          </div>

          {!query.trim() && (
            <div className="quickLinks">
              {["Real Madrid", "Barcelona", "España", "Retro", "Player"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          )}

          {loading && (
            <div className="status">
              <span className="loader" />
              Cargando catálogo…
            </div>
          )}

          {error && <div className="status error">{error}</div>}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="emptyState">
              <strong>No encontramos esa camiseta.</strong>
              <span>Prueba con otro equipo, temporada o tipo.</span>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="resultHeading">
                <strong>{results.length} resultados destacados</strong>
                <span>Resultados en tiempo real</span>
              </div>

              <div className="results">
                {results.map((product) => {
                  const image =
                    [...(product.product_images ?? [])]
                      .sort((a, b) => a.position - b.position)[0]?.url ||
                    "/placeholder-shirt.svg";

                  return (
                    <Link
                      key={product.id}
                      href={`/producto/${product.slug}`}
                      onClick={onClose}
                      className="resultCard"
                    >
                      <div className="imageShell">
                        <img src={image} alt="" />
                      </div>

                      <div className="resultCopy">
                        <span>{product.team}</span>
                        <strong>{product.name}</strong>
                        <small>
                          {product.type.toUpperCase()}
                          {product.season ? ` · ${product.season}` : ""}
                        </small>
                      </div>

                      <strong className="price">
                        {Number(product.price_eur).toFixed(2).replace(".", ",")} €
                      </strong>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          <div className="footerRow">
            <Link href="/catalogo" onClick={onClose} className="catalogButton">
              VER TODO EL CATÁLOGO →
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .searchOverlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: grid;
          align-items: start;
        }

        .backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          cursor: default;
        }

        .searchPanel {
          position: relative;
          z-index: 1;
          max-height: 100dvh;
          overflow-y: auto;
          border-bottom: 1px solid rgba(195, 92, 255, 0.18);
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(139, 44, 255, 0.16),
              transparent 30rem
            ),
            rgba(8, 8, 11, 0.985);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.58);
          animation: searchIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .searchInner {
          padding-top: 28px;
          padding-bottom: 34px;
        }

        .topRow {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .eyebrow {
          color: #d6a6ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        h2 {
          margin: 6px 0 0;
          font-size: clamp(2rem, 5vw, 4rem);
        }

        .closeButton,
        .catalogButton {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.035);
          color: white;
          font-family: var(--font-display);
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
        }

        .inputWrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-top: 22px;
        }

        .inputWrap input {
          width: 100%;
          min-height: 64px;
          padding: 16px 54px 16px 54px;
          border: 1px solid rgba(195, 92, 255, 0.24);
          border-radius: 17px;
          outline: none;
          background: rgba(13, 13, 18, 0.94);
          color: white;
          font-size: 18px;
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.2);
        }

        .inputWrap input:focus {
          border-color: rgba(195, 92, 255, 0.6);
          box-shadow:
            0 0 0 3px rgba(139, 44, 255, 0.12),
            0 18px 50px rgba(0, 0, 0, 0.28);
        }

        .clearButton {
          position: absolute;
          right: 13px;
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 0;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: #ddddE7;
          font-size: 21px;
          cursor: pointer;
        }

        .quickLinks {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .quickLinks button {
          padding: 8px 11px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
          color: #ddddE5;
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          padding: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.025);
          color: var(--muted);
        }

        .status.error {
          color: #ff9cab;
        }

        .loader {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-top-color: var(--purple-2);
          border-radius: 50%;
          animation: spin 650ms linear infinite;
        }

        .emptyState {
          display: grid;
          gap: 5px;
          margin-top: 22px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.025);
        }

        .emptyState span {
          color: var(--muted);
        }

        .resultHeading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 24px;
          color: #eeeeF4;
        }

        .resultHeading span {
          color: var(--muted);
          font-size: 12px;
        }

        .results {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .resultCard {
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          padding: 11px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.025);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .resultCard:hover {
          transform: translateY(-2px);
          border-color: rgba(195, 92, 255, 0.3);
          background: rgba(139, 44, 255, 0.06);
        }

        .imageShell {
          display: grid;
          width: 72px;
          height: 72px;
          place-items: center;
          overflow: hidden;
          border-radius: 12px;
          background:
            radial-gradient(
              circle at 50% 40%,
              rgba(139, 44, 255, 0.18),
              transparent 60%
            ),
            #15151d;
        }

        .imageShell img {
          width: 90%;
          height: 90%;
          object-fit: contain;
        }

        .resultCopy {
          display: grid;
          min-width: 0;
          gap: 2px;
        }

        .resultCopy > span {
          color: #d6a6ff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .resultCopy > strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
        }

        .resultCopy small {
          color: var(--muted);
          font-size: 11px;
        }

        .price {
          color: var(--purple-2);
          font-family: var(--font-display);
          font-size: 19px;
          white-space: nowrap;
        }

        .footerRow {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }

        .catalogButton {
          border-color: rgba(195, 92, 255, 0.2);
          background: rgba(139, 44, 255, 0.08);
          color: #e4c7ff;
        }

        @keyframes searchIn {
          from {
            opacity: 0;
            transform: translateY(-18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .searchInner {
            width: min(100% - 20px, 1180px);
            padding-top: 20px;
          }

          .topRow {
            align-items: center;
          }

          .results {
            grid-template-columns: 1fr;
          }

          .resultHeading span {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .searchInner {
            width: min(100% - 16px, 1180px);
          }

          .topRow h2 {
            font-size: 2rem;
          }

          .closeButton {
            min-height: 38px;
            padding: 8px 10px;
            font-size: 13px;
          }

          .inputWrap input {
            min-height: 56px;
            padding-left: 48px;
            font-size: 16px;
          }

          .resultCard {
            grid-template-columns: 60px minmax(0, 1fr);
          }

          .imageShell {
            width: 60px;
            height: 60px;
          }

          .price {
            grid-column: 2;
            justify-self: start;
            font-size: 17px;
          }

          .footerRow {
            justify-content: stretch;
          }

          .catalogButton {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .searchPanel,
          .loader {
            animation: none !important;
          }

          .resultCard {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 18,
        zIndex: 2,
        color: "#d6a6ff",
      }}
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
