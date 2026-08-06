"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.camisfutmadrid.com")
    .replace(/\/$/, "");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/acceso?error=${encodeURIComponent(
        "El correo o la contraseña no son correctos."
      )}`
    );
  }

  redirect("/cuenta");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/cuenta`,
    },
  });

  if (error) {
    redirect(
      `/registro?error=${encodeURIComponent(
        "No hemos podido crear la cuenta. Comprueba los datos e inténtalo de nuevo."
      )}`
    );
  }

  redirect(
    `/acceso?message=${encodeURIComponent(
      "Revisa tu correo para confirmar la cuenta."
    )}`
  );
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(
      `/recuperar-contrasena?error=${encodeURIComponent(
        "Introduce tu correo electrónico."
      )}`
    );
  }

  // Mostramos siempre un mensaje genérico para no revelar
  // si una dirección está registrada o no.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/actualizar-contrasena`,
  });

  redirect(
    `/recuperar-contrasena?message=${encodeURIComponent(
      "Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña."
    )}`
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    redirect(
      `/actualizar-contrasena?error=${encodeURIComponent(
        "La contraseña debe tener al menos 8 caracteres."
      )}`
    );
  }

  if (password !== confirmation) {
    redirect(
      `/actualizar-contrasena?error=${encodeURIComponent(
        "Las contraseñas no coinciden."
      )}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/recuperar-contrasena?error=${encodeURIComponent(
        "El enlace ha caducado. Solicita uno nuevo."
      )}`
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/actualizar-contrasena?error=${encodeURIComponent(
        "No hemos podido cambiar la contraseña. Solicita un enlace nuevo."
      )}`
    );
  }

  await supabase.auth.signOut();

  redirect(
    `/acceso?message=${encodeURIComponent(
      "Contraseña actualizada. Ya puedes iniciar sesión."
    )}`
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
