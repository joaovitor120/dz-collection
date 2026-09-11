import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/auth';
import { getProduct, listCategories } from '@/lib/admin/products';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductImageManager } from '@/components/admin/ProductImageManager';
import { SpecificationsEditor } from '@/components/admin/SpecificationsEditor';
import { DangerZone } from '@/components/admin/DangerZone';

export const metadata = { title: 'Editar produto' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { client, user } = await requireAdminPage();
  const { id } = await params;
  const search = await searchParams;

  const product = await getProduct(client, id);
  if (!product) notFound();

  const categories = await listCategories(client);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');
  const publicUrlBase = `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '')}/storage/v1/object/public/product-images`;

  return (
    <>
      <AdminHeader email={user.email ?? ''} current="/produtos" />

      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin/produtos" className="text-2xs uppercase tracking-widest2 text-ink-muted hover:text-ink">
          ← Produtos
        </Link>

        {search.criado ? (
          <p className="mt-4 border border-line-strong bg-paper-shade px-3 py-2.5 text-sm">
            Produto criado. Agora adicione as fotos abaixo.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <h1 className="min-w-0 font-display text-3xl">{product.name}</h1>
          {siteUrl ? (
            <a
              href={`${siteUrl}/produtos/${product.slug}`}
              target="_blank"
              rel="noreferrer noopener"
              className="shrink-0 text-2xs uppercase tracking-widest2 text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              Ver no site
            </a>
          ) : null}
        </div>

        <div className="mt-8">
          <ProductForm product={product} categories={categories} />
        </div>

        <div className="mt-12 border-t border-line pt-10">
          <ProductImageManager
            productId={product.id}
            images={product.images}
            publicUrlBase={publicUrlBase}
          />
        </div>

        <div className="mt-12 border-t border-line pt-10">
          <SpecificationsEditor
            productId={product.id}
            specifications={product.specifications}
          />
        </div>

        <div className="mt-12">
          <DangerZone
            productId={product.id}
            productName={product.name}
            active={product.active}
            imageCount={product.images.length}
          />
        </div>
      </main>
    </>
  );
}
