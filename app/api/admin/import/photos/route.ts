import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ALBUMS_PER_REQUEST = 20;
const MAX_IMAGES_PER_PRODUCT = 10;
const PAGE_CONCURRENCY = 4;

const AlbumSchema = z.object({
  albumId: z.string().regex(/^\d+$/),
  sourceUrl: z
    .string()
    .url()
    .refine(
      (value) => {
        try {
          return new URL(value).hostname.toLowerCase().endsWith(".x.yupoo.com");
        } catch {
          return false;
        }
      },
      "El álbum debe pertenecer a Yupoo."
    ),
});

const RequestSchema = z.object({
  albums: z.array(AlbumSchema).min(1).max(MAX_ALBUMS_PER_REQUEST),
});

function proxyImageUrl(sourceUrl: string, refererUrl: string) {
  const source = Buffer.from(sourceUrl, "utf8").toString("hex");
  const referer = Buffer.from(refererUrl, "utf8").toString("hex");
  return `/api/yupoo-image?u=${source}&r=${referer}`;
}

function normalizeImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const absolute = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  try {
    const url = new URL(absolute);
    if (url.hostname.toLowerCase() !== "photo.yupoo.com") return null;

    // data-origin-src suele ser la foto grande. Si llega una variante conocida,
    // preferimos "large" para dar detalle sin usar originales enormes.
    url.pathname = url.pathname.replace(
      /\/(?:small|medium|original)\.(jpg|jpeg|png|webp)$/i,
      "/large.$1"
    );

    return url.toString();
  } catch {
    return null;
  }
}

async function scrapeAlbumImages(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  sourceUrl: string
) {
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
    });

    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.7",
      Referer: sourceUrl,
    });

    const networkImages: string[] = [];

    page.on("request", (request) => {
      const url = request.url();

      if (
        url.includes("photo.yupoo.com") &&
        /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(url)
      ) {
        networkImages.push(url);
      }
    });

    await page.goto(sourceUrl, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let previousHeight = 0;
        let stableRounds = 0;

        const timer = window.setInterval(() => {
          window.scrollBy(0, 700);

          const currentHeight = document.documentElement.scrollHeight;

          if (currentHeight === previousHeight) {
            stableRounds += 1;
          } else {
            stableRounds = 0;
            previousHeight = currentHeight;
          }

          const reachedBottom =
            window.innerHeight + window.scrollY >= currentHeight - 100;

          if (reachedBottom && stableRounds >= 3) {
            window.clearInterval(timer);
            resolve();
          }
        }, 250);

        window.setTimeout(() => {
          window.clearInterval(timer);
          resolve();
        }, 10_000);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const domImages = await page.evaluate(() => {
      const urls: string[] = [];

      for (const img of Array.from(document.images)) {
        const candidates = [
          img.getAttribute("data-origin-src"),
          img.getAttribute("data-original"),
          img.getAttribute("data-src"),
          img.getAttribute("data-lazy"),
          img.currentSrc,
          img.src,
        ];

        for (const candidate of candidates) {
          if (!candidate) continue;

          if (candidate.includes("photo.yupoo.com")) {
            urls.push(candidate);
            break;
          }
        }
      }

      return urls;
    });

    const html = await page.content();
    const htmlImages =
      html
        .replace(/\\\//g, "/")
        .match(
          /(?:https?:)?\/\/photo\.yupoo\.com\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi
        ) ?? [];

    const candidates = [...networkImages, ...domImages, ...htmlImages];

    const unique: string[] = [];
    const seen = new Set<string>();

    for (const raw of candidates) {
      const normalized = normalizeImageUrl(raw);
      if (!normalized) continue;
      if (/logo|avatar|qrcode|qr-code|weibo/i.test(normalized)) continue;
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      unique.push(normalized);

      if (unique.length >= MAX_IMAGES_PER_PRODUCT) break;
    }

    return unique;
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      () => run()
    )
  );

  return results;
}


