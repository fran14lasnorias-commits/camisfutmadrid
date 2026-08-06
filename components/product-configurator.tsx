"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import styles from "./product-configurator.module.css";

const PERSONALIZATION_PRICE_EUR = 4;
const PATCH_PRICE_EUR = 2;

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

  const { addItem } = useCart();
  const router = useRouter();

  const frontImage = product.images[0] || "/placeholder-shirt.svg";
  const backImage = product.images[1] || product.images[0] || "/placeholder-shirt-back.svg";
  const activeImage = view === "back" ? backImage : frontImage;

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

  function togglePersonalization(enabled: boolean) {
    setPersonalized(enabled);
    setError("");
    if (enabled) setView("back");
  }

  function selectPatch(value: string) {
    setPatch(value);
    if (value) setView("back");
  }

  function addToCart() {
    setError("");

    if (!size) {
      setError("Selecciona una talla antes de continuar.");
      return;
    }

    if (personalized && (!name.trim() || !number.trim())) {
      setError("Completa el nombre y el dorsal para guardar la personalización.");
      setView("back");
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
    <main className={styles.page}>
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
            <button
              type="button"
              className={`${styles.viewButton} ${view === "back" ? styles.viewButtonActive : ""}`}
              onClick={() => setView("back")}
              aria-pressed={view === "back"}
            >
              Trasera
            </button>
          </div>
        </div>

        <div className={styles.previewStage}>
          <img
            src={activeImage}
            alt={`${product.name}, vista ${view === "back" ? "trasera" : "frontal"}`}
            className={styles.productImage}
          />

          {view === "back" && personalized && (
            <div className={styles.personalizationLayer} aria-hidden="true">
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
          <span>Simulación orientativa de nombre, dorsal y parche.</span>
          <div className={styles.thumbnailRow}>
            <button
              type="button"
              className={`${styles.thumbnail} ${view === "front" ? styles.thumbnailActive : ""}`}
              onClick={() => setView("front")}
              aria-label="Ver parte frontal"
            >
              <img src={frontImage} alt="" />
            </button>
            <button
              type="button"
              className={`${styles.thumbnail} ${view === "back" ? styles.thumbnailActive : ""}`}
              onClick={() => setView("back")}
              aria-label="Ver parte trasera"
            >
              <img src={backImage} alt="" />
            </button>
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
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h2 className={styles.sectionTitle}>2. Personaliza la espalda</h2>
            <span className={styles.optional}>Opcional · +4 €</span>
          </div>

          <label className={styles.toggleCard}>
            <span className={styles.toggleText}>
              <strong>Añadir nombre y dorsal</strong>
              <span>Verás el resultado directamente sobre la camiseta.</span>
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
                      setView("back");
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
                      setView("back");
                    }}
                    maxLength={2}
                    inputMode="numeric"
                    placeholder="9"
                    autoComplete="off"
                    className={styles.input}
                  />
                </label>
              </div>
              <p className={styles.helper}>Máximo 12 caracteres y dorsal del 0 al 99.</p>
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

        {error && <p className={styles.error} role="alert">{error}</p>}

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
