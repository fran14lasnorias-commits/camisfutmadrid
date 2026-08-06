import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { sendOrderStatusEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) return new NextResponse("Falta stripe-signature", { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new NextResponse(
      `Firma inválida: ${error instanceof Error ? error.message : "error"}`,
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      const { data: order } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_reference: session.payment_intent?.toString() ?? session.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("id,number,total_eur,shipping_address,discount_code")
        .single();

      if (order?.discount_code) {
        await supabase.rpc("mark_coupon_used",{p_code:order.discount_code});
      }

      const address = order?.shipping_address as any;
      if (order && address?.email) {
        await sendOrderStatusEmail({
          supabase,
          orderId:order.id,
          orderNumber:order.number,
          recipient:address.email,
          customerName:address.fullName ?? "cliente",
          totalEur:Number(order.total_eur),
          status:"paid",
        });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      await supabase.rpc("release_order_stock", { p_order_id: orderId });
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    }
  }

  return NextResponse.json({ received: true });
}
