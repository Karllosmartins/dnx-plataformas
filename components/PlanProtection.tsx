'use client'

import { useAuth } from './AuthWrapper'
import { hasFeatureAccess, getPlanDisplayName, PlanType } from '../lib/plans'
import { Lock, ArrowUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface PlanProtectionProps {
  feature: 'dashboard' | 'crm' | 'whatsapp' | 'agentesIA' | 'disparoSimples' | 'disparoIA' | 'extracaoLeads' | 'configuracoes'
  children: React.ReactNode
}

export default function PlanProtection({ feature, children }: PlanProtectionProps) {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<PlanType>('basico')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserPlan() {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('plano')
          .eq('id', parseInt(user.id))
          .single()

        if (!error && data) {
          setUserPlan(data.plano || 'basico')
        }
      } catch (error) {
        console.error('Erro ao carregar plano do usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
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

  const hasAccess = hasFeatureAccess(userPlan, feature)

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
            Esta funcionalidade não está disponível no seu plano {getPlanDisplayName(userPlan)}.
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
                    ? 'Disponível no plano Enterprise'
                    : feature === 'extracaoLeads'
                    ? 'Disponível nos planos Premium e Enterprise'
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