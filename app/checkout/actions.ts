"use server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutPayloadSchema } from "@/lib/order-payload";
import { createPendingOrder } from "@/lib/orders";

export async function createTransferOrder(payload: unknown) {
  const parsed = CheckoutPayloadSchema.parse(payload);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const order = await createPendingOrder({
    supabase,
    payload: parsed,
    paymentMethod: "transfer",
    userId: user?.id,
    couponCode: parsed.couponCode,
  });

  return {
    number: order.number,
    subtotalEur: order.subtotalEur,
    discountEur: order.discountEur,
    totalEur: order.totalEur,
    bankAccountHolder: process.env.BANK_ACCOUNT_HOLDER ?? "",
    bankIban: process.env.BANK_IBAN ?? "",
    bankBic: process.env.BANK_BIC ?? "",
  };
}
