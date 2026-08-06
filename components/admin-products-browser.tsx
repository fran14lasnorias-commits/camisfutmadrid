"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminProductEditor } from "@/components/admin-product-editor";
import {
  bulkDeleteProducts,
  bulkSetProductsPublished,
} from "@/app/admin/productos/actions";

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
  const [selected, setSelected] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  const visibleIds = filteredProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.includes(id));

  function toggleProduct(productId: string) {
    setSelected((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function toggleVisibleProducts() {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function runPublishAction(published: boolean) {
    if (!selected.length || isPending) return;

    setActionMessage("");

    startTransition(async () => {
      try {
        const result = await bulkSetProductsPublished(selected, published);
        setActionMessage(
          published
            ? `${result.updated} productos publicados correctamente.`
            : `${result.updated} productos enviados a borrador.`
        );
        setSelected([]);
        router.refresh();
      } catch (error) {
        setActionMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron actualizar los productos."
        );
      }
    });
  }

  function runDeleteAction() {
    if (!selected.length || isPending) return;

    const confirmed = window.confirm(
      `Vas a eliminar ${selected.length} productos. Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setActionMessage("");

    startTransition(async () => {
      try {
        const result = await bulkDeleteProducts(selected);
        setActionMessage(
          `${result.deleted} productos eliminados correctamente.`
        );
        setSelected([]);
        router.refresh();
      } catch (error) {
        setActionMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron eliminar los productos."
        );
      }
    });
  }


  function clearFilters() {
    setQuery("");
    setStatus("all");
    setType("all");
    setSort("newest");
    setSelected([]);
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

        <div style={{ textAlign: "right" }}>
          <strong>
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "resultado" : "resultados"}
          </strong>
          <span className="muted" style={{ display: "block", marginTop: 4 }}>
            {selected.length} seleccionados
          </span>
        </div>
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

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
          padding: 16,
          marginTop: 14,
          border: selected.length
            ? "1px solid rgba(163,53,255,.45)"
            : "1px solid var(--border)",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            fontWeight: 800,
            cursor: visibleIds.length ? "pointer" : "default",
          }}
        >
          <input
            type="checkbox"
            checked={allVisibleSelected}
            disabled={!visibleIds.length || isPending}
            onChange={toggleVisibleProducts}
          />
          Seleccionar resultados visibles
        </label>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-primary"
            disabled={!selected.length || isPending}
            onClick={() => runPublishAction(true)}
          >
            {isPending ? "PROCESANDO..." : "PUBLICAR"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={!selected.length || isPending}
            onClick={() => runPublishAction(false)}
          >
            PASAR A BORRADOR
          </button>

          <button
            type="button"
            disabled={!selected.length || isPending}
            onClick={runDeleteAction}
            style={{
              padding: "11px 15px",
              borderRadius: 10,
              border: "1px solid rgba(255,80,105,.45)",
              background: "rgba(255,80,105,.10)",
              color: "#ff9aaa",
              fontWeight: 900,
              cursor:
                !selected.length || isPending ? "not-allowed" : "pointer",
            }}
          >
            ELIMINAR
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="card"
          style={{
            padding: 14,
            marginTop: 12,
            color: "#d6a6ff",
            border: "1px solid rgba(163,53,255,.35)",
          }}
        >
          {actionMessage}
        </div>
      )}

      {!filteredProducts.length ? (
        <div className="card" style={{ padding: 24, marginTop: 14 }}>
          <strong>No se han encontrado productos.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Prueba con otro nombre o limpia los filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {filteredProducts.map((product) => {
            const checked = selected.includes(product.id);

            return (
              <div
                key={product.id}
                style={{
                  position: "relative",
                  paddingLeft: 42,
                  borderRadius: 16,
                  outline: checked
                    ? "2px solid rgba(163,53,255,.65)"
                    : "none",
                  outlineOffset: 2,
                }}
              >
                <label
                  aria-label={`Seleccionar ${product.name}`}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 28,
                    zIndex: 2,
                    display: "grid",
                    width: 24,
                    height: 24,
                    placeItems: "center",
                    borderRadius: 7,
                    background: "#111118",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isPending}
                    onChange={() => toggleProduct(product.id)}
                  />
                </label>

                <AdminProductEditor product={product} />
              </div>
            );
          })}
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
