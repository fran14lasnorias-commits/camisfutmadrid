import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
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
          ACCESO SEGURO
        </span>

        <h1>Iniciar sesión</h1>

        <p className="muted">
          Consulta tus pedidos, su estado y los datos de seguimiento.
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

        <form action={signIn} style={{ display: "grid", gap: 12 }}>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <label htmlFor="password" style={{ fontWeight: 700 }}>
              Contraseña
            </label>

            <Link
              href="/recuperar-contrasena"
              style={{
                color: "#d6a6ff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              He olvidado mi contraseña
            </Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Tu contraseña"
            style={inputStyle}
          />

          <button className="btn-primary" type="submit">
            ENTRAR
          </button>
        </form>

        <p className="muted" style={{ marginTop: 18 }}>
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            style={{ color: "#d6a6ff", fontWeight: 700 }}
          >
            Crear cuenta
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
