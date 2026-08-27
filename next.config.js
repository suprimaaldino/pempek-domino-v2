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
  
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' only in dev (Next.js HMR/workbox); never in prod.
              "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : '') + " https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com https://*.gstatic.com https://www.googletagmanager.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.firebaseapp.com https://firebasestorage.googleapis.com",
              "font-src 'self'",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firestore.googleapis.com https://identitytoolkit.googleapis.com",
              "frame-src 'self' https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  
  // HTTPS redirect in production
  async redirects() {
    const redirects = [];
    
    // Only enforce HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      redirects.push({
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://:path*',
        permanent: true,
      });
    }
    
    return redirects;
  },
};

module.exports = withPWA(nextConfig);
