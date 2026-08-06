import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Información legal e identificación del titular de CamisfutMadrid.",
  alternates: {
    canonical: "/legal/aviso-legal",
  },
};

export default function LegalNoticePage() {
  return (
    <main
      className="container"
      style={{ padding: "50px 0 90px", maxWidth: 900 }}
    >
      <span style={{ color: "#d6a6ff", fontWeight: 800 }}>
        INFORMACIÓN LEGAL
      </span>

      <h1>Aviso legal</h1>

      <div className="card" style={{ padding: 26, lineHeight: 1.75 }}>
        <p className="muted" style={{ marginTop: 0 }}>
          Última actualización: 6 de agosto de 2026.
        </p>

        <h2>1. Identificación del titular</h2>

        <p>
          En cumplimiento de la normativa aplicable a los servicios de la
          sociedad de la información y el comercio electrónico, se informa de
          que el titular y responsable de este sitio web es:
        </p>

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "#0d0d12",
          }}
        >
          <p>
            <strong>Nombre comercial:</strong> CamisfutMadrid
          </p>
          <p>
            <strong>Titular:</strong> Francisco Trujillo Gómez
          </p>
          <p>
            <strong>NIF:</strong> 54203571T
          </p>
          <p>
            <strong>Domicilio profesional:</strong> Calle de Hernani, 43,
            28020 Madrid, España
          </p>
          <p>
            <strong>Correo electrónico:</strong>{" "}
            <a
              href="mailto:camisfutmadrid.atencioncliente@gmail.com"
              style={{ color: "#d6a6ff" }}
            >
              camisfutmadrid.atencioncliente@gmail.com
            </a>
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Teléfono:</strong>{" "}
            <a href="tel:+34681659884" style={{ color: "#d6a6ff" }}>
              681 659 884
            </a>
          </p>
        </div>

        <h2>2. Objeto del sitio web</h2>

        <p>
          CamisfutMadrid es una tienda online dedicada a la comercialización de
          camisetas de fútbol y artículos relacionados, incluyendo productos
          que pueden personalizarse con nombre, dorsal o parches.
        </p>

        <p>
          El acceso y uso de este sitio web atribuye la condición de usuario e
          implica la aceptación de este aviso legal, sin perjuicio de las
          condiciones de compra y demás políticas aplicables.
        </p>

        <h2>3. Uso correcto de la web</h2>

        <p>
          El usuario se compromete a utilizar la web de forma lícita, diligente
          y respetuosa, absteniéndose de realizar actuaciones que puedan dañar,
          inutilizar, sobrecargar o deteriorar el sitio, sus sistemas o los
          derechos de terceros.
        </p>

        <h2>4. Propiedad intelectual e industrial</h2>

        <p>
          Los textos, diseño, estructura, código, logotipo y demás elementos
          propios de CamisfutMadrid están protegidos por la normativa aplicable
          y no podrán reproducirse, distribuirse o utilizarse con fines
          comerciales sin autorización.
        </p>

        <p>
          Las marcas, escudos, nombres de clubes, fotografías y demás signos de
          terceros pertenecen a sus respectivos titulares. Su aparición en la
          web no implica vinculación, patrocinio o autorización oficial salvo
          que se indique expresamente.
        </p>

        <h2>5. Responsabilidad</h2>

        <p>
          CamisfutMadrid procura que la información de la web sea correcta y
          esté actualizada. No obstante, podrán producirse errores puntuales,
          interrupciones técnicas o cambios en productos, disponibilidad y
          precios. Cualquier error detectado se corregirá tan pronto como sea
          razonablemente posible.
        </p>

        <p>
          Los enlaces a páginas externas se facilitan únicamente como
          referencia. CamisfutMadrid no controla ni responde del contenido,
          seguridad o disponibilidad de sitios gestionados por terceros.
        </p>

        <h2>6. Contratación y protección de datos</h2>

        <p>
          Las compras realizadas en este sitio se rigen por las{" "}
          <Link
            href="/legal/condiciones"
            style={{ color: "#d6a6ff", fontWeight: 700 }}
          >
            condiciones de compra
          </Link>
          . El tratamiento de datos personales se explica en la{" "}
          <Link
            href="/legal/privacidad"
            style={{ color: "#d6a6ff", fontWeight: 700 }}
          >
            política de privacidad
          </Link>
          .
        </p>

        <h2>7. Comunicaciones</h2>

        <p>
          Para cualquier consulta relacionada con la web, los productos o un
          pedido, el usuario puede escribir al correo indicado anteriormente,
          llamar al teléfono de contacto o utilizar el{" "}
          <Link
            href="/contacto"
            style={{ color: "#d6a6ff", fontWeight: 700 }}
          >
            formulario de contacto
          </Link>
          .
        </p>

        <h2>8. Legislación aplicable</h2>

        <p style={{ marginBottom: 0 }}>
          Este aviso legal se rige por la legislación española. En las
          relaciones con consumidores se respetarán los derechos y fueros que
          resulten obligatoriamente aplicables conforme a la normativa de
          protección de consumidores y usuarios.
        </p>
      </div>
    </main>
  );
}
