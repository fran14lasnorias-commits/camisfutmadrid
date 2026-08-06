"use server";

import { revalidatePath } from "next/cache";
import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusEmail } from "@/lib/email";

const OrderStatusSchema = z.enum([
  "pending",
  "paid",
  "preparing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

const ManagedStatusSchema = z.enum([
  "pending",
  "paid",
  "preparing",
  "packed",
  "shipped",
  "delivered",
]);

const OrderManagementSchema = z.object({
  orderId: z.string().uuid(),
  status: ManagedStatusSchema,
  carrier: z.string().trim().max(80).optional().default(""),
  trackingNumber: z.string().trim().max(160).optional().default(""),
  trackingUrl: z
    .union([z.string().trim().url(), z.literal("")])
    .optional()
    .default(""),
  adminNotes: z.string().trim().max(3000).optional().default(""),
});

function serviceClient(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function refreshOrderPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
}

async function notifyOrder(orderId: string, status: string) {
  const service = serviceClient();

  const { data: order, error } = await service
    .from("orders")
    .select("id,number,total_eur,shipping_address")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    console.error("No se pudo cargar el pedido para enviar el correo:", error);
    return;
  }

  const address = order.shipping_address as {
    email?: string;
    fullName?: string;
  } | null;

  if (!address?.email) return;

  await sendOrderStatusEmail({
    supabase: service,
    orderId: order.id,
    orderNumber: order.number,
    recipient: address.email,
    customerName: address.fullName ?? "cliente",
    totalEur: Number(order.total_eur),
    status,
  });
}

export async function saveOrderManagement(input: unknown) {
  const parsed = OrderManagementSchema.parse(input);
  const { supabase } = await requireAdmin();

  const { data: current, error: currentError } = await supabase
    .from("orders")
    .select(
      "id,status,carrier,tracking_number,tracking_url,shipped_at,delivered_at",
    )
    .eq("id", parsed.orderId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "No se encontró el pedido");
  }

  const now = new Date().toISOString();
  const payload: Record<string, string | null> = {
    status: parsed.status,
    carrier: parsed.carrier || null,
    tracking_number: parsed.trackingNumber || null,
    tracking_url: parsed.trackingUrl || null,
    admin_notes: parsed.adminNotes || null,
  };

  if (parsed.status === "shipped" && !current.shipped_at) {
    payload.shipped_at = now;
  }

  if (parsed.status === "delivered") {
    payload.delivered_at = current.delivered_at ?? now;
    payload.shipped_at = current.shipped_at ?? now;
  }

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", parsed.orderId);

  if (error) throw new Error(error.message);

  if (current.status !== parsed.status) {
    await notifyOrder(parsed.orderId, parsed.status);
  }

  refreshOrderPages();

  return {
    status: parsed.status,
    emailSent: current.status !== parsed.status,
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const parsedStatus = OrderStatusSchema.parse(status);

  if (parsedStatus === "cancelled") {
    await cancelOrderAndReleaseStock(orderId);
    return;
  }

  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status,shipped_at,delivered_at")
    .eq("id", orderId)
    .single();

  if (readError || !current) {
    throw new Error(readError?.message ?? "No se encontró el pedido");
  }

  const now = new Date().toISOString();
  const payload: Record<string, string> = { status: parsedStatus };

  if (parsedStatus === "shipped" && !current.shipped_at) {
    payload.shipped_at = now;
  }

  if (parsedStatus === "delivered") {
    payload.delivered_at = current.delivered_at ?? now;
    payload.shipped_at = current.shipped_at ?? now;
  }

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  if (current.status !== parsedStatus) {
    await notifyOrder(orderId, parsedStatus);
  }

  refreshOrderPages();
}

export async function confirmTransfer(
  orderId: string,
  reference?: string,
) {
  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (readError || !current) {
    throw new Error(readError?.message ?? "No se encontró el pedido");
  }

  const { error } = await supabase.rpc("confirm_transfer_payment", {
    p_order_id: orderId,
    p_reference: reference?.trim() || null,
  });

  if (error) throw new Error(error.message);

  if (current.status !== "paid") {
    await notifyOrder(orderId, "paid");
  }

  refreshOrderPages();
}

export async function cancelOrderAndReleaseStock(orderId: string) {
  const { supabase } = await requireAdmin();

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (readError || !current) {
    throw new Error(readError?.message ?? "No se encontró el pedido");
  }

  if (current.status === "cancelled") {
    refreshOrderPages();
    return;
  }

  if (current.status === "delivered") {
    throw new Error("Un pedido entregado no puede cancelarse desde aquí");
  }

  const { error: releaseError } = await supabase.rpc(
    "release_order_stock",
    { p_order_id: orderId },
  );

  if (releaseError) throw new Error(releaseError.message);

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  await notifyOrder(orderId, "cancelled");
  refreshOrderPages();
}
