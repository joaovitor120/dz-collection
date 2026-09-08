'use client';

import { useFormState } from 'react-dom';
import { requestPasswordReset, type ActionState } from '@/app/login/actions';
import { Alert, Field } from './AuthShell';
import { SubmitButton } from './SubmitButton';

const initial: ActionState = {};

export function ResetRequestForm() {
  const [state, action] = useFormState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-5">
      <Alert tone="info">{state.info}</Alert>
      <Alert tone="error">{state.error}</Alert>
      <Field label="E-mail" name="email" type="email" autoComplete="username" autoFocus />
      <SubmitButton>Enviar instruções</SubmitButton>
    </form>
  );
}
