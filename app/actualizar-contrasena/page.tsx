import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      className="container"
      style={{ padding: "56px 0 90px", maxWidth: 520 }}
    >
      <section className="card" style={{ padding: 26 }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
          NUEVA CONTRASEÑA
        </span>

        <h1>Crea tu nueva contraseña</h1>

        <p className="muted" style={{ lineHeight: 1.65 }}>
          Usa al menos 8 caracteres. Cuando la guardes, volverás a la pantalla
          de inicio de sesión.
        </p>

        {params.error && (
          <p
            role="alert"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255, 80, 105, .10)",
              border: "1px solid rgba(255, 80, 105, .35)",
              color: "#ff9aaa",
            }}
          >
            {params.error}
          </p>
        )}

        <form
          action={updatePassword}
          style={{ display: "grid", gap: 12, marginTop: 20 }}
        >
          <label htmlFor="password" style={{ fontWeight: 700 }}>
            Contraseña nueva
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            style={inputStyle}
          />

          <label
            htmlFor="confirmation"
            style={{ fontWeight: 700, marginTop: 6 }}
          >
            Repite la contraseña
          </label>

          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            style={inputStyle}
          />

          <button className="btn-primary" type="submit">
            GUARDAR CONTRASEÑA
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          ¿El enlace ha caducado?{" "}
          <Link
            href="/recuperar-contrasena"
            style={{ color: "#d6a6ff", fontWeight: 700 }}
          >
            Solicitar otro enlace
          </Link>
        </p>
      </section>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
};
