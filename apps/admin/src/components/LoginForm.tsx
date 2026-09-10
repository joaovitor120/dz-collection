'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signIn, type ActionState } from '@/app/login/actions';
import { Alert, Field } from './AuthShell';
import { SubmitButton } from './SubmitButton';

const initial: ActionState = {};

export function LoginForm() {
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-5">
      <Alert tone="error">{state.error}</Alert>
      <Field label="E-mail" name="email" type="email" autoComplete="username" autoFocus />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" />
      <SubmitButton>Entrar</SubmitButton>
      <p className="text-center">
        <Link href="/recuperar-senha" className="link-underline text-xs text-ink-muted">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}
