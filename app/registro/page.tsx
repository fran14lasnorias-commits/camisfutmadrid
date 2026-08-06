import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container" style={{ padding: "56px 0 90px", maxWidth: 520 }}>
      <section className="card" style={{ padding: 26 }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>NUEVO CLIENTE</span>
        <h1>Crear cuenta</h1>
        {params.error && <p style={{ color: "#ff8c9c" }}>{params.error}</p>}
        <form action={signUp} style={{ display: "grid", gap: 12 }}>
          <input name="fullName" required placeholder="Nombre y apellidos" style={inputStyle} />
          <input name="email" type="email" required placeholder="Email" style={inputStyle} />
          <input name="password" type="password" minLength={8} required placeholder="Contraseña (mínimo 8 caracteres)" style={inputStyle} />
          <button className="btn-primary" type="submit">CREAR CUENTA</button>
        </form>
        <p className="muted" style={{ marginTop: 18 }}>
          ¿Ya tienes cuenta? <Link href="/acceso" style={{ color: "#d6a6ff" }}>Entrar</Link>
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
