import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function decodeHex(value: string | null): string | null {
  if (!value || value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) {
    return null;
  }

  return Buffer.from(value, "hex").toString("utf8");
}

export async function GET(request: NextRequest) {
  const sourceValue = decodeHex(request.nextUrl.searchParams.get("u"));
  const refererValue = decodeHex(request.nextUrl.searchParams.get("r"));

  if (!sourceValue || !refererValue) {
    return NextResponse.json(
      { error: "Faltan los parámetros de la imagen." },
      { status: 400 },
    );
  }

  let sourceUrl: URL;
  let refererUrl: URL;

  try {
    sourceUrl = new URL(sourceValue);
    refererUrl = new URL(refererValue);
  } catch {
    return NextResponse.json({ error: "URL no válida." }, { status: 400 });
  }

  const allowedSource =
    sourceUrl.protocol === "https:" &&
    sourceUrl.hostname === "photo.yupoo.com";

  const allowedReferer =
    refererUrl.protocol === "https:" &&
    refererUrl.hostname === "y199111.x.yupoo.com";

  if (!allowedSource || !allowedReferer) {
    return NextResponse.json(
      { error: "Origen de imagen no permitido." },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetch(sourceUrl.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: refererUrl.toString(),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      },
      redirect: "follow",
      cache: "force-cache",
      next: { revalidate: 604800 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Yupoo respondió con ${upstream.status}.` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";

    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json(
        { error: "Yupoo no devolvió una imagen." },
        { status: 502 },
      );
    }

    const image = await upstream.arrayBuffer();

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch (error) {
    console.error("Error cargando imagen de Yupoo:", error);

    return NextResponse.json(
      { error: "No se pudo cargar la imagen." },
      { status: 502 },
    );
  }
}
