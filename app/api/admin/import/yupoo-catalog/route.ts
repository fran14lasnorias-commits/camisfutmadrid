import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  readYupooCatalogBatch,
  YupooCatalogRequestSchema,
} from "@/lib/yupoo-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const input = YupooCatalogRequestSchema.parse({
      url: body.url,
      page: Number(body.page ?? 1),
      limit: Number(body.limit ?? 25),
    });

    const batch = await readYupooCatalogBatch(input);

    return NextResponse.json(batch, {
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
            "Revisa la dirección, la página y el número de productos.",
        },
        { status: 400 }
      );
    }

    console.error("Error al leer el catálogo masivo de Yupoo:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el catálogo de Yupoo.",
      },
      { status: 500 }
    );
  }
}
