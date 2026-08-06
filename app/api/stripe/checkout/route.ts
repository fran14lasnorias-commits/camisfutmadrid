import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CheckoutPayloadSchema } from "@/lib/order-payload";
import { createPendingOrder } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const payload = CheckoutPayloadSchema.parse(await request.json());
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const order = await createPendingOrder({
      supabase,
      payload,
      paymentMethod: "stripe",
      userId: user?.id,
      couponCode: payload.couponCode,
    });

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: payload.customer.email,
      line_items: [
        ...payload.items.map(item => ({
          quantity: item.quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(item.unitPriceEur * 100),
            product_data: {
              name: item.name,
              description: [
                `Talla ${item.size}`,
                item.personalizationName
                  ? `${item.personalizationName} ${item.personalizationNumber ?? ""}`.trim()
                  : null,
                item.patch ? `Parche ${item.patch}` : null,
              ]
                .filter(Boolean)
                .join(" · "),
            },
          },
        })),
        ...(order.discountEur > 0 ? [{
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: -Math.round(order.discountEur * 100),
            product_data: {
              name: `Descuento ${order.couponCode ?? ""}`.trim(),
            },
          },
        }] : []),
      ],
      metadata: {
        order_id: order.id,
        order_number: order.number,
        coupon_code: order.couponCode ?? "",
      },
      success_url: `${origin}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrito?cancelled=1`,
    });

    if (!session.url) throw new Error("Stripe no devolvió una URL de pago");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    );
  }
}
