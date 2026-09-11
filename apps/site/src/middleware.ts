import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@dz/shared/supabase/middleware';

/**
 * =============================================================================
 * MIDDLEWARE — atua SOMENTE em /admin
 * =============================================================================
 * A vitrine pública não passa por aqui: os cabeçalhos dela vêm do
 * next.config.mjs, e ela não tem sessão para renovar.
 *
 * Para o painel, faz quatro coisas:
 *   1. renova a sessão e valida o usuário no servidor
 *   2. redireciona quem não está autenticado para /admin/login
 *   3. injeta CSP com nonce por requisição
 *   4. marca todo o painel como não-cacheável e não-indexável
 *
 * Isto NÃO substitui a autorização por rota: cada Server Action e cada endpoint
 * chama `requireAdmin()` de novo. Middleware é conveniência e defesa extra, não
 * a barreira única.
 * =============================================================================
 */

const ADMIN = '/admin';

/** Rotas do painel que existem para quem ainda não entrou. */
const PUBLIC_PATHS = [
  '/admin/login',
  '/admin/login/verificacao',
  '/admin/recuperar-senha',
  '/admin/redefinir-senha',
  '/admin/auth/callback',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  // Sem as variáveis do Supabase o painel não tem como autenticar ninguém.
  // Melhor uma página dizendo o que falta do que um 500 sem explicação.
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!configured) {
    if (pathname === '/admin/configuracao-pendente') {
      return adminHeaders(NextResponse.next({ request }), request, isProduction);
    }
    return adminHeaders(
      NextResponse.redirect(redirectTo(request, '/admin/configuracao-pendente')),
      request,
      isProduction,
    );
  }

  const { response, user } = await updateSession(request);

  if (!user && !isPublicPath(pathname)) {
    const url = redirectTo(request, '/admin/login');
    // O destino original vai como caminho relativo; nunca como URL absoluta,
    // para não virar vetor de open redirect.
    if (pathname !== ADMIN) url.searchParams.set('proximo', pathname);
    return adminHeaders(NextResponse.redirect(url), request, isProduction);
  }

  if (user && (pathname === '/admin/login' || pathname === '/admin/recuperar-senha')) {
    return adminHeaders(NextResponse.redirect(redirectTo(request, ADMIN)), request, isProduction);
  }

  return adminHeaders(response, request, isProduction);
}

function redirectTo(request: NextRequest, pathname: string): URL {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return url;
}

function adminHeaders(
  response: NextResponse,
  request: NextRequest,
  isProduction: boolean,
): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  // `strict-dynamic` permite que os scripts carregados PELO script com nonce
  // funcionem, sem precisar liberar 'unsafe-inline' para o resto.
  // Em desenvolvimento o Next precisa de eval para hot reload; em produção não.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? '' : " 'unsafe-eval'"}`,
    // O Next injeta <style> inline para CSS crítico; hash por build não é viável
    // aqui. Escopo limitado a estilo, que não executa código.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: ${supabaseUrl}`,
    `font-src 'self' data:`,
    `connect-src 'self' ${supabaseUrl}`,
    `media-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // O painel não deve ser embutido em lugar nenhum. Cobre clickjacking.
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    isProduction ? `upgrade-insecure-requests` : '',
  ]
    .filter(Boolean)
    .join('; ');

  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  // Nada do painel entra em cache de navegador, proxy ou CDN. É o que impede o
  // botão "voltar" de reexibir dados administrativos depois do logout.
  if (!request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

/** Só /admin. A vitrine pública nunca entra no middleware. */
export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
