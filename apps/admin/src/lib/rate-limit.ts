import 'server-only';

import { headers } from 'next/headers';
import { createAdminClient } from '@dz/shared/supabase/admin';
import { RateLimitError, logServer } from './security';

/**
 * =============================================================================
 * RATE LIMITING
 * =============================================================================
 * Contagem no PostgreSQL, não em memória: a Vercel é serverless e cada
 * invocação seria um contador novo.
 *
 * Cada tentativa consome DOIS baldes independentes — o da conta e o do IP.
 * Basta um estourar para bloquear:
 *
 *   · conta → impede força bruta contra a senha da proprietária
 *   · IP    → impede varredura de várias contas a partir da mesma origem
 *
 * O bloqueio por conta tem TETO de tempo, de propósito: se fosse permanente,
 * qualquer pessoa derrubaria o acesso da proprietária só enviando senha errada.
 * =============================================================================
 */

export const LIMITS = {
  login_account: { max: 5, windowSeconds: 300, maxBlockSeconds: 900 },
  login_ip: { max: 20, windowSeconds: 300, maxBlockSeconds: 900 },
  password_reset_account: { max: 3, windowSeconds: 3600, maxBlockSeconds: 3600 },
  password_reset_ip: { max: 10, windowSeconds: 3600, maxBlockSeconds: 3600 },
  mfa_challenge: { max: 8, windowSeconds: 300, maxBlockSeconds: 900 },
  admin_mutation: { max: 120, windowSeconds: 60, maxBlockSeconds: 120 },
  upload: { max: 30, windowSeconds: 300, maxBlockSeconds: 300 },
  revalidate: { max: 60, windowSeconds: 60, maxBlockSeconds: 120 },
} as const;

export type LimitName = keyof typeof LIMITS;

/** IP do cliente conforme a Vercel o entrega. */
export function clientIp(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'desconhecido';
  return h.get('x-real-ip') ?? 'desconhecido';
}

async function consume(
  name: LimitName,
  identifier: string,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const limit = LIMITS[name];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_bucket: name,
      p_identifier: identifier,
      p_max_attempts: limit.max,
      p_window_seconds: limit.windowSeconds,
      p_max_block_seconds: limit.maxBlockSeconds,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: row?.allowed !== false,
      retryAfter: Number(row?.retry_after_seconds ?? 0),
    };
  } catch (error) {
    // Fail-closed em rota de autenticação seria um DoS fácil (derrubar o banco
    // trancaria o painel). Fail-open registrando alto é a escolha consciente:
    // as outras camadas — senha, MFA, RLS — continuam de pé.
    logServer('rate_limit_unavailable', {
      bucket: name,
      message: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true, retryAfter: 0 };
  }
}

/** Consome os baldes indicados e lança RateLimitError se algum estourar. */
export async function enforceRateLimit(
  buckets: { name: LimitName; identifier: string }[],
): Promise<void> {
  const results = await Promise.all(buckets.map((b) => consume(b.name, b.identifier)));
  const blocked = results.filter((r) => !r.allowed);
  if (blocked.length > 0) {
    const retryAfter = Math.max(...blocked.map((r) => r.retryAfter), 1);
    logServer('rate_limited', { buckets: buckets.map((b) => b.name), retryAfter });
    throw new RateLimitError(retryAfter);
  }
}

/** Atalho para os fluxos de autenticação: conta + IP no mesmo passo. */
export async function enforceAuthRateLimit(
  kind: 'login' | 'password_reset',
  account: string,
): Promise<void> {
  const ip = clientIp();
  await enforceRateLimit([
    { name: `${kind}_account` as LimitName, identifier: account.toLowerCase() },
    { name: `${kind}_ip` as LimitName, identifier: ip },
  ]);
}
