'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { loginSchema, parseInput, passwordResetRequestSchema, mfaChallengeSchema } from '@dz/shared';
import { createClient } from '@dz/shared/supabase/server';
import { enforceAuthRateLimit, enforceRateLimit, clientIp } from '@/lib/rate-limit';
import {
  assertFetchMetadata,
  assertSameOrigin,
  logServer,
  safeRedirectPath,
  toPublicError,
} from '@/lib/security';

export interface ActionState {
  error?: string;
  info?: string;
}

function client() {
  const store = cookies();
  return createClient({
    getAll: () => store.getAll().map(({ name, value }) => ({ name, value })),
    set: (name, value, options) => store.set(name, value, options),
  });
}

/**
 * =============================================================================
 * LOGIN
 * =============================================================================
 * A resposta é NEUTRA em qualquer falha: "E-mail ou senha inválidos." Não
 * revela se a conta existe, se a senha está errada ou se o MFA falta. Isso
 * fecha a porta para enumeração de contas.
 * =============================================================================
 */
export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const GENERIC = 'E-mail ou senha inválidos.';

  try {
    assertSameOrigin();
    assertFetchMetadata();

    const parsed = parseInput(loginSchema, {
      email: formData.get('email'),
      password: formData.get('password'),
    });
    if (!parsed.ok) return { error: GENERIC };

    const { email, password } = parsed.data;
    await enforceAuthRateLimit('login', email);

    const supabase = client();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      logServer('login_failed', { email, ip: clientIp() });
      return { error: GENERIC };
    }

    logServer('login_password_ok', { user_id: data.user.id, ip: clientIp() });

    // Senha correta não é suficiente. Se a conta tem MFA, o acesso só se
    // completa depois do segundo fator.
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.filter((f) => f.status === 'verified') ?? [];

    if (verified.length > 0) redirect('/login/verificacao');

    // Sem MFA cadastrado ainda: manda configurar antes de liberar o painel.
    redirect('/configuracoes/seguranca?exigirMfa=1');
  } catch (error) {
    if (isRedirect(error)) throw error;
    const { message } = toPublicError(error);
    return { error: message };
  }
}

/**
 * =============================================================================
 * DESAFIO MFA (TOTP)
 * =============================================================================
 */
export async function verifyMfa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    assertSameOrigin();
    assertFetchMetadata();

    const parsed = parseInput(mfaChallengeSchema, {
      factorId: formData.get('factorId'),
      code: formData.get('code'),
    });
    if (!parsed.ok) return { error: 'Código inválido.' };

    await enforceRateLimit([{ name: 'mfa_challenge', identifier: clientIp() }]);

    const supabase = client();
    const { factorId, code } = parsed.data;

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) return { error: 'Código inválido.' };

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (error) {
      logServer('mfa_failed', { ip: clientIp() });
      return { error: 'Código inválido.' };
    }

    logServer('mfa_ok', {});
    const next = safeRedirectPath(formData.get('proximo')?.toString(), '/');
    redirect(next);
  } catch (error) {
    if (isRedirect(error)) throw error;
    const { message } = toPublicError(error);
    return { error: message };
  }
}

/**
 * =============================================================================
 * RECUPERAÇÃO DE SENHA
 * =============================================================================
 * Responde SEMPRE a mesma coisa, exista a conta ou não.
 * O link é gerado pelo Supabase Auth — nada de token artesanal.
 * =============================================================================
 */
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const NEUTRAL =
    'Se houver uma conta válida para esse e-mail, enviaremos as instruções de recuperação.';

  try {
    assertSameOrigin();
    const parsed = parseInput(passwordResetRequestSchema, { email: formData.get('email') });
    if (!parsed.ok) return { info: NEUTRAL };

    const { email } = parsed.data;
    await enforceAuthRateLimit('password_reset', email);

    const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL ?? '').replace(/\/+$/, '');
    const supabase = client();

    // redirectTo é montado pelo servidor a partir da env, nunca de input do
    // usuário — e o Supabase ainda valida contra a allowlist do projeto.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${adminUrl}/auth/callback?proximo=/redefinir-senha`,
    });

    logServer('password_reset_requested', { email, ip: clientIp() });
    return { info: NEUTRAL };
  } catch (error) {
    if (isRedirect(error)) throw error;
    // Mesmo em erro interno a resposta continua neutra.
    toPublicError(error);
    return { info: NEUTRAL };
  }
}

/**
 * =============================================================================
 * LOGOUT
 * =============================================================================
 * `scope: 'global'` revoga TODAS as sessões da conta, não só a deste navegador.
 */
export async function signOut(): Promise<never> {
  try {
    assertSameOrigin();
    const supabase = client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.auth.signOut({ scope: 'global' });
    logServer('logout', { user_id: user?.id });
  } catch (error) {
    if (isRedirect(error)) throw error;
    toPublicError(error);
  }
  redirect('/login');
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

/** Cabeçalho de origem, exposto para os testes de segurança. */
export async function debugOrigin(): Promise<string | null> {
  return headers().get('origin');
}
