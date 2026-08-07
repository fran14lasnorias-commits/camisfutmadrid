"use server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutPayloadSchema } from "@/lib/order-payload";
import { createPendingOrder } from "@/lib/orders";
import { sendOrderStatusEmail } from "@/lib/email";

export async function createTransferOrder(payload: unknown) {
  const parsed = CheckoutPayloadSchema.parse(payload);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const order = await createPendingOrder({
    supabase,
    payload: parsed,
    paymentMethod: "transfer",
    userId: user?.id,
    couponCode: parsed.couponCode,
  });

  try {
    await sendOrderStatusEmail({
      supabase,
      orderId: order.id,
      orderNumber: order.number,
      recipient: parsed.customer.email,
      customerName: parsed.customer.fullName || "cliente",
      totalEur: order.totalEur,
      status: "pending",
    });
  } catch (error) {
    console.error(
      "No se pudo enviar el correo de pedido por transferencia:",
      error
    );
  }

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
