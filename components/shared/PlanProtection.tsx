'use client'

import { useAuth } from './AuthWrapper'
import { hasFeatureAccess, FeatureType } from '../../lib/permissions'
import { Lock, ArrowUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase, User, UsuarioComPlano } from '../../lib/supabase'

interface PlanProtectionProps {
  feature: FeatureType
  children: React.ReactNode
}

export default function PlanProtection({ feature, children }: PlanProtectionProps) {
  const { user } = useAuth()
  const [userWithPlan, setUserWithPlan] = useState<User | UsuarioComPlano | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserWithPlan() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Tentar buscar dados completos do usuário com plano
        const { data, error } = await supabase
          .from('view_usuarios_planos')
          .select('*')
          .eq('id', parseInt(user.id || '0'))
          .single()

        if (!error && data) {
          setUserWithPlan(data)
        } else {
          // Fallback para user básico
          setUserWithPlan(user as any)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        setUserWithPlan(user as any)
      } finally {
        setLoading(false)
      }
    }

    fetchUserWithPlan()
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

  const hasAccess = userWithPlan ? hasFeatureAccess(userWithPlan, feature) : false
  const planName = userWithPlan && 'plano_nome' in userWithPlan ? userWithPlan.plano_nome : (userWithPlan?.plano || 'básico')

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