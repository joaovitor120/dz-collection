import 'server-only';

import { headers } from 'next/headers';

/**
 * =============================================================================
 * Camadas de defesa do painel, reunidas em um só lugar.
 * =============================================================================
 */

/** Origens autorizadas a disparar mutations. Nada fora desta lista. */
export function allowedOrigins(): string[] {
  // O painel vive sob /admin no MESMO domínio da loja, então a origem
  // autorizada é a do site.
  const list = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  ].filter((v): v is string => Boolean(v));
  return list.map((v) => v.replace(/\/+$/, ''));
}

/**
 * Validação de Origin/Referer para toda operação que muda estado.
 *
 * Defesa em profundidade sobre o SameSite=Lax do cookie: `Lax` já barra POST
 * cross-site, mas depende do navegador. Esta checagem acontece no servidor.
 *
 * Ausência de ambos os cabeçalhos é tratada como falha — navegador sempre envia
 * Origin em requisição que altera estado.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get('origin');
  const referer = h.get('referer');
  const allowed = allowedOrigins();

  const candidate = origin ?? (referer ? safeOrigin(referer) : null);
  if (!candidate || !allowed.includes(candidate)) {
    throw new ForbiddenError('origem não autorizada');
  }
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Cabeçalhos Fetch Metadata como camada adicional. Navegador moderno marca
 * requisições cross-site; bloqueamos as que não fazem sentido no painel.
 * Nunca usado sozinho — é complemento do assertSameOrigin.
 */
export async function assertFetchMetadata(): Promise<void> {
  const h = await headers();
  const site = h.get('sec-fetch-site');
  if (site && !['same-origin', 'same-site', 'none'].includes(site)) {
    throw new ForbiddenError('requisição cross-site bloqueada');
  }
}

/**
 * Redirect só para caminho interno DO PAINEL.
 *
 * Duas travas, não uma: barra única (nada de `//host`, que é protocol-relative
 * e sai do site) e prefixo `/admin`. A segunda passou a importar quando o painel
 * mudou para o mesmo domínio da loja — sem ela, `?proximo=/catalogo` levaria
 * quem acabou de autenticar para fora do painel.
 */
export const ADMIN_BASE = '/admin';

export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = ADMIN_BASE,
): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return fallback;
  try {
    const url = new URL(raw, 'https://placeholder.invalid');
    const path = url.pathname + url.search;
    if (path !== ADMIN_BASE && !path.startsWith(`${ADMIN_BASE}/`)) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

// -----------------------------------------------------------------------------
// Erros — mensagem genérica para o usuário, detalhe só no log do servidor.
// -----------------------------------------------------------------------------
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly publicMessage: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'não autenticado') {
    super(message, 401, 'Sessão expirada. Entre novamente.');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'não autorizado') {
    super(message, 403, 'Você não tem permissão para esta ação.');
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message, 400, 'Não foi possível concluir a operação. Verifique os dados enviados.');
  }
}

export class RateLimitError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super('rate limited', 429, 'Muitas tentativas. Aguarde um momento e tente de novo.');
  }
}

const REDACT = /(password|senha|token|secret|authorization|cookie|apikey|api_key|totp|refresh)/i;

/** Remove campos sensíveis antes de qualquer log. */
export function redact(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACT.test(k) ? '[REDACTED]' : redact(v),
    ]),
  );
}

/**
 * Traduz qualquer erro para uma resposta segura.
 * O usuário nunca recebe stack, SQL, path interno ou nome de variável.
 */
export function toPublicError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) {
    logServer('app_error', { name: error.name, message: error.message });
    return { status: error.status, message: error.publicMessage };
  }
  logServer('unexpected_error', {
    message: error instanceof Error ? error.message : String(error),
  });
  return { status: 500, message: 'Não foi possível concluir a operação.' };
}

/** Log estruturado, sempre passando pelo redator. */
export function logServer(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, at: new Date().toISOString(), ...(redact(data) as object) }));
}
