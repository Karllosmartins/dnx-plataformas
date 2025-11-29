'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '../../../components/shared/AuthWrapper'
import { Shield, Settings } from 'lucide-react'
import WorkspacesSection from '../../configuracoes-admin/components/WorkspacesSection'

export default function AdminWorkspacesPage() {
  const { user, loading: authLoading } = useAuth()

  // Verificar se o usuário é admin
  const isAdmin = user?.role === 'admin'

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  // Verificar se o usuário tem acesso (precisa ser admin)
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissão para acessar a administração de workspaces.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkspacesSection />
    </div>
  )
}
