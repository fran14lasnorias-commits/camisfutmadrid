"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ProductAdminSchema } from "@/lib/admin-products";

export async function createProduct(input: unknown) {
  const parsed = ProductAdminSchema.parse(input);
  const { supabase } = await requireAdmin();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug: parsed.slug,
      name: parsed.name,
      team: parsed.team,
      season: parsed.season || null,
      type: parsed.type,
      price_eur: parsed.priceEur,
      supplier_cost_usd: parsed.supplierCostUsd,
      description: parsed.description || null,
      supplier_url: parsed.supplierUrl || null,
      published: parsed.published,
    })
    .select("id")
    .single();

  if (error || !product) throw new Error(error?.message ?? "No se pudo crear el producto");

  if (parsed.images.length) {
    const { error: imageError } = await supabase.from("product_images").insert(
      parsed.images.map((url, position) => ({
        product_id: product.id,
        url,
        position,
      }))
    );
    if (imageError) throw new Error(imageError.message);
  }

  const { error: variantError } = await supabase.from("product_variants").insert(
    parsed.variants.map(variant => ({
      product_id: product.id,
      size: variant.size,
      stock: variant.stock,
    }))
  );
  if (variantError) throw new Error(variantError.message);

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");

  return { id: product.id };
}

export async function updateProduct(productId: string, input: unknown) {
  const parsed = ProductAdminSchema.parse(input);
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .update({
      slug: parsed.slug,
      name: parsed.name,
      team: parsed.team,
      season: parsed.season || null,
      type: parsed.type,
      price_eur: parsed.priceEur,
      supplier_cost_usd: parsed.supplierCostUsd,
      description: parsed.description || null,
      supplier_url: parsed.supplierUrl || null,
      published: parsed.published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await supabase.from("product_images").delete().eq("product_id", productId);
  if (parsed.images.length) {
    await supabase.from("product_images").insert(
      parsed.images.map((url, position) => ({
        product_id: productId,
        url,
        position,
      }))
    );
  }

  await supabase.from("product_variants").delete().eq("product_id", productId);
  await supabase.from("product_variants").insert(
    parsed.variants.map(variant => ({
      product_id: productId,
      size: variant.size,
      stock: variant.stock,
    }))
  );

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/productos");
}
