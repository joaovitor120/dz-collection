'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { formatBRL } from '@/lib/format';
import { WhatsAppBuyButton } from './WhatsAppBuyButton';

/**
 * CTA fixo no mobile — aparece só depois que o usuário passa da área principal,
 * para não cobrir a galeria nem o preço logo de cara.
 */
export function StickyBuyBar({ product }: { product: Product }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById('pdp-compra');
    if (!anchor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(entry.boundingClientRect.top < 0 && !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-float border-t border-line bg-paper/97 backdrop-blur-sm transition-transform duration-250 ease-editorial md:hidden ${
        visible ? 'translate-y-0' : 'invisible translate-y-full'
      }`}
      data-testid="sticky-buy-bar"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-hidden={!visible}
    >
      <div className="container flex items-center gap-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xs normal-case tracking-normal text-ink-muted">
            {product.name}
          </p>
          <p className="text-sm font-medium leading-tight">{formatBRL(product.price)}</p>
        </div>
        <WhatsAppBuyButton
          product={product}
          source="pdp_sticky"
          label="Comprar pelo WhatsApp"
          size="sm"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
