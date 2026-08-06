import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "CamisfutMadrid · Camisetas de fútbol premium y personalizadas";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 78% 35%, #7c20d5 0%, #30104f 25%, #09090d 58%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            right: -80,
            top: 40,
            borderRadius: 999,
            border: "2px solid rgba(197, 92, 255, .42)",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            right: 10,
            top: 110,
            borderRadius: 999,
            border: "2px solid rgba(255, 255, 255, .16)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            CAMISFUT
            <span style={{ color: "#c45cff" }}>MADRID</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 760 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(160, 54, 255, .20)",
                border: "1px solid rgba(199, 111, 255, .45)",
                color: "#e2b9ff",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              NUEVA TEMPORADA 2026/27
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 24,
                fontSize: 70,
                lineHeight: 0.98,
                fontWeight: 900,
                letterSpacing: -4,
              }}
            >
              CAMISETAS DE FÚTBOL
              <span style={{ color: "#c45cff" }}>PREMIUM</span>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 24,
                color: "#c9c9d3",
                fontSize: 26,
                lineHeight: 1.35,
              }}
            >
              Personalización · Pago seguro · Entrega en Madrid
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 22,
            }}
          >
            <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
              camisfutmadrid.com
            </span>

            <span
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#a335ff",
                fontWeight: 900,
              }}
            >
              VER CATÁLOGO →
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
