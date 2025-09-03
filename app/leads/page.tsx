'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/AuthWrapper'
import { Phone, User, Plus, DollarSign, FileText, AlertCircle, CheckCircle, Clock, Users, LayoutGrid, List, Search, Filter, X } from 'lucide-react'

const STATUS_CONFIG = {
  'novo_lead': { label: 'Novo Lead', color: 'bg-blue-100 text-blue-800', icon: Users },
  'qualificacao': { label: 'Qualificação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'desqualificado': { label: 'Desqualificado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  'pagamento_consulta': { label: 'Pagamento Consulta', color: 'bg-purple-100 text-purple-800', icon: DollarSign },
  'nao_consta_divida': { label: 'Não Consta Dívida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'consta_divida': { label: 'Consta Dívida', color: 'bg-orange-100 text-orange-800', icon: FileText },
  'enviado_para_negociacao': { label: 'Em Negociação', color: 'bg-indigo-100 text-indigo-800', icon: User },
  'cliente_fechado': { label: 'Cliente Fechado', color: 'bg-green-100 text-green-800', icon: CheckCircle }
}

interface CreateLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadCreated: () => void
  userId?: string
}

function CreateLeadModal({ isOpen, onClose, onLeadCreated, userId }: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    nome_cliente: '',
    cpf: '',
    telefone: '',
    origem: 'WhatsApp',
    tipo_consulta_interesse: 'Consulta Rating',
    valor_estimado_divida: '',
    tempo_negativado: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    try {
      const leadData = {
        user_id: parseInt(userId || '0'),
        nome_cliente: formData.nome_cliente,
        cpf: formData.cpf || null,
        telefone: formData.telefone,
        origem: formData.origem,
        tipo_consulta_interesse: formData.tipo_consulta_interesse,
        valor_estimado_divida: formData.valor_estimado_divida ? parseFloat(formData.valor_estimado_divida) : null,
        tempo_negativado: formData.tempo_negativado || null,
        status_limpa_nome: 'novo_lead'
      }

      const { error } = await supabase
        .from('leads')
        .insert([leadData])

      if (error) throw error

      onLeadCreated()
      onClose()
      setFormData({
        nome_cliente: '',
        cpf: '',
        telefone: '',
        origem: 'WhatsApp',
        tipo_consulta_interesse: 'Consulta Rating',
        valor_estimado_divida: '',
        tempo_negativado: ''
      })
    } catch (error) {
      console.error('Erro ao criar lead:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Criar Novo Lead</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.nome_cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_cliente: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origem
            </label>
            <select
              value={formData.origem}
              onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Site">Site</option>
              <option value="Indicação">Indicação</option>
              <option value="Telefone">Telefone</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Consulta de Interesse
            </label>
            <select
              value={formData.tipo_consulta_interesse}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_consulta_interesse: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Consulta Rating">Consulta Rating</option>
              <option value="Consulta Completa">Consulta Completa</option>
              <option value="Análise de Crédito">Análise de Crédito</option>
              <option value="Limpa Nome">Limpa Nome</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Estimado da Dívida
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.valor_estimado_divida}
              onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado_divida: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Negativado
            </label>
            <input
              type="text"
              placeholder="Ex: 2 anos, 6 meses"
              value={formData.tempo_negativado}
              onChange={(e) => setFormData(prev => ({ ...prev, tempo_negativado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoConsultaFilter, setTipoConsultaFilter] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  const fetchLeads = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', parseInt(user.id || '0'))
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSampleLeads = async () => {
    if (!user) return

    const sampleLeads = [
      {
        user_id: user.id,
        nome_cliente: 'João Silva Santos',
        cpf: '123.456.789-01',
        telefone: '(11) 99999-9999',
        origem: 'WhatsApp',
        status_limpa_nome: 'qualificacao',
        valor_estimado_divida: 15000.00,
        tempo_negativado: '2 anos',
        tipo_consulta_interesse: 'Consulta Rating'
      },
      {
        user_id: user.id,
        nome_cliente: 'Maria Oliveira',
        cpf: '987.654.321-00',
        telefone: '(11) 88888-8888',
        origem: 'Site',
        status_limpa_nome: 'pagamento_consulta',
        valor_estimado_divida: 8500.00,
        valor_pago_consulta: 199.00
      },
      {
        user_id: user.id,
        nome_cliente: 'Carlos Eduardo',
        cpf: '456.789.123-45',
        telefone: '(21) 77777-7777',
        origem: 'Indicação',
        status_limpa_nome: 'consta_divida',
        valor_estimado_divida: 12000.00,
        valor_real_divida: 11547.85,
        valor_pago_consulta: 199.00,
        orgaos_negativados: ['SPC', 'SERASA', 'Banco do Brasil']
      },
      {
        user_id: user.id,
        nome_cliente: 'Ana Paula Costa',
        cpf: '789.123.456-78',
        telefone: '(31) 66666-6666',
        origem: 'WhatsApp',
        status_limpa_nome: 'cliente_fechado',
        valor_estimado_divida: 20000.00,
        valor_real_divida: 18750.00,
        valor_pago_consulta: 199.00,
        valor_contrato: 2500.00,
        vendedor_responsavel: 'Vendedor Principal'
      }
    ]

    try {
      const { error } = await supabase
        .from('leads')
        .insert(sampleLeads)

      if (error) throw error
      fetchLeads()
    } catch (error) {
      console.error('Erro ao criar leads de exemplo:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.novo_lead
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const filteredLeads = leads.filter(lead => {
    // Filtro por status
    const statusMatch = statusFilter === 'todos' || lead.status_limpa_nome === statusFilter
    
    // Filtro por tipo de consulta
    const tipoConsultaMatch = tipoConsultaFilter === 'todos' || 
      (lead.tipo_consulta_interesse && lead.tipo_consulta_interesse.toLowerCase().includes(tipoConsultaFilter.toLowerCase()))
    
    // Filtro por nome e telefone (busca)
    const searchMatch = searchTerm === '' || 
      (lead.nome_cliente && lead.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.telefone && lead.telefone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.cpf && lead.cpf.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro por data
    let dateMatch = true
    if (startDate && lead.created_at) {
      const leadDate = new Date(lead.created_at)
      const filterStartDate = new Date(startDate)
      dateMatch = dateMatch && leadDate >= filterStartDate
    }
    if (endDate && lead.created_at) {
      const leadDate = new Date(lead.created_at)
      const filterEndDate = new Date(endDate + 'T23:59:59')
      dateMatch = dateMatch && leadDate <= filterEndDate
    }
    
    return statusMatch && tipoConsultaMatch && searchMatch && dateMatch
  })

  const getUniqueConsultaTypes = () => {
    const types = leads
      .map(lead => lead.tipo_consulta_interesse)
      .filter(type => type && type.trim() !== '')
    return [...new Set(types)]
  }

  const renderKanbanView = () => {
    const statusGroups = Object.keys(STATUS_CONFIG).map(status => ({
      status,
      config: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG],
      leads: filteredLeads.filter(lead => lead.status_limpa_nome === status)
    }))

    // Debug: verificar se selectedLead está definido
    console.log('Selected lead no Kanban:', selectedLead?.nome_cliente || 'nenhum')

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {statusGroups.map(({ status, config, leads: statusLeads }) => (
          <div key={status} className="flex-shrink-0 w-80">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <config.icon className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{config.label}</h3>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {statusLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border-l-4 ${
                      selectedLead?.id === lead.id ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50'
                    }`}
                    style={{ borderLeftColor: config.color.includes('blue') ? '#3B82F6' : 
                             config.color.includes('yellow') ? '#F59E0B' : 
                             config.color.includes('red') ? '#EF4444' : 
                             config.color.includes('purple') ? '#8B5CF6' : 
                             config.color.includes('orange') ? '#F97316' : 
                             config.color.includes('indigo') ? '#6366F1' : '#10B981' }}
                    onClick={() => {
                      console.log('Card clicado:', lead.nome_cliente, lead.id)
                      setSelectedLead(lead)
                    }}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">
                        {lead.nome_cliente || 'Nome não informado'}
                      </h4>
                      {lead.telefone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.telefone}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <div>Origem: {lead.origem || '-'}</div>
                        {lead.tipo_consulta_interesse && (
                          <div>Consulta: {lead.tipo_consulta_interesse}</div>
                        )}
                      </div>
                      {lead.valor_estimado_divida && (
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(lead.valor_estimado_divida)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {formatDate(lead.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {statusLeads.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <config.icon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhum lead</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando leads...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-600 mt-2">
            Funil de recuperação de crédito - CRM Limpa Nome
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          {/* Toggle de visualização */}
          <div className="flex items-center bg-white rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {leads.length === 0 && (
            <button
              onClick={createSampleLeads}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Criar Leads de Exemplo
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          {/* Linha 1: Busca e toggle de filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros {showFilters ? 'Menos' : 'Mais'}
            </button>
          </div>

          {/* Linha 2: Filtros expandidos */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos ({leads.length})</option>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = leads.filter(lead => lead.status_limpa_nome === status).length
                    return (
                      <option key={status} value={status}>
                        {config.label} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Tipo Consulta:</span>
                <select
                  value={tipoConsultaFilter}
                  onChange={(e) => setTipoConsultaFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  {getUniqueConsultaTypes().map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Data início:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Data fim:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('todos')
                  setTipoConsultaFilter('todos')
                  setStartDate('')
                  setEndDate('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Resumo dos resultados */}
          <div className="text-sm text-gray-600">
            {filteredLeads.length !== leads.length && (
              <span>Mostrando {filteredLeads.length} de {leads.length} leads</span>
            )}
            {filteredLeads.length === leads.length && (
              <span>Total: {leads.length} leads</span>
            )}
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
          <p className="text-gray-600 mb-4">
            Comece criando seus primeiros leads ou importe leads de exemplo.
          </p>
          <button
            onClick={createSampleLeads}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Leads de Exemplo
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'kanban' ? (
            <div className="space-y-6">
              {renderKanbanView()}
              
              {/* Detalhes do Lead - versão expandida para Kanban */}
              {selectedLead ? (
                <div className="bg-white rounded-lg shadow border-t-4 border-blue-500 mt-6">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Detalhes: {selectedLead.nome_cliente || 'Lead Selecionado'}
                    </h3>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Coluna 1: Informações Pessoais */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-600" />
                          Informações Pessoais
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Nome:</span>
                            <span className="text-gray-900">{selectedLead.nome_cliente || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">CPF:</span>
                            <span className="text-gray-900">{selectedLead.cpf || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Telefone:</span>
                            <span className="text-gray-900">{selectedLead.telefone || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Origem:</span>
                            <span className="text-gray-900">{selectedLead.origem || '-'}</span>
                          </div>
                          <div className="mt-4">
                            <span className="text-gray-600 font-medium">Status:</span>
                            <div className="mt-2">{getStatusBadge(selectedLead.status_limpa_nome || 'novo_lead')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Coluna 2: Informações Financeiras */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                          Informações Financeiras
                        </h4>
                        <div className="space-y-3 text-sm">
                          {selectedLead.valor_estimado_divida ? (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Valor estimado:</span>
                              <span className="text-gray-900 font-semibold">{formatCurrency(selectedLead.valor_estimado_divida)}</span>
                            </div>
                          ) : (
                            <div className="text-gray-500">Sem valor estimado</div>
                          )}
                          {selectedLead.valor_real_divida && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Valor real:</span>
                              <span className="text-gray-900 font-semibold">{formatCurrency(selectedLead.valor_real_divida)}</span>
                            </div>
                          )}
                          {selectedLead.valor_pago_consulta && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Consulta paga:</span>
                              <span className="text-blue-600 font-semibold">{formatCurrency(selectedLead.valor_pago_consulta)}</span>
                            </div>
                          )}
                          {selectedLead.valor_contrato && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Valor contrato:</span>
                              <span className="text-green-600 font-bold">{formatCurrency(selectedLead.valor_contrato)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coluna 3: Detalhes Específicos */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-600" />
                          Detalhes Específicos
                        </h4>
                        <div className="space-y-3 text-sm">
                          {selectedLead.tempo_negativado && (
                            <div>
                              <span className="text-gray-600 font-medium">Tempo negativado:</span>
                              <div className="text-gray-900 mt-1">{selectedLead.tempo_negativado}</div>
                            </div>
                          )}
                          {selectedLead.tipo_consulta_interesse && (
                            <div>
                              <span className="text-gray-600 font-medium">Tipo consulta:</span>
                              <div className="text-gray-900 mt-1">{selectedLead.tipo_consulta_interesse}</div>
                            </div>
                          )}
                          {selectedLead.motivo_desqualificacao && (
                            <div>
                              <span className="text-gray-600 font-medium">Motivo desqualificação:</span>
                              <div className="text-red-600 mt-1">{selectedLead.motivo_desqualificacao}</div>
                            </div>
                          )}
                          {selectedLead.orgaos_negativados && selectedLead.orgaos_negativados.length > 0 && (
                            <div>
                              <span className="text-gray-600 font-medium">Órgãos negativados:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedLead.orgaos_negativados.map((orgao, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                    {orgao}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-4">
                            Criado em: {formatDate(selectedLead.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center mt-6">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Clique em um lead no Kanban para ver os detalhes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Leads */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Leads ({filteredLeads.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {filteredLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {lead.nome_cliente || 'Nome não informado'}
                              </h4>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              {lead.cpf && <div>CPF: {lead.cpf}</div>}
                              {lead.telefone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {lead.telefone}
                                </div>
                              )}
                              <div>Origem: {lead.origem || '-'}</div>
                              {lead.tipo_consulta_interesse && <div>Consulta: {lead.tipo_consulta_interesse}</div>}
                              {lead.valor_estimado_divida && (
                                <div className="font-medium text-green-600">
                                  Valor estimado: {formatCurrency(lead.valor_estimado_divida)}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {formatDate(lead.created_at)}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4">
                            {getStatusBadge(lead.status_limpa_nome || 'novo_lead')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detalhes do Lead */}
              <div className="lg:col-span-1">
                {selectedLead ? (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Detalhes do Lead
                      </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Status atual */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Status Atual</h4>
                        {getStatusBadge(selectedLead.status_limpa_nome || 'novo_lead')}
                      </div>

                      {/* Informações básicas */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Informações Pessoais
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-500">Nome:</span> <span className="ml-2 text-gray-900">{selectedLead.nome_cliente || '-'}</span></div>
                          <div><span className="text-gray-500">CPF:</span> <span className="ml-2 text-gray-900">{selectedLead.cpf || '-'}</span></div>
                          <div><span className="text-gray-500">Telefone:</span> <span className="ml-2 text-gray-900">{selectedLead.telefone || '-'}</span></div>
                          <div><span className="text-gray-500">Origem:</span> <span className="ml-2 text-gray-900">{selectedLead.origem || '-'}</span></div>
                        </div>
                      </div>

                      {/* Informações financeiras */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Informações Financeiras
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedLead.valor_estimado_divida && <div><span className="text-gray-500">Valor estimado:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_estimado_divida)}</span></div>}
                          {selectedLead.valor_real_divida && <div><span className="text-gray-500">Valor real:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_real_divida)}</span></div>}
                          {selectedLead.valor_pago_consulta && <div><span className="text-gray-500">Consulta paga:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_pago_consulta)}</span></div>}
                          {selectedLead.valor_contrato && <div><span className="text-gray-500">Valor contrato:</span> <span className="ml-2 text-green-600 font-medium">{formatCurrency(selectedLead.valor_contrato)}</span></div>}
                        </div>
                      </div>

                      {/* Informações específicas */}
                      {(selectedLead.tempo_negativado || selectedLead.tipo_consulta_interesse || selectedLead.motivo_desqualificacao) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes Específicos</h4>
                          <div className="space-y-2 text-sm">
                            {selectedLead.tempo_negativado && <div><span className="text-gray-500">Tempo negativado:</span> <span className="ml-2 text-gray-900">{selectedLead.tempo_negativado}</span></div>}
                            {selectedLead.tipo_consulta_interesse && <div><span className="text-gray-500">Tipo consulta:</span> <span className="ml-2 text-gray-900">{selectedLead.tipo_consulta_interesse}</span></div>}
                            {selectedLead.motivo_desqualificacao && <div><span className="text-gray-500">Motivo desqualificação:</span> <span className="ml-2 text-red-600">{selectedLead.motivo_desqualificacao}</span></div>}
                          </div>
                        </div>
                      )}

                      {/* Órgãos negativados */}
                      {selectedLead.orgaos_negativados && selectedLead.orgaos_negativados.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Órgãos Negativados</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedLead.orgaos_negativados.map((orgao, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                {orgao}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4" />
                      <p>Selecione um lead da lista para ver os detalhes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de criar lead */}
      {showCreateForm && (
        <CreateLeadModal 
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onLeadCreated={fetchLeads}
          userId={user?.id}
        />
      )}
    </div>
  )
}