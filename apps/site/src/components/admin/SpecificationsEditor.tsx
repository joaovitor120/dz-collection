'use client';

import { useActionState, useState } from 'react';
import type { ProductSpecificationRow } from '@dz/shared';
import { saveSpecifications } from '@/app/admin/produtos/actions';
import type { ActionState } from '@/app/admin/login/actions';
import { SubmitButton } from './SubmitButton';
import { Notice, TextInput } from './Field';

interface Row {
  key: string;
  label: string;
  value: string;
}

export function SpecificationsEditor({
  productId,
  specifications,
}: {
  productId: string;
  specifications: ProductSpecificationRow[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSpecifications, {});
  const [rows, setRows] = useState<Row[]>(() =>
    specifications.length > 0
      ? specifications.map((s) => ({ key: s.id, label: s.label, value: s.value }))
      : [{ key: 'nova-0', label: '', value: '' }],
  );

  function addRow() {
    setRows((current) => [...current, { key: `nova-${Date.now()}`, label: '', value: '' }]);
  }

  function removeRow(key: string) {
    setRows((current) =>
      current.length === 1 ? [{ key: `nova-${Date.now()}`, label: '', value: '' }] : current.filter((r) => r.key !== key),
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl">Medidas e detalhes</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Aparecem como uma tabela na página do produto. Ex.: Diâmetro · 4,7 cm
        </p>
      </div>

      <Notice state={state} />

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="product_id" value={productId} />

        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <li key={row.key} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
              <div className="min-w-0 flex-1 basis-full sm:basis-1/3">
                <label htmlFor={`spec_label_${index}`} className="sr-only">
                  Nome da medida {index + 1}
                </label>
                <TextInput
                  id={`spec_label_${index}`}
                  name="spec_label"
                  defaultValue={row.label}
                  maxLength={80}
                  placeholder="Diâmetro"
                />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor={`spec_value_${index}`} className="sr-only">
                  Valor da medida {index + 1}
                </label>
                <TextInput
                  id={`spec_value_${index}`}
                  name="spec_value"
                  defaultValue={row.value}
                  maxLength={600}
                  placeholder="4,7 cm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                aria-label={`Remover medida ${index + 1}`}
                className="min-h-[48px] shrink-0 border border-line-strong px-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
          <div className="sm:w-56">
            <SubmitButton>Salvar medidas</SubmitButton>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="min-h-[48px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink sm:w-48"
          >
            Adicionar linha
          </button>
        </div>
      </form>
    </section>
  );
}
