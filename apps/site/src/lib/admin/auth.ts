import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@dz/shared/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ForbiddenError, UnauthorizedError, logServer } from './security';

/**
 * =============================================================================
 * AUTORIZAÇÃO SERVER-SIDE — porta única do painel.
 * =============================================================================
 * Nenhuma rota, action ou endpoint administrativo confia em estado do cliente.
 * Chegar até uma página NÃO significa estar autorizado: cada mutation chama
 * `requireAdmin()` de novo.
 * =============================================================================
 */

/** Tempo máximo de sessão sem reautenticação, em segundos (12 h). */
export const ABSOLUTE_SESSION_SECONDS = 12 * 60 * 60;

/** Janela para considerar uma autenticação "recente" em ações sensíveis (15 min). */
export const RECENT_AUTH_SECONDS = 15 * 60;

export async function supabaseServer(): Promise<SupabaseClient> {
  const store = await cookies();
  return createClient({
    getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
    set: (name, value, options) => store.set(name, value, options),
  });
}

export interface AdminSession {
  user: User;
  client: SupabaseClient;
  /** Nível de garantia atual da sessão: aal1 = só senha, aal2 = senha + MFA. */
  aal: string;
  /** Momento da última autenticação efetiva (epoch em segundos). */
  authenticatedAt: number;
}

/**
 * Sessão autenticada e AUTORIZADA.
 *
 * Ordem das checagens — cada uma pode reprovar sozinha:
 *   1. `getUser()`, que valida o token no servidor de Auth (não `getSession()`,
 *      que só lê o cookie e portanto é dado do cliente)
 *   2. presença em admin_users, verificada pelo banco via is_admin()
 *   3. AAL2, ou seja, MFA cumprido nesta sessão
 *   4. idade absoluta da sessão
 */
export async function requireAdmin(options: { requireMfa?: boolean } = {}): Promise<AdminSession> {
  const requireMfa = options.requireMfa ?? true;
  const client = await supabaseServer();

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) throw new UnauthorizedError();

  // Autorização: quem responde é o banco, não o e-mail vindo do navegador.
  const { data: isAdmin, error: adminError } = await client.rpc('is_admin');
  if (adminError) {
    logServer('is_admin_rpc_failed', { message: adminError.message });
    throw new ForbiddenError('falha ao verificar autorização');
  }
  if (isAdmin !== true) {
    logServer('authz_denied', { user_id: user.id });
    throw new ForbiddenError('usuário autenticado não é administrador');
  }

  const { data: aalData } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const aal = aalData?.currentLevel ?? 'aal1';

  if (requireMfa && aal !== 'aal2') {
    throw new MfaRequiredError();
  }

  const authenticatedAt = readAuthTime(user);
  if (Date.now() / 1000 - authenticatedAt > ABSOLUTE_SESSION_SECONDS) {
    logServer('session_absolute_timeout', { user_id: user.id });
    throw new UnauthorizedError('sessão expirou pelo tempo máximo');
  }

  return { user, client, aal, authenticatedAt };
}

/**
 * Reautenticação recente para operações de alto risco: trocar senha, desligar
 * MFA, alterar e-mail. Não é exigida em edição rotineira de produto.
 */
export async function requireRecentAuth(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (Date.now() / 1000 - session.authenticatedAt > RECENT_AUTH_SECONDS) {
    throw new ReauthRequiredError();
  }
  return session;
}

function readAuthTime(user: User): number {
  const amr = (user as unknown as { amr?: { timestamp?: number }[] }).amr;
  if (Array.isArray(amr) && amr.length > 0) {
    const latest = Math.max(...amr.map((entry) => entry.timestamp ?? 0));
    if (latest > 0) return latest;
  }
  const iso = user.last_sign_in_at ?? user.created_at;
  return iso ? Math.floor(new Date(iso).getTime() / 1000) : 0;
}

/**
 * Versão para PÁGINAS: em vez de estourar um erro, encaminha a pessoa para o
 * lugar certo — login, verificação de MFA ou aviso de falta de permissão.
 *
 * As Server Actions continuam usando `requireAdmin()`, que lança: ali um
 * redirect silencioso esconderia uma falha de autorização real.
 */
export async function requireAdminPage(
  options: { requireMfa?: boolean } = {},
): Promise<AdminSession> {
  try {
    return await requireAdmin(options);
  } catch (error) {
    if (error instanceof MfaRequiredError) redirect('/admin/login/verificacao');
    if (error instanceof ForbiddenError) redirect('/admin/sem-permissao');
    if (error instanceof UnauthorizedError) redirect('/admin/login');
    throw error;
  }
}

export class MfaRequiredError extends Error {
  readonly redirectTo = '/login/verificacao';
  constructor() {
    super('MFA obrigatório');
    this.name = 'MfaRequiredError';
  }
}

export class ReauthRequiredError extends Error {
  readonly redirectTo = '/login?motivo=reautenticar';
  constructor() {
    super('reautenticação necessária');
    this.name = 'ReauthRequiredError';
  }
}

/** Grava na trilha de auditoria. O autor vem de auth.uid(), nunca do cliente. */
export async function audit(
  client: SupabaseClient,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await client.rpc('log_admin_action', {
    p_action: action,
    p_entity_type: entityType ?? null,
    p_entity_id: entityId ?? null,
    p_metadata: metadata,
  });
  if (error) logServer('audit_write_failed', { action, message: error.message });
}
