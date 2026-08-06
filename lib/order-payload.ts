import { z } from "zod";

export const CheckoutItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  size: z.string(),
  quantity: z.number().int().positive(),
  unitPriceEur: z.number().positive(),
  supplierUnitCostUsd: z.number().nonnegative(),
  personalizationName: z.string().optional(),
  personalizationNumber: z.string().optional(),
  patch: z.string().optional(),
});

export const CustomerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(5),
  postalCode: z.string().min(4),
  city: z.string().min(2),
});

export const CheckoutPayloadSchema = z.object({
  customer: CustomerSchema,
  items: z.array(CheckoutItemSchema).min(1),
  couponCode: z.string().optional(),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;
