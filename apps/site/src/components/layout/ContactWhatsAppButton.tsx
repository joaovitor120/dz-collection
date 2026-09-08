'use client';

import { buttonClass } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/Icon';
import { createGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { trackGeneralWhatsAppClick } from '@/lib/analytics';

export function ContactWhatsAppButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={createGeneralWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackGeneralWhatsAppClick('contact_page')}
      className={buttonClass('primary', 'lg', className)}
    >
      <WhatsAppIcon className="h-[1.05em] w-[1.05em]" />
      Abrir conversa no WhatsApp
    </a>
  );
}
