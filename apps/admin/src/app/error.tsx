'use client';

/**
 * Fronteira de erro do painel.
 *
 * Em produção o usuário recebe uma mensagem genérica — nunca stack, SQL, path
 * interno ou nome de variável de ambiente. O detalhe fica no log do servidor.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <p className="eyebrow">Erro</p>
      <h1 className="mt-3 font-display text-3xl">Não foi possível concluir a operação</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        Tente novamente. Se continuar, saia e entre de novo no painel.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 min-h-[44px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
      >
        Tentar novamente
      </button>
    </main>
  );
}
