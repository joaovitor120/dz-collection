/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Source maps do cliente ficam fora de produção: não há motivo para expor a
  // estrutura interna do painel administrativo.
  productionBrowserSourceMaps: false,
  transpilePackages: ['@dz/shared'],
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [{ protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname }]
      : [],
  },
  experimental: {
    serverActions: {
      // Limite de payload para upload de imagem via Server Action.
      bodySizeLimit: '6mb',
      // Allowlist de origem da checagem de CSRF nativa do Next para Server
      // Actions. Roda ANTES do nosso assertSameOrigin — duas camadas, uma do
      // framework e uma nossa.
      allowedOrigins: [
        new URL(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://dz-collection-adm.vercel.app').host,
        ...(process.env.NODE_ENV === 'production' ? [] : ['localhost:3001']),
      ],
    },
  },
};
export default nextConfig;
