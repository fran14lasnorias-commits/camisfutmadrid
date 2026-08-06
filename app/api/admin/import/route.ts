import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ImportRequestSchema, buildImportDraft } from "@/lib/importer";
import { slugify } from "@/lib/admin-products";
import {
  readYupooCatalogBatch,
  YupooCatalogRequestSchema,
} from "@/lib/yupoo-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CatalogAlbumSchema = z.object({
  albumId: z.string().regex(/^\d+$/),
  sourceUrl: z
    .string()
    .url()
    .refine((value) => {
      try {
        return new URL(value).hostname.toLowerCase().endsWith(".x.yupoo.com");
      } catch {
        return false;
      }
    }, "El álbum debe pertenecer a Yupoo."),
  title: z.string().trim().min(3).max(240),
  coverImage: z
    .string()
    .url()
    .nullable()
    .refine((value) => {
      if (!value) return true;

      try {
        return new URL(value).hostname.toLowerCase() === "photo.yupoo.com";
      } catch {
        return false;
      }
    }, "La portada debe pertenecer a Yupoo."),
});

const CatalogSaveSchema = z.object({
  mode: z.literal("catalog-save"),
  albums: z.array(CatalogAlbumSchema).min(1).max(50),
});

type CatalogAlbum = z.infer<typeof CatalogAlbumSchema>;
type ProductType = "fan" | "player" | "retro";

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];

async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { error: "La sesión ha caducado. Vuelve a iniciar sesión." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "No se pudo comprobar el rol del importador:",
      profileError.message
    );

    return {
      response: NextResponse.json(
        { error: "No se pudo comprobar el permiso de administrador." },
        { status: 500 }
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "No tienes permiso para utilizar este importador." },
        { status: 403 }
      ),
    };
  }

  return { user, supabase };
}

function detectType(title: string): ProductType {
  const value = title.toLowerCase();

  if (/\bplayer(?:\s+version)?\b/.test(value)) return "player";
  if (/\bretro\b/.test(value)) return "retro";

  return "fan";
}

function detectSeason(title: string) {
  const fourDigit = title.match(/\b(20\d{2})\s*[/\- ]\s*(\d{2,4})\b/);

  if (fourDigit) {
    return `${fourDigit[1]}/${fourDigit[2].slice(-2)}`;
  }

  const twoDigit = title.match(/\b(2\d)\s*[/\- ]\s*(2\d)\b/);

  if (twoDigit) {
    return `20${twoDigit[1]}/${twoDigit[2]}`;
  }

  return "";
}

