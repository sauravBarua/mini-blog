import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Only the Docker build sets this. Standalone output can fail on Windows (symlinks).
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
