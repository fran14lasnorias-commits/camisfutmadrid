"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import { sendOrderStatusEmail } from "@/lib/email";

const allowedStatuses = new Set([
  "pending","paid","preparing","packed","shipped","delivered","cancelled"
]);

async function notifyOrder(orderId: string, status: string) {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession:false } }
  );

  const { data: order } = await service
    .from("orders")
    .select("id,number,total_eur,shipping_address")
    .eq("id",orderId)
    .single();

  const address = order?.shipping_address as any;
  if (!order || !address?.email) return;

  await sendOrderStatusEmail({
    supabase:service,
    orderId:order.id,
    orderNumber:order.number,
    recipient:address.email,
    customerName:address.fullName ?? "cliente",
    totalEur:Number(order.total_eur),
    status,
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  if (!allowedStatuses.has(status)) throw new Error("Estado no permitido");
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  await notifyOrder(orderId,status);
  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
}

export async function confirmTransfer(orderId: string, reference?: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc("confirm_transfer_payment", {
    p_order_id: orderId,
    p_reference: reference || null,
  });

  if (error) throw new Error(error.message);
  await notifyOrder(orderId,"paid");
  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
}

export async function cancelOrderAndReleaseStock(orderId: string) {
  const { supabase } = await requireAdmin();

  const { error: releaseError } = await supabase.rpc("release_order_stock", {
    p_order_id: orderId,
  });
  if (releaseError) throw new Error(releaseError.message);

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
  await notifyOrder(orderId,"cancelled");
  revalidatePath("/admin/pedidos");
  revalidatePath("/cuenta");
}
