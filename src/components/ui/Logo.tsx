import Link from 'next/link';

/**
 * Wordmark tipográfico da DZ Collection.
 *
 * A logo original da loja é um mockup renderizado sobre uma parede cinza
 * desfocada (mantida em /public/images/branding para referência) — inutilizável
 * como asset de interface. Como a proprietária autorizou a renovação da
 * identidade, o monograma foi reconstruído tipograficamente preservando o que
 * identifica a marca: o monograma "DZ" em serifa e a palavra "COLLECTION"
 * espacejada abaixo, com o dourado como filete de acento.
 */
export function Logo({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dz =
    size === 'lg'
      ? 'text-[2rem] md:text-[2.5rem]'
      : size === 'sm'
        ? 'text-lg'
        : 'text-[1.4rem] md:text-[1.6rem]';
  const word =
    size === 'lg'
      ? 'text-[0.6rem] md:text-2xs'
      : size === 'sm'
        ? 'text-[0.5rem]'
        : 'text-[0.5rem] md:text-[0.55rem]';

  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span
        className={`font-display font-medium tracking-[0.06em] ${dz}`}
        aria-hidden="true"
      >
        DZ
      </span>
      <span
        className={`mt-[0.3em] flex w-full items-center gap-[0.4em] ${word}`}
        aria-hidden="true"
      >
        <span className="h-px flex-1 bg-gold/50" />
        <span className="font-sans uppercase tracking-widest2">Collection</span>
        <span className="h-px flex-1 bg-gold/50" />
      </span>
    </span>
  );
}

export function LogoLink({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Link
      href="/"
      className={`inline-block transition-opacity duration-250 ease-editorial hover:opacity-70 ${className}`}
      aria-label="DZ Collection — página inicial"
    >
      <Logo size={size} />
    </Link>
  );
}
