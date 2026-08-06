import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ImportRequestSchema, buildImportDraft } from "@/lib/importer";
import {
  readYupooCatalogBatch,
  YupooCatalogRequestSchema,
} from "@/lib/yupoo-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  return { user };
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
