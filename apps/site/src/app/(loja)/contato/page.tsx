import type { Metadata } from 'next';
import Link from 'next/link';
import { site, WHATSAPP_DISPLAY } from '@/data/site';
import { ContactWhatsAppButton } from '@/components/layout/ContactWhatsAppButton';
import { buttonClass } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Contato',
  description: `Fale com a DZ Collection pelo WhatsApp ${WHATSAPP_DISPLAY}.`,
  alternates: { canonical: '/contato' },
};

export default function ContactPage() {
  return (
    <div className="container py-14 md:py-20">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="eyebrow">Atendimento</p>
          <h1 className="mt-4 font-display text-[2.2rem] leading-[1.08] md:text-[3rem]">
            Fale com a gente
          </h1>
          <p className="mt-6 max-w-prose2 text-sm leading-relaxed text-ink-soft md:text-[0.95rem]">
            Todo o atendimento da DZ Collection acontece pelo WhatsApp: dúvidas sobre
            um modelo, disponibilidade, formas de pagamento, frete e o fechamento do
            pedido.
          </p>

          <div className="mt-9 border-y border-line py-6">
            <p className="eyebrow mb-2">WhatsApp</p>
            <p className="font-display text-2xl">{WHATSAPP_DISPLAY}</p>
            <ContactWhatsAppButton className="mt-5" />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-ink-muted">
            {site.name} · CNPJ {site.cnpj}
          </p>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <h2 className="eyebrow mb-4">Perguntas rápidas</h2>
          <dl className="divide-y divide-line border-y border-line">
            <div className="py-4">
              <dt className="text-sm font-medium">Como faço para comprar?</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Escolha o modelo no catálogo e toque em “Comprar pelo WhatsApp”. A
                conversa abre com o nome e o link daquele óculos já preenchidos.
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-sm font-medium">Quais formas de pagamento?</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Pix, cartões Visa, Mastercard, Elo, American Express, Hipercard,
                Diners, Discover e Aura, além de transferência bancária. Pagando com
                Pix há 5% de desconto, não acumulável com outras promoções.
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-sm font-medium">E o frete?</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                O valor e o prazo são combinados no atendimento, de acordo com o seu
                endereço.
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-sm font-medium">Os óculos têm proteção UV?</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Os modelos com proteção UV400 trazem essa informação na própria
                página do produto, nas especificações técnicas.
              </dd>
            </div>
          </dl>

          <Link href="/catalogo" className={buttonClass('outline', 'md', 'mt-8')}>
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
