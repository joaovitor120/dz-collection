'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import {
  confirmMfaEnrollment,
  disableMfa,
  startMfaEnrollment,
} from '@/app/admin/configuracoes/seguranca/actions';
import type { ActionState } from '@/app/admin/login/actions';
import { Alert, Field } from './AuthShell';
import { SubmitButton } from './SubmitButton';

const initial: ActionState = {};

export function MfaSetup({ enrolled }: { enrolled: { id: string } | null }) {
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string } | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [confirmState, confirmAction] = useActionState(confirmMfaEnrollment, initial);
  const [disableState, disableAction] = useActionState(disableMfa, initial);

  if (enrolled) {
    return (
      <div className="max-w-sm space-y-4">
        <Alert tone="info">{disableState.info}</Alert>
        <Alert tone="error">{disableState.error}</Alert>
        <p className="inline-flex items-center gap-2 border border-line px-3 py-2 text-2xs uppercase tracking-widest2">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Ativada
        </p>
        <p className="text-xs leading-relaxed text-ink-muted">
          Desativar reduz a proteção da conta que controla todo o catálogo. Só faça isso
          para trocar de aparelho — e reative em seguida.
        </p>
        <form action={disableAction}>
          <input type="hidden" name="factorId" value={enrolled.id} />
          <button
            type="submit"
            className="min-h-[44px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
          >
            Desativar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-5">
      <Alert tone="error">{error ?? confirmState.error}</Alert>
      <Alert tone="info">{confirmState.info}</Alert>

      {!enroll ? (
        <>
          <p className="text-xs leading-relaxed text-ink-muted">
            Instale um aplicativo autenticador (Google Authenticator, 1Password, Authy)
            e toque abaixo para ler o QR Code.
          </p>
          <button
            type="button"
            onClick={async () => {
              setError(undefined);
              const result = await startMfaEnrollment();
              if (result.ok) setEnroll({ factorId: result.factorId, qr: result.qr });
              else setError(result.error);
            }}
            className="min-h-[48px] w-full border border-ink bg-ink px-5 text-[0.78rem] font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink-soft"
          >
            Configurar agora
          </button>
        </>
      ) : (
        <form action={confirmAction} className="space-y-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enroll.qr}
            alt="QR Code para configurar a verificação em duas etapas"
            className="mx-auto h-48 w-48 border border-line bg-white p-2"
          />
          <p className="text-xs leading-relaxed text-ink-muted">
            Leia o código no aplicativo e digite os 6 dígitos gerados. Este QR Code
            aparece uma única vez.
          </p>
          <input type="hidden" name="factorId" value={enroll.factorId} />
          <Field
            label="Código do aplicativo" name="code" autoComplete="one-time-code"
            inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoFocus
          />
          <SubmitButton>Ativar</SubmitButton>
        </form>
      )}
    </div>
  );
}
