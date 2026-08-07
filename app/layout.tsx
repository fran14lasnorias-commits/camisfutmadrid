import type { Metadata } from "next";
import { Barlow_Condensed, Manrope } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://camisfutmadrid.com"
  ),
  title: {
    default: "CamisfutMadrid",
    template: "%s | CamisfutMadrid",
  },
  description:
    "Camisetas de fútbol premium con personalización y entrega en Madrid.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "CamisfutMadrid",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${barlowCondensed.variable}`}
    >
      <body>
        <CartProvider>
          <div
            style={{
              background: "linear-gradient(90deg,#5511b5,#9c2cff)",
              padding: "9px 16px",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: ".04em",
            }}
          >
            ENVÍO GRATIS · ENTREGA EN MANO EN MADRID · PAGO SEGURO
          </div>

          <Header />

          {children}

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
