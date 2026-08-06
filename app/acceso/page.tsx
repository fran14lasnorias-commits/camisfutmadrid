import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container" style={{ padding: "56px 0 90px", maxWidth: 520 }}>
      <section className="card" style={{ padding: 26 }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>ACCESO SEGURO</span>
        <h1>Iniciar sesión</h1>
        <p className="muted">Consulta tus pedidos, favoritos y direcciones.</p>

        {params.error && <p style={{ color: "#ff8c9c" }}>{params.error}</p>}
        {params.message && <p style={{ color: "#79f2ad" }}>{params.message}</p>}

        <form action={signIn} style={{ display: "grid", gap: 12 }}>
          <input name="email" type="email" required placeholder="Email" style={inputStyle} />
          <input name="password" type="password" required placeholder="Contraseña" style={inputStyle} />
          <button className="btn-primary" type="submit">ENTRAR</button>
        </form>

        <p className="muted" style={{ marginTop: 18 }}>
          ¿No tienes cuenta? <Link href="/registro" style={{ color: "#d6a6ff" }}>Crear cuenta</Link>
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
