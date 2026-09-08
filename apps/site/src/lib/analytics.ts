import type { Product } from '@/types';

/**
 * Camada de analytics preparada, sem adicionar serviços externos.
 * Se um dia GA4 / Meta Pixel / Plausible forem configurados, os eventos já
 * estarão sendo emitidos com as propriedades certas.
 */
type EventName = 'whatsapp_product_click' | 'whatsapp_general_click';

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

function push(event: EventName, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const w = window as AnalyticsWindow;
  const payload = { event, ...params };
  if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
  if (typeof w.gtag === 'function') w.gtag('event', event, params);
}

export function trackProductWhatsAppClick(
  product: Product,
  context: { source: string },
) {
  push('whatsapp_product_click', {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    product_price: product.price,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    source: context.source,
  });
}

export function trackGeneralWhatsAppClick(source: string) {
  push('whatsapp_general_click', {
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    source,
  });
}
