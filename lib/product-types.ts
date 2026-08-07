import type { Product } from "@/lib/products";

export const PRODUCT_TYPE_LABELS: Record<Product["type"], string> = {
  fan: "Fan",
  player: "Player",
  retro: "Retro",
  kids: "Niño",
  adult_kit: "Conjunto adulto",
  polo: "Polo",
  shorts: "Pantalón",
  socks: "Medias",
  training: "Entrenamiento",
  nba: "NBA",
};

export const PRODUCT_TYPE_BADGES: Record<
  Product["type"],
  {
    label: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  fan: {
    label: "FAN",
    color: "#d8b4ff",
    background: "rgba(139,44,255,.12)",
    border: "rgba(195,92,255,.24)",
  },
  player: {
    label: "PLAYER",
    color: "#9ce6ff",
    background: "rgba(56,189,248,.10)",
    border: "rgba(56,189,248,.24)",
  },
  retro: {
    label: "RETRO",
    color: "#ffd08a",
    background: "rgba(255,184,77,.10)",
    border: "rgba(255,184,77,.24)",
  },
  kids: {
    label: "NIÑO",
    color: "#8af3b7",
    background: "rgba(61,222,138,.10)",
    border: "rgba(61,222,138,.24)",
  },
  adult_kit: {
    label: "CONJUNTO",
    color: "#f5c2ff",
    background: "rgba(217,70,239,.10)",
    border: "rgba(217,70,239,.24)",
  },
  polo: {
    label: "POLO",
    color: "#c7d2fe",
    background: "rgba(99,102,241,.10)",
    border: "rgba(99,102,241,.24)",
  },
  shorts: {
    label: "PANTALÓN",
    color: "#bae6fd",
    background: "rgba(14,165,233,.10)",
    border: "rgba(14,165,233,.24)",
  },
  socks: {
    label: "MEDIAS",
    color: "#bbf7d0",
    background: "rgba(34,197,94,.10)",
    border: "rgba(34,197,94,.24)",
  },
  training: {
    label: "TRAINING",
    color: "#fde68a",
    background: "rgba(245,158,11,.10)",
    border: "rgba(245,158,11,.24)",
  },
  nba: {
    label: "NBA",
    color: "#fecaca",
    background: "rgba(239,68,68,.10)",
    border: "rgba(239,68,68,.24)",
  },
};

export const PRODUCT_TYPE_FILTER_OPTIONS: Array<{
  value: Product["type"];
  label: string;
}> = [
  { value: "fan", label: "Fan" },
  { value: "player", label: "Player" },
  { value: "retro", label: "Retro" },
  { value: "kids", label: "Niño" },
  { value: "adult_kit", label: "Conjunto adulto" },
  { value: "polo", label: "Polo" },
  { value: "shorts", label: "Pantalón" },
  { value: "socks", label: "Medias" },
  { value: "training", label: "Entrenamiento" },
  { value: "nba", label: "NBA" },
];
