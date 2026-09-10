import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * =============================================================================
 * INVALIDAÇÃO DE CACHE DISPARADA PELO PAINEL
 * =============================================================================
 * O catálogo é servido de cache para ser rápido. Quando a proprietária muda um
 * preço, este endpoint é quem avisa que as páginas envelheceram.
 *
 * Ele NÃO é público. Sem segredo válido responde 404 — não 401 — porque um 401
 * confirmaria a existência da rota para quem estivesse varrendo o site.
 *
 * A comparação do segredo é feita em TEMPO CONSTANTE. Comparar strings com `===`
 * vaza, pelo tempo de resposta, quantos caracteres iniciais estavam certos.
 * =============================================================================
 */

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

const NOT_FOUND = NextResponse.json({ error: 'not found' }, { status: 404 });

export async function POST(request: Request): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return NOT_FOUND;

  const provided = request.headers.get('x-revalidate-secret');
  if (!provided || !safeEqual(provided, expected)) return NOT_FOUND;

  revalidatePath('/', 'layout');
  revalidatePath('/catalogo');
  revalidatePath('/produtos/[slug]', 'page');
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}

/** Qualquer outro método: mesma resposta, para não revelar a rota. */
export async function GET(): Promise<NextResponse> {
  return NOT_FOUND;
}
