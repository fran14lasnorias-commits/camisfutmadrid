"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "covers" | "all";

type Status = {
  running: boolean;
  mode: Mode;
  initial: number;
  pending: number;
  migrated: number;
  failed: number;
  message: string;
};

const initialStatus: Status = {
  running: false,
  mode: "covers",
  initial: 0,
  pending: 0,
  migrated: 0,
  failed: 0,
  message: "",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ImageMigrationPanel() {
  const [status, setStatus] = useState<Status>(initialStatus);
  const stopRef = useRef(false);

  useEffect(() => {
    return () => {
      stopRef.current = true;
    };
  }, []);

  async function readPending(mode: Mode) {
    const response = await fetch(
      `/api/admin/images/migrate?mode=${mode}`,
      { cache: "no-store" }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "No se pudo consultar el progreso.");
    }

    return Number(data.pending ?? 0);
  }

  async function start(mode: Mode) {
    if (status.running) return;

    stopRef.current = false;

    try {
      const initial = await readPending(mode);

      setStatus({
        running: true,
        mode,
        initial,
        pending: initial,
        migrated: 0,
        failed: 0,
        message:
          mode === "covers"
            ? "Migrando portadas para acelerar home y catálogo..."
            : "Migrando galerías completas a Supabase Storage...",
      });

      if (initial === 0) {
        setStatus((current) => ({
          ...current,
          running: false,
          pending: 0,
          message: "No quedan imágenes pendientes en este modo.",
        }));
        return;
      }

      let migratedTotal = 0;
      let failedTotal = 0;

      while (!stopRef.current) {
        let response: Response | null = null;
        let data: any = null;
        let lastError = "";

        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            response = await fetch("/api/admin/images/migrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mode }),
            });

            data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(
                data.error ?? `La API respondió ${response.status}.`
              );
            }

            lastError = "";
            break;
          } catch (error) {
            lastError =
              error instanceof Error
                ? error.message
                : "La petición se cortó.";

            if (attempt < 3) {
              await sleep(attempt * 1500);
            }
          }
        }

        if (lastError || !data) {
          throw new Error(lastError || "La migración se interrumpió.");
        }

        migratedTotal += Number(data.migrated ?? 0);
        failedTotal += Number(data.failed ?? 0);
        const pending = Number(data.pending ?? 0);

        setStatus((current) => ({
          ...current,
          pending,
          migrated: migratedTotal,
          failed: failedTotal,
          message:
            mode === "covers"
              ? `Portadas: ${pending.toLocaleString("es-ES")} pendientes`
              : `Galerías: ${pending.toLocaleString("es-ES")} imágenes pendientes`,
        }));

        if (data.done || pending === 0) {
          setStatus((current) => ({
            ...current,
            running: false,
            pending: 0,
            message:
              mode === "covers"
                ? "PORTADAS TERMINADAS. Home y catálogo ya no dependen de Yupoo."
                : "MIGRACIÓN COMPLETA. Todas las galerías están en Supabase Storage.",
          }));
          return;
        }

        // Si todo un lote falla, damos más margen para no machacar Yupoo/Vercel.
        if (Number(data.migrated ?? 0) === 0) {
          await sleep(4000);
        } else {
          await sleep(500);
        }
      }

      setStatus((current) => ({
        ...current,
        running: false,
        message: "Migración pausada. Lo ya migrado se conserva.",
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        running: false,
        message:
          error instanceof Error
            ? `Error: ${error.message}`
            : "La migración se detuvo.",
      }));
    }
  }

  function stop() {
    stopRef.current = true;
  }

  const completed =
    status.initial > 0
      ? Math.max(0, status.initial - status.pending)
      : 0;

  const percent =
    status.initial > 0
      ? Math.min(100, Math.round((completed / status.initial) * 100))
      : 0;

  return (
    <section
      className="card"
      style={{
        padding: 24,
        display: "grid",
        gap: 18,
        maxWidth: 920,
      }}
    >
      <div>
        <span style={{ color: "#d6a6ff", fontWeight: 900 }}>
          ACELERAR TIENDA
        </span>
        <h1 style={{ margin: "6px 0 8px" }}>
          Mover imágenes a Supabase Storage
        </h1>
        <p className="muted" style={{ lineHeight: 1.65, margin: 0 }}>
          Primero mueve las portadas para que home y catálogo dejen de
          depender del proxy de Yupoo. Después mueve todas las galerías.
          Puedes pausar y continuar sin perder lo ya hecho.
        </p>
      </div>

      <div
        style={{
          height: 14,
          borderRadius: 999,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background:
              "linear-gradient(90deg,#7c2cff,#c45cff)",
            transition: "width .25s ease",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 12,
        }}
      >
        {[
          ["Progreso", `${percent}%`],
          ["Pendientes", status.pending.toLocaleString("es-ES")],
          ["Migradas sesión", status.migrated.toLocaleString("es-ES")],
          ["Fallos sesión", status.failed.toLocaleString("es-ES")],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "rgba(255,255,255,.025)",
            }}
          >
            <div className="muted" style={{ fontSize: 13 }}>
              {label}
            </div>
            <strong style={{ fontSize: 24 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "14px 16px",
          border: "1px solid rgba(112,255,190,.24)",
          borderRadius: 14,
          color: "#70ffbe",
          minHeight: 50,
        }}
      >
        {status.message || "Elige primero PORTADAS."}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-primary"
          disabled={status.running}
          onClick={() => start("covers")}
        >
          1 · MIGRAR PORTADAS
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={status.running}
          onClick={() => start("all")}
        >
          2 · MIGRAR TODAS LAS GALERÍAS
        </button>

        {status.running && (
          <button
            type="button"
            className="btn-secondary"
            onClick={stop}
          >
            PAUSAR
          </button>
        )}
      </div>

      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        No cierres esta pestaña mientras esté migrando. La tienda puede
        seguir utilizándose y las imágenes ya migradas quedan guardadas.
      </p>
    </section>
  );
}
