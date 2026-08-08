"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Archivo_Black, Barlow_Condensed, Bebas_Neue, Rajdhani } from "next/font/google";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import styles from "./product-configurator.module.css";

const PERSONALIZATION_PRICE_EUR = 4;
const PATCH_PRICE_EUR = 2;

const laligaStyleFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-laliga-style",
  display: "swap",
  preload: false,
});

const premierStyleFont = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-premier-style",
  display: "swap",
  preload: false,
});

const federationStyleFont = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-federation-style",
  display: "swap",
  preload: false,
});

const retroStyleFont = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-retro-style",
  display: "swap",
  preload: false,
});

const letteringFontVariables = [
  laligaStyleFont.variable,
  premierStyleFont.variable,
  federationStyleFont.variable,
  retroStyleFont.variable,
].join(" ");

type LetteringProfile = {
  label: string;
  className: string;
};

const LALIGA_TEAMS = new Set([
  "Real Madrid",
  "Barcelona",
  "Atlético de Madrid",
  "Athletic Club",
  "UD Almería",
]);

const ADIDAS_FEDERATIONS = new Set(["Argentina", "España", "Japón"]);
const NIKE_FEDERATIONS = new Set([
  "Brasil",
  "Estados Unidos",
  "Noruega",
  "Países Bajos",
]);

function letteringProfileFor(product: Product): LetteringProfile {
  if (product.type === "retro") {
    return { label: "estilo retro de su temporada", className: styles.letteringRetro };
  }

  if (product.team === "Chelsea") {
    return { label: "estilo visual Premier League", className: styles.letteringPremier };
  }

  if (LALIGA_TEAMS.has(product.team)) {
    return { label: "estilo visual LALIGA", className: styles.letteringLaliga };
  }

  if (ADIDAS_FEDERATIONS.has(product.team)) {
    return { label: "estilo selección adidas", className: styles.letteringAdidas };
  }

  if (NIKE_FEDERATIONS.has(product.team)) {
    return { label: "estilo selección Nike", className: styles.letteringNike };
  }

  if (product.team === "Portugal") {
    return { label: "estilo selección PUMA", className: styles.letteringPuma };
  }

  return { label: "estilo competición", className: styles.letteringGeneric };
}

const NATIONAL_TEAMS = new Set([
  "Argentina",
  "Brasil",
  "España",
  "Estados Unidos",
  "Japón",
  "Noruega",
  "Países Bajos",
  "Portugal",
]);

function patchOptionsFor(product: Product) {
  const base = [{ value: "", label: "Sin parche" }];

  if (NATIONAL_TEAMS.has(product.team)) {
    return [
      ...base,
      { value: "Mundial 2026", label: "Mundial 2026 (+2 €)" },
      { value: "Clasificatorias", label: "Clasificatorias (+2 €)" },
    ];
  }

  if (product.team === "Chelsea") {
    return [
      ...base,
      { value: "Premier League", label: "Premier League (+2 €)" },
      { value: "Champions", label: "Champions (+2 €)" },
    ];
  }

  return [
    ...base,
    { value: "LaLiga", label: "LaLiga (+2 €)" },
    { value: "Champions", label: "Champions (+2 €)" },
    { value: "Copa del Rey", label: "Copa del Rey (+2 €)" },
  ];
}

function money(value: number) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function sanitizeName(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÜÑÇÀÈÌÒÙÂÊÎÔÛÄËÏÖÜ\- .'']/g, "")
    .slice(0, 12);
}

function supplierSizeExtra(size: string) {
  if (size === "2XL") return 2;
  if (size === "3XL") return 3;
  if (size === "4XL") return 4;
  return 0;
}

