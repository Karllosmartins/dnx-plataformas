'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import { hasFeatureAccess } from '../../lib/permissions'
import {
  Settings,
  Crown,
  Building,
  Users,
  Cog
} from 'lucide-react'

// Importar componentes das páginas existentes
import PlanosSection from './components/PlanosSection'
import TiposNegocioSection from './components/TiposNegocioSection'
import UsuariosSection from './components/UsuariosSection'

export default function ConfiguracoesAdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'planos' | 'tipos' | 'usuarios'>('planos')

  // Verificar se o usuário tem acesso
  if (!user || !hasFeatureAccess(user as any, 'usuarios')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissão para acessar as configurações administrativas.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    {
      id: 'planos' as const,
      name: 'Planos',
      icon: Crown,
      description: 'Gerencie planos e permissões'
    },
    {
      id: 'tipos' as const,
      name: 'Tipos de Negócio',
      icon: Building,
      description: 'Configure tipos de negócio'
    },
    {
      id: 'usuarios' as const,
      name: 'Usuários',
      icon: Users,
      description: 'Administre usuários'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <Cog className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configurações Administrativas
              </h1>
              <p className="mt-2 text-gray-600">
                Gerencie planos, tipos de negócio e usuários do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-400 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'planos' && <PlanosSection />}
          {activeTab === 'tipos' && <TiposNegocioSection />}
          {activeTab === 'usuarios' && <UsuariosSection />}
        </div>
      </div>
    </div>
  )
}