/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  output: undefined, // Entferne 'export' für SSR
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
