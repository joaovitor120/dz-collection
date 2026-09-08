import type { Product } from '@/types';

export function ProductSpecifications({ product }: { product: Product }) {
  if (!product.specifications?.length) return null;

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="eyebrow mb-4">
        Especificações técnicas
      </h2>
      <dl className="divide-y divide-line border-y border-line">
        {product.specifications.map((spec) => (
          <div key={spec.label} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 py-3">
            <dt className="text-2xs uppercase tracking-widest2 text-ink-muted">
              {spec.label}
            </dt>
            <dd className="text-sm leading-relaxed">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
