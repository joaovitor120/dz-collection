'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LogoLink } from '@/components/ui/Logo';
import { MenuIcon, SearchIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { createGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { trackGeneralWhatsAppClick } from '@/lib/analytics';

const NAV = [
  { href: '/catalogo?ordenar=lancamentos', label: 'Lançamentos', match: 'lancamentos' },
  { href: '/catalogo', label: 'Catálogo', match: '/catalogo' },
  { href: '/sobre', label: 'Sobre', match: '/sobre' },
  { href: '/contato', label: 'Contato', match: '/contato' },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setCondensed(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={`sticky top-0 z-header bg-paper/95 backdrop-blur-sm transition-[border-color,box-shadow] duration-250 ease-editorial ${
          condensed ? 'border-b border-line shadow-subtle' : 'border-b border-transparent'
        }`}
      >
        <div className="container grid h-[var(--dz-header-h)] grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Esquerda: menu (mobile) / navegação (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 grid h-11 w-11 place-items-center lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <nav className="hidden lg:block" aria-label="Navegação principal">
              <ul className="flex items-center gap-7">
                {NAV.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="link-underline text-2xs uppercase tracking-widest2 text-ink transition-colors hover:text-ink-soft"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Centro: logo */}
          <div className="flex justify-center">
            <LogoLink />
          </div>

          {/* Direita: busca + WhatsApp */}
          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-11 w-11 place-items-center transition-colors hover:text-gold-deep"
              aria-label="Buscar produtos"
              aria-expanded={searchOpen}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
            <a
              href={createGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGeneralWhatsAppClick('header')}
              className="hidden items-center gap-2 border border-line-strong px-3.5 py-2.5 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink hover:bg-ink hover:text-paper md:inline-flex"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Fale conosco
            </a>
            <a
              href={createGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGeneralWhatsAppClick('header_mobile')}
              className="-mr-2 grid h-11 w-11 place-items-center md:hidden"
              aria-label="Falar com a DZ Collection no WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
