'use client';

import type { CatalogFilters, CategorySlug, Product } from '@/types';
import { categories, priceBuckets } from '@/data/site';
import { allColors, countFor } from '@/lib/catalog';

function Check({
  checked,
  label,
  count,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  count?: number;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 py-1.5 text-sm ${
        disabled ? 'cursor-not-allowed opacity-40' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="grid h-4 w-4 shrink-0 place-items-center border border-line-strong transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
      >
        <svg
          viewBox="0 0 12 12"
          className={`h-2.5 w-2.5 text-paper ${checked ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 6.2 2.6 2.6L10 3.4" />
        </svg>
      </span>
      <span className="flex-1">{label}</span>
      {typeof count === 'number' ? (
        <span className="text-2xs normal-case tracking-normal text-ink-muted">
          {count}
        </span>
      ) : null}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <legend className="eyebrow mb-2">{title}</legend>
      {children}
    </fieldset>
  );
}

export function FilterPanel({
  filters,
  setFilters,
  all,
}: {
  filters: CatalogFilters;
  setFilters: (next: CatalogFilters) => void;
  all: Product[];
}) {
  const catCounts = countFor(all, (p) => p.category);
  const colorCounts = countFor(all, (p) => p.colors);
  const promoCount = all.filter((p) => p.compareAtPrice).length;
  const colors = allColors(all);

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  return (
    <div>
      <Group title="Formato">
        {categories.map((c) => {
          const count = catCounts[c.slug] ?? 0;
          return (
            <Check
              key={c.slug}
              label={c.name}
              count={count}
              disabled={count === 0}
              checked={filters.categories.includes(c.slug)}
              onChange={() =>
                setFilters({
                  ...filters,
                  categories: toggle<CategorySlug>(filters.categories, c.slug),
                })
              }
            />
          );
        })}
      </Group>

      <Group title="Cor">
        {colors.map((color) => (
          <Check
            key={color}
            label={color}
            count={colorCounts[color] ?? 0}
            checked={filters.colors.includes(color)}
            onChange={() =>
              setFilters({ ...filters, colors: toggle(filters.colors, color) })
            }
          />
        ))}
      </Group>

      <Group title="Faixa de preço">
        {priceBuckets.map((b) => {
          const count = all.filter(
            (p) => p.price >= b.min && (b.max === null || p.price <= b.max),
          ).length;
          return (
            <Check
              key={b.id}
              label={b.label}
              count={count}
              disabled={count === 0}
              checked={filters.priceBuckets.includes(b.id)}
              onChange={() =>
                setFilters({
                  ...filters,
                  priceBuckets: toggle(filters.priceBuckets, b.id),
                })
              }
            />
          );
        })}
      </Group>

      <Group title="Promoções">
        <Check
          label="Em promoção"
          count={promoCount}
          checked={filters.onlyPromo}
          onChange={() => setFilters({ ...filters, onlyPromo: !filters.onlyPromo })}
        />
      </Group>
    </div>
  );
}
