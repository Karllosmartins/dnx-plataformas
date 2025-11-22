const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack config para garantir path alias
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
  // Configuração para deploy em VPS
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'bcrypt', 'pino', 'pino-pretty']
  },
  
  // Output standalone para Docker
  output: 'standalone',
  
  // Configurações de imagem
  images: {
    domains: [
      'app.dnxplataformas.com.br',
      'wsapi.dnxplataformas.com.br',
      'webhooks.dnxplataformas.com.br',
      'f005.backblazeb2.com'
    ],
    unoptimized: true // Para VPS sem otimização de imagem
  },
  
  // Configurações de ambiente
  env: {
    CUSTOM_KEY: 'DNX_PLATAFORMAS_CRM'
  },
  
  // Configurações de build
  typescript: {
    ignoreBuildErrors: false
  },
  
  eslint: {
    ignoreDuringBuilds: false
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig