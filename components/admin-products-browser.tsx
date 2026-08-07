"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
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
  original_price_eur: number | null;
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
  shorts: "Pantalón",
  socks: "Medias",
  training: "Entrenamiento",
};

const ALL_TYPES = [
  "fan",
  "player",
  "retro",
  "kids",
  "adult_kit",
  "polo",
  "shorts",
  "socks",
  "training",
];

type StatusFilter = "all" | "draft" | "published";
type SortMode = "newest" | "name" | "team";

type Props = {
  products: AdminProduct[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  initialQuery: string;
  initialStatus: StatusFilter;
  initialType: string;
  initialSort: SortMode;
};

export function AdminProductsBrowser({
  products,
  total,
  page,
  totalPages,
  pageSize,
  initialQuery,
  initialStatus,
  initialType,
  initialSort,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState<SortMode>(initialSort);
  const [selected, setSelected] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const visibleIds = useMemo(() => products.map((product) => product.id), [products]);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.includes(id));

  function buildUrl(nextPage = 1) {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (sort !== "newest") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));

    const qs = params.toString();
    return qs ? `/admin/productos?${qs}` : "/admin/productos";
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelected([]);
    startTransition(() => {
      router.push(buildUrl(1));
    });
  }

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setType("all");
    setSort("newest");
    setSelected([]);
    startTransition(() => router.push("/admin/productos"));
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || isPending) return;
    setSelected([]);
    startTransition(() => {
      router.push(buildUrl(nextPage));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

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

    if (
      !window.confirm(
        `Vas a eliminar ${selected.length} productos de esta página. Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

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

  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);
  const filtersActive =
    initialQuery !== "" ||
    initialStatus !== "all" ||
    initialType !== "all" ||
    initialSort !== "newest";

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
            Mostrando {firstResult.toLocaleString("es-ES")}–{lastResult.toLocaleString("es-ES")} de{" "}
            {total.toLocaleString("es-ES")}
          </span>
        </div>

        <strong>
          Página {page} de {totalPages}
        </strong>
      </div>

      <form
        onSubmit={submitFilters}
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
            Buscar en todos los productos
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
              {ALL_TYPES.map((item) => (
                <option key={item} value={item}>
                  {TYPE_LABELS[item]}
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
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isPending}
          >
            {isPending ? "CARGANDO..." : "BUSCAR / APLICAR FILTROS"}
          </button>

          {filtersActive && (
            <button
              type="button"
              className="btn-secondary"
              onClick={clearFilters}
              disabled={isPending}
            >
              LIMPIAR FILTROS
            </button>
          )}
        </div>
      </form>

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
          Seleccionar los {products.length} de esta página
        </label>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-primary"
            disabled={!selected.length || isPending}
            onClick={() => runPublishAction(true)}
          >
            PUBLICAR
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

      {!products.length ? (
        <div className="card" style={{ padding: 24, marginTop: 14 }}>
          <strong>No se han encontrado productos.</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Prueba con otra búsqueda o limpia los filtros.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {products.map((product) => {
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
                    left: 13,
                    top: 20,
                    zIndex: 3,
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

      {totalPages > 1 && (
        <nav
          aria-label="Paginación de productos"
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            padding: 16,
            marginTop: 20,
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

          <strong style={{ padding: "0 8px" }}>
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
