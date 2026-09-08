'use client';

import { useEffect, useRef, useState } from 'react';
import type { SortKey } from '@/types';
import { sortOptions } from '@/lib/catalog';
import { ChevronDownIcon } from '@/components/ui/Icon';

export function SortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (key: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = sortOptions.find((o) => o.key === value) ?? sortOptions[0]!;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-[42px] min-w-0 items-center gap-2 border border-line-strong px-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink sm:px-3.5"
      >
        <span className="hidden text-ink-muted sm:inline">Ordenar:</span>
        <span className="truncate">{current.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-250 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Ordenar produtos"
          className="absolute right-0 z-overlay mt-1 w-52 animate-fadeIn border border-line bg-paper py-1 shadow-lift"
        >
          {sortOptions.map((o) => (
            <li key={o.key} role="none">
              <button
                type="button"
                role="option"
                aria-selected={o.key === value}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-paper-shade ${
                  o.key === value ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {o.label}
                {o.key === value ? (
                  <span aria-hidden="true" className="h-1.5 w-1.5 bg-gold" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
