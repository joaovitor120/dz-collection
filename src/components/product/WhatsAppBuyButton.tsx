'use client';

import { useCallback } from 'react';
import type { Product } from '@/types';
import { buttonClass } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { createProductWhatsAppUrl } from '@/lib/whatsapp';
import { trackProductWhatsAppClick } from '@/lib/analytics';

/**
 * CTA comercial do site. Abre o WhatsApp da DZ Collection já com o nome exato
 * e a URL pública daquele produto na mensagem — é assim que a proprietária
 * identifica de imediato qual peça trouxe o contato.
 */
export function WhatsAppBuyButton({
  product,
  source,
  label = 'Comprar pelo WhatsApp',
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  product: Product;
  /** De onde partiu o clique — vai para o analytics (card, pdp, sticky, busca...) */
  source: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const onClick = useCallback(() => {
    trackProductWhatsAppClick(product, { source });
  }, [product, source]);

  // A URL enviada é sempre a URL pública canônica do produto, montada a partir
  // de NEXT_PUBLIC_SITE_URL + slug. Nunca localhost, nunca URL de preview.
  const href = createProductWhatsAppUrl(product);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={buttonClass(variant, size, className)}
      aria-label={`Comprar ${product.name} pelo WhatsApp`}
      data-testid="whatsapp-buy"
      data-product-slug={product.slug}
    >
      <WhatsAppIcon className="h-[1.05em] w-[1.05em] shrink-0" />
      <span>{label}</span>
    </a>
  );
}
