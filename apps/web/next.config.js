/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@nizios/ui', '@nizios/i18n', '@nizios/config'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
