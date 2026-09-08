'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/types';
import { CloseIcon, ZoomIcon } from '@/components/ui/Icon';

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLDivElement>(null);

  const alt = (i: number) => product.imageAlts[i] ?? product.name;

  // Sincroniza os indicadores com o swipe no mobile
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  }, []);

  useEffect(() => {
    if (!zoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setZoomed(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [zoomed]);

  return (
    <>
      {/* Mobile: swipe horizontal com indicador */}
      <div className="md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`Fotos de ${product.name}`}
        >
          {product.images.map((src, i) => (
            <div key={src} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-paper-shade">
              {broken[i] ? (
                <FallbackImage />
              ) : (
                <Image
                  src={src}
                  alt={alt(i)}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
        {product.images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {product.images.map((src, i) => (
              <span
                key={src}
                className={`h-1 w-6 transition-colors duration-250 ${
                  i === index ? 'bg-ink' : 'bg-line-strong'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Desktop: imagem principal + miniaturas verticais */}
      <div className="hidden gap-4 md:flex">
        {product.images.length > 1 ? (
          <ul className="flex w-[74px] shrink-0 flex-col gap-3">
            {product.images.map((src, i) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ver foto ${i + 1} de ${product.images.length}`}
                  aria-current={i === index}
                  className={`relative block aspect-[3/4] w-full overflow-hidden bg-paper-shade transition-opacity duration-250 ${
                    i === index ? 'opacity-100 ring-1 ring-ink' : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  <Image src={src} alt="" fill sizes="74px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="group relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden bg-paper-shade"
          aria-label={`Ampliar foto de ${product.name}`}
        >
          {broken[index] ? (
            <FallbackImage />
          ) : (
            <Image
              src={product.images[index]}
              alt={alt(index)}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 50vw"
              onError={() => setBroken((b) => ({ ...b, [index]: true }))}
              className="object-cover transition-transform duration-400 ease-editorial group-hover:scale-[1.02]"
            />
          )}
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center border border-line bg-paper/90 text-ink opacity-0 transition-opacity duration-250 group-hover:opacity-100">
            <ZoomIcon className="h-4 w-4" />
          </span>
        </button>
      </div>

      {/* Zoom */}
      {zoomed ? (
        <div
          className="fixed inset-0 z-drawer hidden animate-fadeIn bg-ink/90 md:block"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${product.name}`}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center text-paper transition-colors hover:text-gold-soft"
            aria-label="Fechar ampliação"
            autoFocus
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="relative block h-full w-full cursor-zoom-out"
            onClick={() => setZoomed(false)}
            aria-label="Fechar ampliação"
          >
            <Image
              src={product.images[index]}
              alt={alt(index)}
              fill
              sizes="100vw"
              className="object-contain p-6"
            />
          </button>
        </div>
      ) : null}
    </>
  );
}

function FallbackImage() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-paper-shade">
      <span className="text-2xs uppercase tracking-widest2 text-ink-muted">
        Imagem indisponível
      </span>
    </div>
  );
}
