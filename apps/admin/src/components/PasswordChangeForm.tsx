'use client';

import { useActionState } from 'react';
import { changePassword } from '@/app/configuracoes/seguranca/actions';
import type { ActionState } from '@/app/login/actions';
import { Alert, Field } from './AuthShell';
import { SubmitButton } from './SubmitButton';

const initial: ActionState = {};

export function PasswordChangeForm() {
  const [state, action] = useActionState(changePassword, initial);
  return (
    <form action={action} className="max-w-sm space-y-5">
      <Alert tone="error">{state.error}</Alert>
      <Alert tone="info">{state.info}</Alert>
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" />
      <Field label="Confirmar nova senha" name="confirm" type="password" autoComplete="new-password" />
      <p className="text-xs leading-relaxed text-ink-muted">
        Mínimo de 12 caracteres. Use uma frase longa ou um gerenciador de senhas.
      </p>
      <SubmitButton>Alterar senha</SubmitButton>
    </form>
  );
}
