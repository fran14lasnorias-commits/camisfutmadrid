"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const { itemCount } = useCart();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

    loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadRole();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="site-header">
      <div className="header-inner container">
        <Link href="/" className="brand" aria-label="Ir a la portada">
          <img
            src="/logo-camisfut.png"
            alt=""
            width={46}
            height={46}
            className="brand-logo"
          />
          <span className="brand-name">
            CAMISFUT<span>MADRID</span>
          </span>
        </Link>

        <button
          type="button"
          className="menu-button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`main-nav ${menuOpen ? "main-nav-open" : ""}`}
          aria-label="Navegación principal"
        >
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo?type=retro">Retro</Link>
          <Link href="/cuenta">Mi cuenta</Link>

          {isAdmin && <Link href="/admin">Admin</Link>}

          <Link href="/carrito" className="cart-link">
            Carrito
            <span className="cart-count" aria-label={`${itemCount} artículos`}>
              {itemCount}
            </span>
          </Link>
        </nav>
      </div>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid var(--border);
          background: rgba(8, 8, 11, 0.94);
          backdrop-filter: blur(16px);
        }

        .header-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 68px;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-size: 22px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: -0.4px;
          white-space: nowrap;
        }

        .brand-logo {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          object-fit: contain;
          border-radius: 999px;
          filter: drop-shadow(0 8px 14px rgba(150, 45, 255, 0.28));
        }

        .brand-name {
          color: white;
        }

        .brand-name span {
          color: var(--purple-2);
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 14px;
        }

        .main-nav :global(a) {
          color: white;
          text-decoration: none;
        }

        .main-nav :global(a:hover) {
          color: #d6a6ff;
        }

        .cart-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .cart-count {
          display: grid;
          min-width: 22px;
          height: 22px;
          padding: 0 5px;
          place-items: center;
          border-radius: 999px;
          background: var(--purple);
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        .menu-button {
          display: none;
          width: 44px;
          height: 42px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: #111118;
          cursor: pointer;
        }

        .menu-button span {
          display: block;
          width: 100%;
          height: 2px;
          margin: 4px 0;
          border-radius: 99px;
          background: white;
        }

        @media (max-width: 760px) {
          .header-inner {
            min-height: 64px;
          }

          .brand {
            gap: 8px;
            font-size: 17px;
          }

          .brand-logo {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
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
            padding: 14px;
            gap: 7px;
            flex-direction: column;
            align-items: stretch;
            border: 1px solid var(--border);
            border-top: 0;
            border-radius: 0 0 16px 16px;
            background: rgba(8, 8, 11, 0.98);
            box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
          }

          .main-nav-open {
            display: flex;
          }

          .main-nav :global(a) {
            display: flex;
            min-height: 44px;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 10px;
            background: #111118;
          }

          .cart-link {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
