import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container py-24 text-center md:py-32">
      <p className="eyebrow">Erro 404</p>
      <h1 className="mx-auto mt-4 max-w-md font-display text-[2rem] leading-[1.1] md:text-[2.6rem]">
        Não encontramos esta página
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-sm text-ink-muted">
        O endereço pode ter mudado. Veja os modelos disponíveis no catálogo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/catalogo" className={buttonClass('primary', 'md')}>
          Ver catálogo
        </Link>
        <Link href="/" className={buttonClass('outline', 'md')}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
