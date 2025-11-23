'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { leadsApi, funisApi, camposApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Settings,
  Sliders,
  Phone,
  Mail,
  User,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  GripVertical,
  ChevronRight,
  RefreshCw,
  Filter,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface Estagio {
  id: string
  funil_id: string
  nome: string
  cor: string
  ordem: number
}

interface Funil {
  id: string
  nome: string
  cor: string
  ordem: number
  ativo: boolean
  estagios?: Estagio[]
}

interface Lead {
  id: string
  nome_cliente: string
  telefone: string
  email_usuario?: string
  funil_id?: string
  estagio_id?: string
  created_at: string
  updated_at?: string
  campos_personalizados?: Record<string, unknown>
}

interface CampoPersonalizado {
  id: string
  nome: string
  tipo: string
  obrigatorio: boolean
  opcoes?: string[]
  funil_id?: string
}

type ViewMode = 'list' | 'kanban'

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function LeadsPage() {
  const { user } = useAuth()

  // Estados de dados
  const [leads, setLeads] = useState<Lead[]>([])
  const [funis, setFunis] = useState<Funil[]>([])
  const [campos, setCampos] = useState<CampoPersonalizado[]>([])

  // Estados de filtros
  const [selectedFunilId, setSelectedFunilId] = useState<string>('')
  const [selectedEstagioId, setSelectedEstagioId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Estado do drawer de visualizacao
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)

  // =============================================================================
  // FETCH DATA
  // =============================================================================

  const fetchFunis = useCallback(async () => {
    try {
      const response = await funisApi.list(true)
      if (response.success && response.data) {
        const funisData = response.data as Funil[]
        setFunis(funisData.filter((f) => f.ativo))
        // Selecionar primeiro funil por padrao
        if (funisData.length > 0 && !selectedFunilId) {
          setSelectedFunilId(funisData[0].id)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar funis:', err)
    }
  }, [selectedFunilId])

  const fetchCampos = useCallback(async () => {
    try {
      const response = await camposApi.list()
      if (response.success && response.data) {
        setCampos(response.data as CampoPersonalizado[])
      }
    } catch (err) {
      console.error('Erro ao carregar campos:', err)
    }
  }, [])

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {}
      if (selectedFunilId) params.funilId = selectedFunilId
      if (selectedEstagioId && selectedEstagioId !== 'all') params.estagioId = selectedEstagioId
      if (searchQuery) params.search = searchQuery

      const response = await leadsApi.list(params)

      if (response.success && response.data) {
        setLeads(response.data as Lead[])
      } else {
        setError(response.error || 'Erro ao carregar leads')
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
      setError('Erro de conexao com a API')
    } finally {
      setLoading(false)
    }
  }, [selectedFunilId, selectedEstagioId, searchQuery])

  useEffect(() => {
    fetchFunis()
    fetchCampos()
  }, [fetchFunis, fetchCampos])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCreateLead = () => {
    setEditingLead(null)
    setIsModalOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead)
    setViewingLead(null)
    setIsModalOpen(true)
  }

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead)
  }

  const handleCloseViewLead = () => {
    setViewingLead(null)
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return

    try {
      const response = await leadsApi.delete(leadId)
      if (response.success) {
        fetchLeads()
      } else {
        alert(response.error || 'Erro ao excluir lead')
      }
    } catch (err) {
      console.error('Erro ao excluir lead:', err)
      alert('Erro ao excluir lead')
    }
  }

  const handleMoveToStage = async (leadId: string, estagioId: string) => {
    try {
      const response = await leadsApi.moveToStage(leadId, estagioId)
      if (response.success) {
        fetchLeads()
      } else {
        alert(response.error || 'Erro ao mover lead')
      }
    } catch (err) {
      console.error('Erro ao mover lead:', err)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingLead(null)
  }

  const handleLeadSaved = () => {
    handleCloseModal()
    fetchLeads()
  }

  const handleRefresh = () => {
    fetchLeads()
  }

  const clearFilters = () => {
    setSelectedEstagioId('all')
    setSearchQuery('')
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  const selectedFunil = funis.find((f) => f.id === selectedFunilId)
  const estagios = selectedFunil?.estagios || []

  const getEstagioName = (estagioId?: string) => {
    if (!estagioId) return 'Sem estagio'
    for (const funil of funis) {
      const estagio = funil.estagios?.find((e) => e.id === estagioId)
      if (estagio) return estagio.nome
    }
    return 'Desconhecido'
  }

  const getEstagioColor = (estagioId?: string) => {
    if (!estagioId) return '#6b7280'
    for (const funil of funis) {
      const estagio = funil.estagios?.find((e) => e.id === estagioId)
      if (estagio) return estagio.cor
    }
    return '#6b7280'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  // =============================================================================
  // RENDER - HEADER
  // =============================================================================

  const renderHeader = () => (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestao de Leads
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerencie seus leads e acompanhe o progresso no funil
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/leads/funis">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Funis
          </Button>
        </Link>
        <Link href="/leads/campos">
          <Button variant="outline" size="sm">
            <Sliders className="mr-2 h-4 w-4" />
            Campos Personalizados
          </Button>
        </Link>
        <Button onClick={handleCreateLead}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lead
        </Button>
      </div>
    </div>
  )

  // =============================================================================
  // RENDER - FILTROS
  // =============================================================================

  const renderFilters = () => (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Seletor de Funil */}
          <div className="w-full md:w-48">
            <Label className="mb-2 block text-sm">Funil</Label>
            <Select value={selectedFunilId} onValueChange={setSelectedFunilId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funis.map((funil) => (
                  <SelectItem key={funil.id} value={funil.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: funil.cor }}
                      />
                      {funil.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Estagio */}
          <div className="w-full md:w-48">
            <Label className="mb-2 block text-sm">Estagio</Label>
            <Select
              value={selectedEstagioId}
              onValueChange={setSelectedEstagioId}
              disabled={!selectedFunilId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os estagios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estagios</SelectItem>
                {estagios.map((estagio) => (
                  <SelectItem key={estagio.id} value={estagio.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: estagio.cor }}
                      />
                      {estagio.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <div className="flex-1">
            <Label className="mb-2 block text-sm">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2">
            {((selectedEstagioId && selectedEstagioId !== 'all') || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // =============================================================================
  // RENDER - LISTA
  // =============================================================================

  const renderListView = () => (
    <div className="mt-6">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estagio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <User className="mb-4 h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">Nenhum lead encontrado</p>
                        <Button
                          variant="link"
                          onClick={handleCreateLead}
                          className="mt-2"
                        >
                          Criar primeiro lead
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleViewLead(lead)}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {lead.nome_cliente}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {lead.telefone && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Phone className="h-3 w-3" />
                              {formatPhone(lead.telefone)}
                            </div>
                          )}
                          {lead.email_usuario && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              {lead.email_usuario}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge
                          variant="outline"
                          className="border-0"
                          style={{
                            backgroundColor: `${getEstagioColor(lead.estagio_id)}20`,
                            color: getEstagioColor(lead.estagio_id),
                          }}
                        >
                          {getEstagioName(lead.estagio_id)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.created_at)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditLead(lead)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLead(lead.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // =============================================================================
  // RENDER - KANBAN
  // =============================================================================

  const renderKanbanView = () => {
    const leadsByStage = estagios.reduce(
      (acc, estagio) => {
        acc[estagio.id] = leads.filter((l) => l.estagio_id === estagio.id)
        return acc
      },
      {} as Record<string, Lead[]>
    )

    // Leads sem estagio
    const leadsWithoutStage = leads.filter(
      (l) => !l.estagio_id || !estagios.find((e) => e.id === l.estagio_id)
    )

    if (!selectedFunilId) {
      return (
        <div className="mt-6 flex items-center justify-center rounded-lg border-2 border-dashed p-12">
          <div className="text-center">
            <Filter className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              Selecione um funil para visualizar o Kanban
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="mt-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Coluna sem estagio */}
          {leadsWithoutStage.length > 0 && (
            <div className="flex w-80 flex-shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Sem estagio
                </h3>
                <Badge variant="secondary" className="ml-auto">
                  {leadsWithoutStage.length}
                </Badge>
              </div>
              <div className="flex-1 space-y-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                {leadsWithoutStage.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    estagios={estagios}
                    onEdit={handleEditLead}
                    onDelete={handleDeleteLead}
                    onMove={handleMoveToStage}
                    onView={handleViewLead}
                    formatPhone={formatPhone}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Colunas por estagio */}
          {estagios
            .sort((a, b) => a.ordem - b.ordem)
            .map((estagio) => (
              <div key={estagio.id} className="flex w-80 flex-shrink-0 flex-col">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: estagio.cor }}
                  />
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">
                    {estagio.nome}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {leadsByStage[estagio.id]?.length || 0}
                  </Badge>
                </div>
                <div
                  className="flex-1 space-y-3 rounded-lg p-3"
                  style={{ backgroundColor: `${estagio.cor}10` }}
                >
                  {(leadsByStage[estagio.id] || []).map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      estagios={estagios}
                      onEdit={handleEditLead}
                      onDelete={handleDeleteLead}
                      onMove={handleMoveToStage}
                      onView={handleViewLead}
                      formatPhone={formatPhone}
                      formatDate={formatDate}
                    />
                  ))}
                  {(!leadsByStage[estagio.id] ||
                    leadsByStage[estagio.id].length === 0) && (
                    <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-400">Nenhum lead</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  // =============================================================================
  // RENDER PRINCIPAL
  // =============================================================================

  if (loading && leads.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6">
      {renderHeader()}
      {renderFilters()}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {viewMode === 'list' ? renderListView() : renderKanbanView()}

      {/* Modal */}
      {isModalOpen && (
        <LeadModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleLeadSaved}
          lead={editingLead}
          funis={funis}
          campos={campos}
        />
      )}

      {/* Drawer de visualizacao */}
      {viewingLead && (
        <LeadViewDrawer
          lead={viewingLead}
          onClose={handleCloseViewLead}
          onEdit={() => handleEditLead(viewingLead)}
          onDelete={() => handleDeleteLead(viewingLead.id)}
          onMoveToStage={handleMoveToStage}
          estagios={estagios}
          funis={funis}
          campos={campos}
          formatPhone={formatPhone}
          formatDate={formatDate}
          getEstagioName={getEstagioName}
          getEstagioColor={getEstagioColor}
        />
      )}
    </div>
  )
}

// =============================================================================
// COMPONENTE - KANBAN CARD
// =============================================================================

interface KanbanCardProps {
  lead: Lead
  estagios: Estagio[]
  onEdit: (lead: Lead) => void
  onDelete: (id: string) => void
  onMove: (leadId: string, estagioId: string) => void
  onView: (lead: Lead) => void
  formatPhone: (phone: string) => string
  formatDate: (date: string) => string
}

function KanbanCard({
  lead,
  estagios,
  onEdit,
  onDelete,
  onMove,
  onView,
  formatPhone,
  formatDate,
}: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onView(lead)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {lead.nome_cliente}
            </h4>
            {lead.telefone && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Phone className="h-3 w-3" />
                {formatPhone(lead.telefone)}
              </p>
            )}
            {lead.email_usuario && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Mail className="h-3 w-3" />
                {lead.email_usuario}
              </p>
            )}
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border bg-white py-1 shadow-lg dark:bg-gray-800">
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(lead)
                    setShowMenu(false)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMoveMenu(!showMoveMenu)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                  Mover para
                </button>
                {showMoveMenu && (
                  <div className="border-t py-1">
                    {estagios.map((estagio) => (
                      <button
                        key={estagio.id}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          onMove(lead.id, estagio.id)
                          setShowMenu(false)
                          setShowMoveMenu(false)
                        }}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: estagio.cor }}
                        />
                        {estagio.nome}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(lead.id)
                    setShowMenu(false)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(lead.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPONENTE - MODAL DE LEAD
// =============================================================================

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  lead: Lead | null
  funis: Funil[]
  campos: CampoPersonalizado[]
}

function LeadModal({
  isOpen,
  onClose,
  onSave,
  lead,
  funis,
  campos,
}: LeadModalProps) {
  const [formData, setFormData] = useState({
    nome_cliente: lead?.nome_cliente || '',
    telefone: lead?.telefone || '',
    email_usuario: lead?.email_usuario || '',
    funil_id: lead?.funil_id || '',
    estagio_id: lead?.estagio_id || '',
  })
  const [camposValues, setCamposValues] = useState<Record<string, unknown>>(
    lead?.campos_personalizados || {}
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!lead

  const selectedFunil = funis.find((f) => f.id === formData.funil_id)
  const estagios = selectedFunil?.estagios || []

  // Campos do funil selecionado
  const camposFunil = campos.filter(
    (c) => !c.funil_id || c.funil_id === formData.funil_id
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        campos_personalizados: camposValues,
      }

      let response
      if (isEditing && lead) {
        response = await leadsApi.update(lead.id, payload)
      } else {
        response = await leadsApi.create(payload)
      }

      if (response.success) {
        onSave()
      } else {
        setError(response.error || 'Erro ao salvar lead')
      }
    } catch (err) {
      console.error('Erro ao salvar lead:', err)
      setError('Erro de conexao com a API')
    } finally {
      setLoading(false)
    }
  }

  const handleFunilChange = (funilId: string) => {
    setFormData((prev) => ({
      ...prev,
      funil_id: funilId,
      estagio_id: '', // Limpar estagio ao mudar funil
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="nome_cliente">Nome do Cliente *</Label>
            <Input
              id="nome_cliente"
              value={formData.nome_cliente}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nome_cliente: e.target.value }))
              }
              placeholder="Nome completo"
              required
              className="mt-1"
            />
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, telefone: e.target.value }))
              }
              placeholder="(00) 00000-0000"
              required
              className="mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email_usuario}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email_usuario: e.target.value }))
              }
              placeholder="email@exemplo.com"
              className="mt-1"
            />
          </div>

          {/* Funil */}
          <div>
            <Label>Funil</Label>
            <Select
              value={formData.funil_id}
              onValueChange={handleFunilChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funis.map((funil) => (
                  <SelectItem key={funil.id} value={funil.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: funil.cor }}
                      />
                      {funil.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estagio */}
          {formData.funil_id && (
            <div>
              <Label>Estagio</Label>
              <Select
                value={formData.estagio_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, estagio_id: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um estagio" />
                </SelectTrigger>
                <SelectContent>
                  {estagios.map((estagio) => (
                    <SelectItem key={estagio.id} value={estagio.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: estagio.cor }}
                        />
                        {estagio.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos Personalizados */}
          {camposFunil.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Campos Personalizados
              </h3>
              {camposFunil.map((campo) => (
                <div key={campo.id}>
                  <Label htmlFor={`campo-${campo.id}`}>
                    {campo.nome}
                    {campo.obrigatorio && ' *'}
                  </Label>
                  {campo.tipo === 'select' && campo.opcoes ? (
                    <Select
                      value={(camposValues[campo.id] as string) || ''}
                      onValueChange={(value) =>
                        setCamposValues((prev) => ({ ...prev, [campo.id]: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={`Selecione ${campo.nome}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {campo.opcoes.map((opcao) => (
                          <SelectItem key={opcao} value={opcao}>
                            {opcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : campo.tipo === 'textarea' ? (
                    <textarea
                      id={`campo-${campo.id}`}
                      value={(camposValues[campo.id] as string) || ''}
                      onChange={(e) =>
                        setCamposValues((prev) => ({
                          ...prev,
                          [campo.id]: e.target.value,
                        }))
                      }
                      className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      required={campo.obrigatorio}
                    />
                  ) : campo.tipo === 'number' ? (
                    <Input
                      id={`campo-${campo.id}`}
                      type="number"
                      value={(camposValues[campo.id] as string) || ''}
                      onChange={(e) =>
                        setCamposValues((prev) => ({
                          ...prev,
                          [campo.id]: e.target.value,
                        }))
                      }
                      className="mt-1"
                      required={campo.obrigatorio}
                    />
                  ) : campo.tipo === 'date' ? (
                    <Input
                      id={`campo-${campo.id}`}
                      type="date"
                      value={(camposValues[campo.id] as string) || ''}
                      onChange={(e) =>
                        setCamposValues((prev) => ({
                          ...prev,
                          [campo.id]: e.target.value,
                        }))
                      }
                      className="mt-1"
                      required={campo.obrigatorio}
                    />
                  ) : (
                    <Input
                      id={`campo-${campo.id}`}
                      type="text"
                      value={(camposValues[campo.id] as string) || ''}
                      onChange={(e) =>
                        setCamposValues((prev) => ({
                          ...prev,
                          [campo.id]: e.target.value,
                        }))
                      }
                      className="mt-1"
                      required={campo.obrigatorio}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botoes */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// COMPONENTE - DRAWER DE VISUALIZACAO
// =============================================================================

interface LeadViewDrawerProps {
  lead: Lead
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onMoveToStage: (leadId: string, estagioId: string) => void
  estagios: Estagio[]
  funis: Funil[]
  campos: CampoPersonalizado[]
  formatPhone: (phone: string) => string
  formatDate: (date: string) => string
  getEstagioName: (estagioId?: string) => string
  getEstagioColor: (estagioId?: string) => string
}

function LeadViewDrawer({
  lead,
  onClose,
  onEdit,
  onDelete,
  onMoveToStage,
  estagios,
  funis,
  campos,
  formatPhone,
  formatDate,
  getEstagioName,
  getEstagioColor,
}: LeadViewDrawerProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  const getFunilName = (funilId?: string) => {
    if (!funilId) return 'Sem funil'
    const funil = funis.find((f) => f.id === funilId)
    return funil?.nome || 'Desconhecido'
  }

  const getCampoLabel = (campoId: string) => {
    const campo = campos.find((c) => c.id === campoId)
    return campo?.nome || campoId
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detalhes do Lead
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Nome e avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {lead.nome_cliente}
              </h3>
              <Badge
                variant="outline"
                className="mt-1 border-0"
                style={{
                  backgroundColor: `${getEstagioColor(lead.estagio_id)}20`,
                  color: getEstagioColor(lead.estagio_id),
                }}
              >
                {getEstagioName(lead.estagio_id)}
              </Badge>
            </div>
          </div>

          {/* Informacoes de contato */}
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="text-sm font-semibold uppercase text-gray-500">Contato</h4>
            {lead.telefone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {formatPhone(lead.telefone)}
                </span>
              </div>
            )}
            {lead.email_usuario && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {lead.email_usuario}
                </span>
              </div>
            )}
          </div>

          {/* Informacoes do funil */}
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="text-sm font-semibold uppercase text-gray-500">Funil</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Funil:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {getFunilName(lead.funil_id)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Estagio:</span>
              <Badge
                variant="outline"
                className="border-0"
                style={{
                  backgroundColor: `${getEstagioColor(lead.estagio_id)}20`,
                  color: getEstagioColor(lead.estagio_id),
                }}
              >
                {getEstagioName(lead.estagio_id)}
              </Badge>
            </div>

            {/* Mover para outro estagio */}
            {estagios.length > 0 && (
              <div className="relative pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                >
                  <ChevronRight className="mr-2 h-4 w-4" />
                  Mover para outro estagio
                </Button>
                {showMoveMenu && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-white py-1 shadow-lg dark:bg-gray-800">
                    {estagios.map((estagio) => (
                      <button
                        key={estagio.id}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        disabled={lead.estagio_id === estagio.id}
                        onClick={() => {
                          onMoveToStage(lead.id, estagio.id)
                          setShowMoveMenu(false)
                        }}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: estagio.cor }}
                        />
                        <span className={lead.estagio_id === estagio.id ? 'text-gray-400' : ''}>
                          {estagio.nome}
                        </span>
                        {lead.estagio_id === estagio.id && (
                          <span className="ml-auto text-xs text-gray-400">(atual)</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Datas */}
          <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <h4 className="text-sm font-semibold uppercase text-gray-500">Datas</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Criado em:</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(lead.created_at)}
                </span>
              </div>
            </div>
            {lead.updated_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Atualizado em:</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(lead.updated_at)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Campos personalizados */}
          {lead.campos_personalizados &&
            Object.keys(lead.campos_personalizados).length > 0 && (
              <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h4 className="text-sm font-semibold uppercase text-gray-500">
                  Campos Personalizados
                </h4>
                {Object.entries(lead.campos_personalizados).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      {getCampoLabel(key)}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {String(value) || '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-white px-6 py-4 dark:bg-gray-900">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