export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const PAGE_SIZE = 1000;
    let from = 0;
    const albums: Array<{ albumId: string; sourceUrl: string }> = [];
    const seen = new Set<string>();

    while (true) {
      const { data, error } = await supabase
        .from("products")
        .select("supplier_url")
        .not("supplier_url", "is", null)
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw new Error(error.message);

      const rows = data ?? [];

      for (const row of rows as Array<{ supplier_url: string | null }>) {
        const sourceUrl = row.supplier_url?.trim();
        if (!sourceUrl) continue;

        const match = sourceUrl.match(/\/albums\/(\d+)/i);
        if (!match) continue;

        if (seen.has(sourceUrl)) continue;
        seen.add(sourceUrl);

        albums.push({
          albumId: match[1],
          sourceUrl,
        });
      }

      if (rows.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return NextResponse.json(
      {
        total: albums.length,
        albums,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error leyendo productos para actualizar fotos:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron leer los productos existentes.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const { supabase } = await requireAdmin();
    const body = RequestSchema.parse(await request.json());

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const scraped = await mapWithConcurrency(
      body.albums,
      PAGE_CONCURRENCY,
      async (album) => {
        try {
          const images = await scrapeAlbumImages(browser!, album.sourceUrl);
          return { ...album, images, error: null as string | null };
        } catch (error) {
          return {
            ...album,
            images: [] as string[],
            error:
              error instanceof Error
                ? error.message
                : "No se pudo leer el álbum.",
          };
        }
      }
    );

  const { data: products, error: productsError } = await supabase
  .from("products")
  .select("id,supplier_url");

    if (productsError) throw new Error(productsError.message);

    const productByUrl = new Map(
      (products ?? [])
        .filter(
          (row: { id: string; supplier_url: string | null }) =>
            Boolean(row.supplier_url)
        )
        .map((row: { id: string; supplier_url: string | null }) => [
          row.supplier_url!,
          row.id,
        ])
    );

    let updated = 0;
    let imagesSaved = 0;
    let withoutProduct = 0;
    let withoutImages = 0;

    const details: Array<{
      albumId: string;
      sourceUrl: string;
      images: number;
      updated: boolean;
      error: string | null;
    }> = [];

    for (const album of scraped) {
     const productId = productByAlbum.get(album.albumId);
      if (!productId) {
        withoutProduct += 1;
        details.push({
          albumId: album.albumId,
          sourceUrl: album.sourceUrl,
          images: album.images.length,
          updated: false,
          error: album.error ?? "Producto no localizado en Supabase.",
        });
        continue;
      }

      if (!album.images.length) {
        withoutImages += 1;
        details.push({
          albumId: album.albumId,
          sourceUrl: album.sourceUrl,
          images: 0,
          updated: false,
          error: album.error ?? "Yupoo no devolvió imágenes.",
        });
        continue;
      }

      const proxied = album.images.map((image) =>
        proxyImageUrl(image, album.sourceUrl)
      );

      // Solo borramos la galería anterior después de haber obtenido imágenes.
      // Si Yupoo falla, la portada existente queda intacta.
      const { error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);

      if (deleteError) throw new Error(deleteError.message);

      const { error: insertError } = await supabase
        .from("product_images")
        .insert(
          proxied.map((url, position) => ({
            product_id: productId,
            url,
            position,
          }))
        );

      if (insertError) throw new Error(insertError.message);

      updated += 1;
      imagesSaved += proxied.length;

      details.push({
        albumId: album.albumId,
        sourceUrl: album.sourceUrl,
        images: proxied.length,
        updated: true,
        error: null,
      });
    }

    return NextResponse.json(
      {
        updated,
        imagesSaved,
        withoutProduct,
        withoutImages,
        details,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Revisa los álbumes enviados al importador de fotos.",
        },
        { status: 400 }
      );
    }

    console.error("Error importando galerías de Yupoo:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron importar las galerías.",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
