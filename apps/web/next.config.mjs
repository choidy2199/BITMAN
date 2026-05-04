/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@toolbox/ui',
    '@toolbox/db',
    '@toolbox/auth',
    '@toolbox/domain',
    '@toolbox/cache',
    '@toolbox/queue',
    '@toolbox/search',
    '@toolbox/payments',
    '@toolbox/notify',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
