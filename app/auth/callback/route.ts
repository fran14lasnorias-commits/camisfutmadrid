import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/cuenta";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || url.origin
  ).replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(
      `${siteUrl}/acceso?error=${encodeURIComponent(
        "El enlace no es válido o ha caducado."
      )}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${siteUrl}/recuperar-contrasena?error=${encodeURIComponent(
        "El enlace no es válido o ha caducado. Solicita uno nuevo."
      )}`
    );
  }

  return NextResponse.redirect(`${siteUrl}${next}`);
}
