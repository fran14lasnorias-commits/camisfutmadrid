import Link from "next/link";
import { sendContactMessage } from "@/app/contacto/actions";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container" style={{ padding: "50px 0 90px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
          ATENCIÓN AL CLIENTE
        </span>

        <h1 style={{ marginBottom: 8 }}>Contacto</h1>

        <p className="muted" style={{ lineHeight: 1.65, marginTop: 0 }}>
          Cuéntanos qué necesitas. Para consultas sobre un pedido, incluye el
          número de pedido para localizarlo más rápido.
        </p>

        <section className="card" style={{ padding: 26, marginTop: 24 }}>
          {params.error && (
            <p
              role="alert"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(255,80,105,.10)",
                border: "1px solid rgba(255,80,105,.35)",
                color: "#ff9aaa",
                lineHeight: 1.55,
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
                background: "rgba(61,222,138,.10)",
                border: "1px solid rgba(61,222,138,.35)",
                color: "#8af3b7",
                lineHeight: 1.55,
              }}
            >
              {params.message}
            </p>
          )}

          <form
            action={sendContactMessage}
            style={{ display: "grid", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(230px,1fr))",
                gap: 16,
              }}
            >
              <div>
                <label htmlFor="name" style={labelStyle}>
                  Nombre *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="email" style={labelStyle}>
                  Correo electrónico *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  placeholder="tu@email.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(230px,1fr))",
                gap: 16,
              }}
            >
              <div>
                <label htmlFor="phone" style={labelStyle}>
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Opcional"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="subject" style={labelStyle}>
                  Motivo de la consulta *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  defaultValue=""
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Selecciona una opción
                  </option>
                  <option value="Estado de mi pedido">
                    Estado de mi pedido
                  </option>
                  <option value="Personalización de camiseta">
                    Personalización de camiseta
                  </option>
                  <option value="Tallas y productos">
                    Tallas y productos
                  </option>
                  <option value="Cambio o devolución">
                    Cambio o devolución
                  </option>
                  <option value="Problema con el pago">
                    Problema con el pago
                  </option>
                  <option value="Otra consulta">Otra consulta</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="message" style={labelStyle}>
                Mensaje *
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={3000}
                rows={7}
                placeholder="Escribe aquí tu consulta. Añade el número de pedido si ya has comprado."
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="website">Página web</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                color: "#b7b7c1",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                required
                style={{ marginTop: 4, flex: "0 0 auto" }}
              />
              <span>
                He leído la{" "}
                <Link
                  href="/legal/privacidad"
                  style={{ color: "#d6a6ff", fontWeight: 700 }}
                >
                  política de privacidad
                </Link>{" "}
                y acepto que se utilicen mis datos para responder a esta
                consulta.
              </span>
            </label>

            <button className="btn-primary" type="submit">
              ENVIAR MENSAJE
            </button>
          </form>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          <div className="card" style={{ padding: 18 }}>
            <strong>Consultas sobre pedidos</strong>
            <p className="muted" style={{ marginBottom: 0, lineHeight: 1.55 }}>
              Indica el número CFM del pedido para que podamos localizarlo.
            </p>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <strong>Seguimiento online</strong>
            <p className="muted" style={{ marginBottom: 0, lineHeight: 1.55 }}>
              También puedes revisar el estado desde{" "}
              <Link
                href="/cuenta"
                style={{ color: "#d6a6ff", fontWeight: 700 }}
              >
                Mi cuenta
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "#0d0d12",
  color: "white",
  fontSize: 16,
};
