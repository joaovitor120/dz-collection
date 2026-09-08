/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com data:`,
      `img-src 'self' data: blob: ${supabaseUrl}`,
      `connect-src 'self' ${supabaseUrl}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      isProduction ? 'upgrade-insecure-requests' : '',
    ].filter(Boolean).join('; '),
  },
];

if (isProduction) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@dz/shared'],
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 360, 390, 430, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 384],
    remotePatterns: supabaseUrl
      ? [{ protocol: 'https', hostname: new URL(supabaseUrl).hostname }]
      : [],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default nextConfig;
