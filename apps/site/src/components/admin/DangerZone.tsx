'use client';

import { useActionState, useState } from 'react';
import { deleteProduct, toggleActive } from '@/app/admin/produtos/actions';
import type { ActionState } from '@/app/admin/login/actions';
import { SubmitButton } from './SubmitButton';
import { Notice, TextInput } from './Field';

/**
 * Dois jeitos de "remover", e a diferença entre eles é a coisa mais importante
 * desta tela:
 *
 *   · Tirar do catálogo  → reversível. Some do site, continua salvo aqui.
 *   · Excluir            → definitivo. Apaga produto, fotos e medidas.
 *
 * A exclusão pede o nome digitado. Não é burocracia: é o que separa um clique
 * errado de uma perda de dados sem volta.
 */
export function DangerZone({
  productId,
  productName,
  active,
  imageCount,
}: {
  productId: string;
  productName: string;
  active: boolean;
  imageCount: number;
}) {
  const [toggleState, toggleAction] = useActionState<ActionState, FormData>(toggleActive, {});
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteProduct, {});
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  return (
    <section className="flex flex-col gap-6 border border-line-strong bg-paper-shade p-5">
      <h2 className="font-display text-xl">Tirar do ar ou excluir</h2>

      <Notice state={toggleState} />

      <div className="flex flex-col gap-2">
        <form action={toggleAction}>
          <input type="hidden" name="id" value={productId} />
          <input type="hidden" name="active" value={active ? 'false' : 'true'} />
          <button
            type="submit"
            className="min-h-[48px] w-full border border-ink px-4 text-2xs uppercase tracking-widest2 transition-colors hover:bg-ink hover:text-paper sm:w-auto sm:px-6"
          >
            {active ? 'Tirar do catálogo' : 'Publicar no catálogo'}
          </button>
        </form>
        <p className="text-xs text-ink-muted">
          {active
            ? 'O produto some do site imediatamente, mas continua salvo aqui — dá para publicar de novo quando quiser.'
            : 'O produto volta a aparecer no site.'}
        </p>
      </div>

      <div className="border-t border-line-strong pt-6">
        <Notice state={deleteState} />

        {!confirming ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-[48px] w-full border border-red-300 px-4 text-2xs uppercase tracking-widest2 text-red-700 transition-colors hover:border-red-600 sm:w-auto sm:px-6"
            >
              Excluir definitivamente
            </button>
            <p className="text-xs text-ink-muted">
              Apaga o produto, {imageCount === 1 ? 'a foto' : `as ${imageCount} fotos`} e as
              medidas. Não tem como desfazer.
            </p>
          </div>
        ) : (
          <form action={deleteAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={productId} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmacao" className="text-sm text-ink">
                Para confirmar, digite o nome do produto:
              </label>
              <p className="font-display text-lg">{productName}</p>
              <TextInput
                id="confirmacao"
                name="confirmacao"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Digite o nome exatamente como está acima"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center">
              <div className="sm:w-56">
                {typed === productName ? (
                  <SubmitButton>Excluir para sempre</SubmitButton>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[48px] w-full items-center justify-center border border-line-strong px-5 text-[0.78rem] uppercase tracking-[0.14em] text-ink-muted opacity-60"
                  >
                    Excluir para sempre
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setTyped('');
                }}
                className="min-h-[48px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink sm:w-40"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
