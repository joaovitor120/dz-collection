/**
 * ÚNICO ponto da aplicação que monta link de WhatsApp.
 * Número, formato da mensagem e domínio mudam apenas aqui.
 */
import { formatCents } from './money';

export const WHATSAPP_NUMBER = '5527996441300';
export const WHATSAPP_DISPLAY = '+55 27 99644-1300';

const BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

function buildUrl(message: string): string {
  return `${BASE}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppVariation {
  label: string;
  value: string;
}

/** Contato geral. Nunca carrega nome nem URL de produto. */
export function createGeneralWhatsAppUrl(): string {
  return buildUrl('Olá! Vim pelo site da DZ Collection e gostaria de tirar uma dúvida.');
}

/**
 * Mensagem de produto. Carrega obrigatoriamente o nome exato e a URL pública
 * daquele produto — é assim que a proprietária identifica de imediato qual
 * peça gerou o contato.
 */
export function createProductWhatsAppUrl(
  product: { name: string; slug: string; price_cents: number },
  siteUrl: string,
  variations: WhatsAppVariation[] = [],
): string {
  const url = `${siteUrl.replace(/\/+$/, '')}/produtos/${product.slug}`;
  const lines: string[] = [`Olá! Tenho interesse no produto ${product.name}.`, ''];

  const valid = variations.filter((v) => v.label && v.value);
  if (valid.length > 0) {
    for (const v of valid) lines.push(`${v.label}: ${v.value}`);
    lines.push('');
  }

  lines.push(
    `Preço exibido no site: ${formatCents(product.price_cents)}`,
    '',
    'Gostaria de saber mais informações e verificar a disponibilidade.',
    '',
    'Produto:',
    url,
  );

  return buildUrl(lines.join('\n'));
}
