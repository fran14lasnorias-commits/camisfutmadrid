import { z } from "zod";

const ProductImageUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      // Admitimos imágenes externas http/https y rutas internas de la propia web,
      // por ejemplo /api/yupoo-image?... y /placeholder-shirt.svg.
      if (value.startsWith("/")) return true;

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    {
      message: "La imagen debe ser una URL válida o una ruta interna de la web.",
    }
  );

export const ProductAdminSchema = z
  .object({
    name: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    team: z.string().min(2),
    season: z.string().optional(),
    type: z.enum([
      "fan",
      "player",
      "retro",
      "kids",
      "adult_kit",
      "polo",
      "shorts",
      "socks",
      "training",
      "nba",
    ]),
    priceEur: z.number().positive(),
    originalPriceEur: z.number().positive().nullable().optional(),
    supplierCostUsd: z.number().nonnegative(),
    description: z.string().optional(),
    supplierUrl: z.string().url().optional().or(z.literal("")),
    published: z.boolean(),
    images: z.array(ProductImageUrlSchema).default([]),
    variants: z
      .array(
        z.object({
          size: z.string().min(1),
          stock: z.number().int().nonnegative(),
        })
      )
      .min(1),
  })
  .superRefine((value, ctx) => {
    if (
      value.originalPriceEur != null &&
      value.originalPriceEur <= value.priceEur
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["originalPriceEur"],
        message: "El precio anterior debe ser mayor que el precio de venta.",
      });
    }
  });

export type ProductAdminInput = z.infer<typeof ProductAdminSchema>;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
