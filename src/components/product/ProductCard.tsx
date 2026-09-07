import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Price } from '@/components/product/Price';
import { WhatsAppBuyButton } from '@/components/product/WhatsAppBuyButton';
import { Badge } from '@/components/ui/Badge';
import { productPath } from '@/lib/urls';

/**
 * Card compacto e editorial: a foto domina, a moldura é uma linha fina.
 * Clicar na imagem ou no nome abre a página do produto.
 * O botão "Comprar" abre o WhatsApp daquela peça.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw',
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const href = productPath(product.slug);
  const hoverImage = product.images[1];

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={href}
        className="relative block overflow-hidden bg-paper-shade"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover transition-[opacity,transform] duration-400 ease-editorial group-hover:scale-[1.02] md:group-hover:opacity-0"
          />
          {hoverImage ? (
            <Image
              src={hoverImage}
              alt=""
              fill
              sizes={sizes}
              loading="lazy"
              className="hidden object-cover opacity-0 transition-opacity duration-400 ease-editorial md:block md:group-hover:opacity-100"
            />
          ) : null}
        </div>

        {/* Uma etiqueta por card: mais de uma polui a vitrine. */}
        <div className="pointer-events-none absolute left-0 top-0 p-2.5">
          {!product.available ? (
            <Badge tone="muted">Esgotado</Badge>
          ) : product.isNew ? (
            <Badge tone="ink">Lançamento</Badge>
          ) : product.stock === 1 ? (
            <Badge tone="muted">Última peça</Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-3.5">
        <h3 className="text-[0.82rem] font-normal leading-snug">
          <Link href={href} className="link-underline hover:text-ink-soft">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2">
          <Price product={product} />
        </div>

        <div className="mt-3.5 flex-1" />

        <WhatsAppBuyButton
          product={product}
          source="product_card"
          label="Comprar"
          variant="outline"
          size="sm"
          className="w-full"
        />
      </div>
    </article>
  );
}
