'use client';

import { useActionState } from 'react';
import { verifyMfa, type ActionState } from '@/app/login/actions';
import { Alert, Field } from './AuthShell';
import { SubmitButton } from './SubmitButton';

const initial: ActionState = {};

export function MfaForm({ factorId }: { factorId: string }) {
  const [state, action] = useActionState(verifyMfa, initial);
  return (
    <form action={action} className="space-y-5">
      <Alert tone="error">{state.error}</Alert>
      <input type="hidden" name="factorId" value={factorId} />
      <Field
        label="Código" name="code" autoComplete="one-time-code"
        inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoFocus
      />
      <SubmitButton>Verificar</SubmitButton>
    </form>
  );
}
