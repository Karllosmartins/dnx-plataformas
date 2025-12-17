'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface WorkspacePermissions {
  id: string  // UUID
  name: string
  slug: string
  plano_id: number | null
  plano_nome: string
  acesso_dashboard: boolean
  acesso_crm: boolean
  acesso_whatsapp: boolean
  acesso_disparo_simples: boolean
  acesso_disparo_ia: boolean
  acesso_agentes_ia: boolean
  acesso_extracao_leads: boolean
  acesso_enriquecimento: boolean
  acesso_usuarios: boolean
  acesso_consulta: boolean
  acesso_integracoes: boolean
  acesso_arquivos: boolean
  plano_customizado?: Record<string, boolean> | null
}

export interface WorkspaceLimits {
  limite_leads: number
  leads_consumidos: number
  limite_consultas: number
  consultas_realizadas: number
  limite_instancias_whatsapp: number
  instancias_whatsapp_ativas: number
}

export interface CurrentWorkspace extends WorkspacePermissions {
  limits?: WorkspaceLimits
}

interface WorkspaceContextType {
  currentWorkspace: CurrentWorkspace | null
  workspaceId: string | null  // UUID
  loading: boolean
  error: string | null
  refreshWorkspace: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<boolean>
  hasFeatureAccess: (feature: string) => boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}

interface WorkspaceProviderProps {
  children: ReactNode
  userId: string | number | null
}

export function WorkspaceProvider({ children, userId }: WorkspaceProviderProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState<CurrentWorkspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentWorkspace = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar se há workspace pendente do switch (evita race condition)
      const pendingWorkspace = sessionStorage.getItem('pending_workspace')
      if (pendingWorkspace) {
        try {
          const workspaceData = JSON.parse(pendingWorkspace)
          sessionStorage.removeItem('pending_workspace')
          setCurrentWorkspace(workspaceData)
          setLoading(false)
          return
        } catch {
          sessionStorage.removeItem('pending_workspace')
        }
      }

      const response = await fetch(`/api/workspaces/current?userId=${userId}`)
      const result = await response.json()

      if (result.success && result.data) {
        setCurrentWorkspace(result.data)
      } else {
        setError(result.error || 'Erro ao carregar workspace')
        setCurrentWorkspace(null)
      }
    } catch (err) {
      setError('Erro de conexão ao carregar workspace')
      setCurrentWorkspace(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const switchWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    if (!userId) return false

    try {
      const response = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId })
      })
      const result = await response.json()

      if (result.success) {
        // Se a API retornou os dados do workspace, salvamos em sessionStorage
        // para evitar race condition de replicação no banco
        if (result.data) {
          sessionStorage.setItem('pending_workspace', JSON.stringify(result.data))
        }
        // Recarregar a página para atualizar todos os dados
        window.location.reload()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [userId])

  const hasFeatureAccess = useCallback((feature: string): boolean => {
    if (!currentWorkspace) return false

    const featureMap: Record<string, keyof WorkspacePermissions> = {
      'dashboard': 'acesso_dashboard',
      'crm': 'acesso_crm',
      'whatsapp': 'acesso_whatsapp',
      'disparoSimples': 'acesso_disparo_simples',
      'disparoIA': 'acesso_disparo_ia',
      'agentesIA': 'acesso_agentes_ia',
      'extracaoLeads': 'acesso_extracao_leads',
      'enriquecimentoAPI': 'acesso_enriquecimento',
      'usuarios': 'acesso_usuarios',
      'consulta': 'acesso_consulta',
      'integracoes': 'acesso_integracoes',
      'arquivos': 'acesso_arquivos',
    }

    const permissionKey = featureMap[feature]
    if (!permissionKey) return false

    // Verificar customizações primeiro
    if (currentWorkspace.plano_customizado && permissionKey in currentWorkspace.plano_customizado) {
      return currentWorkspace.plano_customizado[permissionKey] as boolean
    }

    return currentWorkspace[permissionKey] as boolean
  }, [currentWorkspace])

  useEffect(() => {
    fetchCurrentWorkspace()
  }, [fetchCurrentWorkspace])

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaceId: currentWorkspace?.id ?? null,
    loading,
    error,
    refreshWorkspace: fetchCurrentWorkspace,
    switchWorkspace,
    hasFeatureAccess,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
