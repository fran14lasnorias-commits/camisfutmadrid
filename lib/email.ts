import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type OrderEmailInput = {
  supabase: SupabaseClient;
  orderId: string;
  orderNumber: string;
  recipient: string;
  customerName: string;
  totalEur: number;
  status: string;
};

function subjectFor(status: string, orderNumber: string) {
  const labels: Record<string,string> = {
    pending: `Pedido ${orderNumber} recibido`,
    paid: `Pago confirmado · ${orderNumber}`,
    preparing: `Estamos preparando tu pedido ${orderNumber}`,
    packed: `Pedido ${orderNumber} empaquetado`,
    shipped: `Tu pedido ${orderNumber} ha sido enviado`,
    delivered: `Pedido ${orderNumber} entregado`,
    cancelled: `Pedido ${orderNumber} cancelado`,
  };
  return labels[status] ?? `Actualización del pedido ${orderNumber}`;
}

export async function sendOrderStatusEmail(input: OrderEmailInput) {
  const subject = subjectFor(input.status,input.orderNumber);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;background:#0e0e13;color:#fff;padding:28px;border-radius:18px">
      <h1 style="color:#c35cff">CamisfutMadrid</h1>
      <p>Hola ${input.customerName},</p>
      <h2>${subject}</h2>
      <p>Estado actual: <strong>${input.status}</strong></p>
      <p>Total del pedido: <strong>${input.totalEur.toFixed(2).replace(".",",")} €</strong></p>
      <p style="color:#aaa">Gracias por confiar en CamisfutMadrid.</p>
    </div>
  `;

  const { data: event } = await input.supabase
    .from("email_events")
    .insert({
      order_id: input.orderId,
      event_type: `order_${input.status}`,
      recipient: input.recipient,
      status: "pending",
    })
    .select("id")
    .single();

  if (!resend) {
    await input.supabase
      .from("email_events")
      .update({
        status: "skipped",
        error_message: "RESEND_API_KEY no configurada",
      })
      .eq("id", event?.id);
    return;
  }

  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "CamisfutMadrid <pedidos@example.com>",
      to: input.recipient,
      subject,
      html,
    });

    await input.supabase
      .from("email_events")
      .update({
        status: "sent",
        provider_message_id: response.data?.id ?? null,
      })
      .eq("id", event?.id);
  } catch (error) {
    await input.supabase
      .from("email_events")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Error desconocido",
      })
      .eq("id", event?.id);
  }
}
