'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { workspacesApi } from '@/lib/api-client'

interface Workspace {
  id: string
  name: string
  slug: string
  plano_nome?: string
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  loading: boolean
  refresh: () => Promise<void>
}

// Hook simples que carrega o workspace atual
export function useWorkspace(): WorkspaceContextType {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadWorkspaces() {
    setLoading(true)
    try {
      const response = await workspacesApi.list()

      if (response.success && response.data) {
        const workspacesData = Array.isArray(response.data)
          ? response.data
          : [response.data]

        setWorkspaces(workspacesData as Workspace[])

        // Definir workspace atual (primeiro por padrão)
        if (workspacesData.length > 0) {
          setCurrentWorkspace(workspacesData[0] as Workspace)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaces()
  }, [])

  return {
    workspaces,
    currentWorkspace,
    loading,
    refresh: loadWorkspaces,
  }
}
