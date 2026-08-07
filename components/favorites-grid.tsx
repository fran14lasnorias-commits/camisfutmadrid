"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useFavorites } from "@/components/favorites-provider";
import type { Product } from "@/lib/products";

export function FavoritesGrid({
  products,
}: {
  products: Product[];
}) {
  const {
    favoriteIds,
    favoriteCount,
    hydrated,
    clearFavorites,
  } = useFavorites();

  const favorites = products.filter((product) =>
    favoriteIds.includes(product.id)
  );

  if (!hydrated) {
    return (
      <div className="card" style={{ padding: 28 }}>
        <span className="muted">Cargando tus favoritos…</span>
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <div
        className="card"
        style={{
          display: "grid",
          justifyItems: "start",
          gap: 12,
          padding: "clamp(24px,6vw,46px)",
          background:
            "radial-gradient(circle at 15% 0%,rgba(139,44,255,.14),transparent 24rem),var(--surface)",
        }}
      >
        <span style={{ fontSize: 36 }}>♡</span>

        <h2 style={{ margin: 0, fontSize: "clamp(2rem,6vw,4rem)" }}>
          TODAVÍA NO HAS GUARDADO NINGUNA
        </h2>

        <p className="muted" style={{ maxWidth: 570, margin: 0 }}>
          Pulsa el corazón de cualquier camiseta para guardarla aquí y volver a
          verla cuando quieras.
        </p>

        <Link href="/catalogo" className="btn-primary" style={{ marginTop: 8 }}>
          VER CATÁLOGO
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <strong style={{ fontSize: 18 }}>
            {favoriteCount} {favoriteCount === 1 ? "favorito" : "favoritos"}
          </strong>
          <span className="muted" style={{ display: "block", marginTop: 3 }}>
            Guardados en este dispositivo.
          </span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={clearFavorites}
        >
          VACIAR FAVORITOS
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(260px,100%),1fr))",
          gap: 18,
        }}
      >
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
