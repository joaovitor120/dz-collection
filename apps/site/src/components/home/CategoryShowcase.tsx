import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { categories } from '@/data/site';
import { categoryPath } from '@/lib/urls';
import { SectionHeading } from '@/components/ui/SectionHeading';

/** Apresentação editorial das categorias reais que têm produtos hoje. */
export function CategoryShowcase({ products }: { products: Product[] }) {
  const visible = categories
    .filter((c) => c.image)
    .map((c) => ({
      ...c,
      count: products.filter((p) => p.category === c.slug).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <section className="container py-14 md:py-20" aria-labelledby="categorias-title">
      <SectionHeading
        eyebrow="Por formato"
        title={<span id="categorias-title">Encontre o seu</span>}
        description="Cada formato conversa com um traço do rosto. Comece por aqui."
        href="/catalogo"
        linkLabel="Ver catálogo"
      />

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {visible.map((c) => (
          <li key={c.slug}>
            <Link href={categoryPath(c.slug)} className="group block">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-shade">
                <Image
                  src={c.image as string}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 23vw, 47vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-400 ease-editorial group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
                  <span className="block font-display text-lg leading-none text-paper md:text-xl">
                    {c.name}
                  </span>
                  <span className="mt-1.5 block text-[0.6rem] uppercase tracking-widest2 text-paper/75">
                    {c.count} {c.count === 1 ? 'modelo' : 'modelos'}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
