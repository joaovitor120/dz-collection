'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { categories, WHATSAPP_DISPLAY } from '@/data/site';
import { categoryPath } from '@/lib/urls';
import { createGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { trackGeneralWhatsAppClick } from '@/lib/analytics';
import { CloseIcon, WhatsAppIcon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/catalogo?ordenar=lancamentos', label: 'Lançamentos' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(
      () => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus(),
      60,
    );
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-drawer lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slideInRight flex-col bg-paper shadow-drawer"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center transition-colors hover:text-gold-deep"
            aria-label="Fechar menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6" aria-label="Menu principal">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="block py-2.5 font-display text-xl transition-colors hover:text-gold-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="eyebrow mb-3 mt-8">Formatos</p>
          <ul className="space-y-1">
            {categories
              .filter((c) => c.image)
              .map((c) => (
                <li key={c.slug}>
                  <Link
                    href={categoryPath(c.slug)}
                    onClick={onClose}
                    className="block py-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div className="border-t border-line px-5 py-4">
          <a
            href={createGeneralWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackGeneralWhatsAppClick('mobile_menu');
              onClose();
            }}
            className="flex items-center gap-2.5 text-sm"
          >
            <WhatsAppIcon className="h-5 w-5 text-whats" />
            <span>
              <span className="block text-2xs uppercase tracking-widest2 text-ink-muted">
                Atendimento
              </span>
              <span className="block">{WHATSAPP_DISPLAY}</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
