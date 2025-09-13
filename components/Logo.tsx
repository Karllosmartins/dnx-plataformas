'use client'

// =====================================================
// COMPONENTE LOGO - DNX PLATAFORMAS
// Componente para exibir a logo do sistema
// =====================================================

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
  xl: { width: 96, height: 96 }
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dimensions = sizeMap[size]

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="DNX Plataformas"
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-lg"
        priority
      />
      {showText && (
        <div className="ml-3">
          <h1 className={`font-bold text-gray-900 ${
            size === 'sm' ? 'text-lg' :
            size === 'md' ? 'text-xl' :
            size === 'lg' ? 'text-2xl' :
            'text-3xl'
          }`}>
            DNX Plataformas
          </h1>
          <p className={`text-gray-600 ${
            size === 'sm' ? 'text-xs' :
            size === 'md' ? 'text-sm' :
            'text-base'
          }`}>
            DNX Operações Inteligentes
          </p>
        </div>
      )}
    </div>
  )
}

// Componente apenas da logo (sem texto)
export function LogoIcon({ size = 'md', className = '' }: Omit<LogoProps, 'showText'>) {
  return <Logo size={size} showText={false} className={className} />
}

// Componente com texto personalizado
export function LogoWithText({ 
  size = 'md', 
  title = 'DNX Plataformas', 
  subtitle = 'DNX Operações Inteligentes',
  className = '' 
}: LogoProps & { title?: string; subtitle?: string }) {
  const dimensions = sizeMap[size]

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="DNX Plataformas"
        width={dimensions.width}
        height={dimensions.height}
        className="rounded-lg"
        priority
      />
      <div className="ml-3">
        <h1 className={`font-bold text-gray-900 ${
          size === 'sm' ? 'text-lg' :
          size === 'md' ? 'text-xl' :
          size === 'lg' ? 'text-2xl' :
          'text-3xl'
        }`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-gray-600 ${
            size === 'sm' ? 'text-xs' :
            size === 'md' ? 'text-sm' :
            'text-base'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}