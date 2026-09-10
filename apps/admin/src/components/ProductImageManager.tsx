'use client';

import { useActionState } from 'react';
import type { ProductImageRow } from '@dz/shared';
import { deleteImage, setPrimaryImage, uploadImage } from '@/app/produtos/actions';
import type { ActionState } from '@/app/login/actions';
import { SubmitButton } from './SubmitButton';
import { Field, Notice, TextInput } from './Field';

export function ProductImageManager({
  productId,
  images,
  publicUrlBase,
}: {
  productId: string;
  images: ProductImageRow[];
  publicUrlBase: string;
}) {
  const [uploadState, uploadAction] = useActionState<ActionState, FormData>(uploadImage, {});
  const [imageState, imageAction] = useActionState<ActionState, FormData>(deleteImage, {});
  const [primaryState, primaryAction] = useActionState<ActionState, FormData>(
    setPrimaryImage,
    {},
  );

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-xl">Fotos</h2>
        <p className="mt-1 text-xs text-ink-muted">
          JPG, PNG ou WebP, até 5 MB. Toda imagem é reprocessada no envio: os dados de
          localização e câmera são descartados.
        </p>
      </div>

      <Notice state={uploadState} />
      <Notice state={imageState} />
      <Notice state={primaryState} />

      {images.length === 0 ? (
        <p className="border border-dashed border-line-strong p-6 text-center text-sm text-ink-muted">
          Nenhuma foto ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.id} className="flex flex-col border border-line bg-paper-pure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${publicUrlBase}/${image.storage_path}`}
                alt={image.alt_text ?? ''}
                width={image.width ?? 400}
                height={image.height ?? 400}
                className="aspect-square w-full max-w-full object-cover"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-2 p-2.5">
                {image.is_primary ? (
                  <span className="text-2xs uppercase tracking-widest2 text-gold-deep">
                    Principal
                  </span>
                ) : (
                  <form action={primaryAction}>
                    <input type="hidden" name="product_id" value={productId} />
                    <input type="hidden" name="image_id" value={image.id} />
                    <button
                      type="submit"
                      className="min-h-[36px] w-full border border-line-strong text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
                    >
                      Tornar principal
                    </button>
                  </form>
                )}

                <form action={imageAction} className="mt-auto">
                  <input type="hidden" name="product_id" value={productId} />
                  <input type="hidden" name="image_id" value={image.id} />
                  <button
                    type="submit"
                    className="min-h-[36px] w-full border border-red-200 text-2xs uppercase tracking-widest2 text-red-700 transition-colors hover:border-red-500"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={uploadAction}
        className="flex flex-col gap-4 border border-line bg-paper-shade p-4"
      >
        <input type="hidden" name="product_id" value={productId} />

        <Field label="Nova foto" htmlFor="file">
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="w-full text-sm file:mr-3 file:min-h-[40px] file:cursor-pointer file:border file:border-line-strong file:bg-paper-pure file:px-3 file:text-2xs file:uppercase file:tracking-widest2"
          />
        </Field>

        <Field
          label="Descrição da imagem"
          htmlFor="alt_text"
          hint="Lida por leitores de tela e usada pelo Google. Descreva o que se vê."
        >
          <TextInput
            id="alt_text"
            name="alt_text"
            maxLength={300}
            placeholder="Modelo usando o óculos, visto de frente"
          />
        </Field>

        <div className="sm:w-56">
          <SubmitButton>Enviar foto</SubmitButton>
        </div>
      </form>
    </section>
  );
}
