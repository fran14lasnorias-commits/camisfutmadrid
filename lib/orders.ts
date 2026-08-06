import type { SupabaseClient } from "@supabase/supabase-js";
import type { CheckoutPayload } from "@/lib/order-payload";
import { supplierShippingUsd } from "@/lib/pricing";
import { calculateOrderProfit } from "@/lib/checkout-calculations";

export function makeOrderNumber(prefix = "CFM") {
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
}

export function calculateOrderCosts(payload: CheckoutPayload) {
  const subtotalEur = payload.items.reduce(
    (sum, item) => sum + item.unitPriceEur * item.quantity,
    0
  );
  const units = payload.items.reduce((sum, item) => sum + item.quantity, 0);
  const supplierCostUsd =
    payload.items.reduce(
      (sum, item) => sum + item.supplierUnitCostUsd * item.quantity,
      0
    ) + supplierShippingUsd(units);

  return { subtotalEur, units, supplierCostUsd };
}

export async function resolveCoupon({
  supabase,
  code,
  subtotalEur,
}: {
  supabase: SupabaseClient;
  code?: string;
  subtotalEur: number;
}) {
  if (!code?.trim()) return { code: null, discountEur: 0 };

  const { data, error } = await supabase.rpc("apply_coupon", {
    p_code: code,
    p_subtotal: subtotalEur,
  });

  if (error) throw new Error(error.message);

  return {
    code: data.code as string,
    discountEur: Number(data.discount_eur),
  };
}

export async function createPendingOrder({
  supabase,
  payload,
  paymentMethod,
  userId,
  couponCode,
}: {
  supabase: SupabaseClient;
  payload: CheckoutPayload;
  paymentMethod: "transfer" | "stripe";
  userId?: string | null;
  couponCode?: string;
}) {
  const { subtotalEur, supplierCostUsd } = calculateOrderCosts(payload);
  const coupon = await resolveCoupon({ supabase, code: couponCode, subtotalEur });
  const totalEur = Math.max(0, subtotalEur - coupon.discountEur);
  const { settings, result } = calculateOrderProfit({
    revenueEur: subtotalEur,
    supplierCostUsd,
    discountEur: coupon.discountEur,
  });

  const number = makeOrderNumber();

  const { data, error } = await supabase.rpc("create_order_and_reserve_stock_v2", {
    p_number: number,
    p_user_id: userId ?? null,
    p_total_eur: totalEur,
    p_supplier_cost_usd: supplierCostUsd,
    p_payment_method: paymentMethod,
    p_shipping_method: "home",
    p_shipping_address: payload.customer,
    p_items: payload.items,
    p_discount_code: coupon.code,
    p_discount_eur: coupon.discountEur,
    p_estimated_profit_eur: result.profitEur,
    p_exchange_rate_usd_eur: settings.exchangeRateUsdEur,
    p_payment_fee_eur: result.paymentFeeEur,
    p_packaging_cost_eur: settings.packagingCostEur,
    p_customer_shipping_cost_eur: settings.customerShippingCostEur,
  });

  if (error) throw new Error(error.message);

  return {
    id: data.id as string,
    number: data.number as string,
    subtotalEur,
    discountEur: coupon.discountEur,
    totalEur,
    supplierCostUsd,
    estimatedProfitEur: result.profitEur,
    couponCode: coupon.code,
  };
}
