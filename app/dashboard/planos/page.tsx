'use client'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

import { useAuth } from '../../../components/shared/AuthWrapper'
import { hasFeatureAccess } from '../../../lib/permissions'
import { Shield } from 'lucide-react'
import PlanosSection from '../../../app/configuracoes-admin/components/PlanosSection'

export default function PlanosPage() {
  const { user } = useAuth()

  // Verificar se o usuário tem acesso
  if (!user || !hasFeatureAccess(user as any, 'usuarios')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissão para acessar o gerenciamento de planos.
          </p>
        </div>
      </div>
    )
  }

  return <PlanosSection />
}