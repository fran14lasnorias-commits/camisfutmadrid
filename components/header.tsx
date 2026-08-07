"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/catalogo?team=selecciones", label: "Selecciones" },
  { href: "/catalogo?type=retro", label: "Retro" },
  { href: "/catalogo?sort=price_asc", label: "Ofertas" },
];

export function Header() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setIsAdmin(data?.role === "admin");
      }
    }

    void loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function isActive(href: string) {
    const path = href.split("?")[0];

    return pathname === path || (path !== "/" && pathname.startsWith(path));
  }

  return (
    <header className={`header ${scrolled ? "headerScrolled" : ""}`}>
      <div className="headerTopLine" aria-hidden="true" />

      <div className="container headerInner">
        <Link href="/" className="brand" aria-label="Ir a la portada">
          <span className="logoShell">
            <img
              src="/logo-camisfut.png"
              alt=""
              width={46}
              height={46}
              className="logo"
            />
          </span>

          <span className="brandText">
            <strong className="brandDesktop">
              CAMISFUT<span>MADRID</span>
            </strong>

            <strong className="brandMobile">
              CAMISFUT
              <span>MADRID</span>
            </strong>

            <small>CAMISETAS DE FÚTBOL</small>
          </span>
        </Link>

        <nav
          className={`desktopNav ${menuOpen ? "desktopNavOpen" : ""}`}
          aria-label="Navegación principal"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "navActive" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="actions">
          <Link
            href="/catalogo"
            className="iconButton"
            aria-label="Buscar productos"
            title="Buscar"
          >
            <SearchIcon />
          </Link>

          <Link
            href="/cuenta"
            className="iconButton accountButton"
            aria-label="Mi cuenta"
            title="Mi cuenta"
          >
            <UserIcon />
          </Link>

          {isAdmin && (
            <Link href="/admin" className="adminButton">
              ADMIN
            </Link>
          )}

          <Link href="/carrito" className="cartButton" aria-label="Abrir carrito">
            <CartIcon />
            <span className="cartText">Carrito</span>
            <span className="cartCount">{itemCount}</span>
          </Link>

          <button
            type="button"
            className={`menuButton ${menuOpen ? "menuButtonOpen" : ""}`}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobileMenu">
          <div className="container mobileMenuInner">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "mobileActive" : ""}
              >
                <span>{item.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}

            <div className="mobileDivider" />

            <Link href="/cuenta">
              <span>Mi cuenta</span>
              <span aria-hidden="true">→</span>
            </Link>

            {isAdmin && (
              <Link href="/admin">
                <span>Administración</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 120;
          background: rgba(8, 8, 11, 0.78);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px) saturate(145%);
          -webkit-backdrop-filter: blur(20px) saturate(145%);
          transition:
            background 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .headerScrolled {
          background: rgba(8, 8, 11, 0.95);
          border-bottom-color: rgba(195, 92, 255, 0.16);
          box-shadow: 0 18px 46px rgba(0, 0, 0, 0.34);
        }

        .headerTopLine {
          position: absolute;
          top: 0;
          left: 50%;
          width: min(720px, 72vw);
          height: 1px;
          transform: translateX(-50%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(195, 92, 255, 0.78),
            transparent
          );
          opacity: 0.55;
          pointer-events: none;
        }

        .headerInner {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 28px;
          min-height: 78px;
          transition: min-height 180ms ease;
        }

        .headerScrolled .headerInner {
          min-height: 68px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          color: white;
          text-decoration: none;
        }

        .logoShell {
          display: grid;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(195, 92, 255, 0.25);
          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(195, 92, 255, 0.2),
              transparent 55%
            ),
            rgba(255, 255, 255, 0.025);
          box-shadow: 0 10px 26px rgba(139, 44, 255, 0.18);
          transition:
            width 180ms ease,
            height 180ms ease,
            flex-basis 180ms ease,
            transform 180ms ease;
        }

        .brand:hover .logoShell {
          transform: rotate(-3deg) scale(1.02);
        }

        .headerScrolled .logoShell {
          width: 42px;
          height: 42px;
          flex-basis: 42px;
        }

        .logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .brandText {
          display: grid;
          gap: 2px;
          min-width: 0;
        }

        .brandDesktop,
        .brandMobile {
          font-family: var(--font-display);
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: 0.03em;
        }

        .brandDesktop {
          font-size: 24px;
          white-space: nowrap;
        }

        .brandMobile {
          display: none;
        }

        .brandDesktop span,
        .brandMobile span {
          color: var(--purple-2);
        }

        .brandText small {
          color: var(--muted);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.2em;
        }

        .desktopNav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-width: 0;
        }

        .desktopNav :global(a) {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          padding: 9px 14px;
          border-radius: 999px;
          color: #d6d6de;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          transition:
            color 150ms ease,
            background 150ms ease,
            transform 150ms ease;
        }

        .desktopNav :global(a:hover) {
          color: white;
          background: rgba(195, 92, 255, 0.08);
          transform: translateY(-1px);
        }

        .desktopNav :global(.navActive) {
          color: white;
          background: linear-gradient(
            135deg,
            rgba(139, 44, 255, 0.24),
            rgba(195, 92, 255, 0.1)
          );
          box-shadow: inset 0 0 0 1px rgba(195, 92, 255, 0.18);
        }

        .actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          min-width: max-content;
        }

        .iconButton {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          color: white;
          transition:
            background 150ms ease,
            border-color 150ms ease,
            transform 150ms ease;
        }

        .iconButton:hover {
          transform: translateY(-1px);
          border-color: rgba(195, 92, 255, 0.34);
          background: rgba(195, 92, 255, 0.08);
        }

        .adminButton {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 8px 10px;
          border: 1px solid rgba(255, 184, 77, 0.28);
          border-radius: 999px;
          background: rgba(255, 184, 77, 0.07);
          color: #ffd08a;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .cartButton {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          gap: 8px;
          padding: 8px 10px 8px 12px;
          border: 1px solid rgba(195, 92, 255, 0.22);
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            rgba(139, 44, 255, 0.16),
            rgba(195, 92, 255, 0.06)
          );
          color: white;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          transition:
            transform 150ms ease,
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .cartButton:hover {
          transform: translateY(-1px);
          border-color: rgba(195, 92, 255, 0.48);
          box-shadow: 0 12px 28px rgba(139, 44, 255, 0.16);
        }

        .cartCount {
          display: grid;
          min-width: 24px;
          height: 24px;
          place-items: center;
          padding: 0 6px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            var(--purple),
            var(--purple-2)
          );
          color: white;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 900;
        }

        .menuButton {
          display: none;
          width: 42px;
          height: 42px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          color: white;
          cursor: pointer;
        }

        .menuButton span {
          display: block;
          width: 100%;
          height: 2px;
          margin: 4px 0;
          border-radius: 999px;
          background: currentColor;
          transition:
            transform 170ms ease,
            opacity 170ms ease;
        }

        .menuButtonOpen span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .menuButtonOpen span:nth-child(2) {
          opacity: 0;
        }

        .menuButtonOpen span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        .mobileMenu {
          display: none;
        }

        @media (max-width: 1080px) {
          .headerInner {
            gap: 18px;
          }

          .desktopNav :global(a) {
            padding-inline: 10px;
            font-size: 15px;
          }

          .brandText small {
            display: none;
          }
        }

        @media (max-width: 880px) {
          .headerInner,
          .headerScrolled .headerInner {
            grid-template-columns: minmax(0, 1fr) auto;
            min-height: 68px;
            gap: 12px;
          }

          .desktopNav {
            display: none;
          }

          .menuButton {
            display: block;
          }

          .accountButton,
          .adminButton {
            display: none;
          }

          .mobileMenu {
            display: block;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(195, 92, 255, 0.14);
            background: rgba(8, 8, 11, 0.98);
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.46);
            backdrop-filter: blur(24px);
          }

          .mobileMenuInner {
            display: grid;
            gap: 8px;
            padding: 14px 0 18px;
          }

          .mobileMenuInner :global(a) {
            display: flex;
            min-height: 50px;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding: 12px 14px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.025);
            color: #eeeeF5;
            font-family: var(--font-display);
            font-size: 17px;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
          }

          .mobileMenuInner :global(.mobileActive) {
            border-color: rgba(195, 92, 255, 0.22);
            background: linear-gradient(
              135deg,
              rgba(139, 44, 255, 0.18),
              rgba(195, 92, 255, 0.06)
            );
          }

          .mobileDivider {
            height: 1px;
            margin: 4px 0;
            background: rgba(255, 255, 255, 0.07);
          }
        }

        @media (max-width: 560px) {
          .headerInner {
            width: min(100% - 18px, 1180px);
            gap: 7px;
          }

          .brand {
            gap: 7px;
          }

          .logoShell,
          .headerScrolled .logoShell {
            width: 38px;
            height: 38px;
            flex-basis: 38px;
          }

          .brandDesktop {
            display: none;
          }

          .brandMobile {
            display: grid;
            font-size: 16px;
            line-height: 0.8;
          }

          .brandMobile span {
            display: block;
            margin-top: 3px;
          }

          .brandText small {
            display: none;
          }

          .actions {
            gap: 5px;
          }

          .iconButton {
            width: 38px;
            height: 38px;
            border-radius: 11px;
          }

          .cartButton {
            min-height: 38px;
            gap: 5px;
            padding: 6px 7px;
            border-radius: 11px;
          }

          .cartText {
            display: none;
          }

          .cartCount {
            min-width: 21px;
            height: 21px;
            padding-inline: 5px;
            font-size: 10px;
          }

          .menuButton {
            width: 38px;
            height: 38px;
            padding: 9px;
          }

          .mobileMenuInner {
            width: min(100% - 18px, 1180px);
          }
        }

        @media (max-width: 380px) {
          .headerInner {
            width: min(100% - 12px, 1180px);
          }

          .brand {
            gap: 5px;
          }

          .logoShell,
          .headerScrolled .logoShell {
            width: 34px;
            height: 34px;
            flex-basis: 34px;
          }

          .brandMobile {
            font-size: 14px;
          }

          .iconButton,
          .menuButton {
            width: 34px;
            height: 34px;
          }

          .cartButton {
            min-height: 34px;
            padding: 5px 6px;
          }
        }
      `}</style>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.2" fill="currentColor" />
      <circle cx="17" cy="19" r="1.2" fill="currentColor" />
    </svg>
  );
}
