import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@dz/shared/supabase/middleware';

/**
 * =============================================================================
 * PRIMEIRA CAMADA: roda antes de qualquer página ou rota do painel.
 * =============================================================================
 * Faz quatro coisas:
 *   1. renova a sessão e valida o usuário no servidor
 *   2. redireciona quem não está autenticado para /login
 *   3. injeta CSP com nonce por requisição
 *   4. marca todo o painel como não-cacheável
 *
 * Isto NÃO substitui a autorização por rota: cada Server Action e cada endpoint
 * chama `requireAdmin()` de novo. Middleware é conveniência e defesa extra, não
 * a barreira única.
 * =============================================================================
 */

/** Rotas que existem para quem ainda não entrou. */
const PUBLIC_PATHS = [
  '/login',
  '/login/verificacao',
  '/recuperar-senha',
  '/redefinir-senha',
  '/auth/callback',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  const { response, user } = await updateSession(request);

  // ---------------------------------------------------------------- redireções
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // O destino original vai como caminho relativo; nunca como URL absoluta,
    // para não virar vetor de open redirect.
    if (pathname !== '/') url.searchParams.set('proximo', pathname);
    return applySecurityHeaders(NextResponse.redirect(url), request, isProduction);
  }

  if (user && (pathname === '/login' || pathname === '/recuperar-senha')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return applySecurityHeaders(NextResponse.redirect(url), request, isProduction);
  }

  return applySecurityHeaders(response, request, isProduction);
}

function applySecurityHeaders(
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
    // O Next injeta <style> inline para CSS-in-JS crítico; hash por build não é
    // viável aqui. Escopo limitado a estilo, que não executa código.
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
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)'],
};
