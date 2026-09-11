import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin/auth';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Painel' };
export const dynamic = 'force-dynamic';

/** Dashboard. Todos os números vêm do banco — nada hardcoded. */
export default async function DashboardPage() {
  const { client, user } = await requireAdminPage();

  const [produtos, ativos, lancamentos, destaques, categorias, semFoto] = await Promise.all([
    client.from('products').select('id', { count: 'exact', head: true }),
    client.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_launch', true),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    client.from('categories').select('id', { count: 'exact', head: true }),
    client.from('products').select('id, product_images (id)'),
  ]);

  const cards = [
    { label: 'Produtos', value: produtos.count ?? 0 },
    { label: 'No catálogo', value: ativos.count ?? 0 },
    { label: 'Lançamentos', value: lancamentos.count ?? 0 },
    { label: 'Destaques', value: destaques.count ?? 0 },
    { label: 'Categorias', value: categorias.count ?? 0 },
  ];

  const faltandoFoto = ((semFoto.data ?? []) as { product_images: unknown[] }[]).filter(
    (p) => (p.product_images ?? []).length === 0,
  ).length;

  return (
    <>
      <AdminHeader email={user.email ?? ''} current="/" />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="eyebrow">Painel</p>
        <h1 className="mt-2 font-display text-3xl">Catálogo</h1>

        <ul className="mt-8 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
          {cards.map((c) => (
            <li key={c.label} className="bg-paper-pure p-5">
              <p className="font-display text-3xl leading-none">{c.value}</p>
              <p className="eyebrow mt-2">{c.label}</p>
            </li>
          ))}
        </ul>

        {faltandoFoto > 0 ? (
          <p className="mt-6 border border-gold-soft bg-paper-shade px-4 py-3 text-sm">
            {faltandoFoto === 1
              ? '1 produto está sem foto.'
              : `${faltandoFoto} produtos estão sem foto.`}{' '}
            <Link href="/admin/produtos" className="underline underline-offset-4">
              Ver produtos
            </Link>
          </p>
        ) : null}

        <nav className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/admin/produtos/novo"
            className="min-h-[48px] border border-ink bg-ink px-6 py-3 text-2xs uppercase tracking-widest2 text-paper transition-colors hover:bg-ink-soft"
          >
            Adicionar produto
          </Link>
          <Link
            href="/admin/produtos"
            className="min-h-[48px] border border-line-strong px-5 py-3 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
          >
            Gerenciar catálogo
          </Link>
        </nav>
      </main>
    </>
  );
}
