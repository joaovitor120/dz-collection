import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth';
import { signOut } from '@/app/login/actions';

export const metadata = { title: 'Painel' };
export const dynamic = 'force-dynamic';

/** Dashboard. Todos os números vêm do banco — nada hardcoded. */
export default async function DashboardPage() {
  const { client, user } = await requireAdminPage();

  const [produtos, ativos, lancamentos, destaques, categorias] = await Promise.all([
    client.from('products').select('id', { count: 'exact', head: true }),
    client.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_launch', true),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    client.from('categories').select('id', { count: 'exact', head: true }),
  ]);

  const cards = [
    { label: 'Produtos', value: produtos.count ?? 0 },
    { label: 'Ativos', value: ativos.count ?? 0 },
    { label: 'Lançamentos', value: lancamentos.count ?? 0 },
    { label: 'Destaques', value: destaques.count ?? 0 },
    { label: 'Categorias', value: categorias.count ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Painel</p>
          <h1 className="mt-3 font-display text-3xl">Catálogo</h1>
          <p className="mt-2 text-sm text-ink-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-[44px] border border-line-strong px-4 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
          >
            Sair
          </button>
        </form>
      </header>

      <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
        {cards.map((c) => (
          <li key={c.label} className="bg-paper p-5">
            <p className="font-display text-3xl leading-none">{c.value}</p>
            <p className="eyebrow mt-2">{c.label}</p>
          </li>
        ))}
      </ul>

      <nav className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/configuracoes/seguranca"
          className="min-h-[44px] border border-line-strong px-4 py-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
        >
          Segurança
        </Link>
      </nav>
    </div>
  );
}
