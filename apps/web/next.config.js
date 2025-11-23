/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dnx/types'],
  // Output standalone para Docker
  output: 'standalone',
  // Desabilita geração de páginas estáticas de erro
  // que causam conflito com app router
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
