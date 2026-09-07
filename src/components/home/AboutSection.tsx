import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/data/site';
import { buttonClass } from '@/components/ui/Button';

/** Trecho real da "Nossa História" da loja, em formato editorial. */
export function AboutSection() {
  return (
    <section className="border-y border-line bg-paper-shade/60" aria-labelledby="sobre-title">
      <div className="container grid gap-10 py-14 md:grid-cols-12 md:items-center md:gap-14 md:py-20">
        <div className="relative md:col-span-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-shade">
            <Image
              src="/images/products/rancher/oculos-rancher-dourado-01.webp"
              alt="Modelo de chapéu usando o Óculos de Sol Rancher dourado da DZ Collection"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-7">
          <p className="eyebrow">Sobre a DZ</p>
          <h2
            id="sobre-title"
            className="mt-3 font-display text-[1.75rem] leading-[1.15] md:text-[2.3rem]"
          >
            Um óculos de sol vai muito além de um acessório.
          </h2>
          <p className="mt-5 max-w-prose2 text-sm leading-relaxed text-ink-soft md:text-[0.95rem]">
            {site.story[0]}
          </p>
          <p className="mt-4 max-w-prose2 text-sm leading-relaxed text-ink-muted md:text-[0.95rem]">
            {site.story[1]}
          </p>
          <Link href="/sobre" className={buttonClass('outline', 'md', 'mt-8')}>
            Conhecer a marca
          </Link>
        </div>
      </div>
    </section>
  );
}
