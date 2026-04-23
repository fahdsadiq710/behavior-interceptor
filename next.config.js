/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'node-cron'],
    instrumentationHook: true,
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig
