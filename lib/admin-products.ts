export type ProductType =
  | "fan"
  | "player"
  | "retro"
  | "kids"
  | "adult_kit"
  | "polo"
  | "shorts"
  | "socks"
  | "training"
  | "nba";

export type Product = {
  id: string;
  slug: string;
  name: string;
  team: string;
  season: string;
  type: ProductType;
  price: number;
  originalPrice?: number;
  costUsd: number;
  images: string[];
  sizes: string[];
};

export const products: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "real-madrid-2026-27-local-fan",
    name: "Real Madrid 2026/27 Local Fan",
    team: "Real Madrid",
    season: "2026/27",
    type: "fan",
    price: 25,
    originalPrice: 30,
    costUsd: 10,
    images: [
      "/placeholder-shirt.svg",
      "/placeholder-shirt-back.svg",
    ],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  },
];
