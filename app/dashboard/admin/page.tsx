'use client'

import { useState, useEffect } from 'react'
import { Shield, Building2, Loader2, Plus, Pencil } from 'lucide-react'

interface Plano {
  id: number
  nome: string
}

interface User {
  id: number
  name: string
  email: string
}

interface Workspace {
  id: string
  name: string
  slug: string
  plano_id?: number
  owner_id?: number
  limite_leads?: number
  limite_consultas?: number
  limite_instancias?: number
  leads_consumidos?: number
  consultas_realizadas?: number
  planos?: Plano
  users?: User
}

export default function AdminPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // TODO: Carregar workspaces, users e planos
      // Por agora deixando vazio para não dar erro

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Administração de Workspaces
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os workspaces, limites e permissões
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">
          Página em desenvolvimento. Migration 003 precisa ser aplicada primeiro.
        </p>
      </div>
    </div>
  )
}