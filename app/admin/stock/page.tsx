import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const LOW_STOCK_LIMIT = 2;

type ProductRow = {
  id: string;
  name: string;
  team: string;
  published: boolean;
  product_variants: {
    size: string;
    stock: number;
  }[];
};

function stockBadge(stock: number) {
  if (stock <= 0) {
    return {
      label: "AGOTADA",
      background: "rgba(255, 80, 105, .12)",
      border: "rgba(255, 80, 105, .40)",
      color: "#ff9aaa",
    };
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return {
      label: `QUEDAN ${stock}`,
      background: "rgba(255, 184, 77, .12)",
      border: "rgba(255, 184, 77, .40)",
      color: "#ffd08a",
    };
  }

  return {
    label: `${stock} DISPONIBLES`,
    background: "rgba(61, 222, 138, .10)",
    border: "rgba(61, 222, 138, .35)",
    color: "#8af3b7",
  };
}

export default async function AdminStockPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      team,
      published,
      product_variants(size,stock)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`No se pudo cargar el stock: ${error.message}`);
  }

  const products = (data ?? []) as ProductRow[];

  const variants = products.flatMap((product) =>
    (product.product_variants ?? []).map((variant) => ({
      ...variant,
      productId: product.id,
      productName: product.name,
      team: product.team,
      published: product.published,
    }))
  );

  const totalUnits = variants.reduce(
    (sum, variant) => sum + Math.max(0, Number(variant.stock)),
    0
  );

  const outOfStock = variants.filter(
    (variant) => Number(variant.stock) <= 0
  ).length;

  const lowStock = variants.filter(
    (variant) =>
      Number(variant.stock) > 0 &&
      Number(variant.stock) <= LOW_STOCK_LIMIT
  ).length;

  const productsNeedingRestock = products.filter((product) =>
    (product.product_variants ?? []).some(
      (variant) => Number(variant.stock) <= LOW_STOCK_LIMIT
    )
  ).length;

  const orderedProducts = [...products].sort((a, b) => {
    const severity = (product: ProductRow) => {
      const stocks = (product.product_variants ?? []).map((variant) =>
        Number(variant.stock)
      );

      if (stocks.some((stock) => stock <= 0)) return 0;
      if (stocks.some((stock) => stock <= LOW_STOCK_LIMIT)) return 1;
      return 2;
    };

    return severity(a) - severity(b) || a.name.localeCompare(b.name, "es");
  });

  const cards = [
    ["Unidades disponibles", String(totalUnits)],
    ["Tallas agotadas", String(outOfStock)],
    ["Tallas con stock bajo", String(lowStock)],
    ["Productos para reponer", String(productsNeedingRestock)],
  ];

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            ADMINISTRACIÓN
          </span>
          <h1 style={{ marginBottom: 8 }}>Control de stock</h1>
          <p className="muted" style={{ margin: 0 }}>
            Se considera stock bajo cuando quedan {LOW_STOCK_LIMIT} unidades o
            menos de una talla.
          </p>
        </div>

        <Link href="/admin/productos" className="btn-primary">
          ACTUALIZAR STOCK
        </Link>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
          gap: 14,
          marginTop: 24,
        }}
      >
        {cards.map(([label, value]) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <span className="muted">{label}</span>
            <strong
              style={{ display: "block", fontSize: 30, marginTop: 8 }}
            >
              {value}
            </strong>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 30 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Stock por producto y talla</h2>
          <span className="muted">{products.length} productos</span>
        </div>

        {!orderedProducts.length ? (
          <div className="card" style={{ padding: 22, marginTop: 16 }}>
            Todavía no hay productos.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            {orderedProducts.map((product) => {
              const productVariants = [...(product.product_variants ?? [])].sort(
                (a, b) =>
                  ["S", "M", "L", "XL", "2XL", "3XL", "4XL"].indexOf(a.size) -
                  ["S", "M", "L", "XL", "2XL", "3XL", "4XL"].indexOf(b.size)
              );

              const productTotal = productVariants.reduce(
                (sum, variant) => sum + Math.max(0, Number(variant.stock)),
                0
              );

              const hasAlert = productVariants.some(
                (variant) => Number(variant.stock) <= LOW_STOCK_LIMIT
              );

              return (
                <article
                  key={product.id}
                  className="card"
                  style={{
                    padding: 18,
                    border: hasAlert
                      ? "1px solid rgba(255, 184, 77, .32)"
                      : "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 18 }}>{product.name}</strong>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {product.team}
                        {!product.published && " · No publicado"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className="muted">Stock total</span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 22,
                          marginTop: 3,
                        }}
                      >
                        {productTotal}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(115px,1fr))",
                      gap: 9,
                      marginTop: 16,
                    }}
                  >
                    {productVariants.map((variant) => {
                      const badge = stockBadge(Number(variant.stock));

                      return (
                        <div
                          key={`${product.id}-${variant.size}`}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            border: `1px solid ${badge.border}`,
                            background: badge.background,
                          }}
                        >
                          <strong style={{ fontSize: 16 }}>
                            Talla {variant.size}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              marginTop: 5,
                              color: badge.color,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
