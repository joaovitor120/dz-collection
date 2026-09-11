export const metadata = { title: 'Configuração pendente' };
export const dynamic = 'force-dynamic';

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
];

/**
 * Mostrada quando o painel sobe sem as variáveis do Supabase.
 * Só lista NOMES de variável — nunca valores.
 */
export default function Page() {
  const missing = REQUIRED.filter((name) => !process.env[name]);

  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <p className="eyebrow">Painel administrativo</p>
      <h1 className="mt-3 font-display text-3xl">Configuração pendente</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        O painel precisa de um projeto Supabase para autenticar. Crie o arquivo
        <code className="mx-1 border border-line bg-paper-shade px-1.5 py-0.5 text-xs">
          apps/admin/.env.local
        </code>
        com as variáveis abaixo e reinicie o servidor.
      </p>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {REQUIRED.map((name) => {
          const ok = !missing.includes(name);
          return (
            <li key={name} className="flex items-center gap-3 py-3">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-green-600' : 'bg-red-500'}`}
              />
              <code className="text-xs">{name}</code>
              <span className="ml-auto text-2xs uppercase tracking-widest2 text-ink-muted">
                {ok ? 'definida' : 'ausente'}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-xs leading-relaxed text-ink-muted">
        O passo a passo para criar o projeto e pegar as chaves está em{' '}
        <code className="border border-line bg-paper-shade px-1.5 py-0.5">
          docs/SETUP-SUPABASE.md
        </code>
        . O catálogo público roda sem isso — só o painel depende do Supabase.
      </p>
    </main>
  );
}
