"use client";

import { useEffect, useMemo, useState } from "react";

function getNextSundayEnd() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
  const daysUntilSunday = day === 0 ? 0 : 7 - day;

  const end = new Date(now);
  end.setDate(now.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);

  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 7);
  }

  return end;
}

function diffParts(target: Date) {
  const now = new Date();
  const total = Math.max(0, target.getTime() - now.getTime());

  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1_000);

  return { days, hours, minutes, seconds };
}

export function WeeklyCountdown() {
  const target = useMemo(() => getNextSundayEnd(), []);
  const [time, setTime] = useState(() => diffParts(target));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(diffParts(target));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [target]);

  const blocks = [
    ["DÍAS", time.days],
    ["HORAS", time.hours],
    ["MIN", time.minutes],
    ["SEG", time.seconds],
  ] as const;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 8,
        width: "min(100%,520px)",
      }}
      aria-label="Tiempo restante de la selección semanal"
    >
      {blocks.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 86,
            padding: "12px 8px",
            border: "1px solid rgba(195,92,255,.20)",
            borderRadius: 15,
            background: "rgba(8,8,12,.62)",
            backdropFilter: "blur(12px)",
          }}
        >
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.7rem,5vw,2.8rem)",
              lineHeight: 1,
            }}
          >
            {String(value).padStart(2, "0")}
          </strong>
          <span
            style={{
              marginTop: 7,
              color: "#d8b4ff",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: ".12em",
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
