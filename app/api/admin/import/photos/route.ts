import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import chromium from "@sparticuz/chromium-min";
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
    const hostname = url.hostname.toLowerCase();

if (
  hostname !== "yupoo.com" &&
  !hostname.endsWith(".yupoo.com")
) {
  return null;
}
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

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.7",
      Referer: sourceUrl,
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    const networkImages: string[] = [];

    page.on("request", (request) => {
      const requestUrl = request.url();
      const resourceType = request.resourceType();

      if (
        resourceType === "image" &&
        requestUrl.toLowerCase().includes("yupoo.com")
      ) {
        networkImages.push(requestUrl);
      }
    });

    const response = await page.goto(sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });

    if (response && response.status() >= 400) {
      throw new Error(
        `Yupoo respondió HTTP ${response.status()} al abrir el álbum.`
      );
    }

    const albumSelector =
      ".showalbum__children img, .image__main img, .showalbum__image img";

    await page
      .waitForSelector(albumSelector, { timeout: 10_000 })
      .catch(() => null);

    // Forzar lazy-loading de las fotos del álbum.
    await page.evaluate(async (selector) => {
      const sleep = (ms: number) =>
        new Promise<void>((resolve) => window.setTimeout(resolve, ms));

      for (let round = 0; round < 5; round += 1) {
        const images = Array.from(
          document.querySelectorAll<HTMLImageElement>(selector)
        );

        for (const image of images) {
          image.scrollIntoView({
            block: "center",
            inline: "nearest",
          });
          await sleep(80);
        }

        window.scrollTo(0, document.documentElement.scrollHeight);
        await sleep(500);
      }

      window.scrollTo(0, 0);
      await sleep(300);
    }, albumSelector);

    const selectorImages = await page.$$eval(albumSelector, (images) => {
      const urls: string[] = [];

      for (const image of images as HTMLImageElement[]) {
        const candidates = [
          image.getAttribute("data-origin-src"),
          image.getAttribute("data-original"),
          image.getAttribute("data-src"),
          image.getAttribute("data-lazy"),
          image.currentSrc,
          image.src,
        ];

        for (const candidate of candidates) {
          if (candidate) urls.push(candidate);
        }

        for (const srcset of [
          image.getAttribute("data-srcset"),
          image.getAttribute("srcset"),
        ]) {
          if (!srcset) continue;

          for (const part of srcset.split(",")) {
            const candidate = part.trim().split(/\s+/)[0];
            if (candidate) urls.push(candidate);
          }
        }
      }

      return urls;
    });

    // Respaldo: todas las imágenes del DOM + recursos cargados.
    const fallbackImages = await page.evaluate(() => {
      const urls: string[] = [];

      for (const image of Array.from(document.images)) {
        for (const candidate of [
          image.getAttribute("data-origin-src"),
          image.getAttribute("data-original"),
          image.getAttribute("data-src"),
          image.getAttribute("data-lazy"),
          image.currentSrc,
          image.src,
        ]) {
          if (candidate) urls.push(candidate);
        }

        for (const srcset of [
          image.getAttribute("data-srcset"),
          image.getAttribute("srcset"),
        ]) {
          if (!srcset) continue;

          for (const part of srcset.split(",")) {
            const candidate = part.trim().split(/\s+/)[0];
            if (candidate) urls.push(candidate);
          }
        }
      }

      for (const entry of performance.getEntriesByType("resource")) {
        const name = (entry as PerformanceResourceTiming).name;
        if (name) urls.push(name);
      }

      return urls;
    });

    // Último respaldo: URLs de imágenes embebidas en el HTML,
    // aceptando cualquier subdominio de Yupoo, no solo photo.yupoo.com.
    const html = await page.content();
    const htmlImages =
      html
        .replace(/\\\//g, "/")
        .match(
          /(?:https?:)?\/\/[^"'<>\\\s]*yupoo\.com\/[^"'<>\\\s]+?(?:\.(?:jpg|jpeg|png|webp))(?:\?[^"'<>\\\s]*)?/gi
        ) ?? [];

    const candidates = [
      ...selectorImages,
      ...networkImages,
      ...fallbackImages,
      ...htmlImages,
    ];

    const unique: string[] = [];
    const seen = new Set<string>();

    for (const raw of candidates) {
      const normalized = normalizeImageUrl(raw);
      if (!normalized) continue;

      if (
        /logo|avatar|qrcode|qr-code|weibo|favicon|sprite|icon/i.test(
          normalized
        )
      ) {
        continue;
      }

      if (seen.has(normalized)) continue;

      seen.add(normalized);
      unique.push(normalized);

      if (unique.length >= MAX_IMAGES_PER_PRODUCT) break;
    }

    if (!unique.length) {
      const diagnostic = await page.evaluate((selector) => {
        return {
          title: document.title,
          finalUrl: location.href,
          selectorImages: document.querySelectorAll(selector).length,
          allImages: document.images.length,
          bodyText: document.body?.innerText?.slice(0, 250) ?? "",
        };
      }, albumSelector);

      throw new Error(
        `Yupoo abrió el álbum pero no detectó fotos ` +
          `(selector=${diagnostic.selectorImages}, img=${diagnostic.allImages}, ` +
          `título="${diagnostic.title}", url="${diagnostic.finalUrl}").`
      );
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

    let productFrom = 0;
    const products: Array<{ id: string; albumId: string; sourceUrl: string }> = [];
    const seenAlbumIds = new Set<string>();

    while (true) {
      const { data, error } = await supabase
        .from("products")
        .select("id,supplier_url")
        .not("supplier_url", "is", null)
        .order("id", { ascending: true })
        .range(productFrom, productFrom + PAGE_SIZE - 1);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<{ id: string; supplier_url: string | null }>;

      for (const row of rows) {
        const sourceUrl = row.supplier_url?.trim();
        if (!sourceUrl) continue;

        const match = sourceUrl.match(/\/albums\/(\d+)/i);
        if (!match) continue;

        const albumId = match[1];
        if (seenAlbumIds.has(albumId)) continue;
        seenAlbumIds.add(albumId);

        products.push({ id: row.id, albumId, sourceUrl });
      }

      if (rows.length < PAGE_SIZE) break;
      productFrom += PAGE_SIZE;
    }

    let imageFrom = 0;
    const imageCountByProduct = new Map<string, number>();

    while (true) {
      const { data, error } = await supabase
        .from("product_images")
        .select("product_id")
        .order("product_id", { ascending: true })
        .range(imageFrom, imageFrom + PAGE_SIZE - 1);

      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<{ product_id: string }>;

      for (const row of rows) {
        imageCountByProduct.set(
          row.product_id,
          (imageCountByProduct.get(row.product_id) ?? 0) + 1
        );
      }

      if (rows.length < PAGE_SIZE) break;
      imageFrom += PAGE_SIZE;
    }

    const albums = products.map((product) => {
      const imageCount = imageCountByProduct.get(product.id) ?? 0;
      return {
        albumId: product.albumId,
        sourceUrl: product.sourceUrl,
        imageCount,
        completed: imageCount >= 2,
      };
    });

    const completed = albums.filter((album) => album.completed).length;
    const pending = albums.length - completed;
    const imagesSaved = albums.reduce((sum, album) => sum + album.imageCount, 0);

    return NextResponse.json(
      { total: albums.length, completed, pending, imagesSaved, albums },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Error leyendo progreso real de galerías:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el progreso real de las galerías.",
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
      executablePath: await chromium.executablePath(
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar"
),
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

    const PRODUCT_PAGE_SIZE = 1000;
    let productFrom = 0;
    const productByAlbum = new Map<string, string>();

    while (true) {
      const { data: productRows, error: productsError } = await supabase
        .from("products")
        .select("id,supplier_url")
        .not("supplier_url", "is", null)
        .order("id", { ascending: true })
        .range(productFrom, productFrom + PRODUCT_PAGE_SIZE - 1);

      if (productsError) {
        throw new Error(productsError.message);
      }

      const rows =
        (productRows ?? []) as Array<{
          id: string;
          supplier_url: string | null;
        }>;

      for (const product of rows) {
        if (!product.supplier_url) continue;

        const match = product.supplier_url.match(/\/albums\/(\d+)/i);
        if (!match) continue;

        productByAlbum.set(match[1], product.id);
      }

      if (rows.length < PRODUCT_PAGE_SIZE) break;
      productFrom += PRODUCT_PAGE_SIZE;
    }

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
