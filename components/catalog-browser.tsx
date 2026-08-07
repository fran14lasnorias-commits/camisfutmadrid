"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  initialQuery: string;
  initialTeam: string;
  initialSeason: string;
  initialType: string;
  initialSort: string;
  category?: string;
};

export function CatalogBrowser({
  products,
  total,
  page,
  totalPages,
  initialQuery,
  initialTeam,
  initialSeason,
  initialType,
  initialSort,
  category,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [team, setTeam] = useState(initialTeam);
  const [season, setSeason] = useState(initialSeason);
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [isPending, startTransition] = useTransition();

  function buildUrl(nextPage = 1) {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (team.trim()) params.set("team", team.trim());
    if (season.trim()) params.set("season", season.trim());
    if (type !== "Todos") params.set("type", type);
    if (sort !== "newest") params.set("sort", sort);
    if (category) params.set("category", category);
    if (nextPage > 1) params.set("page", String(nextPage));

    const qs = params.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => router.push(buildUrl(1)));
  }

  function clearFilters() {
    setQuery("");
    setTeam("");
    setSeason("");
    setType("Todos");
    setSort("newest");

    startTransition(() => {
      router.push(category ? `/catalogo?category=${category}` : "/catalogo");
    });
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || isPending) return;

    startTransition(() => {
      router.push(buildUrl(nextPage));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <section>
      <form
        onSubmit={submit}
        className="card"
        style={{
          display: "grid",
          gap: 16,
          marginTop: 24,
          padding: 18,
          borderColor: "rgba(195,92,255,.16)",
        }}
      >
        <div>
          <label htmlFor="catalog-search" style={labelStyle}>
            BUSCAR
          </label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Real Madrid, España, Chelsea..."
            autoComplete="off"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(min(180px,100%),1fr))",
            gap: 12,
          }}
        >
          <div>
            <label htmlFor="catalog-team" style={labelStyle}>
              EQUIPO
            </label>
            <input
              id="catalog-team"
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              placeholder="Ej. Barcelona"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="catalog-type" style={labelStyle}>
              TIPO
            </label>
           <select
  id="catalog-type"
  value={type}
  onChange={(event) => setType(event.target.value)}
  style={inputStyle}
>
  <option value="Todos">Todos</option>
  <option value="fan">Fan</option>
  <option value="player">Player</option>
  <option value="retro">Retro</option>
  <option value="kids">Niño</option>
  <option value="polo">Polo</option>
  <option value="shorts">Pantalón</option>
  <option value="training">Entrenamiento</option>
</select>
          </div>

          <div>
            <label htmlFor="catalog-season" style={labelStyle}>
              TEMPORADA
            </label>
            <input
              id="catalog-season"
              value={season}
              onChange={(event) => setSeason(event.target.value)}
              placeholder="2026/27"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="catalog-sort" style={labelStyle}>
              ORDENAR
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              style={inputStyle}
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" type="submit" disabled={isPending}>
            {isPending ? "CARGANDO..." : "BUSCAR"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={clearFilters}
            disabled={isPending}
          >
            LIMPIAR
          </button>
        </div>
      </form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 22,
        }}
      >
        <strong>
          {total.toLocaleString("es-ES")}{" "}
          {total === 1 ? "producto" : "productos"}
        </strong>
        <span className="muted">
          Página {page} de {totalPages}
        </span>
      </div>

      {!products.length ? (
        <div className="card" style={{ padding: 24, marginTop: 18 }}>
          No se han encontrado productos con esos filtros.
        </div>
      ) : (
        <div
          className="productGrid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(min(250px,100%),1fr))",
            gap: 18,
            marginTop: 18,
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="card"
          aria-label="Paginación del catálogo"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 26,
            padding: 16,
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            disabled={page <= 1 || isPending}
            onClick={() => goToPage(page - 1)}
          >
            ← ANTERIOR
          </button>

          <strong>
            {page} / {totalPages}
          </strong>

          <button
            type="button"
            className="btn-primary"
            disabled={page >= totalPages || isPending}
            onClick={() => goToPage(page + 1)}
          >
            SIGUIENTE →
          </button>
        </nav>
      )}
    </section>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#d8b4ff",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".1em",
};

const inputStyle = {
  width: "100%",
  minHeight: 46,
  padding: "11px 12px",
  borderRadius: 11,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
  fontSize: 15,
};
