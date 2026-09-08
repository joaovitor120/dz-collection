import type { Product } from '@/types';
import { WHATSAPP_NUMBER } from '@/data/site';
import { formatBRL } from '@/lib/format';
import { absoluteUrl, productPath } from '@/lib/urls';

/**
 * -----------------------------------------------------------------------
 * ÚNICO PONTO DA APLICAÇÃO QUE MONTA LINKS DE WHATSAPP.
 * Número, formato da mensagem e domínio mudam apenas aqui.
 * -----------------------------------------------------------------------
 */

export interface WhatsAppVariation {
  label: string;
  value: string;
}

const BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

function buildUrl(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

/** Contato geral — nunca usa nome ou URL de produto. */
export function createGeneralWhatsAppUrl(): string {
  return buildUrl(
    'Olá! Vim pelo site da DZ Collection e gostaria de tirar uma dúvida.',
  );
}

/**
 * Mensagem de produto. Obrigatoriamente carrega o nome exato e a URL pública
 * daquele produto, para a proprietária identificar de imediato a origem do
 * contato. `currentUrl` permite usar a URL real da página quando disponível.
 */
export function createProductWhatsAppUrl(
  product: Product,
  options: { currentUrl?: string; variations?: WhatsAppVariation[] } = {},
): string {
  const url = options.currentUrl?.startsWith('http')
    ? options.currentUrl
    : absoluteUrl(productPath(product.slug));

  const lines: string[] = [`Olá! Tenho interesse no produto ${product.name}.`, ''];

  const variations = options.variations?.filter((v) => v.label && v.value) ?? [];
  if (variations.length > 0) {
    for (const v of variations) lines.push(`${v.label}: ${v.value}`);
    lines.push('');
  }

  lines.push(`Preço exibido no site: ${formatBRL(product.price)}`, '');
  lines.push(
    'Gostaria de saber mais informações e verificar a disponibilidade.',
    '',
    'Produto:',
    url,
  );

  return buildUrl(lines.join('\n'));
}
