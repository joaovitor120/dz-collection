'use server';

import { revalidatePath } from 'next/cache';
import { passwordChangeSchema, parseInput, totpCodeSchema } from '@dz/shared';
import { audit, requireAdmin, requireRecentAuth, supabaseServer } from '@/lib/admin/auth';
import { assertFetchMetadata, assertSameOrigin, logServer, toPublicError } from '@/lib/admin/security';
import type { ActionState } from '@/app/admin/login/actions';

/**
 * Troca de senha. Exige reautenticação recente (ação sensível) e, ao final,
 * revoga as demais sessões: se a senha foi trocada por suspeita de
 * comprometimento, nenhuma sessão antiga pode sobreviver.
 */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await assertFetchMetadata();

    const parsed = parseInput(passwordChangeSchema, {
      password: formData.get('password'),
      confirm: formData.get('confirm'),
    });
    if (!parsed.ok) {
      return { error: parsed.issues[0]?.message ?? parsed.message };
    }

    const { client, user } = await requireRecentAuth();
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    if (error) {
      logServer('password_change_failed', { user_id: user.id });
      return { error: 'Não foi possível alterar a senha. Tente novamente.' };
    }

    await audit(client, 'PASSWORD_CHANGED', 'admin_user', user.id);
    logServer('password_changed', { user_id: user.id });

    // Encerra as outras sessões, mantendo apenas a atual.
    await client.auth.signOut({ scope: 'others' });

    return { info: 'Senha alterada. As demais sessões foram encerradas.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

/** Inicia o cadastro do TOTP e devolve o QR Code para o app autenticador. */
export async function startMfaEnrollment(): Promise<
  { ok: true; factorId: string; qr: string } | { ok: false; error: string }
> {
  try {
    await assertSameOrigin();
    // Ainda em aal1: a pessoa acabou de logar com senha e vai configurar o MFA.
    await requireAdmin({ requireMfa: false });
    const supabase = await supabaseServer();

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `DZ Collection ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data || data.type !== 'totp') {
      return { ok: false, error: 'Não foi possível iniciar a configuração.' };
    }

    // O segredo em texto NÃO é devolvido para a interface: só o QR Code, que é
    // exibido uma única vez, durante o cadastro.
    return { ok: true, factorId: data.id, qr: data.totp.qr_code };
  } catch (error) {
    const { message } = toPublicError(error);
    return { ok: false, error: message };
  }
}

/** Confirma o primeiro código e ativa o segundo fator. */
export async function confirmMfaEnrollment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await assertFetchMetadata();

    const factorId = formData.get('factorId')?.toString() ?? '';
    const code = totpCodeSchema.safeParse(formData.get('code'));
    if (!code.success || !factorId) return { error: 'Código inválido.' };

    const { client, user } = await requireAdmin({ requireMfa: false });

    const { data: challenge, error: challengeError } =
      await client.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) return { error: 'Código inválido.' };

    const { error } = await client.auth.mfa.verify({
      factorId, challengeId: challenge.id, code: code.data,
    });
    if (error) return { error: 'Código inválido.' };

    await audit(client, 'MFA_ENABLED', 'admin_user', user.id);
    logServer('mfa_enabled', { user_id: user.id });
    revalidatePath('/admin/configuracoes/seguranca');
    return { info: 'Verificação em duas etapas ativada.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}

/**
 * Desativar MFA é ação de altíssimo risco: exige sessão já em aal2 E
 * reautenticação recente. Não existe caminho "esqueci meu MFA" pela interface —
 * o procedimento de recuperação está no SECURITY.md e passa pelo painel do
 * Supabase, com acesso ao projeto.
 */
export async function disableMfa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await assertFetchMetadata();

    const factorId = formData.get('factorId')?.toString() ?? '';
    if (!factorId) return { error: 'Fator não informado.' };

    const { client, user, aal } = await requireRecentAuth();
    if (aal !== 'aal2') return { error: 'Confirme sua identidade novamente para esta ação.' };

    const { error } = await client.auth.mfa.unenroll({ factorId });
    if (error) return { error: 'Não foi possível desativar.' };

    await audit(client, 'MFA_DISABLED', 'admin_user', user.id);
    logServer('mfa_disabled', { user_id: user.id });
    revalidatePath('/admin/configuracoes/seguranca');
    return { info: 'Verificação em duas etapas desativada.' };
  } catch (error) {
    const { message } = toPublicError(error);
    return { error: message };
  }
}
