"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";
import { PRODUCT_TYPE_FILTER_OPTIONS, PRODUCT_TYPE_LABELS } from "@/lib/product-types";


const QUERY_ALIASES: Record<string, string[]> = {
  mbappe: ["mbape", "embape", "mbappé", "mbappe"],
  madrid: ["real madrid", "madrid"],
  barca: ["barcelona", "barça", "barca"],
  atletico: ["atlético", "atletico"],
  espana: ["españa", "spain", "espana"],
  nino: ["niño", "kids", "infantil", "nino"],
  visitante: ["away", "visitante"],
  local: ["home", "local"],
  tercera: ["third", "tercera"],
};

type CatalogBrowserProps = {
  products: Product[];
  initialTeam?: string;
  initialType?: "Todos" | Product["type"];
};

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandQuery(value: string) {
  const normalized = normalize(value);
  const parts = new Set(normalized.split(" ").filter(Boolean));

  for (const [key, aliases] of Object.entries(QUERY_ALIASES)) {
    if (parts.has(key) || aliases.some((alias) => normalized.includes(normalize(alias)))) {
      aliases.forEach((alias) => parts.add(normalize(alias)));
    }
  }

  return [...parts];
}

function productSearchText(product: Product) {
  return normalize(
    [
      product.name,
      product.team,
      product.season,
      PRODUCT_TYPE_LABELS[product.type],
      product.type,
    ].join(" ")
  );
}

function scoreProduct(product: Product, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 1;

  const terms = expandQuery(query);
  const name = normalize(product.name);
  const team = normalize(product.team);
  const season = normalize(product.season);
  const type = normalize(PRODUCT_TYPE_LABELS[product.type]);
  const fullText = productSearchText(product);

  let score = 0;

  if (name === normalizedQuery) score += 100;
  if (team === normalizedQuery) score += 90;
  if (name.startsWith(normalizedQuery)) score += 60;
  if (team.startsWith(normalizedQuery)) score += 55;
  if (name.includes(normalizedQuery)) score += 42;
  if (team.includes(normalizedQuery)) score += 38;
  if (season.includes(normalizedQuery)) score += 24;
  if (type.includes(normalizedQuery)) score += 18;

  for (const term of terms) {
    if (fullText.includes(term)) score += 12;
  }

  return score;
}

