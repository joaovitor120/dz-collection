import { signOut } from '@/app/login/actions';

export const metadata = { title: 'Sem permissão' };
export const dynamic = 'force-dynamic';

/**
 * A conta autenticou no Supabase Auth mas não está em admin_users.
 *
 * Este é exatamente o perfil "authenticated não-admin" que a matriz de testes
 * cobre: a sessão é válida, e mesmo assim não há autorização para nada. Em vez
 * de estourar um 500, a pessoa vê o motivo e consegue sair.
 */
export default function Page() {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <p className="eyebrow">Acesso negado</p>
      <h1 className="mt-3 font-display text-3xl">Esta conta não é administradora</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        O login funcionou, mas a conta não está autorizada a administrar o catálogo.
        Autenticar e autorizar são coisas separadas: a autorização vem de um registro
        na tabela <code className="border border-line bg-paper-shade px-1.5 py-0.5 text-xs">admin_users</code>,
        que só pode ser criado com acesso ao projeto Supabase.
      </p>
      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        O passo a passo está em <code className="border border-line bg-paper-shade px-1.5 py-0.5">docs/SETUP-SUPABASE.md</code>, seção 4.
      </p>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="min-h-[44px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
