import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/data/site';
import { buttonClass } from '@/components/ui/Button';

/**
 * Hero editorial: metade texto, metade fotografia real da marca.
 * Curto de propósito — o objetivo é levar aos lançamentos em um clique.
 */
export function Hero() {
  return (
    <section className="border-b border-line" aria-labelledby="hero-title">
      <div className="container grid items-stretch gap-0 md:grid-cols-2">
        <div className="flex flex-col justify-center py-12 md:py-20 md:pr-12 lg:py-24">
          <p className="eyebrow animate-fadeUp">Coleção 2026</p>
          <h1
            id="hero-title"
            className="mt-4 animate-fadeUp font-display text-[2.6rem] leading-[1.05] tracking-[-0.015em] md:text-[3.4rem] lg:text-[4rem]"
          >
            Seu estilo começa
            <br />
            <span className="italic text-gold-deep">pelo olhar.</span>
          </h1>
          <p className="mt-6 max-w-md animate-fadeUp text-sm leading-relaxed text-ink-muted md:text-[0.95rem]">
            {site.shortDescription}
          </p>

          <div className="mt-9 flex animate-fadeUp flex-wrap gap-3">
            <Link
              href="/catalogo?ordenar=lancamentos"
              className={buttonClass('primary', 'lg')}
            >
              Ver lançamentos
            </Link>
            <Link href="/catalogo" className={buttonClass('outline', 'lg')}>
              Catálogo completo
            </Link>
          </div>
        </div>

        <div className="relative -mx-5 md:mx-0">
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:h-full md:min-h-[520px]">
            <Image
              src="/images/products/atena/oculos-atena-camuflado-01.webp"
              alt="Modelo usando o Óculos de Sol Atena da DZ Collection à beira-mar"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
