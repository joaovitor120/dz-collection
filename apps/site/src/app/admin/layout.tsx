import type { Metadata } from 'next';
import { headers } from 'next/headers';

/**
 * Casca do painel. Não herda cabeçalho, rodapé nem botão de WhatsApp da loja —
 * é outro grupo de rotas, com outro propósito.
 *
 * O nonce da CSP é injetado pelo middleware por requisição e exposto aqui para
 * que os scripts do Next sejam aceitos sem precisar liberar 'unsafe-inline'.
 */

export const metadata: Metadata = {
  title: { default: 'Painel · DZ Collection', template: '%s · Painel DZ Collection' },
  // O painel nunca deve ser indexado. Não é segurança — é higiene.
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <div className="min-h-dvh bg-paper" data-area="painel">
      <meta name="csp-nonce" content={nonce} />
      {children}
    </div>
  );
}
