/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 360, 390, 430, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 384],
  },
};
export default nextConfig;
