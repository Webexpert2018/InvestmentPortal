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
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/login?flow=investor',
        permanent: false,
      },
      {
        source: '/Investor',
        destination: '/auth/login?flow=investor',
        permanent: false,
      },
      {
        source: '/investor',
        destination: '/auth/login?flow=investor',
        permanent: false,
      },
      {
        source: '/Accountant',
        destination: '/auth/login?flow=account',
        permanent: false,
      },
      {
        source: '/accountant',
        destination: '/auth/login?flow=account',
        permanent: false,
      },
      {
        source: '/Admin',
        destination: '/auth/login?flow=admin',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/auth/login?flow=admin',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
