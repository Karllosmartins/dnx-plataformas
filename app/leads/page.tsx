'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/AuthWrapper'
import { Phone, User, Plus, DollarSign, FileText, AlertCircle, CheckCircle, Clock, Users, LayoutGrid, List, Search, Filter, X, BarChart3, TrendingUp, Calendar, FileBarChart, Target, Activity } from 'lucide-react'
import LeadForm from '../../components/forms/LeadForm'

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
  const [activeTab, setActiveTab] = useState<'leads' | 'relatorios'>('leads')

  // Estados específicos para a aba Relatórios
  const [reportFilters, setReportFilters] = useState({
    campanha: '',
    origemFilter: 'todos',
    statusRelatorio: 'todos',
    tipoConsultaRelatorio: 'todos',
    dataInicioRelatorio: '',
    dataFimRelatorio: '',
    cnpj: '',
    valorMinimo: '',
    valorMaximo: ''
  })

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

    // Primeiro, carrega os tipos de negócio do usuário
    try {
      const { data: userTipos, error: tiposError } = await supabase
        .from('user_tipos_negocio')
        .select(`
          tipos_negocio!inner (
            id, nome, nome_exibicao, campos_personalizados, status_personalizados, cor
          )
        `)
        .eq('user_id', parseInt(user.id))
        .eq('ativo', true)

      if (tiposError) throw tiposError

      if (!userTipos || userTipos.length === 0) {
        console.error('Usuário não tem tipos de negócio associados')
        return
      }

      // Usa o primeiro tipo de negócio encontrado
      const tipoNegocio = userTipos[0].tipos_negocio as any
      const sampleLeads = []

      if (tipoNegocio.nome === 'previdenciario') {
        // Leads de exemplo para previdenciário
        sampleLeads.push(
          {
            user_id: user.id,
            nome_cliente: 'João Silva Santos',
            cpf: '123.456.789-01',
            telefone: '(11) 99999-9999',
            origem: 'WhatsApp',
            tipo_negocio_id: tipoNegocio.id,
            status_generico: 'novo_caso',
            dados_personalizados: {
              tipo_acidente: 'trabalho',
              contrato_assinado: false,
              beneficios_interesse: ['auxilio_doenca']
            }
          },
          {
            user_id: user.id,
            nome_cliente: 'Maria Oliveira Costa',
            cpf: '987.654.321-00',
            telefone: '(11) 88888-8888',
            origem: 'Site',
            tipo_negocio_id: tipoNegocio.id,
            status_generico: 'analise_viabilidade',
            dados_personalizados: {
              tipo_acidente: 'transito',
              contrato_assinado: true,
              beneficios_interesse: ['auxilio_acidente', 'aposentadoria_invalidez']
            }
          },
          {
            user_id: user.id,
            nome_cliente: 'Carlos Eduardo Silva',
            cpf: '456.789.123-45',
            telefone: '(21) 77777-7777',
            origem: 'Indicação',
            tipo_negocio_id: tipoNegocio.id,
            status_generico: 'caso_viavel',
            dados_personalizados: {
              tipo_acidente: 'doenca_ocupacional',
              contrato_assinado: false,
              beneficios_interesse: ['auxilio_doenca', 'aposentadoria_invalidez']
            }
          }
        )
      } else if (tipoNegocio.nome === 'limpa_nome') {
        // Leads originais para limpa nome
        sampleLeads.push(
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
          }
        )
      }

      if (sampleLeads.length > 0) {
        const { error } = await supabase
          .from('leads')
          .insert(sampleLeads)

        if (error) throw error
        fetchLeads()
      }
    } catch (error) {
      console.error('Erro ao criar leads de exemplo:', error)
    }
  }

  // Resto das funções e componente renderizado...
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    if (!config) return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{status}</span>
    
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const filteredLeads = leads.filter(lead => {
    const statusMatch = statusFilter === 'todos' || lead.status_limpa_nome === statusFilter
    const dateMatch = (!startDate || new Date(lead.created_at || '') >= new Date(startDate)) &&
                     (!endDate || new Date(lead.created_at || '') <= new Date(endDate))
    const tipoConsultaMatch = tipoConsultaFilter === 'todos' || 
      (lead.tipo_consulta_interesse && lead.tipo_consulta_interesse.toLowerCase().includes(tipoConsultaFilter.toLowerCase()))
    const searchMatch = searchTerm === '' || 
      (lead.nome_cliente && lead.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.telefone && lead.telefone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.cpf && lead.cpf.toLowerCase().includes(searchTerm.toLowerCase()))

    return statusMatch && dateMatch && tipoConsultaMatch && searchMatch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="mt-2 text-sm text-gray-600">
              DNX Operações Inteligentes - Gerencie seus leads e oportunidades
            </p>
          </div>
          <div className="flex space-x-3">
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

        {/* Lista de Leads */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum lead encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {leads.length === 0 
                ? 'Comece criando seu primeiro lead ou use leads de exemplo.' 
                : 'Tente ajustar os filtros para encontrar leads.'
              }
            </p>
            {leads.length === 0 && (
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={createSampleLeads}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Leads de Exemplo
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <li key={lead.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.nome_cliente}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Phone className="inline h-3 w-3 mr-1" />
                          {lead.telefone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(lead.status_limpa_nome || 'novo_lead')}
                      <div className="text-sm text-gray-500">
                        {formatDate(lead.created_at)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal do formulário */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Criar Novo Lead</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <LeadForm
              userId={parseInt(user?.id || '0')}
              onSuccess={() => {
                setShowCreateForm(false)
                fetchLeads()
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}