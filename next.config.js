/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Only register service worker in production to avoid dev navigation errors
  register: process.env.NODE_ENV === 'production',
  skipWaiting: process.env.NODE_ENV === 'production',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*\/products.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'products-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*\/paymentConfig.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'payment-config-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  // Force unique build ID on every deploy so Vercel never reuses stale JS chunks,
  // and the PWA Service Worker always detects the new version.
  generateBuildId: async () => `build-${Date.now()}`,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
