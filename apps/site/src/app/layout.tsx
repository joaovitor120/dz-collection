import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { site } from '@/data/site';
import { SITE_URL } from '@/lib/urls';

/**
 * =============================================================================
 * LAYOUT RAIZ — só o esqueleto do documento
 * =============================================================================
 * Fontes, CSS global e metadados padrão. Nada de cabeçalho, rodapé ou botão de
 * WhatsApp: isso pertence à loja, e o painel não pode herdar.
 *
 * Quem monta cada casca é o layout do respectivo grupo de rotas:
 *   (loja)/layout.tsx   → vitrine pública
 *   admin/layout.tsx    → painel administrativo
 * =============================================================================
 */

/**
 * Fontes SERVIDAS PELO PRÓPRIO SITE, não pelo Google.
 *
 * Arquivos variáveis, subset latino, os mesmos que o Google entrega. Motivos:
 * o build deixa de depender de uma rede externa, o visitante não faz requisição
 * a um terceiro só para ler a página, e `fonts.googleapis.com` e
 * `fonts.gstatic.com` saem da CSP — duas origens externas a menos, inclusive na
 * do painel.
 */
const display = localFont({
  src: '../fonts/cormorant-garamond-variable.woff2',
  weight: '300 700',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
});

const sans = localFont({
  src: '../fonts/inter-variable.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.shortDescription,
  applicationName: site.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FAF8F4',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
