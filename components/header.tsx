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
    function updateHeader() {
      setScrolled(window.scrollY > 18);
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (active) {
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
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function isActive(href: string) {
    const path = href.split("?")[0];
    return pathname === path || (path !== "/" && pathname.startsWith(path));
  }

  return (
    <header className={`site-header ${scrolled ? "site-header-scrolled" : ""}`}>
      <div className="header-glow" aria-hidden="true" />

      <div className="header-inner container">
        <Link href="/" className="brand" aria-label="Ir a la portada">
          <span className="brand-logo-wrap">
            <img
              src="/logo-camisfut.png"
              alt=""
              width={48}
              height={48}
              className="brand-logo"
            />
          </span>

          <span className="brand-copy">
            <strong className="brand-name">
              CAMISFUT<span>MADRID</span>
            </strong>
            <small>CAMISETAS DE FÚTBOL</small>
          </span>
        </Link>

        <nav
          className={`main-nav ${menuOpen ? "main-nav-open" : ""}`}
          aria-label="Navegación principal"
        >
          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "nav-link-active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mobile-account-links">
            <Link href="/cuenta">Mi cuenta</Link>
            {isAdmin && <Link href="/admin">Administración</Link>}
          </div>
        </nav>

        <div className="header-actions">
          <Link
            href="/catalogo"
            className="icon-action"
            aria-label="Buscar productos"
            title="Buscar"
          >
            <SearchIcon />
          </Link>

          <Link
            href="/cuenta"
            className="icon-action account-action"
            aria-label="Mi cuenta"
            title="Mi cuenta"
          >
            <UserIcon />
          </Link>

          {isAdmin && (
            <Link href="/admin" className="admin-pill">
              ADMIN
            </Link>
          )}

          <Link href="/carrito" className="cart-link" aria-label="Abrir carrito">
            <CartIcon />
            <span className="cart-label">Carrito</span>
            <span className="cart-count" aria-label={`${itemCount} artículos`}>
              {itemCount}
            </span>
          </Link>

          <button
            type="button"
            className={`menu-button ${menuOpen ? "menu-button-open" : ""}`}
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

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(8, 8, 11, 0.78);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          transition:
            background 180ms ease,
            box-shadow 180ms ease,
            border-color 180ms ease;
        }

        .site-header-scrolled {
          border-bottom-color: rgba(195, 92, 255, 0.16);
          background: rgba(8, 8, 11, 0.93);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.28);
        }

        .header-glow {
          position: absolute;
          inset: 0 auto auto 50%;
          width: min(720px, 70vw);
          height: 1px;
          transform: translateX(-50%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(195, 92, 255, 0.8),
            transparent
          );
          opacity: 0.48;
          pointer-events: none;
        }

        .header-inner {
          position: relative;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          min-height: 80px;
          gap: 34px;
          transition: min-height 180ms ease;
        }

        .site-header-scrolled .header-inner {
          min-height: 68px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          min-width: max-content;
          color: white;
          text-decoration: none;
        }

        .brand-logo-wrap {
          position: relative;
          display: grid;
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          place-items: center;
          border: 1px solid rgba(195, 92, 255, 0.25);
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 25%, rgba(195, 92, 255, 0.2), transparent 55%),
            rgba(255, 255, 255, 0.025);
          box-shadow: 0 10px 28px rgba(139, 44, 255, 0.2);
          transition:
            width 180ms ease,
            height 180ms ease,
            transform 180ms ease;
        }

        .brand:hover .brand-logo-wrap {
          transform: rotate(-3deg) scale(1.03);
        }

        .site-header-scrolled .brand-logo-wrap {
          width: 43px;
          height: 43px;
          flex-basis: 43px;
        }

        .brand-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 50%;
        }

        .brand-copy {
          display: grid;
          gap: 1px;
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 25px;
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: 0.025em;
          white-space: nowrap;
        }

        .brand-name span {
          color: var(--purple-2);
        }

        .brand-copy small {
          color: var(--muted);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.22em;
        }

        .main-nav {
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.025);
        }

        .nav-links :global(a),
        .mobile-account-links :global(a) {
          position: relative;
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          padding: 8px 15px;
          border-radius: 999px;
          color: #d7d7df;
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.025em;
          text-transform: uppercase;
          transition:
            color 150ms ease,
            background 150ms ease,
            transform 150ms ease;
        }

        .nav-links :global(a:hover) {
          color: white;
          background: rgba(195, 92, 255, 0.1);
          transform: translateY(-1px);
        }

        .nav-links :global(.nav-link-active) {
          color: white;
          background: linear-gradient(
            135deg,
            rgba(139, 44, 255, 0.28),
            rgba(195, 92, 255, 0.13)
          );
          box-shadow: inset 0 0 0 1px rgba(195, 92, 255, 0.2);
        }

        .mobile-account-links {
          display: none;
        }

        .header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          min-width: max-content;
        }

        .icon-action {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.035);
          color: white;
          transition:
            transform 150ms ease,
            background 150ms ease,
            border-color 150ms ease;
        }

        .icon-action:hover {
          transform: translateY(-1px);
          border-color: rgba(195, 92, 255, 0.38);
          background: rgba(195, 92, 255, 0.09);
        }

        .admin-pill {
          display: inline-flex;
          min-height: 34px;
          align-items: center;
          padding: 8px 11px;
          border: 1px solid rgba(255, 184, 77, 0.3);
          border-radius: 999px;
          background: rgba(255, 184, 77, 0.08);
          color: #ffd08a;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.06em;
        }

        .cart-link {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          gap: 8px;
          padding: 8px 10px 8px 13px;
          border: 1px solid rgba(195, 92, 255, 0.26);
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            rgba(139, 44, 255, 0.18),
            rgba(195, 92, 255, 0.08)
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

        .cart-link:hover {
          transform: translateY(-1px);
          border-color: rgba(195, 92, 255, 0.52);
          box-shadow: 0 12px 30px rgba(139, 44, 255, 0.18);
        }

        .cart-count {
          display: grid;
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--purple), var(--purple-2));
          color: white;
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 6px 16px rgba(139, 44, 255, 0.3);
        }

        .menu-button {
          display: none;
          width: 44px;
          height: 42px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.035);
          cursor: pointer;
        }

        .menu-button span {
          display: block;
          width: 100%;
          height: 2px;
          margin: 4px 0;
          border-radius: 99px;
          background: white;
          transition:
            transform 170ms ease,
            opacity 170ms ease;
        }

        .menu-button-open span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .menu-button-open span:nth-child(2) {
          opacity: 0;
        }

        .menu-button-open span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        @media (max-width: 1040px) {
          .header-inner {
            gap: 20px;
          }

          .nav-links :global(a) {
            padding-inline: 11px;
            font-size: 15px;
          }

          .brand-copy small {
            display: none;
          }

          .account-action {
            display: none;
          }
        }

        @media (max-width: 860px) {
          .header-inner,
          .site-header-scrolled .header-inner {
            grid-template-columns: minmax(0, 1fr) auto;
            min-height: 68px;
          }

          .brand-name {
            font-size: 20px;
          }

          .brand-logo-wrap,
          .site-header-scrolled .brand-logo-wrap {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
          }

          .menu-button {
            display: block;
          }

          .main-nav {
            position: absolute;
            top: calc(100% + 1px);
            left: 0;
            right: 0;
            display: none;
            padding: 12px 16px 18px;
            border-bottom: 1px solid rgba(195, 92, 255, 0.18);
            background: rgba(8, 8, 11, 0.98);
            backdrop-filter: blur(24px);
            box-shadow: 0 28px 60px rgba(0, 0, 0, 0.48);
          }

          .main-nav-open {
            display: grid;
            gap: 10px;
          }

          .nav-links {
            display: grid;
            gap: 7px;
            padding: 0;
            border: 0;
            border-radius: 0;
            background: transparent;
          }

          .nav-links :global(a),
          .mobile-account-links :global(a) {
            justify-content: flex-start;
            min-height: 48px;
            padding: 12px 14px;
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.035);
          }

          .mobile-account-links {
            display: grid;
            gap: 7px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.07);
          }

          .admin-pill,
          .account-action {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .header-inner {
            width: min(100% - 20px, 1180px);
            gap: 10px;
          }

          .brand {
            gap: 8px;
          }

          .brand-name {
            font-size: 18px;
          }

          .brand-logo-wrap,
          .site-header-scrolled .brand-logo-wrap {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
          }

          .icon-action {
            width: 39px;
            height: 39px;
          }

          .cart-link {
            min-height: 40px;
            padding: 7px 8px;
          }

          .cart-label {
            display: none;
          }

          .menu-button {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
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
      width="19"
      height="19"
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
      width="18"
      height="18"
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
