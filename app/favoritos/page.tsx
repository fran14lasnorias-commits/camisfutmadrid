import type { Metadata } from "next";
import { FavoritesGrid } from "@/components/favorites-grid";
import { getPublishedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Favoritos",
  description:
    "Tus camisetas favoritas guardadas en CamisfutMadrid.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function FavoritesPage() {
  const products = await getPublishedProducts();

  return (
    <main className="container" style={{ padding: "52px 0 90px" }}>
      <span
        style={{
          color: "#d6a6ff",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".14em",
        }}
      >
        TU SELECCIÓN
      </span>

      <h1
        style={{
          margin: "8px 0 10px",
          fontSize: "clamp(3.4rem,9vw,7.4rem)",
        }}
      >
        FAVORITOS
      </h1>

      <p
        className="muted"
        style={{
          maxWidth: 660,
          margin: "0 0 32px",
          fontSize: 17,
          lineHeight: 1.6,
        }}
      >
        Guarda las camisetas que más te gustan y compáralas antes de decidir.
      </p>

      <FavoritesGrid products={products} />
    </main>
  );
}
