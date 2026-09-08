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
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
};
export default nextConfig;
