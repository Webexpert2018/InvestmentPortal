/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
 typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
