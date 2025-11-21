'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useAuth } from '../../components/shared/AuthWrapper'
import PlanProtection from '../../components/shared/PlanProtection'
import HistoricoContagens from '../../components/features/extracao/HistoricoContagens'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface LoginResponse {
  msg: string
  token: string
  expiraEm: number
}

export default function HistoricoContagensPage() {
  const { user } = useAuth()
  
  // Estados da API
  const [apiConfig, setApiConfig] = useState({
    token: '',
    authenticated: false
  })
  const [loading, setLoading] = useState(false)

  // Autenticar na API Profile
  const authenticateAPI = async () => {
    if (!user) return

    setLoading(true)
    try {
      const credenciais = await supabase
        .from('configuracoes_credenciais')
        .select('apikeydados')
        .eq('user_id', user.id)
        .single()

      if (!credenciais.data?.apikeydados) {
        throw new Error('API Key da Profile não encontrada.')
      }

      const response = await fetch('/api/profile-proxy?endpoint=/Auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: credenciais.data.apikeydados
        })
      })

      const data: LoginResponse = await response.json()

      if (data.token) {
        setApiConfig({
          token: data.token,
          authenticated: true
        })
      } else {
        throw new Error(data.msg || 'Erro na autenticação')
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert('Erro na autenticação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PlanProtection feature="extracaoLeads">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Contagens</h1>
          <p className="text-gray-600">Acompanhe o progresso das suas contagens de leads criadas na API Profile</p>
        </div>

        <HistoricoContagens 
          apiConfig={apiConfig} 
          authenticateAPI={authenticateAPI}
          loading={loading}
        />
      </div>
    </PlanProtection>
  )
}