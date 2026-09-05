import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.unsplash.com' }
    ],
  },
  async redirects() {
    return [
      // The Fan Club programme was retired — free membership now lives at
      // /membership. Keep old links and QR codes working.
      { source: '/fan-club', destination: '/membership', permanent: true },
      { source: '/fan-club/join', destination: '/membership', permanent: true }
    ];
  },
};

export default nextConfig;
