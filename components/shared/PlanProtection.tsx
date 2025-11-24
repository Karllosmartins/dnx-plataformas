'use client'

import { useAuth } from './AuthWrapper'
import { hasWorkspaceFeatureAccess, FeatureType, WorkspaceComPlano } from '../../lib/permissions'
import { Lock, ArrowUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { workspacesApi } from '../../lib/api-client'

interface PlanProtectionProps {
  feature: FeatureType
  children: React.ReactNode
}

export default function PlanProtection({ feature, children }: PlanProtectionProps) {
  const { user } = useAuth()
  const [workspaceWithPlan, setWorkspaceWithPlan] = useState<WorkspaceComPlano | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWorkspacePermissions() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Buscar workspaces do usuário
        const response = await workspacesApi.list()

        if (response.success && response.data) {
          const workspaces = Array.isArray(response.data) ? response.data : [response.data]

          if (workspaces.length > 0) {
            const currentWorkspace = workspaces[0] as any

            // Buscar detalhes do workspace com permissões do plano
            const detailsResponse = await workspacesApi.get(currentWorkspace.id)

            if (detailsResponse.success && detailsResponse.data) {
              const wsDetails = detailsResponse.data as any
              const planoData = wsDetails.planos || {}

              setWorkspaceWithPlan({
                id: wsDetails.id,
                name: wsDetails.name,
                plano_id: wsDetails.plano_id,
                plano_nome: planoData.nome,
                acesso_dashboard: planoData.acesso_dashboard || false,
                acesso_crm: planoData.acesso_crm || false,
                acesso_whatsapp: planoData.acesso_whatsapp || false,
                acesso_disparo_simples: planoData.acesso_disparo_simples || false,
                acesso_disparo_ia: planoData.acesso_disparo_ia || false,
                acesso_agentes_ia: planoData.acesso_agentes_ia || false,
                acesso_extracao_leads: planoData.acesso_extracao_leads || false,
                acesso_enriquecimento: planoData.acesso_enriquecimento || false,
                acesso_usuarios: planoData.acesso_usuarios || false,
                acesso_consulta: planoData.acesso_consulta || false,
                acesso_integracoes: planoData.acesso_integracoes || false,
                acesso_arquivos: planoData.acesso_arquivos || false,
                plano_customizado: wsDetails.plano_customizado
              })
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar permissões do workspace:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspacePermissions()
  }, [user?.id])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Admin sempre tem acesso
  if (user.role === 'admin') {
    return <>{children}</>
  }

  const hasAccess = workspaceWithPlan ? hasWorkspaceFeatureAccess(workspaceWithPlan, feature) : false
  const planName = workspaceWithPlan?.plano_nome || 'básico'

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Recurso Não Disponível
          </h1>

          <p className="text-gray-600 mb-6">
            Esta funcionalidade não está disponível no seu plano {planName}.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ArrowUp className="h-5 w-5 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">
                  Faça upgrade para acessar
                </p>
                <p className="text-sm text-blue-700">
                  {feature === 'agentesIA' || feature === 'disparoIA'
                    ? 'Disponível no plano Premium 1 ou Enterprise'
                    : feature === 'extracaoLeads'
                    ? 'Disponível nos planos Premium 2 ou Enterprise'
                    : feature === 'enriquecimento'
                    ? 'Disponível apenas no plano Enterprise'
                    : 'Disponível em planos superiores'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <h3 className="font-medium text-gray-900">O que você pode fazer:</h3>
            <ul className="text-left space-y-1">
              <li>• Entre em contato com o suporte</li>
              <li>• Solicite upgrade do seu plano</li>
              <li>• Use as funcionalidades disponíveis no seu plano atual</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}