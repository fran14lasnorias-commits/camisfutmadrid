import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guía de tallas",
  description:
    "Consulta cómo elegir la talla correcta de tu camiseta de fútbol en CamisfutMadrid.",
  alternates: {
    canonical: "/guia-tallas",
  },
};

const adultSizes = [
  { size: "S", width: "50–52 cm", length: "69–71 cm" },
  { size: "M", width: "52–54 cm", length: "71–73 cm" },
  { size: "L", width: "54–56 cm", length: "73–75 cm" },
  { size: "XL", width: "56–58 cm", length: "75–77 cm" },
  { size: "2XL", width: "58–61 cm", length: "77–79 cm" },
  { size: "3XL", width: "61–64 cm", length: "79–81 cm" },
  { size: "4XL", width: "64–67 cm", length: "81–83 cm" },
];

export default function SizeGuidePage() {
  return (
    <main
      className="container"
      style={{ padding: "50px 0 90px", maxWidth: 980 }}
    >
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        ENCUENTRA TU TALLA
      </span>

      <h1 style={{ marginBottom: 8 }}>Guía de tallas</h1>

      <p className="muted" style={{ lineHeight: 1.7, maxWidth: 760 }}>
        La forma más fiable de elegir talla es medir una camiseta que ya te
        quede bien y comparar las medidas. Las cifras de esta guía son
        orientativas y pueden variar ligeramente según el modelo.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
          marginTop: 26,
        }}
      >
        <article className="card" style={{ padding: 22 }}>
          <span style={numberStyle}>1</span>
          <h2>Mide el ancho</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Coloca una camiseta plana y mide de axila a axila, sin estirar la
            tela.
          </p>
        </article>

        <article className="card" style={{ padding: 22 }}>
          <span style={numberStyle}>2</span>
          <h2>Mide el largo</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Mide desde la parte más alta del hombro hasta el borde inferior.
          </p>
        </article>

        <article className="card" style={{ padding: 22 }}>
          <span style={numberStyle}>3</span>
          <h2>Compara</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Compara tus medidas con la tabla y elige la talla más cercana.
          </p>
        </article>
      </section>

      <section className="card" style={{ padding: 24, marginTop: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Camisetas fan y retro</h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Corte normal. Elige tu talla habitual en la mayoría de los casos.
            </p>
          </div>

          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#25103e",
              color: "#d6a6ff",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            MEDIDAS ORIENTATIVAS
          </span>
        </div>

        <div style={{ overflowX: "auto", marginTop: 20 }}>
          <table
            style={{
              width: "100%",
              minWidth: 560,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={headerCell}>Talla</th>
                <th style={headerCell}>Ancho de pecho</th>
                <th style={headerCell}>Largo</th>
              </tr>
            </thead>

            <tbody>
              {adultSizes.map((item) => (
                <tr key={item.size}>
                  <td style={bodyCell}>
                    <strong>{item.size}</strong>
                  </td>
                  <td style={bodyCell}>{item.width}</td>
                  <td style={bodyCell}>{item.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
          marginTop: 22,
        }}
      >
        <article className="card" style={{ padding: 22 }}>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            VERSIÓN PLAYER
          </span>
          <h2>Corte más ajustado</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Las camisetas player suelen ser más ceñidas. Si estás entre dos
            tallas o prefieres un ajuste cómodo, elige una talla superior.
          </p>
        </article>

        <article className="card" style={{ padding: 22 }}>
          <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
            CAMISETAS INFANTILES
          </span>
          <h2>Comprueba la altura</h2>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            En modelos infantiles, revisa la altura del niño y la talla que
            aparece en la ficha del producto. Si está entre dos tallas, suele
            ser mejor elegir la mayor.
          </p>
        </article>
      </section>

      <section
        className="card"
        style={{
          padding: 24,
          marginTop: 22,
          border: "1px solid rgba(163,53,255,.35)",
          background:
            "linear-gradient(135deg,rgba(163,53,255,.12),rgba(13,13,18,.96))",
        }}
      >
        <h2 style={{ marginTop: 0 }}>¿Sigues teniendo dudas?</h2>
        <p className="muted" style={{ lineHeight: 1.65 }}>
          Escríbenos indicando tu altura, peso, modelo y cómo te gusta llevar
          la camiseta. Te ayudaremos a escoger.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/contacto" className="btn-primary">
            CONSULTAR TALLA
          </Link>
          <Link href="/catalogo" className="btn-secondary">
            VOLVER AL CATÁLOGO
          </Link>
        </div>
      </section>
    </main>
  );
}

const numberStyle = {
  display: "grid",
  width: 38,
  height: 38,
  placeItems: "center",
  borderRadius: 999,
  background: "#a335ff",
  color: "white",
  fontWeight: 900,
};

const headerCell = {
  padding: 14,
  textAlign: "left" as const,
  borderBottom: "1px solid var(--border)",
  color: "#d6a6ff",
};

const bodyCell = {
  padding: 14,
  borderBottom: "1px solid var(--border)",
};
