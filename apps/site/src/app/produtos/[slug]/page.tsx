import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelated, products } from '@/data/products';
import { categories, site } from '@/data/site';
import { absoluteUrl, categoryPath, productPath } from '@/lib/urls';
import { formatBRL } from '@/lib/format';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductSpecifications } from '@/components/product/ProductSpecifications';
import { StickyBuyBar } from '@/components/product/StickyBuyBar';
import { WhatsAppBuyButton } from '@/components/product/WhatsAppBuyButton';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Price } from '@/components/product/Price';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ShieldIcon } from '@/components/ui/Icon';

/** Só existem as 8 peças reais: qualquer outro slug é 404 de verdade. */
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Produto não encontrado' };

  const description = product.description[0]?.slice(0, 300) ?? site.shortDescription;
  const primaryImage = product.images[0] ?? '';

  return {
    title: product.name,
    description,
    alternates: { canonical: productPath(product.slug) },
    openGraph: {
      type: 'website',
      title: `${product.name} — ${site.name}`,
      description,
      url: productPath(product.slug),
      images: [{ url: primaryImage, alt: product.imageAlts[0] ?? product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ${site.name}`,
      description,
      images: [primaryImage],
    },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const category = categories.find((c) => c.slug === product.category);
  const related = getRelated(product, 4);
  const hasUv = [
    ...(product.specifications ?? []).map((s) => `${s.label} ${s.value}`),
    ...(product.highlights ?? []),
    ...product.description,
  ]
    .join(' ')
    .toUpperCase()
    .includes('UV400');

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description.join(' '),
    image: product.images.map((i) => absoluteUrl(i)),
    brand: { '@type': 'Brand', name: site.name },
    category: category?.name,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(productPath(product.slug)),
      priceCurrency: 'BRL',
      price: product.price.toFixed(2),
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: site.name },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: absoluteUrl('/') },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Catálogo',
        item: absoluteUrl('/catalogo'),
      },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: category.name,
              item: absoluteUrl(categoryPath(category.slug)),
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: category ? 4 : 3,
        name: product.name,
        item: absoluteUrl(productPath(product.slug)),
      },
    ],
  };

  return (
    <article className="pb-24 md:pb-20">
      <div className="container pt-6 md:pt-8">
        <nav aria-label="Você está em" className="text-2xs uppercase tracking-widest2 text-ink-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-underline">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/catalogo" className="link-underline">
                Catálogo
              </Link>
            </li>
            {category ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={categoryPath(category.slug)} className="link-underline">
                    {category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </div>

      <div className="container mt-6 grid gap-8 md:mt-10 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div>
          <ProductGallery product={product} />
        </div>

        {/* Bloco de decisão: nome, preço, CTA — tudo acima da dobra no desktop */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.isNew ? <Badge tone="ink">Lançamento</Badge> : null}
            {product.stock === 1 && product.available ? (
              <Badge tone="muted">Última peça</Badge>
            ) : null}
          </div>

          <h1 className="mt-4 font-display text-[1.9rem] leading-[1.1] md:text-[2.4rem]">
            {product.name}
          </h1>

          <div className="mt-5">
            <Price product={product} size="lg" showPix />
          </div>

          <div id="pdp-compra" className="mt-7">
            <WhatsAppBuyButton
              product={product}
              source="pdp_primary"
              size="lg"
              className="w-full sm:w-auto sm:min-w-[300px]"
            />
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Você fala direto com a DZ Collection. A mensagem já vai preenchida com
              este modelo — é só enviar.
            </p>
          </div>

          {hasUv ? (
            <p className="mt-6 inline-flex items-center gap-2 border border-line px-3 py-2 text-2xs uppercase tracking-widest2 text-ink-soft">
              <ShieldIcon className="h-4 w-4 text-gold" />
              Proteção UV400
            </p>
          ) : null}

          <div className="mt-9 space-y-4">
            {product.description.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="max-w-prose2 text-sm leading-relaxed text-ink-soft"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {product.highlights?.length ? (
            <div className="mt-8">
              <h2 className="eyebrow mb-3">Características</h2>
              <ul className="space-y-2">
                {product.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-gold" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-9">
            <ProductSpecifications product={product} />
          </div>

          <p className="mt-6 text-xs leading-relaxed text-ink-muted">
            Preço à vista de {formatBRL(product.price)}
            {product.pixPrice
              ? ` — ${formatBRL(product.pixPrice)} pagando com Pix (5% de desconto, não acumulável com outras promoções).`
              : '.'}{' '}
            Frete e prazo de entrega são combinados no atendimento pelo WhatsApp.
          </p>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="container mt-20 md:mt-28" aria-labelledby="relacionados-title">
          <SectionHeading
            eyebrow="Você também pode gostar"
            title={<span id="relacionados-title">Outros modelos</span>}
            href="/catalogo"
          />
          <ProductGrid products={related} />
        </section>
      ) : null}

      <StickyBuyBar product={product} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </article>
  );
}
