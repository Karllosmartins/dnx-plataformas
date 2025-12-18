const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Supabase packages to fix ESM import issues
  transpilePackages: [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    '@supabase/ssr',
    '@supabase/postgrest-js',
    '@supabase/realtime-js',
    '@supabase/storage-js',
    '@supabase/functions-js',
    '@supabase/gotrue-js'
  ],

  // Webpack config para garantir path alias e resolver ESM
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)

    // Fix for Supabase ESM module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts']
    }

    return config
  },

  // Configuração para deploy em VPS (Next.js 14.0.0 still uses experimental)
  experimental: {
    serverComponentsExternalPackages: ['bcrypt', 'pino', 'pino-pretty'],
    serverActions: {
      bodySizeLimit: '20mb',
    },
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