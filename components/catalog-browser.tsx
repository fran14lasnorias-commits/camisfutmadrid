"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

const TYPE_LABELS: Record<Product["type"], string> = {
  fan: "Fan",
  player: "Player",
  retro: "Retro",
  kids: "Niño",
};

export function CatalogBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("Todos");
  const [type, setType] = useState<"Todos" | Product["type"]>("Todos");

  const teams = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.team))).sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          product.name,
          product.team,
          product.season,
          TYPE_LABELS[product.type],
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);

      const matchesTeam = team === "Todos" || product.team === team;
      const matchesType = type === "Todos" || product.type === type;

      return matchesQuery && matchesTeam && matchesType;
    });
  }, [products, query, team, type]);

  function clearFilters() {
    setQuery("");
    setTeam("Todos");
    setType("Todos");
  }

  const filtersAreActive =
    query.trim() !== "" || team !== "Todos" || type !== "Todos";

  return (
    <section>
      <div
        className="card"
        style={{
          padding: 18,
          marginTop: 24,
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <label
            htmlFor="catalog-search"
            style={{ display: "block", fontWeight: 800, marginBottom: 8 }}
          >
            Buscar camiseta
          </label>

          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ejemplo: Real Madrid, retro, 2026/27…"
            autoComplete="off"
            style={{
              width: "100%",
              padding: "14px 15px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "#0d0d12",
              color: "white",
              fontSize: 16,
            }}
          />
        </div>

        <div>
          <span
            style={{ display: "block", fontWeight: 800, marginBottom: 9 }}
          >
            Equipo
          </span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Todos", ...teams].map((item) => {
              const active = team === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTeam(item)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid #a855f7"
                      : "1px solid var(--border)",
                    background: active ? "#2b1242" : "#111118",
                    color: active ? "#e5c1ff" : "#b7b7c1",
                    cursor: "pointer",
                    fontWeight: active ? 800 : 600,
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span
            style={{ display: "block", fontWeight: 800, marginBottom: 9 }}
          >
            Tipo
          </span>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              ["Todos", "Todos"],
              ["fan", "Fan"],
              ["player", "Player"],
              ["retro", "Retro"],
              ["kids", "Niño"],
            ].map(([value, label]) => {
              const active = type === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setType(value as "Todos" | Product["type"])
                  }
                  style={{
                    padding: "9px 12px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid #a855f7"
                      : "1px solid var(--border)",
                    background: active ? "#2b1242" : "#111118",
                    color: active ? "#e5c1ff" : "#b7b7c1",
                    cursor: "pointer",
                    fontWeight: active ? 800 : 600,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          marginTop: 22,
          flexWrap: "wrap",
        }}
      >
        <strong>
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "camiseta" : "camisetas"}
        </strong>

        {filtersAreActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-secondary"
          >
            LIMPIAR FILTROS
          </button>
        )}
      </div>

      {filteredProducts.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
            marginTop: 18,
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 28, marginTop: 18 }}>
          <h2 style={{ marginTop: 0 }}>No encontramos esa camiseta</h2>
          <p className="muted" style={{ marginBottom: 18 }}>
            Prueba con otro equipo, temporada o tipo de camiseta.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="btn-primary"
          >
            VER TODO EL CATÁLOGO
          </button>
        </div>
      )}
    </section>
  );
}
