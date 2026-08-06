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

type OrderItemRow = {
  product_name_snapshot: string | null;
  size_snapshot: string | null;
  quantity: number | null;
  unit_price_eur: number | string | null;
  personalization_name: string | null;
  personalization_number: string | null;
  patch: string | null;
};

type ShippingAddress = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pedido recibido",
  paid: "Pago confirmado",
  preparing: "Preparando tu pedido",
  packed: "Pedido empaquetado",
  shipped: "Pedido enviado",
  delivered: "Pedido entregado",
  cancelled: "Pedido cancelado",
};

const STATUS_MESSAGES: Record<string, string> = {
  pending:
    "Hemos recibido tu pedido. Queda pendiente la confirmación del pago.",
  paid:
    "El pago se ha confirmado correctamente. Ya podemos empezar a preparar tu pedido.",
  preparing:
    "Tu pedido ya está en preparación. Revisaremos cuidadosamente todos los detalles de personalización.",
  packed:
    "Tu pedido está empaquetado y listo para salir.",
  shipped:
    "Tu pedido ha sido enviado. Te comunicaremos los datos de seguimiento cuando estén disponibles.",
  delivered:
    "Tu pedido figura como entregado. Esperamos que lo disfrutes muchísimo.",
  cancelled:
    "Tu pedido ha sido cancelado. Contacta con nosotros si necesitas ayuda.",
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

function subjectFor(status: string, orderNumber: string) {
  const label = STATUS_LABELS[status] ?? "Actualización de tu pedido";
  return `${label} · ${orderNumber}`;
}

function itemRows(items: OrderItemRow[]) {
  if (!items.length) {
    return `
      <tr>
        <td style="padding:18px;color:#a8a8b3">
          No se pudieron cargar los artículos del pedido.
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unit_price_eur ?? 0);
      const total = quantity * unitPrice;
      const personalization =
        item.personalization_name || item.personalization_number
          ? `
            <div style="margin-top:7px;color:#d69cff;font-size:13px;font-weight:700">
              Nombre: ${escapeHtml(item.personalization_name || "—")}
              · Dorsal: ${escapeHtml(item.personalization_number || "—")}
            </div>
          `
          : "";

      const patch = item.patch
        ? `
          <div style="margin-top:5px;color:#b8b8c2;font-size:13px">
            Parche: ${escapeHtml(item.patch)}
          </div>
        `
        : "";

      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #292934">
            <div style="font-size:15px;font-weight:800;color:#ffffff">
              ${escapeHtml(item.product_name_snapshot || "Camiseta")}
            </div>
            <div style="margin-top:5px;color:#b8b8c2;font-size:13px">
              Talla ${escapeHtml(item.size_snapshot || "—")}
              · Cantidad ${quantity}
            </div>
            ${personalization}
            ${patch}
          </td>
          <td style="padding:16px 0 16px 16px;border-bottom:1px solid #292934;text-align:right;white-space:nowrap;color:#ffffff;font-weight:800">
            ${money(total)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function addressBlock(address: ShippingAddress | null) {
  if (!address) return "";

  return `
    <div style="margin-top:22px;padding:18px;border:1px solid #292934;border-radius:14px;background:#14141b">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#d69cff;font-weight:800">
        Dirección de entrega
      </div>
      <div style="margin-top:10px;line-height:1.65;color:#eeeeF2;font-size:14px">
        <strong>${escapeHtml(address.fullName || "")}</strong><br>
        ${escapeHtml(address.address || "")}<br>
        ${escapeHtml(address.postalCode || "")} ${escapeHtml(address.city || "")}<br>
        ${address.phone ? `Tel. ${escapeHtml(address.phone)}` : ""}
      </div>
    </div>
  `;
}

export async function sendOrderStatusEmail(input: OrderEmailInput) {
  const eventType = `order_${input.status}`;

  const { data: existingEvent } = await input.supabase
    .from("email_events")
    .select("id,status")
    .eq("order_id", input.orderId)
    .eq("event_type", eventType)
    .eq("recipient", input.recipient)
    .in("status", ["pending", "sent"])
    .maybeSingle();

  // Evita correos duplicados si Stripe reintenta el mismo webhook.
  if (existingEvent) return;

  const [{ data: order }, { data: items }] = await Promise.all([
    input.supabase
      .from("orders")
      .select("shipping_address,payment_method,discount_eur")
      .eq("id", input.orderId)
      .single(),
    input.supabase
      .from("order_items")
      .select(
        "product_name_snapshot,size_snapshot,quantity,unit_price_eur,personalization_name,personalization_number,patch",
      )
      .eq("order_id", input.orderId),
  ]);

  const address = (order?.shipping_address ?? null) as ShippingAddress | null;
  const discountEur = Number(order?.discount_eur ?? 0);
  const statusLabel =
    STATUS_LABELS[input.status] ?? "Actualización de tu pedido";
  const statusMessage =
    STATUS_MESSAGES[input.status] ??
    "Tenemos una nueva actualización sobre tu pedido.";

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://camisfutmadrid.vercel.app";
  const supportEmail =
    process.env.SUPPORT_EMAIL ?? "frannegociosshop@gmail.com";
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const subject = subjectFor(input.status, input.orderNumber);

  const html = `
    <!doctype html>
    <html lang="es">
      <body style="margin:0;padding:0;background:#09090d">
        <div style="padding:24px 12px;background:#09090d">
          <div style="max-width:640px;margin:0 auto;background:#101016;border:1px solid #292934;border-radius:22px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#ffffff">
            <div style="padding:26px 28px;background:linear-gradient(135deg,#16121d,#0e0e14);border-bottom:1px solid #292934">
              <div style="font-size:23px;font-weight:900;letter-spacing:.02em">
                CAMISFUT<span style="color:#c34cff">MADRID</span>
              </div>
              <div style="margin-top:18px;display:inline-block;padding:7px 11px;border-radius:999px;background:#39204c;color:#e4b8ff;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">
                ${escapeHtml(statusLabel)}
              </div>
              <h1 style="margin:16px 0 6px;font-size:27px;line-height:1.15">
                Hola, ${escapeHtml(input.customerName)}
              </h1>
              <p style="margin:0;color:#c7c7d0;line-height:1.65;font-size:15px">
                ${escapeHtml(statusMessage)}
              </p>
            </div>

            <div style="padding:26px 28px">
              <table role="presentation" style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="color:#a8a8b3;font-size:13px">Número de pedido</td>
                  <td style="text-align:right;color:#ffffff;font-size:14px;font-weight:900">
                    ${escapeHtml(input.orderNumber)}
                  </td>
                </tr>
              </table>

              <div style="margin-top:24px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#d69cff;font-weight:800">
                Resumen del pedido
              </div>

              <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:6px">
                ${itemRows((items ?? []) as OrderItemRow[])}
              </table>

              ${
                discountEur > 0
                  ? `
                    <table role="presentation" style="width:100%;margin-top:16px;border-collapse:collapse">
                      <tr>
                        <td style="color:#79e8a7;font-size:14px">Descuento aplicado</td>
                        <td style="text-align:right;color:#79e8a7;font-weight:800">
                          −${money(discountEur)}
                        </td>
                      </tr>
                    </table>
                  `
                  : ""
              }

              <div style="margin-top:18px;padding:17px 18px;border-radius:14px;background:#1a1422;border:1px solid #4f2a68">
                <table role="presentation" style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="font-size:17px;font-weight:800;color:#ffffff">Total</td>
                    <td style="text-align:right;font-size:22px;font-weight:900;color:#d05cff">
                      ${money(input.totalEur)}
                    </td>
                  </tr>
                </table>
              </div>

              ${addressBlock(address)}

              <div style="margin-top:24px;padding:16px;border-radius:14px;background:#15151c;color:#b8b8c2;font-size:12px;line-height:1.6">
                En los productos personalizados, la vista previa de la web es orientativa.
                La camiseta se prepara con la tipografía correspondiente al modelo seleccionado.
              </div>

              <div style="margin-top:26px;text-align:center">
                <a href="${escapeHtml(siteUrl)}/cuenta" style="display:inline-block;padding:13px 22px;border-radius:12px;background:#a52cff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900">
                  Ver mi pedido
                </a>
              </div>

              <p style="margin:26px 0 0;text-align:center;color:#8f8f9b;font-size:12px;line-height:1.6">
                ¿Necesitas ayuda? Escríbenos a
                <a href="mailto:${escapeHtml(supportEmail)}" style="color:#d69cff;text-decoration:none">
                  ${escapeHtml(supportEmail)}
                </a>
              </p>
            </div>
          </div>

          <p style="max-width:640px;margin:16px auto 0;text-align:center;color:#666674;font-family:Arial,Helvetica,sans-serif;font-size:11px">
            CamisfutMadrid · Este es un correo automático relacionado con tu pedido.
          </p>
        </div>
      </body>
    </html>
  `;

  const { data: event, error: eventError } = await input.supabase
    .from("email_events")
    .insert({
      order_id: input.orderId,
      event_type: eventType,
      recipient: input.recipient,
      status: "pending",
    })
    .select("id")
    .single();

  if (eventError) {
    console.error("No se pudo registrar el evento de correo:", eventError);
    return;
  }

  if (!resend) {
    await input.supabase
      .from("email_events")
      .update({
        status: "skipped",
        error_message: "RESEND_API_KEY no configurada",
      })
      .eq("id", event.id);
    return;
  }

  try {
    const response = await resend.emails.send({
      from:
        process.env.EMAIL_FROM ??
        "CamisfutMadrid <onboarding@resend.dev>",
      to: input.recipient,
      bcc:
        input.status === "paid" && notificationEmail
          ? [notificationEmail]
          : undefined,
      replyTo: supportEmail,
      subject,
      html,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    await input.supabase
      .from("email_events")
      .update({
        status: "sent",
        provider_message_id: response.data?.id ?? null,
      })
      .eq("id", event.id);
  } catch (error) {
    await input.supabase
      .from("email_events")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Error desconocido",
      })
      .eq("id", event.id);

    console.error("Error enviando correo del pedido:", error);
  }
}
