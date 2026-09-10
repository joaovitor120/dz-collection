import type { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/db';
import { absoluteUrl, productPath } from '@/lib/urls';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await fetchProducts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/catalogo'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/sobre'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/contato'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(productPath(p.slug)),
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
