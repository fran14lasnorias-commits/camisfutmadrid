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
type ProductType =
  | "fan"
  | "player"
  | "retro"
  | "kids"
  | "adult_kit"
  | "polo"
  | "shorts"
  | "socks"
  | "training";

const ADULT_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const KIDS_SIZES = ["16", "18", "20", "22", "24", "26", "28"];

function sizesFor(type: ProductType) {
  return type === "kids" ? KIDS_SIZES : ADULT_SIZES;
}

const NBA_PATTERN =
  /\b(nba|basketball|lakers|celtics|warriors|bulls|knicks|nets|76ers|sixers|raptors|bucks|cavaliers|cavs|pacers|pistons|heat|magic|hawks|hornets|wizards|nuggets|timberwolves|thunder|trail\s*blazers|blazers|jazz|clippers|suns|kings|mavericks|mavs|rockets|grizzlies|pelicans|spurs)\b/i;

function isNbaProduct(title: string) {
  return NBA_PATTERN.test(title);
}

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

  // Orden importante: primero categorías específicas.
  if (/\b(kids?|children|youth)\b/.test(value)) return "kids";

  if (
    /\b(adult\s*(kit|set)|adult\s*jersey\s*\+\s*shorts?|jersey\s*\+\s*shorts?|shirt\s*\+\s*shorts?|soccer\s*(kit|set))\b/.test(
      value
    )
  ) {
    return "adult_kit";
  }

  if (
    /\b(training\s*(kit|set|suit)|tracksuit|track\s*suit|training|pre[-\s]?match|warm[-\s]?up|windbreaker|jacket|hoodie|coat|thermal)\b/.test(
      value
    )
  ) {
    return "training";
  }

  if (/\b(polo|t-?shirt|casual\s*shirt)\b/.test(value)) return "polo";
  if (/\b(shorts?|short\s*pants?)\b/.test(value)) return "shorts";
  if (/\b(socks?|stockings?)\b/.test(value)) return "socks";
  if (/\bplayer(?:\s+version)?\b/.test(value)) return "player";
  if (/\bretro|classic|vintage\b/.test(value)) return "retro";

  // Jersey, Home, Away, Third, portero y cualquier prenda no reconocida
  // entran como Fan para no perder productos.
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

  const singleYear = title.match(/\b(20\d{2})\b/);

  if (singleYear) {
    return singleYear[1];
  }

  return "";
}

function detectTeam(title: string, season: string) {
  let team = title;

  team = team
    .replace(/\b20\d{2}\s*[/\- ]\s*\d{2,4}\b/g, " ")
    .replace(/\b2\d\s*[/\- ]\s*2\d\b/g, " ");

  if (/^20\d{2}$/.test(season)) {
    team = team.replace(new RegExp(`\\b${season}\\b`, "g"), " ");
  }

  team = team
    .replace(
      /\b(home|away|third|goalkeeper|gk|player|version|retro|classic|vintage|jersey|kids?|children|youth|size|adult|kit|set|polo|t-?shirt|training|tracksuit|pre[-\s]?match|warm[-\s]?up|shorts?|socks?)\b/gi,
      " "
    )
    .replace(/\b1[68]\s*[-–]\s*28\b/gi, " ")
    .replace(/\b(?:XS|S|M|L|XL|2XL|3XL|4XL|5XL)\s*[-–]\s*(?:XL|2XL|3XL|4XL|5XL)\b/gi, " ")
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
  if (type === "kids") return 29;
  if (type === "polo") return 27;
  if (type === "training") return 55;
  if (type === "adult_kit") return 30;

  // Sin precio específico indicado: se mantiene la tarifa base.
  return 25;
}

function supplierCostFor(type: ProductType) {
  if (type === "player") return 15;
  if (type === "retro") return 14;

  // Para categorías nuevas no inventamos el coste del proveedor:
  // se deja el valor base hasta que se revise en Admin.
  return 10;
}

function labelFor(type: ProductType) {
  if (type === "player") return "Player";
  if (type === "retro") return "Retro";
  if (type === "kids") return "Niño";
  if (type === "adult_kit") return "Kit adulto";
  if (type === "polo") return "Polo";
  if (type === "shorts") return "Pantalón";
  if (type === "socks") return "Medias";
  if (type === "training") return "Kit entrenamiento";
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

async function saveCatalogDrafts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  albums: CatalogAlbum[]
) {
  const safeAlbums = albums.filter(
    (album) => !isNbaProduct(album.title)
  );
  const blockedNba = albums.length - safeAlbums.length;
  const drafts = safeAlbums.map(buildProductDetails);
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
      skipped: skipped + blockedNba,
      blockedNba,
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
        original_price_eur: draft.priceEur + 5,
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
          (product: { id: string; slug: string }) => {
            const draft = draftBySlug.get(product.slug)!;

            return sizesFor(draft.type).map((size) => ({
              product_id: product.id,
              size,
              stock: 1000,
            }));
          }
        )
      );

    if (variantError) throw new Error(variantError.message);
  } catch (error) {
    await supabase.from("products").delete().in("id", productIds);
    throw error;
  }

  return {
    imported: insertedProducts.length,
    skipped: skipped + blockedNba,
    blockedNba,
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

      const batch = await readYupooCatalogBatch(input);

      return NextResponse.json(batch, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
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
