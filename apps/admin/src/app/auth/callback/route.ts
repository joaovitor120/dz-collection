import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@dz/shared/supabase/server';
import { safeRedirectPath, logServer } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Troca o código do link de e-mail por uma sessão.
 *
 * O destino é passado por `safeRedirectPath`, que só aceita caminho interno —
 * `?proximo=https://atacante.com` vira `/`. É a trava contra open redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirectPath(url.searchParams.get('proximo'), '/');

  if (!code) return NextResponse.redirect(new URL('/login?erro=link', request.url));

  const store = cookies();
  const supabase = createClient({
    getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
    set: (name, value, options) => store.set(name, value, options),
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logServer('auth_callback_failed', { message: error.message });
    return NextResponse.redirect(new URL('/login?erro=link', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