export function CatalogBrowser({
  products,
  initialTeam = "Todos",
  initialType = "Todos",
}: CatalogBrowserProps) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState(initialTeam);
  const [type, setType] = useState<"Todos" | Product["type"]>(initialType);
  const [searchFocused, setSearchFocused] = useState(false);
  const [sort, setSort] = useState<"relevance" | "price_asc" | "price_desc" | "name">("relevance");

  const teams = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.team))).sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [products]
  );

  const seasons = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.season)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => b.localeCompare(a, "es")),
    [products]
  );

  const [season, setSeason] = useState("Todas");

  const filteredProducts = useMemo(() => {
    return products
      .map((product) => ({
        product,
        score: scoreProduct(product, query),
      }))
      .filter(({ product, score }) => {
        const matchesQuery = !query.trim() || score > 0;
        const matchesTeam = team === "Todos" || product.team === team;
        const matchesType = type === "Todos" || product.type === type;
        const matchesSeason =
          season === "Todas" || product.season === season;

        return matchesQuery && matchesTeam && matchesType && matchesSeason;
      })
      .sort((a, b) => {
        if (sort === "price_asc") {
          return a.product.price - b.product.price;
        }

        if (sort === "price_desc") {
          return b.product.price - a.product.price;
        }

        if (sort === "name") {
          return a.product.name.localeCompare(b.product.name, "es");
        }

        return (
          b.score - a.score ||
          a.product.name.localeCompare(b.product.name, "es")
        );
      })
      .map(({ product }) => product);
  }, [products, query, team, type, season, sort]);

  const suggestions = useMemo(
    () => (query.trim() ? filteredProducts.slice(0, 5) : []),
    [filteredProducts, query]
  );

  function updateUrl(nextTeam: string, nextType: string) {
    const params = new URLSearchParams(window.location.search);

    if (nextTeam === "Todos") params.delete("team");
    else params.set("team", nextTeam);

    if (nextType === "Todos") params.delete("type");
    else params.set("type", nextType);

    const queryString = params.toString();

    window.history.replaceState(
      {},
      "",
      queryString ? `/catalogo?${queryString}` : "/catalogo"
    );
  }

  function clearFilters() {
    setQuery("");
    setTeam("Todos");
    setType("Todos");
    setSeason("Todas");
    setSort("relevance");
    setSearchFocused(false);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/catalogo");
    }
  }


  const groupedProducts = useMemo(
    () =>
      PRODUCT_TYPE_FILTER_OPTIONS
        .map((option) => ({
          type: option.value,
          label: option.label,
          products: filteredProducts.filter(
            (product) => product.type === option.value
          ),
        }))
        .filter((group) => group.products.length > 0),
    [filteredProducts]
  );

  const [sectionLimits, setSectionLimits] = useState<
    Partial<Record<Product["type"], number>>
  >({});

  function sectionLimit(productType: Product["type"]) {
    return sectionLimits[productType] ?? 12;
  }

  function showMoreInSection(productType: Product["type"]) {
    setSectionLimits((current) => ({
      ...current,
      [productType]: (current[productType] ?? 12) + 12,
    }));
  }

  const filtersAreActive =
    query.trim() !== "" ||
    team !== "Todos" ||
    type !== "Todos" ||
    season !== "Todas" ||
    sort !== "relevance";

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 18,
          flexWrap: "wrap",
          marginTop: 18,
        }}
      >
        <div>
          <span
            style={{
              color: "#d6a6ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".14em",
            }}
          >
            ENCUENTRA TU CAMISETA
          </span>

          <h1
            style={{
              margin: "8px 0 8px",
              fontSize: "clamp(3rem,8vw,6.6rem)",
              lineHeight: .86,
            }}
          >
            CATÁLOGO
          </h1>

          <p className="muted" style={{ margin: 0 }}>
            {products.length} modelos disponibles
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {["Real Madrid", "Barcelona", "España"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setQuery(item)}
              style={{
                padding: "9px 12px",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 999,
                background: "rgba(255,255,255,.03)",
                color: "#e7e7ee",
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          position: "relative",
          zIndex: 5,
          display: "grid",
          gap: 18,
          marginTop: 24,
          padding: 20,
          overflow: "visible",
          borderColor: "rgba(195,92,255,.16)",
          background:
            "radial-gradient(circle at 15% 0%,rgba(139,44,255,.13),transparent 22rem),var(--surface)",
        }}
      >
        <div style={{ position: "relative" }}>
          <label
            htmlFor="catalog-search"
            style={{
              display: "block",
              marginBottom: 9,
              color: "#d8b4ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".13em",
              textTransform: "uppercase",
            }}
          >
            ¿Qué camiseta buscas?
          </label>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SearchIcon />

            <input
              id="catalog-search"
              type="search"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() =>
                window.setTimeout(() => setSearchFocused(false), 140)
              }
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Real Madrid, Mbappé, retro, España 2026…"
              autoComplete="off"
              style={{
                width: "100%",
                minHeight: 58,
                padding: "15px 54px 15px 50px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(8,8,12,.84)",
                color: "white",
                fontSize: 17,
                boxShadow: searchFocused
                  ? "0 0 0 3px rgba(139,44,255,.14),0 18px 44px rgba(0,0,0,.24)"
                  : "none",
                transition: "box-shadow 160ms ease,border-color 160ms ease",
              }}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
                style={{
                  position: "absolute",
                  right: 12,
                  display: "grid",
                  width: 34,
                  height: 34,
                  placeItems: "center",
                  border: 0,
                  borderRadius: 10,
                  background: "rgba(255,255,255,.06)",
                  color: "#cfcfd8",
                  fontSize: 19,
                }}
              >
                ×
              </button>
            )}
          </div>

          {searchFocused && query.trim() && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 9px)",
                left: 0,
                right: 0,
                zIndex: 20,
                overflow: "hidden",
                border: "1px solid rgba(195,92,255,.22)",
                borderRadius: 16,
                background: "rgba(10,10,14,.98)",
                boxShadow: "0 24px 70px rgba(0,0,0,.54)",
                backdropFilter: "blur(22px)",
              }}
            >
              {suggestions.length ? (
                suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "52px minmax(0,1fr) auto",
                      alignItems: "center",
                      gap: 12,
                      padding: 11,
                      borderBottom: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <img
                      src={product.images[0] || "/placeholder-shirt.svg"}
                      alt=""
                      style={{
                        width: 52,
                        height: 52,
                        objectFit: "contain",
                        borderRadius: 10,
                        background: "#111116",
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <strong
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.name}
                      </strong>
                      <span
                        className="muted"
                        style={{ display: "block", marginTop: 2, fontSize: 12 }}
                      >
                        {product.team} · {PRODUCT_TYPE_LABELS[product.type]}
                      </span>
                    </div>

                    <strong style={{ color: "var(--purple-2)" }}>
                      {product.price.toFixed(2).replace(".", ",")} €
                    </strong>
                  </Link>
                ))
              ) : (
                <div style={{ padding: 18 }}>
                  <strong>No encontramos coincidencias</strong>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    Prueba con otro equipo, temporada o tipo.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(210px,100%),1fr))",
            gap: 14,
          }}
        >
          <FilterSelect
            id="catalog-team"
            label="Equipo"
            value={team}
            onChange={(nextTeam) => {
              setTeam(nextTeam);
              updateUrl(nextTeam, type);
            }}
          >
            <option value="Todos">Todos los equipos</option>
            {teams.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="catalog-type"
            label="Tipo"
            value={type}
            onChange={(nextType) => {
              const safeType = nextType as "Todos" | Product["type"];
              setType(safeType);
              updateUrl(team, safeType);
            }}
          >
            <option value="Todos">Todos los tipos</option>
            {PRODUCT_TYPE_FILTER_OPTIONS
              .filter((option) =>
                ["fan", "player", "retro"].includes(option.value)
              )
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </FilterSelect>

          <FilterSelect
            id="catalog-season"
            label="Temporada"
            value={season}
            onChange={setSeason}
          >
            <option value="Todas">Todas las temporadas</option>
            {seasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="catalog-sort"
            label="Ordenar"
            value={sort}
            onChange={(value) =>
              setSort(value as "relevance" | "price_asc" | "price_desc" | "name")
            }
          >
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="name">Nombre A–Z</option>
          </FilterSelect>
        </div>

        <div
          style={{
            display: "flex",
            gap: 9,
            flexWrap: "wrap",
          }}
        >
          {["Real Madrid", "Barcelona", "España", "Retro", "Player"].map(
            (quickSearch) => (
              <button
                key={quickSearch}
                type="button"
                onClick={() => {
                  if (quickSearch === "Retro") {
                    setType("retro");
                    updateUrl(team, "retro");
                  } else if (quickSearch === "Player") {
                    setType("player");
                    updateUrl(team, "player");
                  } else {
                    setQuery(quickSearch);
                  }
                }}
                style={{
                  padding: "8px 11px",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.035)",
                  color: "#d8d8e0",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {quickSearch}
              </button>
            )
          )}
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
          <strong style={{ fontSize: 18 }}>
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "camiseta" : "camisetas"}
          </strong>

          {filteredProducts.length > 0 && (
            <span
              className="muted"
              style={{ display: "block", marginTop: 4, fontSize: 13 }}
            >
              Organizadas automáticamente por tipo
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
        <>
          {groupedProducts.length > 1 && (
            <nav
              aria-label="Secciones del catálogo"
              style={{
                display: "flex",
                gap: 9,
                flexWrap: "wrap",
                marginTop: 22,
              }}
            >
              {groupedProducts.map((group) => (
                <a
                  key={group.type}
                  href={`#seccion-${group.type}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 12px",
                    border: "1px solid rgba(195,92,255,.18)",
                    borderRadius: 999,
                    background: "rgba(139,44,255,.07)",
                    color: "#e4ccff",
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    fontWeight: 800,
                    letterSpacing: ".03em",
                  }}
                >
                  {group.label}
                  <span
                    style={{
                      color: "var(--muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                    }}
                  >
                    {group.products.length}
                  </span>
                </a>
              ))}
            </nav>
          )}

          <div style={{ display: "grid", gap: 54, marginTop: 28 }}>
            {groupedProducts.map((group) => {
              const limit = sectionLimit(group.type);
              const visible = group.products.slice(0, limit);
              const remaining = group.products.length - visible.length;

              return (
                <section
                  key={group.type}
                  id={`seccion-${group.type}`}
                  style={{ scrollMarginTop: 130 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: 16,
                      flexWrap: "wrap",
                      marginBottom: 18,
                      paddingBottom: 14,
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "#d6a6ff",
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: ".14em",
                        }}
                      >
                        SECCIÓN
                      </span>

                      <h2
                        style={{
                          margin: "4px 0 0",
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(2.2rem,5vw,4rem)",
                          lineHeight: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        {group.label}
                      </h2>
                    </div>

                    <span className="muted" style={{ fontSize: 13 }}>
                      {group.products.length}{" "}
                      {group.products.length === 1 ? "producto" : "productos"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(min(260px,100%),1fr))",
                      gap: 18,
                    }}
                  >
                    {visible.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {remaining > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 22,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => showMoreInSection(group.type)}
                      >
                        VER 12 MÁS DE {group.label.toUpperCase()} · {remaining} RESTANTES
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
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

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} style={{ display: "grid", gap: 8 }}>
      <span
        style={{
          color: "#d8b4ff",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          minHeight: 50,
          padding: "13px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.09)",
          background: "#0d0d12",
          color: "white",
          fontSize: 15,
        }}
      >
        {children}
      </select>
    </label>
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
        left: 17,
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
