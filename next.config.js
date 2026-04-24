/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    instrumentationHook: true,
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig
