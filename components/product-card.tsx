"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { useFavorites } from "@/components/favorites-provider";
import { PRODUCT_TYPE_BADGES } from "@/lib/product-types";

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();

  const primaryImage = product.images[0] || "/placeholder-shirt.svg";
  const secondaryImage = product.images[1] || primaryImage;
  const activeImage = hovered ? secondaryImage : primaryImage;
  const badge = PRODUCT_TYPE_BADGES[product.type];
  const favorite = hydrated && isFavorite(product.id);

  return (
    <article
      className="card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        transition:
          "transform 220ms cubic-bezier(.2,.8,.2,1), border-color 220ms ease, box-shadow 220ms ease",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        borderColor: hovered
          ? "rgba(195,92,255,.34)"
          : "var(--border)",
        boxShadow: hovered
          ? "0 26px 70px rgba(0,0,0,.34), 0 0 30px rgba(139,44,255,.08)"
          : "none",
        background:
          "linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--surface)",
      }}
    >
      <button
        type="button"
        aria-label={
          favorite
            ? `Quitar ${product.name} de favoritos`
            : `Añadir ${product.name} a favoritos`
        }
        aria-pressed={favorite}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(product.id);
        }}
        style={{
          position: "absolute",
          top: 13,
          right: 13,
          zIndex: 8,
          display: "grid",
          width: 42,
          height: 42,
          placeItems: "center",
          padding: 0,
          border: favorite
            ? "1px solid rgba(255,103,151,.40)"
            : "1px solid rgba(255,255,255,.12)",
          borderRadius: "50%",
          background: favorite
            ? "rgba(255,70,130,.16)"
            : "rgba(8,8,12,.68)",
          color: favorite ? "#ff6f9d" : "#ffffff",
          backdropFilter: "blur(12px)",
          boxShadow: favorite
            ? "0 8px 24px rgba(255,70,130,.18)"
            : "0 8px 20px rgba(0,0,0,.22)",
          cursor: "pointer",
          transition:
            "transform 160ms ease, background 160ms ease, color 160ms ease",
        }}
      >
        <HeartIcon filled={favorite} />
      </button>

      <Link
        href={`/producto/${product.slug}`}
        aria-label={`Ver ${product.name}`}
        style={{ display: "block", color: "inherit" }}
      >
        <div
          style={{
            position: "relative",
            height: 320,
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 42%,rgba(139,44,255,.28),transparent 48%),#15151d",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 3,
              display: "inline-flex",
              alignItems: "center",
              minHeight: 28,
              padding: "6px 9px",
              borderRadius: 999,
              border: `1px solid ${badge.border}`,
              background: badge.background,
              color: badge.color,
              fontFamily: "var(--font-display)",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: ".08em",
              backdropFilter: "blur(12px)",
            }}
          >
            {badge.label}
          </span>

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "auto 18% 8% 18%",
              height: 28,
              borderRadius: "50%",
              background: "rgba(0,0,0,.42)",
              filter: "blur(18px)",
              opacity: hovered ? 0.78 : 0.54,
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "opacity 220ms ease, transform 220ms ease",
            }}
          />

          {imageFailed ? (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: "78%",
                height: "78%",
                border: "1px dashed rgba(255,255,255,.12)",
                borderRadius: 18,
                color: "var(--muted)",
                textAlign: "center",
                padding: 18,
              }}
            >
              Imagen no disponible
            </div>
          ) : (
            <img
              src={activeImage}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              style={{
                position: "relative",
                zIndex: 2,
                width: "88%",
                height: "88%",
                objectFit: "contain",
                transform: hovered
                  ? "translateY(-7px) scale(1.055)"
                  : "translateY(0) scale(1)",
                filter: hovered
                  ? "drop-shadow(0 32px 28px rgba(0,0,0,.68)) drop-shadow(0 0 18px rgba(195,92,255,.10))"
                  : "drop-shadow(0 25px 24px rgba(0,0,0,.58))",
                transition:
                  "transform 360ms cubic-bezier(.2,.8,.2,1), filter 260ms ease, opacity 180ms ease",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 14,
              zIndex: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              border: "1px solid rgba(255,255,255,.09)",
              borderRadius: 13,
              background: "rgba(8,8,12,.76)",
              backdropFilter: "blur(14px)",
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(8px)",
              transition:
                "opacity 180ms ease, transform 220ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <span
              style={{
                color: "white",
                fontFamily: "var(--font-display)",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: ".04em",
              }}
            >
              VER CAMISETA
            </span>

            <span
              style={{
                color: "var(--purple-2)",
                fontSize: 19,
                fontWeight: 900,
              }}
            >
              →
            </span>
          </div>
        </div>

        <div style={{ padding: "18px 18px 20px" }}>
          <span
            style={{
              display: "block",
              marginBottom: 7,
              color: "#d6a6ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            {product.team}
            {product.season ? ` · ${product.season}` : ""}
          </span>

          <h3
            style={{
              minHeight: 54,
              margin: 0,
              fontFamily: "var(--font-body)",
              fontSize: 17,
              fontWeight: 800,
              lineHeight: 1.42,
              letterSpacing: "-.01em",
              textTransform: "none",
            }}
          >
            {product.name}
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 14,
              marginTop: 17,
            }}
          >
            <div>
              <span
                className="muted"
                style={{
                  display: "block",
                  marginBottom: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Desde
              </span>

              <strong
                style={{
                  color: "var(--purple-2)",
                  fontFamily: "var(--font-display)",
                  fontSize: 27,
                  lineHeight: 1,
                }}
              >
                {product.price.toFixed(2).replace(".", ",")} €
              </strong>
            </div>

            <span
              style={{
                display: "inline-flex",
                minHeight: 38,
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 12px",
                border: "1px solid rgba(195,92,255,.22)",
                borderRadius: 11,
                background: "rgba(139,44,255,.08)",
                color: "#e6ccff",
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: ".04em",
              }}
            >
              VER
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
