import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminProductEditor } from "@/components/admin-product-editor";
import { CleanProductTitlesButton } from "@/components/clean-product-titles-button";
import { cleanProductTitle } from "@/lib/product-title-cleaner";

type ReviewProduct = {
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
  created_at: string | null;
  product_images: { url: string; position: number }[];
  product_variants: { size: string; stock: number }[];
};

type ReviewedProduct = {
  product: ReviewProduct;
  reasons: string[];
  severity: number;
};

const SIZE_PATTERN =
  /\b(?:XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\s*[-–—]\s*(?:XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL)\b/i;

const LONG_CODE_PATTERN = /\d{10,}/;

const SUPPLIER_TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/\bproduction is underway\b/i, "Texto interno del proveedor"],
  [/\bpre[- ]?orders?\b/i, "Texto de preventa del proveedor"],
  [/\bwithout sponsors?\b/i, "Texto del proveedor en el nombre"],
  [/\bsize\s+[smlx\d-]+\b/i, "Tallas incluidas en el nombre"],
  [/\bpre[- ]?match\b/i, "Producto prepartido"],
  [/\btraining\b/i, "Producto de entrenamiento"],
];

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function reviewProduct(
  product: ReviewProduct,
  duplicateNames: Set<string>
): ReviewedProduct | null {
  const reasons: string[] = [];
  let severity = 0;

  const combined = `${product.name} ${product.team}`;

  if (LONG_CODE_PATTERN.test(combined)) {
    reasons.push("Código numérico largo en nombre o equipo");
    severity += 4;
  }

  if (SIZE_PATTERN.test(combined) || /\bS-XXL\b/i.test(combined)) {
    reasons.push("Rango de tallas incluido en el nombre");
    severity += 3;
  }

  for (const [pattern, reason] of SUPPLIER_TEXT_PATTERNS) {
    if (pattern.test(combined)) {
      reasons.push(reason);
      severity += 3;
    }
  }

  if (cleanProductTitle(product.name) !== product.name.trim()) {
    reasons.push("Título susceptible de limpieza automática");
    severity += 3;
  }

  if (product.name.length > 78) {
    reasons.push("Nombre demasiado largo");
    severity += 2;
  }

  if (product.team.length > 48) {
    reasons.push("Equipo demasiado largo o mal identificado");
    severity += 3;
  }

  if (/^\d{2,4}\b/.test(product.team)) {
    reasons.push("El equipo empieza por una temporada o un año");
    severity += 3;
  }

  if (/\b(?:jersey|version|edition|style)\b/i.test(product.team)) {
    reasons.push("El campo Equipo contiene descripción del producto");
    severity += 2;
  }

  if (
    product.season &&
    !/^(?:19|20)\d{2}(?:\/\d{2})?$/.test(product.season.trim())
  ) {
    reasons.push("Temporada con formato incorrecto");
    severity += 2;
  }

  if (!product.product_images?.length) {
    reasons.push("Producto sin fotografía");
    severity += 4;
  }

  const normalized = normalizeName(product.name);

  if (normalized && duplicateNames.has(normalized)) {
    reasons.push("Posible producto duplicado");
    severity += 3;
  }

  if (!product.supplier_url) {
    reasons.push("Sin enlace al proveedor");
    severity += 1;
  }

  if (!reasons.length) return null;

  return {
    product,
    reasons: Array.from(new Set(reasons)),
    severity,
  };
}

export default async function ProductsReviewPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,name,slug,team,season,type,price_eur,supplier_cost_usd,
      description,supplier_url,published,created_at,
      product_images(url,position),
      product_variants(size,stock)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `No se pudieron analizar los productos: ${error.message}`
    );
  }

  const products = (data ?? []) as ReviewProduct[];
  const nameCounts = new Map<string, number>();

  for (const product of products) {
    const normalized = normalizeName(product.name);
    if (!normalized) continue;

    nameCounts.set(normalized, (nameCounts.get(normalized) ?? 0) + 1);
  }

  const duplicateNames = new Set(
    [...nameCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
  );

  const reviewed = products
    .map((product) => reviewProduct(product, duplicateNames))
    .filter((item): item is ReviewedProduct => Boolean(item))
    .sort(
      (a, b) =>
        b.severity - a.severity ||
        a.product.name.localeCompare(b.product.name, "es")
    );

  const publishedIssues = reviewed.filter(
    ({ product }) => product.published
  ).length;

  const withoutImages = reviewed.filter(({ reasons }) =>
    reasons.includes("Producto sin fotografía")
  ).length;

  const duplicates = reviewed.filter(({ reasons }) =>
    reasons.includes("Posible producto duplicado")
  ).length;

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            CONTROL DE CALIDAD
          </span>

          <h1 style={{ marginBottom: 8 }}>Productos por revisar</h1>

          <p className="muted" style={{ maxWidth: 760, lineHeight: 1.65 }}>
            Aquí aparecen productos con nombres sospechosos, códigos del
            proveedor, tallas dentro del título, equipo mal identificado,
            fotografías ausentes o posibles duplicados. Puedes corregir
            automáticamente el texto basura de los títulos sin modificar fotos,
            precios, stock ni variantes.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <CleanProductTitlesButton />

          <Link href="/admin/productos" className="btn-secondary">
            VOLVER A PRODUCTOS
          </Link>
        </div>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 14,
          marginTop: 24,
        }}
      >
        <div className="card" style={{ padding: 18 }}>
          <span className="muted">Productos analizados</span>
          <strong style={metricStyle}>{products.length}</strong>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="muted">Necesitan revisión</span>
          <strong style={metricStyle}>{reviewed.length}</strong>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="muted">Publicados con avisos</span>
          <strong style={metricStyle}>{publishedIssues}</strong>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="muted">Sin fotografía</span>
          <strong style={metricStyle}>{withoutImages}</strong>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <span className="muted">Posibles duplicados</span>
          <strong style={metricStyle}>{duplicates}</strong>
        </div>
      </section>

      {!reviewed.length ? (
        <section
          className="card"
          style={{
            padding: 26,
            marginTop: 24,
            border: "1px solid rgba(61,222,138,.35)",
          }}
        >
          <strong style={{ color: "#8af3b7" }}>
            El catálogo no presenta avisos automáticos.
          </strong>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 16, marginTop: 26 }}>
          {reviewed.map(({ product, reasons, severity }) => (
            <article
              key={product.id}
              style={{
                display: "grid",
                gap: 10,
                padding: 4,
                borderRadius: 18,
                border:
                  severity >= 6
                    ? "1px solid rgba(255,80,105,.48)"
                    : "1px solid rgba(255,184,77,.42)",
                background:
                  severity >= 6
                    ? "rgba(255,80,105,.035)"
                    : "rgba(255,184,77,.025)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  padding: "12px 12px 0",
                }}
              >
                {reasons.map((reason) => (
                  <span
                    key={reason}
                    style={{
                      display: "inline-flex",
                      padding: "6px 9px",
                      borderRadius: 999,
                      border:
                        severity >= 6
                          ? "1px solid rgba(255,80,105,.38)"
                          : "1px solid rgba(255,184,77,.35)",
                      background:
                        severity >= 6
                          ? "rgba(255,80,105,.10)"
                          : "rgba(255,184,77,.10)",
                      color: severity >= 6 ? "#ff9aaa" : "#ffd08a",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>

              <AdminProductEditor product={product as any} />
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

const metricStyle = {
  display: "block",
  marginTop: 7,
  fontSize: 29,
};
