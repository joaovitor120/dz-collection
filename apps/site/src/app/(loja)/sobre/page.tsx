import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/data/site';
import { benefits } from '@/data/site';
import { buttonClass } from '@/components/ui/Button';
import { ChatIcon, PixIcon, ShieldIcon, SparkleIcon } from '@/components/ui/Icon';

const icons = { shield: ShieldIcon, pix: PixIcon, chat: ChatIcon, sparkle: SparkleIcon };

export const metadata: Metadata = {
  title: 'Sobre a DZ Collection',
  description:
    'A história da DZ Collection: modelos selecionados unindo design, qualidade e proteção UV400.',
  alternates: { canonical: '/sobre' },
};

export default function AboutPage() {
  return (
    <div className="pb-8">
      <section className="border-b border-line">
        <div className="container grid gap-10 py-12 md:grid-cols-12 md:items-center md:gap-14 md:py-20">
          <div className="md:col-span-6">
            <p className="eyebrow">Sobre a DZ</p>
            <h1 className="mt-4 font-display text-[2.2rem] leading-[1.08] md:text-[3rem]">
              Nossa história
            </h1>
            <p className="mt-6 max-w-prose2 text-sm leading-relaxed text-ink-soft md:text-[0.95rem]">
              {site.story[0]}
            </p>
          </div>
          <div className="md:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-shade md:aspect-[4/5]">
              <Image
                src="/images/products/valentina/oculos-valentina-preto-dourado-01.webp"
                alt="Modelo usando o Óculos de Sol Valentina da DZ Collection"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-[1.6rem] leading-tight md:text-[2rem]">
              O que guia cada escolha
            </h2>
          </div>
          <div className="space-y-5 md:col-span-7 md:col-start-6">
            {site.story.slice(1).map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="max-w-prose2 text-sm leading-relaxed text-ink-soft md:text-[0.95rem]"
              >
                {paragraph}
              </p>
            ))}
            <p className="pt-2 font-display text-xl text-ink">{site.tagline}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper-shade/60">
        <div className="container py-12 md:py-16">
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = icons[b.icon];
              return (
                <li key={b.title} className="flex gap-3.5">
                  <Icon className="h-6 w-6 shrink-0 text-gold" />
                  <div>
                    <h3 className="text-[0.82rem] font-medium">{b.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                      {b.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container py-16 text-center md:py-20">
        <h2 className="mx-auto max-w-lg font-display text-[1.7rem] leading-[1.15] md:text-[2.2rem]">
          Veja os modelos disponíveis
        </h2>
        <Link href="/catalogo" className={buttonClass('primary', 'lg', 'mt-7')}>
          Ir para o catálogo
        </Link>
      </section>
    </div>
  );
}
