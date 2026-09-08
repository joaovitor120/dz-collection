'use client';

import Link from 'next/link';
import { categories, paymentMethods, site, WHATSAPP_DISPLAY } from '@/data/site';
import { categoryPath } from '@/lib/urls';
import { createGeneralWhatsAppUrl } from '@/lib/whatsapp';
import { trackGeneralWhatsAppClick } from '@/lib/analytics';
import { Logo } from '@/components/ui/Logo';
import { WhatsAppIcon } from '@/components/ui/Icon';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line bg-paper md:mt-28">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Logo size="md" className="items-start" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {site.shortDescription}
            </p>
          </div>

          <nav className="md:col-span-2" aria-label="Navegação do rodapé">
            <p className="eyebrow mb-4">Navegação</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="link-underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/catalogo?ordenar=lancamentos" className="link-underline">
                  Lançamentos
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="link-underline">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="link-underline">
                  Sobre a DZ
                </Link>
              </li>
              <li>
                <Link href="/contato" className="link-underline">
                  Contato
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="md:col-span-2" aria-label="Formatos">
            <p className="eyebrow mb-4">Formatos</p>
            <ul className="space-y-2.5 text-sm">
              {categories
                .filter((c) => c.image)
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={categoryPath(c.slug)} className="link-underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="eyebrow mb-4">Atendimento</p>
            <a
              href={createGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGeneralWhatsAppClick('footer')}
              className="inline-flex items-center gap-2.5 text-sm"
            >
              <WhatsAppIcon className="h-5 w-5 text-whats" />
              <span className="link-underline">{WHATSAPP_DISPLAY}</span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Todo o atendimento e a finalização dos pedidos acontecem pelo WhatsApp.
            </p>

            <p className="eyebrow mb-3 mt-8">Formas de pagamento</p>
            <ul className="flex flex-wrap gap-x-2 gap-y-1.5 text-2xs normal-case tracking-normal text-ink-muted">
              {paymentMethods.map((m) => (
                <li key={m} className="border border-line px-2 py-1">
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-2xs normal-case tracking-normal text-ink-muted">
              Formas de pagamento combinadas no atendimento. Desconto de 5% no Pix, não
              acumulável com outras promoções.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-2xs normal-case tracking-normal text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. Todos os direitos reservados. CNPJ {site.cnpj}.
          </p>
          <p className="font-display text-sm normal-case tracking-normal text-ink">
            {site.tagline}
          </p>
        </div>

        <p className="mt-4 text-2xs normal-case tracking-normal text-ink-muted">
          Desenvolvido por João Vitor Binda Caetano
        </p>
      </div>
    </footer>
  );
}
