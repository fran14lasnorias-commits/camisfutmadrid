export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  quantity: number;
  unitPriceEur: number;
  supplierUnitCostUsd: number;
  personalizationName?: string;
  personalizationNumber?: string;
  patch?: string;
};

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPriceEur * item.quantity, 0);
}

export function totalUnits(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
