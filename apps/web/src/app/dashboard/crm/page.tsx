'use client'

import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/kanban'
import { funisApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface Funil {
  id: string
  nome: string
  cor: string
}

export default function CRMPage() {
  const [funis, setFunis] = useState<Funil[]>([])
  const [selectedFunil, setSelectedFunil] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFunis()
  }, [])

  const loadFunis = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await funisApi.list()
      const responseData = response.data as { data?: Funil[]; success?: boolean } | Funil[]
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setFunis(data as Funil[])

      // Selecionar primeiro funil por padrão
      if (data.length > 0 && !selectedFunil) {
        setSelectedFunil((data as Funil[])[0].id)
      }
    } catch (err) {
      setError('Erro ao carregar funis')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={loadFunis}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (funis.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Nenhum funil encontrado</p>
        <p className="text-sm text-muted-foreground">
          Crie um funil na aba Funis para comecar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com seletor de funil */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">Gerencie seus leads no Kanban</p>
        </div>

        {/* Seletor de Funil */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Funil:</label>
          <select
            value={selectedFunil || ''}
            onChange={(e) => setSelectedFunil(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {funis.map((funil) => (
              <option key={funil.id} value={funil.id}>
                {funil.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      {selectedFunil && (
        <KanbanBoard
          funilId={selectedFunil}
          onLeadClick={(lead) => {
            console.log('Lead clicked:', lead)
            // TODO: Abrir modal de edição do lead
          }}
        />
      )}
    </div>
  )
}