export function ProductConfigurator({ product }: { product: Product }) {
  const defaultSize = product.sizes.includes("M")
    ? "M"
    : product.sizes[0] ?? "";

  const [size, setSize] = useState(defaultSize);
  const [personalized, setPersonalized] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [patch, setPatch] = useState("");
  const [view, setView] = useState<"front" | "back">("front");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const { addItem } = useCart();
  const router = useRouter();

  const frontImage = product.images[0] || "/placeholder-shirt.svg";
  const backImage =
    product.images[1] && product.images[1] !== frontImage
      ? product.images[1]
      : null;
  const hasBackImage = Boolean(backImage);
  const activeImage =
    view === "back" && backImage
      ? backImage
      : frontImage;

  const sizeExtra = size === "4XL" ? 2 : 0;
  const personalizationExtra = personalized ? PERSONALIZATION_PRICE_EUR : 0;
  const patchExtra = patch ? PATCH_PRICE_EUR : 0;

  const total = useMemo(
    () => product.price + sizeExtra + personalizationExtra + patchExtra,
    [product.price, sizeExtra, personalizationExtra, patchExtra],
  );

  const previewName = name || "TU NOMBRE";
  const previewNumber = number || "00";
  const patchOptions = useMemo(() => patchOptionsFor(product), [product]);
  const letteringProfile = useMemo(() => letteringProfileFor(product), [product]);

  function togglePersonalization(enabled: boolean) {
    setPersonalized(enabled);
    setError("");

    if (enabled && hasBackImage) {
      setView("back");
    }
  }

  function selectPatch(value: string) {
    setPatch(value);

    if (value && hasBackImage) {
      setView("back");
    }
  }

  function showPreviousImage() {
    if (!hasBackImage) return;
    setView(view === "front" ? "back" : "front");
  }

  function showNextImage() {
    if (!hasBackImage) return;
    setView(view === "front" ? "back" : "front");
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (!hasBackImage || touchStartX.current === null || touchStartY.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Solo cambiamos de foto si el gesto es claramente horizontal.
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
  }

  function addToCart() {
    setError("");

    if (!size) {
      setError("Selecciona una talla antes de continuar.");
      return;
    }

    if (personalized && (!name.trim() || !number.trim())) {
      setError("Completa el nombre y el dorsal para guardar la personalización.");

      if (hasBackImage) {
        setView("back");
      }

      return;
    }

    setAdding(true);

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: frontImage,
      size,
      quantity: 1,
      unitPriceEur: total,
      supplierUnitCostUsd:
        product.costUsd
        + (personalized ? 3 : 0)
        + (patch ? 1 : 0)
        + supplierSizeExtra(size),
      personalizationName: personalized ? name.trim().toUpperCase() : undefined,
      personalizationNumber: personalized ? number : undefined,
      patch: patch || undefined,
    });

    window.setTimeout(() => router.push("/carrito"), 350);
  }

  return (
    <main className={`${styles.page} ${letteringFontVariables}`}>
      <section className={styles.galleryCard} aria-label="Vista previa de la camiseta">
        <div className={styles.previewHeader}>
          <span className={styles.previewBadge}>
            <span className={styles.liveDot} />
            Vista previa en directo
          </span>

          <div className={styles.viewSwitch} role="group" aria-label="Cambiar vista">
            <button
              type="button"
              className={`${styles.viewButton} ${view === "front" ? styles.viewButtonActive : ""}`}
              onClick={() => setView("front")}
              aria-pressed={view === "front"}
            >
              Frontal
            </button>
            {hasBackImage && (
              <button
                type="button"
                className={`${styles.viewButton} ${view === "back" ? styles.viewButtonActive : ""}`}
                onClick={() => setView("back")}
                aria-pressed={view === "back"}
              >
                Trasera
              </button>
            )}
          </div>
        </div>

        <div
            className={styles.previewStage}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ position: "relative", touchAction: "pan-y" }}
          >
          <img
            src={activeImage}
            alt={`${product.name}, vista ${view === "back" ? "trasera" : "frontal"}`}
            className={styles.productImage}
          />

          {hasBackImage && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                aria-label="Ver imagen anterior"
                style={galleryArrowLeft}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNextImage}
                aria-label="Ver imagen siguiente"
                style={galleryArrowRight}
              >
                ›
              </button>
            </>
          )}

          {view === "back" && personalized && (
            <div className={`${styles.personalizationLayer} ${letteringProfile.className}`} aria-hidden="true">
              <span className={styles.playerName}>{previewName}</span>
              <strong className={styles.playerNumber}>{previewNumber}</strong>
            </div>
          )}

          {view === "back" && patch && (
            <span className={styles.patchPreview} aria-hidden="true">
              {patch}
            </span>
          )}
        </div>

        <div className={styles.previewFooter}>
          <div style={{ display: "grid", gap: 7 }}>
            <span>Vista orientativa con {letteringProfile.label}.</span>
            {hasBackImage && (
              <span style={{ color: "#aaa4b5", fontSize: 12 }}>
                En móvil puedes deslizar la camiseta a izquierda o derecha.
              </span>
            )}
            {hasBackImage && (
              <div style={{ display: "flex", gap: 6 }} aria-label="Posición de la galería">
                <span style={view === "front" ? galleryDotActive : galleryDot} />
                <span style={view === "back" ? galleryDotActive : galleryDot} />
              </div>
            )}
          </div>
          <div className={styles.thumbnailRow}>
            <button
              type="button"
              className={`${styles.thumbnail} ${view === "front" ? styles.thumbnailActive : ""}`}
              onClick={() => setView("front")}
              aria-label="Ver parte frontal"
            >
              <img src={frontImage} alt="" />
            </button>
            {backImage && (
              <button
                type="button"
                className={`${styles.thumbnail} ${view === "back" ? styles.thumbnailActive : ""}`}
                onClick={() => setView("back")}
                aria-label="Ver parte trasera"
              >
                <img src={backImage} alt="" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={styles.configCard}>
        <p className={styles.eyebrow}>{product.team}</p>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.meta}>Versión {product.type} · {product.season}</p>

        <div className={styles.priceLine}>
          <strong className={styles.price}>{money(total)}</strong>
          <span className={styles.priceNote}>Precio actualizado<br />en tiempo real</span>
        </div>

        <div className={styles.divider} />

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>1. Elige tu talla</h2>
            <span className={styles.optional}>4XL: +2 €</span>
          </div>
          <div className={styles.sizeGrid}>
            {product.sizes.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSize(item);
                  setError("");
                }}
                className={`${styles.sizeButton} ${size === item ? styles.sizeButtonActive : ""}`}
                aria-pressed={size === item}
              >
                {item}
              </button>
            ))}
          </div>

          <Link
            href="/guia-tallas"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              marginTop: 13,
              color: "#d6a6ff",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            ¿Dudas con la talla? Ver guía de tallas →
          </Link>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>2. Personaliza la espalda</h2>
            <span className={styles.optional}>Opcional · +4 €</span>
          </div>

          <label className={styles.toggleCard}>
            <span className={styles.toggleText}>
              <strong>Añadir nombre y dorsal</strong>
              <span>Vista previa orientativa: la fuente mostrada puede no coincidir exactamente con la oficial. La camiseta se entrega con la tipografía original del modelo seleccionado.</span>
            </span>
            <input
              type="checkbox"
              checked={personalized}
              onChange={event => togglePersonalization(event.target.checked)}
              className={styles.hiddenCheckbox}
            />
            <span className={`${styles.switch} ${personalized ? styles.switchOn : ""}`} aria-hidden="true" />
          </label>

          {personalized && (
            <>
              <div className={styles.fields}>
                <label className={styles.field}>
                  Nombre
                  <input
                    value={name}
                    onChange={event => {
                      setName(sanitizeName(event.target.value));
                      setError("");

                      if (hasBackImage) {
                        setView("back");
                      }
                    }}
                    maxLength={12}
                    placeholder="MBAPPÉ"
                    autoComplete="off"
                    className={styles.input}
                  />
                </label>

                <label className={styles.field}>
                  Dorsal
                  <input
                    value={number}
                    onChange={event => {
                      setNumber(event.target.value.replace(/\D/g, "").slice(0, 2));
                      setError("");

                      if (hasBackImage) {
                        setView("back");
                      }
                    }}
                    maxLength={2}
                    inputMode="numeric"
                    placeholder="9"
                    autoComplete="off"
                    className={styles.input}
                  />
                </label>
              </div>
              <p className={styles.helper}>
                Máximo 12 caracteres y dorsal del 0 al 99.
                {!hasBackImage &&
                  " La vista trasera no está disponible para este producto, pero la personalización se añadirá correctamente al pedido."}
              </p>
            </>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>3. Añade un parche</h2>
            <span className={styles.optional}>Opcional · +2 €</span>
          </div>
          <label className={styles.field}>
            Competición
            <select
              value={patch}
              onChange={event => selectPatch(event.target.value)}
              className={styles.select}
            >
              {patchOptions.map(option => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>Camiseta</span>
            <strong>{money(product.price)}</strong>
          </div>
          {sizeExtra > 0 && (
            <div className={styles.priceRow}>
              <span>Suplemento talla {size}</span>
              <strong>+{money(sizeExtra)}</strong>
            </div>
          )}
          {personalized && (
            <div className={styles.priceRow}>
              <span>Nombre y dorsal</span>
              <strong>+{money(PERSONALIZATION_PRICE_EUR)}</strong>
            </div>
          )}
          {patch && (
            <div className={styles.priceRow}>
              <span>Parche {patch}</span>
              <strong>+{money(PATCH_PRICE_EUR)}</strong>
            </div>
          )}
          <div className={`${styles.priceRow} ${styles.totalRow}`}>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={addToCart}
          disabled={adding}
          className={styles.buyButton}
        >
          {adding ? "AÑADIDO · ABRIENDO CARRITO..." : `AÑADIR AL CARRITO · ${money(total)}`}
        </button>

        <div className={styles.trustRow}>
          <span className={styles.trustItem}>Pago seguro</span>
          <span className={styles.trustItem}>Pedido personalizado</span>
          <span className={styles.trustItem}>Entrega 7–13 días</span>
        </div>
      </section>
    </main>
  );
}

const galleryArrowBase = {
  position: "absolute" as const,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(8,8,12,.68)",
  color: "white",
  fontSize: 30,
  lineHeight: 1,
  cursor: "pointer",
  backdropFilter: "blur(8px)",
};

const galleryArrowLeft = {
  ...galleryArrowBase,
  left: 12,
};

const galleryArrowRight = {
  ...galleryArrowBase,
  right: 12,
};

const galleryDot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "rgba(255,255,255,.28)",
};

const galleryDotActive = {
  ...galleryDot,
  width: 20,
  background: "#c35cff",
};
