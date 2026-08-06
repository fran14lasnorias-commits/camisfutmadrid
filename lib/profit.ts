export type ProfitInput = {
  revenueEur: number;
  supplierCostUsd: number;
  exchangeRateUsdEur: number;
  paymentFeePercent: number;
  paymentFeeFixedEur: number;
  packagingCostEur: number;
  customerShippingCostEur: number;
  discountEur?: number;
};

export function calculateEstimatedProfit(input: ProfitInput) {
  const supplierCostEur = input.supplierCostUsd * input.exchangeRateUsdEur;
  const paymentFeeEur =
    input.revenueEur * (input.paymentFeePercent / 100) +
    input.paymentFeeFixedEur;

  const netRevenue = input.revenueEur - (input.discountEur ?? 0);
  const profitEur =
    netRevenue -
    supplierCostEur -
    paymentFeeEur -
    input.packagingCostEur -
    input.customerShippingCostEur;

  return {
    supplierCostEur,
    paymentFeeEur,
    netRevenue,
    profitEur,
    marginPercent: netRevenue > 0 ? (profitEur / netRevenue) * 100 : 0,
  };
}
