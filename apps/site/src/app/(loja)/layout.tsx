import type { Metadata } from 'next';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { site, WHATSAPP_DISPLAY } from '@/data/site';
import { SITE_URL } from '@/lib/urls';
import { fetchProducts } from '@/lib/db';

/** Casca da vitrine pública. O painel não passa por aqui. */

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
  },
};

export const revalidate = 3600;

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  // A busca do cabeçalho precisa do catálogo inteiro. Carregado uma vez aqui,
  // no servidor, em vez de uma chamada por página.
  const products = await fetchProducts();

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: SITE_URL,
    description: site.shortDescription,
    slogan: site.tagline,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: WHATSAPP_DISPLAY,
        availableLanguage: ['Portuguese'],
      },
    ],
  };

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-drawer focus:bg-ink focus:px-4 focus:py-2 focus:text-2xs focus:uppercase focus:tracking-widest2 focus:text-paper"
      >
        Ir para o conteúdo
      </a>
      <AnnouncementBar />
      <Header products={products} />
      <main id="conteudo">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  );
}
