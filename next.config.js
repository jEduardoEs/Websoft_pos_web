/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })(nextConfig)
  : nextConfig
