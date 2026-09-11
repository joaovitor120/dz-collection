import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { AboutSection } from '@/components/home/AboutSection';
import { Benefits } from '@/components/home/Benefits';
import { Testimonials } from '@/components/home/Testimonials';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { buttonClass } from '@/components/ui/Button';
import { fetchFeatured, fetchLaunches, fetchProducts } from '@/lib/db';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.shortDescription,
  alternates: { canonical: '/' },
};

/** Revalida sozinho a cada hora; o painel força a atualização na hora de uma edição. */
export const revalidate = 3600;

export default async function HomePage() {
  const [newArrivals, featured, all] = await Promise.all([
    fetchLaunches(4),
    fetchFeatured(),
    fetchProducts(),
  ]);

  return (
    <>
      <Hero />

      {/* LANÇAMENTOS — prioridade número 1 da proprietária */}
      <section className="container py-14 md:py-20" aria-labelledby="lancamentos-title">
        <SectionHeading
          eyebrow="Recém-chegados"
          title={<span id="lancamentos-title">Lançamentos</span>}
          description="Os modelos mais recentes da DZ Collection."
          href="/catalogo?ordenar=lancamentos"
        />
        <ProductGrid products={newArrivals} priorityCount={2} />
      </section>

      <CategoryShowcase products={all} />

      {/* DESTAQUES — exatamente os produtos que a loja destaca hoje.
          Não existe dado público de vendas, então não há "mais vendidos". */}
      <section
        className="border-t border-line"
        aria-labelledby="destaques-title"
      >
        <div className="container py-14 md:py-20">
          <SectionHeading
            eyebrow="Selecionados pela DZ"
            title={<span id="destaques-title">Destaques</span>}
            href="/catalogo?ordenar=destaques"
          />
          <ProductGrid products={featured} />
        </div>
      </section>

      <AboutSection />

      <Benefits />

      <Testimonials />

      {/* Fechamento simples: um caminho claro para o catálogo */}
      <section className="container py-16 text-center md:py-24">
        <p className="eyebrow">Catálogo completo</p>
        <h2 className="mx-auto mt-3 max-w-lg font-display text-[1.75rem] leading-[1.15] md:text-[2.3rem]">
          Escolha o seu modelo e fale com a gente pelo WhatsApp.
        </h2>
        <Link href="/catalogo" className={buttonClass('primary', 'lg', 'mt-8')}>
          Ver todos os modelos
        </Link>
      </section>
    </>
  );
}
