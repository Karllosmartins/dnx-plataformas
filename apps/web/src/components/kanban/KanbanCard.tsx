'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { Mail, Phone, Calendar, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Lead {
  id: number
  nome_cliente: string
  email_usuario?: string
  numero_formatado?: string
  estagio_id: string
  created_at: string
  dados_personalizados?: Record<string, unknown>
}

interface KanbanCardProps {
  lead: Lead
  isDragging?: boolean
  onClick?: () => void
}

export function KanbanCard({ lead, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'kanban-card',
        (isDragging || isSortableDragging) && 'dragging opacity-50'
      )}
      onClick={onClick}
    >
      {/* Header com grip e nome */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h4 className="font-medium leading-tight">
            {lead.nome_cliente || 'Sem nome'}
          </h4>
        </div>
      </div>

      {/* Informações do lead */}
      <div className="mt-2 space-y-1">
        {lead.email_usuario && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email_usuario}</span>
          </div>
        )}

        {lead.numero_formatado && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.numero_formatado}</span>
          </div>
        )}

        {lead.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(lead.created_at), "dd 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        )}
      </div>

      {/* Tags ou campos personalizados */}
      {lead.dados_personalizados && Object.keys(lead.dados_personalizados).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(lead.dados_personalizados).slice(0, 2).map(([key, value]) => (
            <span
              key={key}
              className="rounded bg-secondary px-1.5 py-0.5 text-xs"
            >
              {String(value)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
