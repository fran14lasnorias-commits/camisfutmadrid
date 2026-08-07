"use client";

import { useEffect, useRef, useState } from "react";

type VirtualTryOnProps = {
  imageUrl: string;
  productName: string;
};

type CameraFacing = "user" | "environment";

export function VirtualTryOn({
  imageUrl,
  productName,
}: VirtualTryOnProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<CameraFacing>("user");

  const [width, setWidth] = useState(66);
  const [height, setHeight] = useState(62);
  const [top, setTop] = useState(25);
  const [left, setLeft] = useState(50);
  const [opacity, setOpacity] = useState(0.9);

  async function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startCamera(mode: CameraFacing = facingMode) {
    setLoading(true);
    setCameraError("");

    try {
      await stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador no permite usar la cámara.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Debes permitir el acceso a la cámara para usar el probador."
          : error instanceof Error
            ? error.message
            : "No se pudo abrir la cámara.";

      setCameraError(message);
    } finally {
      setLoading(false);
    }
  }

  async function openTryOn() {
    setOpen(true);
  }

  async function closeTryOn() {
    await stopCamera();
    setOpen(false);
    setCameraError("");
  }

  async function switchCamera() {
    const nextMode: CameraFacing =
      facingMode === "user" ? "environment" : "user";

    setFacingMode(nextMode);
    await startCamera(nextMode);
  }

  function resetPosition() {
    setWidth(66);
    setHeight(62);
    setTop(25);
    setLeft(50);
    setOpacity(0.9);
  }

  useEffect(() => {
    if (!open) return;

    void startCamera();

    return () => {
      void stopCamera();
    };
    // La cámara solo se inicia al abrir el probador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={openTryOn}
        style={{
          width: "100%",
          marginTop: 10,
          borderColor: "rgba(190,92,255,.55)",
          color: "#e7c3ff",
        }}
      >
        📷 PRUÉBATELA CON TU CÁMARA
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Probador virtual de ${productName}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            gridTemplateRows: "auto minmax(0,1fr) auto",
            background: "#050507",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "rgba(9,9,13,.96)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block" }}>Probador virtual</strong>
              <span
                className="muted"
                style={{
                  display: "block",
                  maxWidth: 520,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                }}
              >
                {productName}
              </span>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={closeTryOn}
            >
              CERRAR
            </button>
          </header>

          <div
            style={{
              position: "relative",
              minHeight: 0,
              overflow: "hidden",
              background:
                "radial-gradient(circle at center, #252534 0%, #09090d 65%)",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />

            {!cameraError && (
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  zIndex: 2,
                  top: `${top}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                  objectFit: "contain",
                  transform: "translate(-50%, 0)",
                  opacity,
                  pointerEvents: "none",
                  userSelect: "none",
                  filter: "drop-shadow(0 10px 20px rgba(0,0,0,.28))",
                }}
              />
            )}

            {loading && (
              <div style={messageOverlayStyle}>ABRIENDO CÁMARA…</div>
            )}

            {cameraError && (
              <div style={messageOverlayStyle}>
                <strong>No se pudo abrir la cámara</strong>
                <span style={{ marginTop: 8 }}>{cameraError}</span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => startCamera()}
                  style={{ marginTop: 16 }}
                >
                  VOLVER A INTENTAR
                </button>
              </div>
            )}

            {!loading && !cameraError && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 14,
                  zIndex: 3,
                  transform: "translateX(-50%)",
                  padding: "8px 11px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,.62)",
                  color: "white",
                  fontSize: 12,
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                Colócate de frente y ajusta la camiseta
              </div>
            )}
          </div>

          <section
            style={{
              maxHeight: "42vh",
              overflowY: "auto",
              padding: 14,
              borderTop: "1px solid var(--border)",
              background: "#0b0b10",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: 12,
              }}
            >
              <Control
                label="Anchura"
                value={width}
                min={30}
                max={100}
                onChange={setWidth}
              />
              <Control
                label="Altura"
                value={height}
                min={30}
                max={100}
                onChange={setHeight}
              />
              <Control
                label="Arriba / abajo"
                value={top}
                min={0}
                max={60}
                onChange={setTop}
              />
              <Control
                label="Izquierda / derecha"
                value={left}
                min={15}
                max={85}
                onChange={setLeft}
              />
              <Control
                label="Transparencia"
                value={Math.round(opacity * 100)}
                min={35}
                max={100}
                onChange={(value) => setOpacity(value / 100)}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={switchCamera}
                disabled={loading}
              >
                CAMBIAR CÁMARA
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={resetPosition}
              >
                CENTRAR CAMISETA
              </button>
            </div>

            <p
              className="muted"
              style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.5 }}
            >
              La imagen de la cámara se procesa únicamente en este dispositivo.
              CamisfutMadrid no guarda ni sube el vídeo.
            </p>
          </section>
        </div>
      )}
    </>
  );
}

function Control({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        padding: 11,
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "#101016",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 800 }}>
        {label}: {value}
      </span>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}

const messageOverlayStyle = {
  position: "absolute" as const,
  inset: 0,
  zIndex: 4,
  display: "grid",
  placeContent: "center",
  justifyItems: "center",
  padding: 24,
  background: "rgba(5,5,7,.86)",
  color: "white",
  textAlign: "center" as const,
};
