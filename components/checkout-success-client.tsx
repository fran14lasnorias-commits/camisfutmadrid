"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function CheckoutSuccessClient() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
