import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  env: {
    NEXT_PUBLIC_CONTENT_API_BASE_URL: process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL || 'http://localhost:4001',
  },
};

export default nextConfig;
