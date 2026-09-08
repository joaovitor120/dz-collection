import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-display', display: 'swap',
});
const sans = Inter({
  subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans', display: 'swap',
});

/** O painel nunca deve ser indexado. Não é segurança — é higiene. */
export const metadata: Metadata = {
  title: { default: 'Painel · DZ Collection', template: '%s · Painel DZ Collection' },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#131211' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get('x-nonce') ?? undefined;
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <head><meta name="csp-nonce" content={nonce} /></head>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
