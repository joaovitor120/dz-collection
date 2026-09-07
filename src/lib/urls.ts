/**
 * Origem pública do site. Em produção deve vir de NEXT_PUBLIC_SITE_URL —
 * nunca de localhost, porque essa URL é enviada por WhatsApp e precisa
 * continuar válida quando a proprietária clicar nela depois.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dzcollection.com.br'
).replace(/\/+$/, '');

export function productPath(slug: string): string {
  return `/produtos/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/catalogo?categoria=${slug}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
