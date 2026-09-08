import type { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { absoluteUrl, productPath } from '@/lib/urls';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

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
