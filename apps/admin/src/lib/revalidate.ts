import 'server-only';

import { logServer } from './security';

/**
 * =============================================================================
 * REVALIDAÇÃO DO CATÁLOGO PÚBLICO
 * =============================================================================
 * O site público é estático por padrão — é o que o deixa rápido. Quando a
 * proprietária muda um preço no painel, alguém precisa avisar o site de que
 * a página em cache envelheceu.
 *
 * O aviso vai autenticado por um segredo compartilhado (REVALIDATE_SECRET),
 * que existe só no servidor dos dois lados. Sem ele, o endpoint do site seria
 * um botão público de invalidação de cache — e portanto um vetor de DoS.
 *
 * Falha aqui NÃO derruba a operação: o dado já está salvo no banco. O site
 * apenas demora um pouco mais para refletir. Por isso esta função nunca lança.
 * =============================================================================
 */
export async function revalidateSite(): Promise<void> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');
  const secret = process.env.REVALIDATE_SECRET;

  if (!siteUrl || !secret) {
    logServer('revalidate_skipped', { reason: 'configuração ausente' });
    return;
  }

  try {
    const response = await fetch(`${siteUrl}/api/revalidar`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Cabeçalho, não query string: não vaza em log de acesso nem no Referer.
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ scope: 'catalogo' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      logServer('revalidate_rejected', { status: response.status });
    }
  } catch (error) {
    logServer('revalidate_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
