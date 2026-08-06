import { z } from "zod";

const MAX_ALBUMS_PER_BATCH = 50;

export const YupooCatalogRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((value) => {
      try {
        const hostname = new URL(value).hostname.toLowerCase();
        return hostname.endsWith(".x.yupoo.com");
      } catch {
        return false;
      }
    }, "La dirección debe pertenecer a un catálogo público de Yupoo."),
  page: z.number().int().min(1).max(500).default(1),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_ALBUMS_PER_BATCH)
    .default(25),
});

export type YupooAlbumSummary = {
  albumId: string;
  sourceUrl: string;
  title: string;
  coverImage: string | null;
  eligible: boolean;
  exclusionReason: string | null;
};

export type YupooCatalogBatch = {
  catalogUrl: string;
  page: number;
  discovered: number;
  eligible: YupooAlbumSummary[];
  excluded: YupooAlbumSummary[];
  warnings: string[];
};

const EXCLUDED_PATTERNS: Array<[RegExp, string]> = [
  [/\b(baby|babies|infant)\b/i, "Producto para bebé"],
  [/\b(kids?|children|youth)\b/i, "Producto infantil"],
  [/\b(women|woman|ladies|crop\s*top|vest)\b/i, "Modelo de mujer"],
  [/\b(shorts?|socks?)\b/i, "No es una camiseta"],
  [/\b(training|tracksuit|windbreaker|jacket|coat|hoodie|down\s*jacket|thermal)\b/i, "Prenda de entrenamiento o abrigo"],
  [/\b(polo|t-?shirt)\b/i, "Polo o camiseta casual"],
  [/\b(jewellery|jewelry|nba|rugby|f1)\b/i, "Categoría distinta de fútbol"],
];

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCharCode(Number(number))
    )
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function readAttribute(markup: string, attribute: string) {
  const pattern = new RegExp(
    `${attribute}\\s*=\\s*["']([^"']+)["']`,
    "i"
  );

  return pattern.exec(markup)?.[1] ?? null;
}

function absoluteUrl(baseUrl: string, value: string | null) {
  if (!value) return null;

  const cleaned = decodeHtml(value).replaceAll("\\/", "/");

  if (cleaned.startsWith("//")) {
    return `https:${cleaned}`;
  }

  try {
    return new URL(cleaned, baseUrl).toString();
  } catch {
    return null;
  }
}

function buildPageUrl(rawUrl: string, page: number) {
  const url = new URL(rawUrl);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function classifyTitle(title: string) {
  for (const [pattern, reason] of EXCLUDED_PATTERNS) {
    if (pattern.test(title)) {
      return {
        eligible: false,
        exclusionReason: reason,
      };
    }
  }

  const looksLikeJersey =
    /\b(jersey|goalkeeper|gk|retro|player\s*version|home|away|third)\b/i.test(
      title
    );

  return {
    eligible: looksLikeJersey,
    exclusionReason: looksLikeJersey
      ? null
      : "No se ha identificado claramente como camiseta de fútbol",
  };
}

function parseCatalogPage(
  html: string,
  pageUrl: string
): YupooAlbumSummary[] {
  const albums = new Map<string, YupooAlbumSummary>();

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = match[1];
    const content = match[2];
    const href = readAttribute(attributes, "href");

    if (!href) continue;

    const albumMatch = href.match(/\/albums\/(\d+)/i);
    if (!albumMatch) continue;

    const albumId = albumMatch[1];
    if (albums.has(albumId)) continue;

    const imageMarkup = content.match(/<img\b([^>]*)>/i)?.[1] ?? "";
    const title =
      readAttribute(attributes, "title") ??
      readAttribute(content, "data-title") ??
      readAttribute(imageMarkup, "alt") ??
      stripTags(content);

    const cleanTitle = stripTags(title || "");

    if (!cleanTitle || cleanTitle.length < 3) continue;

    const coverCandidate =
      readAttribute(imageMarkup, "data-origin-src") ??
      readAttribute(imageMarkup, "data-src") ??
      readAttribute(imageMarkup, "src");

    const classification = classifyTitle(cleanTitle);

    albums.set(albumId, {
      albumId,
      sourceUrl: absoluteUrl(pageUrl, href) ?? href,
      title: cleanTitle,
      coverImage: absoluteUrl(pageUrl, coverCandidate),
      ...classification,
    });
  }

  return [...albums.values()];
}

async function fetchCatalogHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CamisfutMadridCatalogImporter/1.0)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Yupoo ha respondido con el estado ${response.status}.`
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Yupoo ha tardado demasiado en responder. Prueba otra vez."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function readYupooCatalogBatch(input: unknown) {
  const parsed = YupooCatalogRequestSchema.parse(input);
  const pageUrl = buildPageUrl(parsed.url, parsed.page);
  const html = await fetchCatalogHtml(pageUrl);
  const albums = parseCatalogPage(html, pageUrl);

  const eligible = albums
    .filter((album) => album.eligible)
    .slice(0, parsed.limit);

  const excluded = albums.filter((album) => !album.eligible);

  const warnings: string[] = [];

  if (!albums.length) {
    warnings.push(
      "No se han detectado álbumes. Yupoo puede haber bloqueado temporalmente la lectura."
    );
  }

  if (albums.length > eligible.length) {
    warnings.push(
      "Se han separado automáticamente productos infantiles, de mujer, entrenamiento y otras categorías."
    );
  }

  return {
    catalogUrl: parsed.url,
    page: parsed.page,
    discovered: albums.length,
    eligible,
    excluded,
    warnings,
  } satisfies YupooCatalogBatch;
}
