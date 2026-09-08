'use client';

import { usePathname } from 'next/navigation';
import { createGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { trackGeneralWhatsAppClick } from '@/lib/analytics';
import { WhatsAppIcon } from '@/components/ui/Icon';

/**
 * Atendimento geral — mensagem sem produto. Discreto, fora do caminho do
 * conteúdo, e escondido no mobile das páginas de produto para não competir
 * com o CTA fixo daquela peça.
 */
export function WhatsAppFloat() {
  const pathname = usePathname();
  const onProductPage = pathname?.startsWith('/produtos/');

  return (
    <a
      href={createGeneralWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackGeneralWhatsAppClick('floating_button')}
      className={`fixed bottom-5 right-4 z-float grid h-12 w-12 place-items-center rounded-full border border-ink/10 bg-ink text-paper shadow-lift transition-transform duration-250 ease-editorial hover:scale-105 md:bottom-6 md:right-6 ${
        onProductPage ? 'hidden md:grid' : ''
      }`}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Falar com a DZ Collection no WhatsApp"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
