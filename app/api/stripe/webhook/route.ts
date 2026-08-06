import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendOrderStatusEmail } from "@/lib/email";
import type Stripe from "stripe";

export const runtime = "nodejs";

function paymentReference(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? session.id;
}

function orderIdFrom(session: Stripe.Checkout.Session) {
  return session.metadata?.order_id ?? null;
}

async function sendOrderEmail(
  supabase: SupabaseClient,
  order: {
    id: string;
    number: string;
    total_eur: number | string;
    shipping_address: unknown;
  },
  status: string,
) {
  const address = order.shipping_address as {
    email?: string;
    fullName?: string;
  } | null;

  if (!address?.email) return;

  await sendOrderStatusEmail({
    supabase,
    orderId: order.id,
    orderNumber: order.number,
    recipient: address.email,
    customerName: address.fullName ?? "cliente",
    totalEur: Number(order.total_eur),
    status,
  });
}

async function markOrderPaid(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const orderId = orderIdFrom(session);
  if (!orderId) return;

  /*
   * Solo transforma un pedido pendiente en pagado.
   * Si Stripe reintenta el mismo webhook, no vuelve a usar el cupón
   * ni vuelve a enviar el correo.
   */
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_reference: paymentReference(session),
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select(
      "id,number,total_eur,shipping_address,discount_code",
    )
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo confirmar el pedido: ${error.message}`);
  }

  // Ya estaba procesado o no existe.
  if (!order) return;

  if (order.discount_code) {
    const { error: couponError } = await supabase.rpc(
      "mark_coupon_used",
      { p_code: order.discount_code },
    );

    if (couponError) {
      console.error("No se pudo marcar el cupón como usado:", couponError);
    }
  }

  await sendOrderEmail(supabase, order, "paid");
}

async function cancelOrder(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const orderId = orderIdFrom(session);
  if (!orderId) return;

  const { data: pendingOrder, error: readError } = await supabase
    .from("orders")
    .select("id,number,total_eur,shipping_address")
    .eq("id", orderId)
    .eq("status", "pending")
    .maybeSingle();

  if (readError) {
    throw new Error(`No se pudo leer el pedido: ${readError.message}`);
  }

  // Ya estaba pagado, cancelado o procesado anteriormente.
  if (!pendingOrder) return;

  const { error: releaseError } = await supabase.rpc(
    "release_order_stock",
    { p_order_id: orderId },
  );

  if (releaseError) {
    throw new Error(`No se pudo liberar el stock: ${releaseError.message}`);
  }

  const { data: cancelledOrder, error: cancelError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id,number,total_eur,shipping_address")
    .maybeSingle();

  if (cancelError) {
    throw new Error(`No se pudo cancelar el pedido: ${cancelError.message}`);
  }

  if (cancelledOrder) {
    await sendOrderEmail(supabase, cancelledOrder, "cancelled");
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return new NextResponse("Falta stripe-signature", { status: 400 });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET no está configurada.");
    return new NextResponse("Webhook no configurado", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    return new NextResponse(
      `Firma inválida: ${
        error instanceof Error ? error.message : "error"
      }`,
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        /*
         * Con tarjeta y otros métodos inmediatos, payment_status será paid.
         * Con métodos diferidos puede seguir unpaid y se espera al evento
         * checkout.session.async_payment_succeeded.
         */
        if (session.payment_status !== "unpaid") {
          await markOrderPaid(supabase, session);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        await markOrderPaid(supabase, event.data.object);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        await cancelOrder(supabase, event.data.object);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(`Error procesando ${event.type}:`, error);

    // Hace que Stripe vuelva a intentar el webhook.
    return new NextResponse("Error procesando el evento", {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}
