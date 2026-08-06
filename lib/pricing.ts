export type SupplierCostInput = {
  baseCostUsd: number;
  quantity: number;
  personalizationCount?: number;
  patchCount?: number;
  sizes?: string[];
};

export function supplierShippingUsd(quantity: number): number {
  if (quantity >= 5) return 0;
  if (quantity === 4) return 2;
  if (quantity === 3) return 3;
  if (quantity === 2) return 5;
  return 6;
}

export function sizeExtraUsd(size: string): number {
  if (size === "3XL") return 3;
  if (size === "2XL") return 2;
  return 0;
}

export function calculateSupplierCost(input: SupplierCostInput): number {
  const personalization = (input.personalizationCount ?? 0) * 3;
  const patches = (input.patchCount ?? 0) * 1;
  const sizeExtras = (input.sizes ?? []).reduce((sum, size) => sum + sizeExtraUsd(size), 0);
  return input.baseCostUsd + personalization + patches + sizeExtras + supplierShippingUsd(input.quantity);
}
