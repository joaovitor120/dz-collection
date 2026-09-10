'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { CategoryRow, ProductRow } from '@dz/shared';
import { createProduct, updateProduct } from '@/app/produtos/actions';
import type { ActionState } from '@/app/login/actions';
import { SubmitButton } from './SubmitButton';
import { Checkbox, Field, Notice, Select, TextArea, TextInput } from './Field';

/** 15990 → "159,90". Formato que a pessoa digita, não centavos. */
function toDisplayPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductRow;
  categories: CategoryRow[];
}) {
  const isEdit = Boolean(product);
  const action = isEdit ? updateProduct : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {isEdit ? <input type="hidden" name="id" value={product?.id} /> : null}

      <Notice state={state} />

      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-xl">Identificação</h2>

        <Field label="Nome do produto" htmlFor="name">
          <TextInput
            id="name"
            name="name"
            required
            maxLength={120}
            defaultValue={product?.name ?? ''}
            placeholder="Óculos de Sol Atena - Camuflado"
          />
        </Field>

        <Field
          label="Endereço no site (slug)"
          htmlFor="slug"
          hint="Deixe em branco para gerar a partir do nome. Mudar isso muda o link do produto."
        >
          <TextInput
            id="slug"
            name="slug"
            maxLength={160}
            defaultValue={product?.slug ?? ''}
            placeholder="oculos-de-sol-atena-camuflado"
          />
        </Field>

        <Field label="Descrição" htmlFor="description">
          <TextArea
            id="description"
            name="description"
            maxLength={8000}
            defaultValue={product?.description ?? ''}
            placeholder="Texto que aparece na página do produto."
          />
        </Field>

        <Field label="Categoria" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ''}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col gap-5 border-t border-line pt-8">
        <h2 className="font-display text-xl">Preço e estoque</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Preço (R$)" htmlFor="price" hint="Use vírgula: 129,90">
            <TextInput
              id="price"
              name="price"
              required
              inputMode="decimal"
              defaultValue={toDisplayPrice(product?.price_cents)}
              placeholder="129,90"
            />
          </Field>

          <Field
            label="Preço &ldquo;de&rdquo; (R$)"
            htmlFor="compare_at_price"
            hint="Só preencha se houver promoção. Precisa ser maior que o preço atual."
          >
            <TextInput
              id="compare_at_price"
              name="compare_at_price"
              inputMode="decimal"
              defaultValue={toDisplayPrice(product?.compare_at_price_cents)}
              placeholder=""
            />
          </Field>

          <Field label="Estoque" htmlFor="stock">
            <TextInput
              id="stock"
              name="stock"
              inputMode="numeric"
              defaultValue={String(product?.stock ?? 1)}
            />
          </Field>

          <Field
            label="Ordem de exibição"
            htmlFor="display_order"
            hint="Menor número aparece primeiro."
          >
            <TextInput
              id="display_order"
              name="display_order"
              inputMode="numeric"
              defaultValue={String(product?.display_order ?? 0)}
            />
          </Field>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 className="font-display text-xl">Onde aparece</h2>

        <Checkbox
          name="active"
          label="Publicado no catálogo"
          hint="Desmarcado, o produto some do site — mas continua salvo aqui."
          defaultChecked={product?.active ?? true}
        />
        <Checkbox
          name="is_launch"
          label="Lançamento"
          hint="Aparece na vitrine de Lançamentos, a primeira seção da home."
          defaultChecked={product?.is_launch ?? false}
        />
        <Checkbox
          name="is_featured"
          label="Destaque"
          hint="Aparece na seção de destaques."
          defaultChecked={product?.is_featured ?? false}
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="flex flex-col gap-5 border-t border-line pt-8">
        <h2 className="font-display text-xl">Busca do Google</h2>
        <p className="-mt-3 text-xs text-ink-muted">
          Opcional. Em branco, o site usa o nome e a descrição do produto.
        </p>

        <Field label="Título" htmlFor="meta_title">
          <TextInput
            id="meta_title"
            name="meta_title"
            maxLength={160}
            defaultValue={product?.meta_title ?? ''}
          />
        </Field>

        <Field label="Descrição" htmlFor="meta_description">
          <TextArea
            id="meta_description"
            name="meta_description"
            maxLength={320}
            defaultValue={product?.meta_description ?? ''}
            className="min-h-[80px]"
          />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-8 sm:flex-row-reverse sm:items-center">
        <div className="sm:w-56">
          <SubmitButton>{isEdit ? 'Salvar alterações' : 'Criar produto'}</SubmitButton>
        </div>
        <Link
          href="/produtos"
          className="inline-flex min-h-[48px] items-center justify-center border border-line-strong px-5 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink sm:w-40"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
