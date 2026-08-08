import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_ALBUM =
  "https://y199111.x.yupoo.com/albums/242772491?uid=1&isSubCate=false&referrercate=";

function normalizeUrl(value: string) {
  const cleaned = value
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&quot;/g, '"')
    .trim();

  if (cleaned.startsWith("//")) return `https:${cleaned}`;

  if (cleaned.startsWith("/")) {
    return `https://y199111.x.yupoo.com${cleaned}`;
  }

  return cleaned;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function extractPhotoUrls(html: string) {
  const cleaned = html
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&quot;/g, '"');

  const hits: string[] = [];

  const patterns = [
    /(?:https?:)?\/\/photo\.yupoo\.com\/[A-Za-z0-9_%./?=&+\-]+/g,
    /(?:https?:)?\/\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\\s]*)?/gi,
  ];

  for (const pattern of patterns) {
    for (const match of cleaned.match(pattern) ?? []) {
      const normalized = normalizeUrl(match);

      if (!/^https?:\/\//i.test(normalized)) continue;
      if (/logo|avatar|qrcode|qr-code|weibo/i.test(normalized)) continue;

      hits.push(normalized);
    }
  }

  const attrPattern =
    /(?:src|data-src|data-origin-src|data-original|data-lazy|data-img)=["']([^"']+)["']/gi;

  for (const match of cleaned.matchAll(attrPattern)) {
    const raw = match[1];
    const normalized = normalizeUrl(raw);

    if (!/^https?:\/\//i.test(normalized)) continue;
    if (!/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(normalized)) continue;
    if (/logo|avatar|qrcode|qr-code|weibo/i.test(normalized)) continue;

    hits.push(normalized);
  }

  return unique(hits);
}

function findInterestingFragments(html: string) {
  const cleaned = html.replace(/\\\//g, "/");

  const needles = [
    "photo.yupoo.com",
    "image",
    "images",
    "photo",
    "photos",
    "album",
    "pic",
    "src",
    "data-src",
    "__NEXT_DATA__",
    "__NUXT__",
    "window.__",
  ];

  const fragments: string[] = [];

  for (const needle of needles) {
    let from = 0;
    let foundForNeedle = 0;

    while (foundForNeedle < 4) {
      const index = cleaned.toLowerCase().indexOf(needle.toLowerCase(), from);

      if (index === -1) break;

      const start = Math.max(0, index - 260);
      const end = Math.min(cleaned.length, index + 700);

      fragments.push(cleaned.slice(start, end));
      foundForNeedle += 1;
      from = index + needle.length;
    }
  }

  return unique(fragments).slice(0, 20);
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const album = searchParams.get("url") || DEFAULT_ALBUM;

    let parsed: URL;

    try {
      parsed = new URL(album);
    } catch {
      return NextResponse.json(
        { error: "La URL del álbum no es válida." },
        { status: 400 }
      );
    }

    if (!parsed.hostname.toLowerCase().endsWith(".x.yupoo.com")) {
      return NextResponse.json(
        { error: "La URL debe pertenecer a un álbum de Yupoo." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let response: Response;

    try {
      response = await fetch(album, {
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.7",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36",
          Referer: "https://y199111.x.yupoo.com/",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    const html = await response.text();
    const photos = extractPhotoUrls(html);

    const contentType = response.headers.get("content-type");
    const server = response.headers.get("server");

    return NextResponse.json(
      {
        ok: response.ok,
        requestedUrl: album,
        finalUrl: response.url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        server,
        htmlLength: html.length,
        title:
          html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null,
        photoCount: photos.length,
        photos: photos.slice(0, 30),
        interestingFragments: findInterestingFragments(html),
        firstHtmlChars: html.slice(0, 1500),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Yupoo debug error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo analizar el álbum de Yupoo.",
      },
      { status: 500 }
    );
  }
}
