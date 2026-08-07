import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase no está configurado en el servidor.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNumber?: string;
      email?: string;
    };

    const orderNumber = body.orderNumber?.trim().toUpperCase() ?? "";
    const email = normalizeEmail(body.email ?? "");

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Introduce el número de pedido y el email de compra." },
        { status: 400 }
      );
    }

    if (orderNumber.length > 80 || email.length > 200) {
      return NextResponse.json(
        { error: "Los datos introducidos no son válidos." },
        { status: 400 }
      );
    }

    const supabase = serviceClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        [
          "number",
          "status",
          "total_eur",
          "carrier",
          "tracking_number",
          "tracking_url",
          "shipped_at",
          "delivered_at",
          "shipping_address",
        ].join(",")
      )
      .eq("number", orderNumber)
      .maybeSingle();

    if (error) {
      console.error("Error consultando seguimiento:", error);
      return NextResponse.json(
        { error: "No se pudo consultar el pedido." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "No encontramos un pedido con esos datos." },
        { status: 404 }
      );
    }

    const shippingAddress = order.shipping_address as {
      email?: string;
    } | null;

    const orderEmail = normalizeEmail(shippingAddress?.email ?? "");

    if (!orderEmail || orderEmail !== email) {
      return NextResponse.json(
        { error: "No encontramos un pedido con esos datos." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        number: order.number,
        status: order.status,
        totalEur: Number(order.total_eur),
        carrier: order.carrier ?? null,
        trackingNumber: order.tracking_number ?? null,
        trackingUrl: order.tracking_url ?? null,
        shippedAt: order.shipped_at ?? null,
        deliveredAt: order.delivered_at ?? null,
      },
    });
  } catch (error) {
    console.error("Seguimiento de pedido:", error);

    return NextResponse.json(
      { error: "No se pudo consultar el pedido." },
      { status: 500 }
    );
  }
}
