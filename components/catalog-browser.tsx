"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

const TYPE_LABELS: Record<Product["type"], string> = {
  fan: "Fan",
  player: "Player",
  retro: "Retro",
  kids: "Niño",
};

const PRODUCTS_PER_BATCH = 24;

type CatalogBrowserProps = {
  products: Product[];
  initialTeam?: string;
  initialType?: "Todos" | Product["type"];
};

export function CatalogBrowser({
  products,
  initialTeam = "Todos",
  initialType = "Todos",
}: CatalogBrowserProps) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState(initialTeam);
  const [type, setType] = useState<"Todos" | Product["type"]>(initialType);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_BATCH);

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

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/catalogo");
    }
  }

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_BATCH);
  }, [query, team, type]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;


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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          <div>
            <label
              htmlFor="catalog-team"
              style={{ display: "block", fontWeight: 800, marginBottom: 8 }}
            >
              Equipo
            </label>

            <select
              id="catalog-team"
              value={team}
              onChange={(event) => {
                const nextTeam = event.target.value;
                setTeam(nextTeam);

                const params = new URLSearchParams(window.location.search);

                if (nextTeam === "Todos") {
                  params.delete("team");
                } else {
                  params.set("team", nextTeam);
                }

                const queryString = params.toString();
                window.history.replaceState(
                  {},
                  "",
                  queryString ? `/catalogo?${queryString}` : "/catalogo"
                );
              }}
              style={{
                width: "100%",
                padding: "14px 15px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "#0d0d12",
                color: "white",
                fontSize: 16,
              }}
            >
              <option value="Todos">Todos los equipos</option>
              {teams.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="catalog-type"
              style={{ display: "block", fontWeight: 800, marginBottom: 8 }}
            >
              Tipo
            </label>

            <select
              id="catalog-type"
              value={type}
              onChange={(event) => {
                const nextType = event.target.value as
                  | "Todos"
                  | Product["type"];

                setType(nextType);

                const params = new URLSearchParams(window.location.search);

                if (nextType === "Todos") {
                  params.delete("type");
                } else {
                  params.set("type", nextType);
                }

                const queryString = params.toString();
                window.history.replaceState(
                  {},
                  "",
                  queryString ? `/catalogo?${queryString}` : "/catalogo"
                );
              }}
              style={{
                width: "100%",
                padding: "14px 15px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "#0d0d12",
                color: "white",
                fontSize: 16,
              }}
            >
              <option value="Todos">Todos los tipos</option>
              <option value="fan">Fan</option>
              <option value="player">Player</option>
              <option value="retro">Retro</option>
              <option value="kids">Niño</option>
            </select>
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
        <div>
          <strong>
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "camiseta" : "camisetas"}
          </strong>

          {filteredProducts.length > 0 && (
            <span
              className="muted"
              style={{ display: "block", marginTop: 4, fontSize: 13 }}
            >
              Mostrando {visibleProducts.length} de {filteredProducts.length}
            </span>
          )}
        </div>

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
          {visibleProducts.map((product) => (
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

      {hasMoreProducts && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 28,
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              setVisibleCount((current) => current + PRODUCTS_PER_BATCH)
            }
            style={{ minWidth: 230 }}
          >
            MOSTRAR 24 MÁS
          </button>
        </div>
      )}
    </section>
  );
}
