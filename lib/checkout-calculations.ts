import { calculateEstimatedProfit } from "@/lib/profit";

export function getBusinessSettings() {
  return {
    exchangeRateUsdEur: Number(process.env.USD_TO_EUR_RATE ?? 0.92),
    paymentFeePercent: Number(process.env.PAYMENT_FEE_PERCENT ?? 1.5),
    paymentFeeFixedEur: Number(process.env.PAYMENT_FEE_FIXED_EUR ?? 0.25),
    packagingCostEur: Number(process.env.PACKAGING_COST_EUR ?? 0.60),
    customerShippingCostEur: Number(process.env.CUSTOMER_SHIPPING_COST_EUR ?? 0),
  };
}

export function calculateOrderProfit({
  revenueEur,
  supplierCostUsd,
  discountEur,
}: {
  revenueEur: number;
  supplierCostUsd: number;
  discountEur: number;
}) {
  const settings = getBusinessSettings();
  return {
    settings,
    result: calculateEstimatedProfit({
      revenueEur,
      supplierCostUsd,
      discountEur,
      ...settings,
    }),
  };
}
