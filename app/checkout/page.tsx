import { CheckoutForm } from "@/components/checkout-form";

export default function CheckoutPage() {
  return (
    <main className="container" style={{padding:"46px 0 80px"}}>
      <h1>Finalizar compra</h1>
      <CheckoutForm />
    </main>
  );
}
