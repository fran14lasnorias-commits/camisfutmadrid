"use client";

import { useMemo, useState } from "react";
import { AdminProductEditor } from "@/components/admin-product-editor";

type AdminProduct = {
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
  created_at?: string | null;
  product_images: { url: string; position: number }[];
  product_variants: { size: string; stock: number }[];
};

const TYPE_LABELS: Record<string, string> = {
  fan: "Fan",
  player: "Player",
  retro: "Retro",
  kids: "Niño",
  adult_kit: "Kit adulto",
  polo: "Polo",
  shorts: "Shorts",
  socks: "Calcetines",
  training: "Entrenamiento",
  nba: "NBA",
};

type StatusFilter = "all" | "draft" | "published";
type SortMode = "newest" | "name" | "team" | "stock";

export function AdminProductsBrowser({
  products,
}: {
  products: AdminProduct[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const availableTypes = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.type))).sort(
        (a, b) =>
          (TYPE_LABELS[a] ?? a).localeCompare(TYPE_LABELS[b] ?? b, "es")
      ),
    [products]
  );

  const counts = useMemo(
    () => ({
      total: products.length,
      drafts: products.filter((product) => !product.published).length,
      published: products.filter((product) => product.published).length,
    }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    const result = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          product.name,
          product.team,
          product.season ?? "",
          product.slug,
          TYPE_LABELS[product.type] ?? product.type,
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);

      const matchesStatus =
        status === "all" ||
        (status === "published" && product.published) ||
        (status === "draft" && !product.published);

      const matchesType = type === "all" || product.type === type;

      return matchesQuery && matchesStatus && matchesType;
    });

    return [...result].sort((a, b) => {
      if (sort === "name") {
        return a.name.localeCompare(b.name, "es");
      }

      if (sort === "team") {
        return (
          a.team.localeCompare(b.team, "es") ||
          a.name.localeCompare(b.name, "es")
        );
      }

      if (sort === "stock") {
        const stockA = (a.product_variants ?? []).reduce(
          (sum, variant) => sum + Number(variant.stock),
          0
        );
        const stockB = (b.product_variants ?? []).reduce(
          (sum, variant) => sum + Number(variant.stock),
          0
        );

        return stockB - stockA;
      }

      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      );
    });
  }, [products, query, status, type, sort]);

  const filtersActive =
    query.trim() !== "" ||
    status !== "all" ||
    type !== "all" ||
    sort !== "newest";

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setType("all");
    setSort("newest");
  }

  return (
    <section style={{ marginTop: 30 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 5 }}>Productos existentes</h2>
          <span className="muted">
            {counts.total} productos · {counts.drafts} borradores ·{" "}
            {counts.published} publicados
          </span>
        </div>

        <strong>
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "resultado" : "resultados"}
        </strong>
      </div>

      <div
        className="card"
        style={{
          display: "grid",
          gap: 14,
          padding: 18,
          marginTop: 18,
        }}
      >
        <div>
          <label htmlFor="admin-product-search" style={labelStyle}>
            Buscar producto
          </label>

          <input
            id="admin-product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, equipo, temporada o slug…"
            autoComplete="off"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          <div>
            <label htmlFor="admin-product-status" style={labelStyle}>
              Estado
            </label>

            <select
              id="admin-product-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
              style={inputStyle}
            >
              <option value="all">Todos</option>
              <option value="draft">Solo borradores</option>
              <option value="published">Solo publicados</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-product-type" style={labelStyle}>
              Tipo
            </label>

            <select
              id="admin-product-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              style={inputStyle}
            >
              <option value="all">Todos los tipos</option>
              {availableTypes.map((item) => (
                <option key={item} value={item}>
                  {TYPE_LABELS[item] ?? item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-product-sort" style={labelStyle}>
              Ordenar
            </label>

            <select
              id="admin-product-sort"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as SortMode)
              }
              style={inputStyle}
            >
              <option value="newest">Más recientes</option>
              <option value="name">Nombre A–Z</option>
              <option value="team">Equipo A–Z</option>
              <option value="stock">Mayor stock</option>
            </select>
          </div>
        </div>

        {filtersActive && (
          <button
            type="button"
            className="btn-secondary"
            onClick={clearFilters}
          >
            LIMPIAR FILTROS
          </button>
        )}
      </div>

      {!filteredProducts.length ? (
        <div className="card" style={{ padding: 24, marginTop: 14 }}>
          <strong>No se han encontrado productos.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Prueba con otro nombre o limpia los filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {filteredProducts.map((product) => (
            <AdminProductEditor key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 7,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: 13,
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
  fontSize: 15,
};
