'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CatalogFilters, SortKey } from '@/types';
import { products } from '@/data/products';
import { categories, priceBuckets } from '@/data/site';
import {
  activeFilterCount,
  applyFilters,
  emptyFilters,
  sortProducts,
} from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterPanel } from '@/components/catalog/FilterPanel';
import { SortMenu } from '@/components/catalog/SortMenu';
import { buttonClass } from '@/components/ui/Button';
import { CloseIcon, SearchIcon, SlidersIcon } from '@/components/ui/Icon';
import { toParams } from '@/lib/catalog-params';

export function CatalogView({
  initialFilters,
  initialSort,
}: {
  initialFilters: CatalogFilters;
  initialSort: SortKey;
}) {
  const router = useRouter();

  const [filters, setFiltersState] = useState<CatalogFilters>(initialFilters);
  const [sort, setSortState] = useState<SortKey>(initialSort);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [queryDraft, setQueryDraft] = useState(filters.query);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mantém a URL sincronizada — o estado do catálogo é compartilhável.
  const sync = useCallback(
    (nextFilters: CatalogFilters, nextSort: SortKey) => {
      router.replace(`/catalogo${toParams(nextFilters, nextSort)}`, { scroll: false });
    },
    [router],
  );

  const setFilters = useCallback(
    (next: CatalogFilters) => {
      setFiltersState(next);
      sync(next, sort);
    },
    [sort, sync],
  );

  const setSort = useCallback(
    (next: SortKey) => {
      setSortState(next);
      sync(filters, next);
    },
    [filters, sync],
  );

  // Busca com debounce curto para não recalcular a cada tecla.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (queryDraft !== filters.query) setFilters({ ...filters, query: queryDraft });
    }, 180);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const result = useMemo(
    () => sortProducts(applyFilters(products, filters), sort),
    [filters, sort],
  );

  const activeCount = activeFilterCount(filters);
  const chips = [
    ...filters.categories.map((c) => ({
      key: `cat-${c}`,
      label: categories.find((x) => x.slug === c)?.name ?? c,
      clear: () =>
        setFilters({
          ...filters,
          categories: filters.categories.filter((x) => x !== c),
        }),
    })),
    ...filters.colors.map((c) => ({
      key: `cor-${c}`,
      label: c,
      clear: () =>
        setFilters({ ...filters, colors: filters.colors.filter((x) => x !== c) }),
    })),
    ...filters.priceBuckets.map((b) => ({
      key: `preco-${b}`,
      label: priceBuckets.find((x) => x.id === b)?.label ?? b,
      clear: () =>
        setFilters({
          ...filters,
          priceBuckets: filters.priceBuckets.filter((x) => x !== b),
        }),
    })),
    ...(filters.onlyPromo
      ? [
          {
            key: 'promo',
            label: 'Em promoção',
            clear: () => setFilters({ ...filters, onlyPromo: false }),
          },
        ]
      : []),
  ];

  function clearAll() {
    setQueryDraft('');
    setFilters({ ...emptyFilters });
  }

  return (
    <div className="container pb-20 pt-8 md:pt-10">
      <nav aria-label="Você está em" className="mb-6 text-2xs uppercase tracking-widest2 text-ink-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="link-underline">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            Catálogo
          </li>
        </ol>
      </nav>

      <header className="mb-8 md:mb-10">
        <h1 className="font-display text-[2rem] leading-none md:text-[2.6rem]">
          Catálogo
        </h1>
        <p className="mt-3 max-w-prose2 text-sm text-ink-muted">
          {products.length} modelos disponíveis. Escolha o seu e fale com a DZ
          Collection pelo WhatsApp.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* Sidebar discreta no desktop */}
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-[calc(var(--dz-header-h)+1.5rem)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-2xs uppercase tracking-widest2">Filtros</p>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-2xs uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink"
                >
                  Limpar
                </button>
              ) : null}
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} all={products} />
          </div>
        </aside>

        <div>
          {/* Toolbar: busca + filtros (mobile) + ordenação */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-xs">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="search"
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                placeholder="Buscar no catálogo"
                aria-label="Buscar no catálogo"
                className="min-h-[42px] w-full border border-line-strong bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-ink"
              />
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex min-h-[42px] shrink-0 items-center gap-2 border border-line-strong px-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink lg:hidden"
                aria-expanded={drawerOpen}
              >
                <SlidersIcon className="h-4 w-4" />
                Filtros
                {activeCount > 0 ? (
                  <span className="grid h-4 min-w-4 place-items-center bg-ink px-1 text-[0.6rem] text-paper">
                    {activeCount}
                  </span>
                ) : null}
              </button>
              <SortMenu value={sort} onChange={setSort} />
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 border border-line-strong px-2.5 py-1.5 text-2xs normal-case tracking-normal transition-colors hover:border-ink"
                >
                  {chip.label}
                  <CloseIcon className="h-3 w-3" />
                  <span className="sr-only">Remover filtro</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="link-underline ml-1 text-2xs uppercase tracking-widest2 text-ink-muted"
              >
                Limpar tudo
              </button>
            </div>
          ) : null}

          <p aria-live="polite" className="mb-5 text-2xs uppercase tracking-widest2 text-ink-muted">
            {result.length} {result.length === 1 ? 'produto' : 'produtos'}
          </p>

          {result.length === 0 ? (
            <div className="border border-line px-6 py-16 text-center">
              <h2 className="font-display text-xl">Nenhum produto encontrado</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
                Ajuste a busca ou remova alguns filtros para ver mais modelos.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className={buttonClass('outline', 'md', 'mt-6')}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ProductGrid products={result} priorityCount={4} columns="wide" />
          )}
        </div>
      </div>

      {/* Drawer de filtros no mobile */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-drawer lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
            aria-label="Fechar filtros"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col bg-paper"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="text-2xs uppercase tracking-widest2">Filtros</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-10 w-10 place-items-center"
                aria-label="Fechar filtros"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterPanel filters={filters} setFilters={setFilters} all={products} />
            </div>
            <div className="flex gap-3 border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={clearAll}
                className={buttonClass('outline', 'md', 'flex-1')}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={buttonClass('primary', 'md', 'flex-1')}
              >
                Ver {result.length}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
