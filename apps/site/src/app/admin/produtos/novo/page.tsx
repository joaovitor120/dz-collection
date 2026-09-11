import Link from 'next/link';
import { requireAdminPage } from '@/lib/admin/auth';
import { listCategories } from '@/lib/admin/products';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'Novo produto' };
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const { client, user } = await requireAdminPage();
  const categories = await listCategories(client);

  return (
    <>
      <AdminHeader email={user.email ?? ''} current="/produtos" />

      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin/produtos" className="text-2xs uppercase tracking-widest2 text-ink-muted hover:text-ink">
          ← Produtos
        </Link>

        <h1 className="mt-4 font-display text-3xl">Novo produto</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Depois de criar, você adiciona as fotos e as medidas na tela de edição.
        </p>

        <div className="mt-8">
          <ProductForm categories={categories} />
        </div>
      </main>
    </>
  );
}
