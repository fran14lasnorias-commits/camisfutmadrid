import { z } from "zod";

export const ProductAdminSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  team: z.string().min(2),
  season: z.string().optional(),
  type: z.enum(["fan","player","retro","kids","adult_kit","polo","shorts","socks","training","nba"]),
  priceEur: z.number().positive(),
  supplierCostUsd: z.number().nonnegative(),
  description: z.string().optional(),
  supplierUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean(),
  images: z.array(z.string().url()).default([]),
  variants: z.array(z.object({
    size: z.string().min(1),
    stock: z.number().int().nonnegative(),
  })).min(1),
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
