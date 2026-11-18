import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawBackendTarget = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ''
)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  transpilePackages: ['gsap', 'lenis'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    if (!rawBackendTarget || !/^https?:\/\//i.test(rawBackendTarget)) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${rawBackendTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
