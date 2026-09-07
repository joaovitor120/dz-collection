'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { products } from '@/data/products';
import { categories } from '@/data/site';
import { searchProducts } from '@/lib/catalog';
import { formatBRL } from '@/lib/format';
import { categoryPath, productPath } from '@/lib/urls';
import { CloseIcon, SearchIcon } from '@/components/ui/Icon';

const SUGGESTIONS = ['Lançamentos', 'Dourado', 'Preto', 'Tartaruga', 'Gatinho'];

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.trim().length < 1) return [];
    return searchProducts(products, query).slice(0, 6);
  }, [query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      const target = results[active];
      if (target) {
        event.preventDefault();
        window.location.href = productPath(target.slug);
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-overlay animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar produtos"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-[2px]"
        aria-label="Fechar busca"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="relative mx-auto max-h-[88vh] w-full overflow-y-auto border-b border-line bg-paper shadow-lift"
      >
        <div className="container py-5 md:py-7">
          <div className="flex items-center gap-3 border-b border-line pb-3">
            <SearchIcon className="h-5 w-5 shrink-0 text-ink-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Buscar por modelo, cor ou formato"
              aria-label="Buscar por modelo, cor ou formato"
              autoComplete="off"
              className="w-full bg-transparent py-2 font-display text-lg outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-ink-muted md:text-xl"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="text-2xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink"
              >
                Limpar
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-1 grid h-9 w-9 shrink-0 place-items-center text-ink transition-colors hover:text-gold-deep"
              aria-label="Fechar busca"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {query.trim().length === 0 ? (
            <div className="grid gap-8 pt-6 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">Buscas frequentes</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setQuery(s === 'Lançamentos' ? '' : s)}
                      className="border border-line px-3 py-1.5 text-xs transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-3">Categorias</p>
                <ul className="space-y-1.5">
                  {categories
                    .filter((c) => c.image)
                    .map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={categoryPath(c.slug)}
                          onClick={onClose}
                          className="link-underline text-sm"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-lg">Nada encontrado para “{query}”.</p>
              <p className="mt-2 text-sm text-ink-muted">
                Tente outro modelo, cor ou formato — ou veja o catálogo completo.
              </p>
              <Link
                href="/catalogo"
                onClick={onClose}
                className="link-underline mt-4 inline-block text-2xs uppercase tracking-widest2"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="pt-5">
              <p className="eyebrow mb-3">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </p>
              <ul className="divide-y divide-line">
                {results.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={productPath(p.slug)}
                      onClick={onClose}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-4 py-3 transition-colors ${
                        i === active ? 'bg-paper-shade/70' : ''
                      }`}
                      aria-current={i === active ? 'true' : undefined}
                    >
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-paper-shade">
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{p.name}</span>
                        <span className="mt-1 block text-2xs normal-case tracking-normal text-ink-muted">
                          {formatBRL(p.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/catalogo?busca=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="link-underline mt-4 inline-block text-2xs uppercase tracking-widest2"
              >
                Ver todos os resultados no catálogo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
