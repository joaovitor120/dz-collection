import Link from 'next/link';
import { formatCents } from '@dz/shared';
import { requireAdminPage } from '@/lib/admin/auth';
import { listProducts, storagePublicUrl } from '@/lib/admin/products';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const metadata = { title: 'Produtos' };
export const dynamic = 'force-dynamic';

type Search = Record<string, string | string[] | undefined>;

function one(params: Search, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { client, user } = await requireAdminPage();
  const params = await searchParams;

  const q = one(params, 'q');
  const rawStatus = one(params, 'status');
  const status =
    rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : ('all' as const);

  const { items } = await listProducts(client, { q, status });

  return (
    <>
      <AdminHeader email={user.email ?? ''} current="/produtos" />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h1 className="mt-2 font-display text-3xl">Produtos</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {items.length === 1 ? '1 produto' : `${items.length} produtos`}
              {status !== 'all' || q ? ' encontrados' : ''}
            </p>
          </div>

          <Link
            href="/admin/produtos/novo"
            className="inline-flex min-h-[48px] items-center justify-center border border-ink bg-ink px-6 text-2xs uppercase tracking-widest2 text-paper transition-colors hover:bg-ink-soft"
          >
            Adicionar produto
          </Link>
        </div>

        {/* Filtros por GET: o estado fica na URL, dá para favoritar e voltar. */}
        <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-56">
            <label htmlFor="q" className="eyebrow">
              Buscar
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Nome do produto"
              className="mt-1.5 min-h-[48px] w-full border border-line-strong bg-paper-pure px-3 text-sm outline-none focus:border-ink"
            />
          </div>

          <div className="basis-44">
            <label htmlFor="status" className="eyebrow">
              Situação
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="mt-1.5 min-h-[48px] w-full border border-line-strong bg-paper-pure px-3 text-sm outline-none focus:border-ink"
            >
              <option value="all">Todos</option>
              <option value="active">No catálogo</option>
              <option value="inactive">Fora do catálogo</option>
            </select>
          </div>

          <button
            type="submit"
            className="min-h-[48px] shrink-0 border border-line-strong px-5 text-2xs uppercase tracking-widest2 transition-colors hover:border-ink"
          >
            Filtrar
          </button>
        </form>

        {items.length === 0 ? (
          <p className="mt-10 border border-dashed border-line-strong p-10 text-center text-sm text-ink-muted">
            Nenhum produto encontrado.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-px bg-line">
            {items.map((product) => {
              const cover = product.images.find((i) => i.is_primary) ?? product.images[0];
              return (
                <li key={product.id} className="bg-paper-pure">
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="flex items-center gap-4 p-3 transition-colors hover:bg-paper-shade"
                  >
                    {cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={storagePublicUrl(cover.storage_path)}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-dashed border-line-strong text-2xs text-ink-muted">
                        sem foto
                      </span>
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{product.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">
                        {product.category?.name ?? 'Sem categoria'}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {!product.active && <Tag tone="muted">fora do catálogo</Tag>}
                        {product.is_launch && <Tag>lançamento</Tag>}
                        {product.is_featured && <Tag>destaque</Tag>}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="block font-display text-lg leading-none">
                        {formatCents(product.price_cents)}
                      </span>
                      {product.compare_at_price_cents ? (
                        <span className="mt-1 block text-xs text-ink-muted line-through">
                          {formatCents(product.compare_at_price_cents)}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'muted' }) {
  return (
    <span
      className={`border px-1.5 py-0.5 text-[0.625rem] uppercase tracking-widest2 ${
        tone === 'muted'
          ? 'border-line-strong text-ink-muted'
          : 'border-gold-soft text-gold-deep'
      }`}
    >
      {children}
    </span>
  );
}
