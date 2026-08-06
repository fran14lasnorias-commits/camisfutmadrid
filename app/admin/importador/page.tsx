import { requireAdmin } from "@/lib/auth";
import { ImportReview } from "@/components/import-review";
import { YupooCatalogImporter } from "@/components/yupoo-catalog-importer";

export default async function ImporterPage() {
  await requireAdmin();

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        IMPORTADOR
      </span>

      <h1 style={{ marginBottom: 8 }}>Importar productos</h1>

      <p className="muted" style={{ lineHeight: 1.65, maxWidth: 780 }}>
        Puedes preparar una camiseta desde un álbum concreto o revisar una
        página completa del catálogo del proveedor. Nada se publica
        automáticamente.
      </p>

      <section style={{ marginTop: 28 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            IMPORTACIÓN INDIVIDUAL
          </span>
          <h2 style={{ margin: "5px 0 0" }}>
            Un álbum de Yupoo
          </h2>
        </div>

        <ImportReview />
      </section>

      <div
        style={{
          height: 1,
          margin: "42px 0",
          background: "var(--border)",
        }}
      />

      <section>
        <div style={{ marginBottom: 16 }}>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            IMPORTACIÓN MASIVA
          </span>
          <h2 style={{ margin: "5px 0 0" }}>
            Una página completa del catálogo
          </h2>
        </div>

        <YupooCatalogImporter />
      </section>
    </main>
  );
}
