/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix Apollo Server bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@yaacovcr/transform': '@yaacovcr/transform',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
