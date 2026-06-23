/**
 * Rishtajodo Matrimony - Next.js Configuration
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack root — prevents workspace lockfile detection warning
  turbopack: {
    root: __dirname,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },

  // Image optimization — allow Supabase Storage domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // TypeScript strict checking in build
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint strict checking in build
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