function detectTeam(title: string, season: string) {
  const seasonPatterns = [
    /\b20\d{2}\s*[/\- ]\s*\d{2,4}\b/,
    /\b2\d\s*[/\- ]\s*2\d\b/,
  ];

  let team = title;

  for (const pattern of seasonPatterns) {
    const match = pattern.exec(title);

    if (match?.index !== undefined) {
      team = title.slice(0, match.index);
      break;
    }
  }

  team = team
    .replace(/\b(home|away|third|goalkeeper|gk|player|version|retro|jersey)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return team || (season ? "Equipo por revisar" : title);
}

function detectVariant(title: string) {
  const value = title.toLowerCase();

  if (/\b(goalkeeper|gk)\b/.test(value)) return "Portero";
  if (/\bthird(?:\s+away)?\b/.test(value)) return "Tercera";
  if (/\baway\b/.test(value)) return "Visitante";
  if (/\bhome\b/.test(value)) return "Local";

  return "";
}

function priceFor(type: ProductType) {
  if (type === "player") return 27;
  if (type === "retro") return 28;
  return 25;
}

function supplierCostFor(type: ProductType) {
  if (type === "player") return 15;
  if (type === "retro") return 14;
  return 10;
}

function labelFor(type: ProductType) {
  if (type === "player") return "Player";
  if (type === "retro") return "Retro";
  return "Fan";
}

function buildProductDetails(album: CatalogAlbum) {
  const season = detectSeason(album.title);
  const team = detectTeam(album.title, season);
  const variant = detectVariant(album.title);
  const type = detectType(album.title);

  const name =
    [team, season, variant, labelFor(type)].filter(Boolean).join(" ") ||
    album.title;

  return {
    album,
    slug: `${slugify(name)}-${album.albumId}`,
    name,
    team,
    season,
    type,
    priceEur: priceFor(type),
    supplierCostUsd: supplierCostFor(type),
    description:
      `${name}. Borrador importado desde el catálogo del proveedor. ` +
      "Revisa el nombre, las imágenes, las características y los derechos de comercialización antes de publicarlo.",
  };
}

function proxyImageUrl(sourceUrl: string | null, refererUrl: string) {
  if (!sourceUrl) return "/placeholder-shirt.svg";

  const source = Buffer.from(sourceUrl, "utf8").toString("hex");
  const referer = Buffer.from(refererUrl, "utf8").toString("hex");

  return `/api/yupoo-image?u=${source}&r=${referer}`;
}

async function removeCatalogDuplicates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  albums: CatalogAlbum[],
  requestedLimit: number
) {
  if (!albums.length) {
    return {
      albums: [] as CatalogAlbum[],
      hidden: 0,
    };
  }

  const prepared = albums.map((album) => ({
    album,
    details: buildProductDetails(album),
  }));

  const supplierUrls = Array.from(
    new Set(prepared.map(({ album }) => album.sourceUrl))
  );

  const productNames = Array.from(
    new Set(prepared.map(({ details }) => details.name))
  );

  const [
    { data: existingByUrl, error: urlError },
    { data: existingByName, error: nameError },
  ] = await Promise.all([
    supplierUrls.length
      ? supabase
          .from("products")
          .select("supplier_url")
          .in("supplier_url", supplierUrls)
      : Promise.resolve({ data: [], error: null }),
    productNames.length
      ? supabase
          .from("products")
          .select("name")
          .in("name", productNames)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (urlError) throw new Error(urlError.message);
  if (nameError) throw new Error(nameError.message);

  const existingUrls = new Set(
    (existingByUrl ?? [])
      .map((row: { supplier_url: string | null }) => row.supplier_url)
      .filter((value): value is string => Boolean(value))
  );

  const existingNames = new Set(
    (existingByName ?? []).map((row: { name: string }) =>
      row.name.trim().toLocaleLowerCase("es")
    )
  );

  const seenUrls = new Set<string>();
  const seenProductKeys = new Set<string>();
  const uniqueAlbums: CatalogAlbum[] = [];

  for (const { album, details } of prepared) {
    const normalizedName = details.name
      .trim()
      .toLocaleLowerCase("es");

    const productKey = [
      normalizedName,
      details.type,
      details.season,
    ].join("|");

    const alreadyImported =
      existingUrls.has(album.sourceUrl) ||
      existingNames.has(normalizedName);

    const repeatedInPage =
      seenUrls.has(album.sourceUrl) ||
      seenProductKeys.has(productKey);

    if (alreadyImported || repeatedInPage) {
      continue;
    }

    seenUrls.add(album.sourceUrl);
    seenProductKeys.add(productKey);
    uniqueAlbums.push(album);
  }

  const visibleAlbums = uniqueAlbums.slice(0, requestedLimit);

  return {
    albums: visibleAlbums,
    hidden: albums.length - uniqueAlbums.length,
  };
}

async function saveCatalogDrafts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  albums: CatalogAlbum[]
) {
  const drafts = albums.map(buildProductDetails);
  const supplierUrls = drafts.map(({ album }) => album.sourceUrl);
  const slugs = drafts.map(({ slug }) => slug);

  const [{ data: existingByUrl, error: urlError }, { data: existingBySlug, error: slugError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("supplier_url")
        .in("supplier_url", supplierUrls),
      supabase.from("products").select("slug").in("slug", slugs),
    ]);

  if (urlError) throw new Error(urlError.message);
  if (slugError) throw new Error(slugError.message);

  const existingUrls = new Set(
    (existingByUrl ?? [])
      .map((row: { supplier_url: string | null }) => row.supplier_url)
      .filter(Boolean)
  );

  const existingSlugs = new Set(
    (existingBySlug ?? []).map((row: { slug: string }) => row.slug)
  );

  const newDrafts = drafts.filter(
    ({ album, slug }) =>
      !existingUrls.has(album.sourceUrl) && !existingSlugs.has(slug)
  );

  const skipped = drafts.length - newDrafts.length;

  if (!newDrafts.length) {
    return {
      imported: 0,
      skipped,
      names: [] as string[],
    };
  }

  const { data: insertedProducts, error: productError } = await supabase
    .from("products")
    .insert(
      newDrafts.map((draft) => ({
        slug: draft.slug,
        name: draft.name,
        team: draft.team,
        season: draft.season || null,
        type: draft.type,
        price_eur: draft.priceEur,
        supplier_cost_usd: draft.supplierCostUsd,
        description: draft.description,
        supplier_url: draft.album.sourceUrl,
        published: false,
      }))
    )
    .select("id,slug");

  if (productError || !insertedProducts) {
    throw new Error(
      productError?.message ?? "No se pudieron crear los borradores."
    );
  }

  const draftBySlug = new Map(
    newDrafts.map((draft) => [draft.slug, draft])
  );

  const productIds = insertedProducts.map(
    (product: { id: string }) => product.id
  );

  try {
    const { error: imageError } = await supabase
      .from("product_images")
      .insert(
        insertedProducts.map(
          (product: { id: string; slug: string }) => {
            const draft = draftBySlug.get(product.slug)!;

            return {
              product_id: product.id,
              url: proxyImageUrl(
                draft.album.coverImage,
                draft.album.sourceUrl
              ),
              position: 0,
            };
          }
        )
      );

    if (imageError) throw new Error(imageError.message);

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(
        insertedProducts.flatMap(
          (product: { id: string }) =>
            SIZES.map((size) => ({
              product_id: product.id,
              size,
              stock: 1000,
            }))
        )
      );

    if (variantError) throw new Error(variantError.message);
  } catch (error) {
    await supabase.from("products").delete().in("id", productIds);
    throw error;
  }

  return {
    imported: insertedProducts.length,
    skipped,
    names: newDrafts.map((draft) => draft.name),
  };
}

export async function GET() {
  const auth = await checkAdmin();

  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Importador individual y masivo conectado correctamente.",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin();

    if ("response" in auth) {
      return auth.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "La petición enviada no es válida." },
        { status: 400 }
      );
    }

    const source =
      body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : {};

    if (source.mode === "catalog") {
      const input = YupooCatalogRequestSchema.parse({
        url: source.url,
        page: Number(source.page ?? 1),
        limit: Number(source.limit ?? 25),
      });

      // Leemos el máximo de la página para poder ocultar repetidos
      // y seguir mostrando tantas camisetas nuevas como sea posible.
      const batch = await readYupooCatalogBatch({
        ...input,
        limit: 50,
      });

      const filtered = await removeCatalogDuplicates(
        auth.supabase,
        batch.eligible as CatalogAlbum[],
        input.limit
      );

      const warnings = [...batch.warnings];

      if (filtered.hidden > 0) {
        warnings.unshift(
          `${filtered.hidden} productos repetidos o ya importados se han ocultado.`
        );
      }

      return NextResponse.json(
        {
          ...batch,
          eligible: filtered.albums,
          duplicatesHidden: filtered.hidden,
          warnings,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (source.mode === "catalog-save") {
      const input = CatalogSaveSchema.parse(body);
      const result = await saveCatalogDrafts(auth.supabase, input.albums);

      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }

    const { url } = ImportRequestSchema.parse(body);
    const draft = await buildImportDraft(url);

    return NextResponse.json(draft, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Revisa los datos enviados al importador.",
        },
        { status: 400 }
      );
    }

    console.error("Error del importador:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo completar la importación.",
      },
      { status: 500 }
    );
  }
}
