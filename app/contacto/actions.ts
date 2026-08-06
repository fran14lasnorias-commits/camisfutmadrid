"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional(),
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendContactMessage(formData: FormData) {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/contacto?error=${encodeURIComponent(
        "Revisa los datos e inténtalo de nuevo."
      )}`
    );
  }

  // Campo trampa contra robots. Para un usuario real siempre está vacío.
  if (parsed.data.website) {
    redirect(
      `/contacto?message=${encodeURIComponent(
        "Mensaje enviado correctamente."
      )}`
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient =
    process.env.SUPPORT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL;
  const from =
    process.env.EMAIL_FROM ||
    "CamisfutMadrid <pedidos@camisfutmadrid.com>";

  if (!apiKey || !recipient) {
    console.error(
      "Formulario de contacto: faltan RESEND_API_KEY o SUPPORT_EMAIL."
    );

    redirect(
      `/contacto?error=${encodeURIComponent(
        "Ahora mismo no podemos enviar el mensaje. Escríbenos de nuevo más tarde."
      )}`
    );
  }

  const resend = new Resend(apiKey);
  const { name, email, phone, subject, message } = parsed.data;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;background:#0e0e13;color:#ffffff;padding:30px;border-radius:18px">
      <p style="color:#c35cff;font-size:13px;font-weight:800;margin:0 0 8px">
        NUEVO MENSAJE DESDE LA WEB
      </p>
      <h1 style="margin:0 0 24px">CamisfutMadrid</h1>

      <div style="background:#17171f;border:1px solid #2a2a34;border-radius:14px;padding:18px">
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(phone || "No indicado")}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
      </div>

      <div style="margin-top:18px;background:#17171f;border:1px solid #2a2a34;border-radius:14px;padding:18px">
        <strong>Mensaje</strong>
        <p style="line-height:1.7;white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>

      <p style="color:#a9a9b4;font-size:13px;margin-top:22px">
        Responde directamente a: ${escapeHtml(email)}
      </p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `Contacto web · ${subject}`,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error(
      "No se pudo enviar el formulario de contacto:",
      error instanceof Error ? error.message : error
    );

    redirect(
      `/contacto?error=${encodeURIComponent(
        "No hemos podido enviar el mensaje. Inténtalo de nuevo dentro de unos minutos."
      )}`
    );
  }

  redirect(
    `/contacto?message=${encodeURIComponent(
      "Mensaje enviado. Te responderemos lo antes posible."
    )}`
  );
}
