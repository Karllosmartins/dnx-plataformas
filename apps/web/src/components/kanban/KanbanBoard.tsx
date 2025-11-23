'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { leadsApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface Lead {
  id: number
  nome_cliente: string
  email_usuario?: string
  numero_formatado?: string
  estagio_id: string
  created_at: string
  dados_personalizados?: Record<string, unknown>
}

interface Stage {
  id: string
  nome: string
  cor: string
  ordem: number
  leads: Lead[]
  total: number
}

interface KanbanData {
  funil: { id: string; nome: string }
  kanban: Stage[]
  total_leads: number
}

interface KanbanBoardProps {
  funilId: string
  onLeadClick?: (lead: Lead) => void
}

export function KanbanBoard({ funilId, onLeadClick }: KanbanBoardProps) {
  const [data, setData] = useState<KanbanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Carregar dados do Kanban
  useEffect(() => {
    loadKanban()
  }, [funilId])

  const loadKanban = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await leadsApi.kanban(funilId)
      setData(response.data.data)
    } catch (err) {
      setError('Erro ao carregar kanban')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Encontrar lead pelo ID
  const findLead = (id: number): Lead | undefined => {
    for (const stage of data?.kanban || []) {
      const lead = stage.leads.find((l) => l.id === id)
      if (lead) return lead
    }
    return undefined
  }

  // Encontrar estágio de um lead
  const findStage = (leadId: number): Stage | undefined => {
    return data?.kanban.find((stage) =>
      stage.leads.some((lead) => lead.id === leadId)
    )
  }

  // Início do drag
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const leadId = active.id as number
    setActiveId(leadId)
    setActiveLead(findLead(leadId) || null)
  }

  // Durante o drag (para preview)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || !data) return

    const activeId = active.id as number
    const overId = over.id

    // Encontrar estágios
    const activeStage = findStage(activeId)
    let overStage: Stage | undefined

    // Se o over é um lead, encontrar seu estágio
    if (typeof overId === 'number') {
      overStage = findStage(overId)
    } else {
      // Se o over é um estágio
      overStage = data.kanban.find((s) => s.id === overId)
    }

    if (!activeStage || !overStage || activeStage.id === overStage.id) return

    // Mover lead para outro estágio (preview local)
    setData((prev) => {
      if (!prev) return prev

      const newKanban = prev.kanban.map((stage) => {
        if (stage.id === activeStage.id) {
          return {
            ...stage,
            leads: stage.leads.filter((l) => l.id !== activeId),
            total: stage.total - 1,
          }
        }
        if (stage.id === overStage!.id) {
          const lead = activeStage.leads.find((l) => l.id === activeId)
          if (lead) {
            return {
              ...stage,
              leads: [...stage.leads, { ...lead, estagio_id: overStage!.id }],
              total: stage.total + 1,
            }
          }
        }
        return stage
      })

      return { ...prev, kanban: newKanban }
    })
  }

  // Fim do drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveLead(null)

    if (!over || !data) return

    const leadId = active.id as number
    const overId = over.id

    // Encontrar estágio destino
    let targetStageId: string
    if (typeof overId === 'number') {
      const stage = findStage(overId)
      if (!stage) return
      targetStageId = stage.id
    } else {
      targetStageId = overId as string
    }

    // Encontrar estágio atual do lead
    const currentStage = data.kanban.find((s) =>
      s.leads.some((l) => l.id === leadId)
    )

    // Se não mudou de estágio, não fazer nada
    if (currentStage?.id === targetStageId) return

    // Chamar API para mover lead
    try {
      await leadsApi.moveToStage(leadId, targetStageId)
    } catch (err) {
      console.error('Erro ao mover lead:', err)
      // Recarregar dados em caso de erro
      loadKanban()
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
      <div className="flex h-[500px] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.funil.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {data.total_leads} leads no funil
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={data.kanban.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {data.kanban.map((stage) => (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                title={stage.nome}
                color={stage.cor}
                count={stage.total}
              >
                <SortableContext items={stage.leads.map((l) => l.id)}>
                  {stage.leads.map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => onLeadClick?.(lead)}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ))}
          </SortableContext>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeLead ? (
            <KanbanCard lead={activeLead} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
