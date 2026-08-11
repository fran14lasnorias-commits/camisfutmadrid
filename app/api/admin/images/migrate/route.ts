import { NextResponse } from "next/server";
import {
  createClient as createServiceClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "product-images";
const BATCH_SIZE = 16;
const CONCURRENCY = 4;

const RequestSchema = z.object({
  mode: z.enum(["covers", "all"]).default("covers"),
});

type ImageRow = {
  product_id: string;
  url: string;
  position: number;
};

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createServiceClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function decodeHex(value: string | null) {
  if (!value || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    return null;
  }

  try {
    return Buffer.from(value, "hex").toString("utf8");
  } catch {
    return null;
  }
}

function sourceFromStoredUrl(storedUrl: string): {
  sourceUrl: string;
  refererUrl: string | null;
} | null {
  if (storedUrl.startsWith("/api/yupoo-image?")) {
    const params = new URLSearchParams(storedUrl.split("?")[1] ?? "");
    const sourceUrl = decodeHex(params.get("u"));
    const refererUrl = decodeHex(params.get("r"));

    if (!sourceUrl) return null;

    return {
      sourceUrl,
      refererUrl,
    };
  }

  if (/^https:\/\/photo\.yupoo\.com\//i.test(storedUrl)) {
    return {
      sourceUrl: storedUrl,
      refererUrl: "https://y199111.x.yupoo.com/",
    };
  }

  return null;
}

function extensionFrom(contentType: string, sourceUrl: string) {
  const lower = contentType.toLowerCase();

  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("avif")) return "avif";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";

  try {
    const path = new URL(sourceUrl).pathname.toLowerCase();
    const match = path.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i);
    if (match) return match[1] === "jpeg" ? "jpg" : match[1];
  } catch {}

  return "jpg";
}

async function ensureBucket(service: SupabaseClient) {
  const { data, error } = await service.storage.getBucket(BUCKET);

  if (!error && data) return;

  const { error: createError } = await service.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ],
  });

  if (
    createError &&
    !/already exists|duplicate/i.test(createError.message)
  ) {
    throw new Error(`No se pudo preparar Storage: ${createError.message}`);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run())
  );

  return results;
}

async function migrateOne(service: SupabaseClient, image: ImageRow) {
  const source = sourceFromStoredUrl(image.url);

  if (!source) {
    return {
      ok: false as const,
      skipped: true as const,
      error: "La URL ya no es una imagen de Yupoo migrable.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const upstream = await fetch(source.sourceUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...(source.refererUrl ? { Referer: source.refererUrl } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      throw new Error(`Yupoo HTTP ${upstream.status}`);
    }

    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";

    if (!contentType.startsWith("image/")) {
      throw new Error("Yupoo no devolvió una imagen.");
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());

    if (!buffer.length) {
      throw new Error("La imagen llegó vacía.");
    }

    const extension = extensionFrom(contentType, source.sourceUrl);

    const storagePath = `yupoo/${image.product_id}/${String(
      image.position
    ).padStart(2, "0")}.${extension}`;

    const { error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage: ${uploadError.message}`);
    }

    const { data: publicData } = service.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await service
      .from("product_images")
      .update({ url: publicUrl })
      .eq("product_id", image.product_id)
      .eq("position", image.position)
      .eq("url", image.url);

    if (updateError) {
      throw new Error(`BD: ${updateError.message}`);
    }

    return {
      ok: true as const,
      skipped: false as const,
      url: publicUrl,
      bytes: buffer.length,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function countPending(
  service: SupabaseClient,
  mode: "covers" | "all"
) {
  let query = service
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .or("url.like./api/yupoo-image?%,url.like.https://photo.yupoo.com/%");

  if (mode === "covers") {
    query = query.eq("position", 0);
  }

  const { count, error } = await query;

  if (error) throw new Error(error.message);

  return count ?? 0;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const service = serviceClient();
    const { searchParams } = new URL(request.url);

    const mode =
      searchParams.get("mode") === "all" ? "all" : "covers";

    const pending = await countPending(service, mode);

    return NextResponse.json(
      { pending, mode },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar la migración.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const service = serviceClient();
    const parsed = RequestSchema.parse(await request.json());
    const mode = parsed.mode;

    await ensureBucket(service);

    let query = service
      .from("product_images")
      .select("product_id,url,position")
      .or("url.like./api/yupoo-image?%,url.like.https://photo.yupoo.com/%")
      .order("product_id", { ascending: true })
      .order("position", { ascending: true })
      .limit(BATCH_SIZE);

    if (mode === "covers") {
      query = query.eq("position", 0);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as ImageRow[];

    if (!rows.length) {
      return NextResponse.json({
        done: true,
        mode,
        processed: 0,
        migrated: 0,
        failed: 0,
        pending: 0,
      });
    }

    const results = await mapWithConcurrency(
      rows,
      CONCURRENCY,
      async (row) => {
        try {
          return await migrateOne(service, row);
        } catch (error) {
          return {
            ok: false as const,
            skipped: false as const,
            error:
              error instanceof Error
                ? error.message
                : "No se pudo migrar la imagen.",
          };
        }
      }
    );

    const migrated = results.filter((result) => result.ok).length;

    const failed = results.filter(
      (result) => !result.ok && !result.skipped
    ).length;

    const pending = await countPending(service, mode);

    return NextResponse.json(
      {
        done: pending === 0,
        mode,
        processed: rows.length,
        migrated,
        failed,
        pending,
        errors: results
          .filter((result) => !result.ok)
          .slice(0, 5)
          .map((result) => result.error),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error migrando imágenes a Supabase Storage:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron migrar las imágenes.",
      },
      { status: 500 }
    );
  }
}
