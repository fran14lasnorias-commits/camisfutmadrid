import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "CamisfutMadrid · Camisetas de fútbol premium y personalizadas";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.camisfutmadrid.com"
).replace(/\/$/, "");

export default function OpenGraphImage() {
  const logoUrl = `${SITE_URL}/logo-camisfut.png`;

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
            width: "72%",
            padding: "58px 0 58px 66px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 31,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            CAMISFUT
            <span style={{ color: "#c45cff" }}>MADRID</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(160, 54, 255, .20)",
                border: "1px solid rgba(199, 111, 255, .45)",
                color: "#e2b9ff",
                fontSize: 19,
                fontWeight: 800,
              }}
            >
              NUEVA TEMPORADA 2026/27
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 22,
                fontSize: 66,
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
                marginTop: 22,
                color: "#c9c9d3",
                fontSize: 24,
                lineHeight: 1.35,
              }}
            >
              Personalización · Pago seguro · Entrega en Madrid
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 21,
            }}
          >
            <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
              camisfutmadrid.com
            </span>

            <span
              style={{
                padding: "11px 18px",
                borderRadius: 12,
                background: "#a335ff",
                fontWeight: 900,
              }}
            >
              VER CATÁLOGO →
            </span>
          </div>
        </div>

        <div
          style={{
            width: "28%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 54,
          }}
        >
          <div
            style={{
              width: 300,
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "rgba(10, 10, 15, .78)",
              border: "3px solid rgba(196, 92, 255, .65)",
              boxShadow: "0 30px 70px rgba(0,0,0,.55)",
            }}
          >
            <img
              src={logoUrl}
              alt="Logo oficial de CamisfutMadrid"
              width="260"
              height="260"
              style={{
                width: 260,
                height: 260,
                objectFit: "contain",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size
  );
}
