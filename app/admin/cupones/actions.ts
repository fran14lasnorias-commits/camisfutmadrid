"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const CouponSchema = z.object({
  code: z.string().min(2).transform(value=>value.trim().toUpperCase()),
  type: z.enum(["percent","fixed"]),
  value: z.number().positive(),
  minimumOrderEur: z.number().nonnegative(),
  maxUses: z.number().int().positive().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  active: z.boolean(),
});

export async function createCoupon(input: unknown) {
  const parsed = CouponSchema.parse(input);
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("coupons").insert({
    code: parsed.code,
    type: parsed.type,
    value: parsed.value,
    minimum_order_eur: parsed.minimumOrderEur,
    max_uses: parsed.maxUses,
    starts_at: parsed.startsAt || null,
    ends_at: parsed.endsAt || null,
    active: parsed.active,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/cupones");
}

export async function toggleCoupon(id: string, active: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").update({ active }).eq("id",id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cupones");
}
