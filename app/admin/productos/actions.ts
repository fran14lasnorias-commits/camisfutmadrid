"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ProductAdminSchema } from "@/lib/admin-products";

const ProductIdsSchema = z
  .array(z.string().uuid())
  .min(1, "Selecciona al menos un producto.")
  .max(2000, "Puedes gestionar como máximo 2.000 productos cada vez.");

const BULK_BATCH_SIZE = 100;

function splitIntoBatches<T>(items: T[], size = BULK_BATCH_SIZE) {
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

function refreshProductPages() {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/admin/stock");
}

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

  if (error || !product) {
    throw new Error(error?.message ?? "No se pudo crear el producto");
  }

  if (parsed.images.length) {
    const { error: imageError } = await supabase
      .from("product_images")
      .insert(
        parsed.images.map((url, position) => ({
          product_id: product.id,
          url,
          position,
        }))
      );

    if (imageError) throw new Error(imageError.message);
  }

  const { error: variantError } = await supabase
    .from("product_variants")
    .insert(
      parsed.variants.map((variant) => ({
        product_id: product.id,
        size: variant.size,
        stock: variant.stock,
      }))
    );

  if (variantError) throw new Error(variantError.message);

  refreshProductPages();

  return { id: product.id };
}

export async function updateProduct(productId: string, input: unknown) {
  const parsed = ProductAdminSchema.parse(input);
  const id = z.string().uuid().parse(productId);
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
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: deleteImagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", id);

  if (deleteImagesError) throw new Error(deleteImagesError.message);

  if (parsed.images.length) {
    const { error: imageError } = await supabase
      .from("product_images")
      .insert(
        parsed.images.map((url, position) => ({
          product_id: id,
          url,
          position,
        }))
      );

    if (imageError) throw new Error(imageError.message);
  }

  const { error: deleteVariantsError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", id);

  if (deleteVariantsError) throw new Error(deleteVariantsError.message);

  const { error: variantError } = await supabase
    .from("product_variants")
    .insert(
      parsed.variants.map((variant) => ({
        product_id: id,
        size: variant.size,
        stock: variant.stock,
      }))
    );

  if (variantError) throw new Error(variantError.message);

  refreshProductPages();
}

export async function deleteProduct(productId: string) {
  const id = z.string().uuid().parse(productId);
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  refreshProductPages();
}

export async function bulkSetProductsPublished(
  productIds: unknown,
  published: boolean
) {
  const ids = ProductIdsSchema.parse(productIds);
  const { supabase } = await requireAdmin();
  const updatedAt = new Date().toISOString();

  let updated = 0;

  for (const batch of splitIntoBatches(ids)) {
    const { data, error } = await supabase
      .from("products")
      .update({
        published,
        updated_at: updatedAt,
      })
      .in("id", batch)
      .select("id");

    if (error) {
      throw new Error(
        `No se pudo actualizar una tanda de productos: ${error.message}`
      );
    }

    updated += data?.length ?? 0;
  }

  refreshProductPages();

  return {
    updated,
    published,
  };
}

export async function bulkDeleteProducts(productIds: unknown) {
  const ids = ProductIdsSchema.parse(productIds);
  const { supabase } = await requireAdmin();

  let deleted = 0;

  for (const batch of splitIntoBatches(ids)) {
    const { data, error } = await supabase
      .from("products")
      .delete()
      .in("id", batch)
      .select("id");

    if (error) {
      throw new Error(
        `No se pudo eliminar una tanda de productos: ${error.message}`
      );
    }

    deleted += data?.length ?? 0;
  }

  refreshProductPages();

  return {
    deleted,
  };
}
