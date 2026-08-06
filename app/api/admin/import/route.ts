import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ImportRequestSchema, buildImportDraft } from "@/lib/importer";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { url } = ImportRequestSchema.parse(await request.json());
    const draft = await buildImportDraft(url);
    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo importar" },
      { status: 400 }
    );
  }
}
