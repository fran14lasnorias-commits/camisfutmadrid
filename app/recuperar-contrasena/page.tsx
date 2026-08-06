import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main
      className="container"
      style={{ padding: "56px 0 90px", maxWidth: 520 }}
    >
      <section className="card" style={{ padding: 26 }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
          RECUPERAR ACCESO
        </span>

        <h1>¿Has olvidado tu contraseña?</h1>

        <p className="muted" style={{ lineHeight: 1.65 }}>
          Introduce el correo de tu cuenta y te enviaremos un enlace seguro para
          crear una contraseña nueva.
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

        {params.message && (
          <p
            role="status"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(61, 222, 138, .10)",
              border: "1px solid rgba(61, 222, 138, .35)",
              color: "#8af3b7",
              lineHeight: 1.55,
            }}
          >
            {params.message}
          </p>
        )}

        <form
          action={requestPasswordReset}
          style={{ display: "grid", gap: 12, marginTop: 20 }}
        >
          <label htmlFor="email" style={{ fontWeight: 700 }}>
            Correo electrónico
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            style={inputStyle}
          />

          <button className="btn-primary" type="submit">
            ENVIAR ENLACE
          </button>
        </form>

        <p className="muted" style={{ marginTop: 20 }}>
          ¿Ya recuerdas la contraseña?{" "}
          <Link href="/acceso" style={{ color: "#d6a6ff", fontWeight: 700 }}>
            Volver a iniciar sesión
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
