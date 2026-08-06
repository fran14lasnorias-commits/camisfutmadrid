import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { calculateEstimatedProfit } from "@/lib/profit";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
    { data: paidOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role","customer"),
    supabase.from("orders").select(`
      total_eur,supplier_cost_usd,discount_eur,
      payment_fee_eur,packaging_cost_eur,customer_shipping_cost_eur,
      exchange_rate_usd_eur
    `).in("status", ["paid","preparing","packed","shipped","delivered"]),
  ]);

  const defaults = {
    exchangeRateUsdEur:Number(process.env.USD_TO_EUR_RATE ?? 0.92),
    paymentFeePercent:Number(process.env.PAYMENT_FEE_PERCENT ?? 1.5),
    paymentFeeFixedEur:Number(process.env.PAYMENT_FEE_FIXED_EUR ?? 0.25),
    packagingCostEur:Number(process.env.PACKAGING_COST_EUR ?? 0.60),
    customerShippingCostEur:Number(process.env.CUSTOMER_SHIPPING_COST_EUR ?? 0),
  };

  const totals = (paidOrders ?? []).reduce((acc,order)=>{
    const result=calculateEstimatedProfit({
      revenueEur:Number(order.total_eur),
      supplierCostUsd:Number(order.supplier_cost_usd),
      exchangeRateUsdEur:Number(order.exchange_rate_usd_eur ?? defaults.exchangeRateUsdEur),
      paymentFeePercent:defaults.paymentFeePercent,
      paymentFeeFixedEur:Number(order.payment_fee_eur || defaults.paymentFeeFixedEur),
      packagingCostEur:Number(order.packaging_cost_eur || defaults.packagingCostEur),
      customerShippingCostEur:Number(order.customer_shipping_cost_eur || defaults.customerShippingCostEur),
      discountEur:Number(order.discount_eur ?? 0),
    });
    acc.sales += Number(order.total_eur);
    acc.profit += result.profitEur;
    return acc;
  },{sales:0,profit:0});

  const cards = [
    ["Ventas", `${totals.sales.toFixed(2).replace(".", ",")} €`],
    ["Beneficio estimado", `${totals.profit.toFixed(2).replace(".", ",")} €`],
    ["Pedidos", String(orderCount ?? 0)],
    ["Productos", String(productCount ?? 0)],
    ["Clientes", String(customerCount ?? 0)],
  ];

  return (
    <main className="container" style={{ padding: "46px 0 80px" }}>
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>PANEL PRIVADO</span>
      <h1 style={{ fontSize: 46 }}>Centro de negocio</h1>

      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}>
        <Link href="/admin/productos" className="btn-primary">PRODUCTOS</Link>
        <Link href="/admin/pedidos" className="btn-primary">PEDIDOS</Link>
        <Link href="/admin/clientes" className="btn-secondary">CLIENTES</Link>
        <Link href="/admin/cupones" className="btn-secondary">CUPONES</Link>
        <Link href="/admin/importador" className="btn-secondary">IMPORTADOR</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 24 }}>
        {cards.map(([label, value]) => (
          <div className="card" style={{ padding: 20 }} key={label}>
            <span className="muted">{label}</span>
            <strong style={{ display: "block", fontSize: 30, marginTop: 8 }}>{value}</strong>
          </div>
        ))}
      </div>
    </main>
  );
}
