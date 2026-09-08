import { discountPercent, formatBRL } from '@/lib/format';
import type { Product } from '@/types';

export function Price({
  product,
  size = 'sm',
  showPix = false,
}: {
  product: Product;
  size?: 'sm' | 'lg';
  showPix?: boolean;
}) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const large = size === 'lg';

  return (
    <div className={large ? 'space-y-1.5' : 'space-y-0.5'}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={
            large
              ? 'font-display text-[1.75rem] leading-none'
              : 'text-[0.9rem] font-medium leading-none'
          }
        >
          {formatBRL(product.price)}
        </span>
        {product.compareAtPrice ? (
          <span
            className={`text-ink-muted line-through ${large ? 'text-sm' : 'text-2xs'}`}
          >
            {formatBRL(product.compareAtPrice)}
          </span>
        ) : null}
        {off ? (
          <span
            className={`border border-gold/45 px-1.5 py-0.5 uppercase tracking-widest2 text-gold-deep ${
              large ? 'text-2xs' : 'text-[0.6rem]'
            }`}
          >
            {off}% OFF
          </span>
        ) : null}
      </div>
      {showPix && product.pixPrice ? (
        <p className="text-2xs normal-case tracking-normal text-ink-muted">
          <span className="text-ink">{formatBRL(product.pixPrice)}</span> no Pix
          <span className="text-ink-muted"> · 5% de desconto</span>
        </p>
      ) : null}
    </div>
  );
}
