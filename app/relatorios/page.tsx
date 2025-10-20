'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/AuthWrapper'

interface TipoNegocio {
  id: number
  nome: string
  nome_exibicao: string
  descricao?: string
  icone?: string
  cor?: string
  campos_personalizados?: any[]
  status_personalizados?: string[]
  metricas_config?: any
  ativo: boolean
  ordem: number
}

interface DashboardConfig {
  title: string
  subtitle: string
  metrics?: {
    novosLeads?: string
    qualificados?: string
    emAndamento?: string
    casosViaveis?: string
    fechados?: string
    negociacao?: string
    leadsPerdidos?: string
    totalGeral?: string
  }
  statusLabels?: Record<string, string>
}
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  Download,
  FileBarChart,
  Activity,
  Percent,
  Clock,
  CheckCircle,
  TrendingDown,
  Zap,
  Award,
  Briefcase,
  FileCheck
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function RelatoriosPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [campanhas, setCampanhas] = useState<string[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [userTipoNegocio, setUserTipoNegocio] = useState<TipoNegocio | null>(null)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)

  const [filters, setFilters] = useState({
    campanha: '',
    origem: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    cnpj: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchUserTipoNegocio()
      fetchLeads()
    }
  }, [user])

  const fetchUserTipoNegocio = async () => {
    if (!user?.id) return

    try {
      // Buscar tipo de negócio do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tipo_negocio_id')
        .eq('id', parseInt(user.id))
        .single()

      if (userError) throw userError

      if (userData?.tipo_negocio_id) {
        const { data: tipoData, error: tipoError } = await supabase
          .from('tipos_negocio')
          .select('*')
          .eq('id', userData.tipo_negocio_id)
          .single()

        if (tipoError) throw tipoError

        setUserTipoNegocio(tipoData)
        configureDashboard(tipoData)
      }
    } catch (error) {
      console.error('Erro ao buscar tipo de negócio:', error)
    }
  }

  const configureDashboard = (tipoNegocio: TipoNegocio) => {
    const config: DashboardConfig = {
      title: 'Relatórios',
      subtitle: 'Análises e métricas'
    }

    // Carregar configuração de métricas do banco de dados
    if (tipoNegocio.metricas_config) {
      const metricasConfig = tipoNegocio.metricas_config as any

      config.metrics = {
        novosLeads: metricasConfig.label_novos || 'Novos',
        qualificados: metricasConfig.label_qualificados || 'Qualificados',
        emAndamento: metricasConfig.label_em_andamento || 'Em Andamento',
        casosViaveis: metricasConfig.label_casos_viaveis || 'Casos Viáveis',
        fechados: metricasConfig.label_fechados || 'Fechados',
        negociacao: metricasConfig.label_negociacao || 'Em Negociação',
        leadsPerdidos: metricasConfig.label_perdidos || 'Perdidos',
        totalGeral: metricasConfig.label_total || 'Total Geral'
      }
    }

    // Configurações específicas por tipo de negócio
    if (tipoNegocio.nome === 'limpa_nome') {
      config.title = 'Relatórios - Limpa Nome'
      config.subtitle = 'Análise de consultas e negociações'
      if (!tipoNegocio.metricas_config) {
        config.metrics = {
          novosLeads: 'Novos Leads',
          qualificados: 'Qualificados',
          emAndamento: 'Pagou Consulta',
          casosViaveis: 'Dívidas Encontradas',
          fechados: 'Clientes Fechados',
          negociacao: 'Em Negociação',
          leadsPerdidos: 'Leads Perdidos',
          totalGeral: 'Total Geral'
        }
      }
    } else if (tipoNegocio.nome === 'previdenciario') {
      config.title = 'Relatórios - Previdenciário'
      config.subtitle = 'Análise de casos e processos'
      if (!tipoNegocio.metricas_config) {
        config.metrics = {
          novosLeads: 'Novos Casos',
          qualificados: 'Análise Viabilidade',
          emAndamento: 'Contratos Enviados',
          casosViaveis: 'Casos Viáveis',
          fechados: 'Casos Finalizados',
          negociacao: 'Processos Iniciados',
          leadsPerdidos: 'Casos Perdidos',
          totalGeral: 'Total Geral'
        }
      }
    } else if (tipoNegocio.nome === 'b2b') {
      config.title = 'Relatórios - B2B'
      config.subtitle = 'Análise de vendas corporativas'
      if (!tipoNegocio.metricas_config) {
        config.metrics = {
          novosLeads: 'Novos Contatos',
          qualificados: 'Qualificação',
          emAndamento: 'Apresentações',
          casosViaveis: 'Propostas Enviadas',
          fechados: 'Deals Fechados',
          negociacao: 'Em Negociação',
          leadsPerdidos: 'Contatos Perdidos',
          totalGeral: 'Total Geral'
        }
      }
    } else {
      // Configuração genérica baseada no nome do tipo
      config.title = `Relatórios - ${tipoNegocio.nome_exibicao || tipoNegocio.nome}`
      config.subtitle = tipoNegocio.descricao || 'Análises e métricas'
      if (!tipoNegocio.metricas_config) {
        config.metrics = {
          novosLeads: 'Novos Leads',
          qualificados: 'Qualificados',
          emAndamento: 'Em Andamento',
          casosViaveis: 'Casos Viáveis',
          fechados: 'Fechados',
          negociacao: 'Em Negociação',
          leadsPerdidos: 'Leads Perdidos',
          totalGeral: 'Total Geral'
        }
      }
    }

    // Criar mapeamento de labels de status
    if (tipoNegocio.status_personalizados && Array.isArray(tipoNegocio.status_personalizados)) {
      config.statusLabels = {}
      tipoNegocio.status_personalizados.forEach((status: string) => {
        config.statusLabels![status] = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })
    }

    setDashboardConfig(config)
  }

  const fetchLeads = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', parseInt(user.id))
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setLeads(data || [])

      // Extrair campanhas e origens únicas
      const uniqueCampanhas = [...new Set(data?.map(l => l.nome_campanha).filter(Boolean))]
      const uniqueOrigens = [...new Set(data?.map(l => l.origem).filter(Boolean))]

      setCampanhas(uniqueCampanhas as string[])
      setOrigens(uniqueOrigens as string[])

    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      if (filters.campanha && lead.nome_campanha !== filters.campanha) return false
      if (filters.origem && lead.origem !== filters.origem) return false
      if (filters.status && lead.status_generico !== filters.status) return false
      if (filters.cnpj && !lead.cpf_cnpj?.includes(filters.cnpj)) return false

      if (filters.dataInicio && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterDate = new Date(filters.dataInicio)
        if (leadDate < filterDate) return false
      }

      if (filters.dataFim && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterDate = new Date(filters.dataFim)
        filterDate.setHours(23, 59, 59)
        if (leadDate > filterDate) return false
      }

      return true
    })
  }

  const calculateMetrics = (filteredLeads: Lead[]) => {
    const total = filteredLeads.length
    const comWhatsApp = filteredLeads.filter(l => l.existe_whatsapp).length
    const valorTotal = filteredLeads.reduce((sum, l) => sum + (l.valor_contrato || 0), 0)

    // Métricas por status
    const statusCounts: Record<string, number> = {}
    filteredLeads.forEach(lead => {
      const status = lead.status_generico || 'sem_status'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Métricas por campanha
    const campanhaCounts: Record<string, number> = {}
    const campanhaValores: Record<string, number> = {}
    filteredLeads.forEach(lead => {
      const campanha = lead.nome_campanha || 'Sem campanha'
      campanhaCounts[campanha] = (campanhaCounts[campanha] || 0) + 1
      campanhaValores[campanha] = (campanhaValores[campanha] || 0) + (lead.valor_contrato || 0)
    })

    // Métricas por origem
    const origemCounts: Record<string, number> = {}
    filteredLeads.forEach(lead => {
      const origem = lead.origem || 'Sem origem'
      origemCounts[origem] = (origemCounts[origem] || 0) + 1
    })

    // Timeline (leads por dia)
    const timeline: Record<string, number> = {}
    filteredLeads.forEach(lead => {
      if (lead.created_at) {
        const date = new Date(lead.created_at).toLocaleDateString('pt-BR')
        timeline[date] = (timeline[date] || 0) + 1
      }
    })

    // Métricas específicas por tipo de negócio
    let specificMetrics: any = {}

    if (userTipoNegocio?.nome === 'limpa_nome') {
      const pagouConsulta = filteredLeads.filter(l => l.valor_pago_consulta && l.valor_pago_consulta > 0).length
      const dividasEncontradas = filteredLeads.filter(l =>
        l.status_limpa_nome === 'consta_divida' || l.status_generico === 'consta_divida'
      ).length
      const clientesFechados = filteredLeads.filter(l =>
        l.status_limpa_nome === 'cliente_fechado' || l.status_generico === 'cliente_fechado'
      ).length

      specificMetrics = {
        pagouConsulta,
        dividasEncontradas,
        taxaDividas: pagouConsulta > 0 ? ((dividasEncontradas / pagouConsulta) * 100).toFixed(1) : '0',
        taxaConversao: dividasEncontradas > 0 ? ((clientesFechados / dividasEncontradas) * 100).toFixed(1) : '0',
        valorConsultas: filteredLeads.reduce((sum, l) => sum + (l.valor_pago_consulta || 0), 0),
        ticketMedioConsulta: pagouConsulta > 0 ? (filteredLeads.reduce((sum, l) => sum + (l.valor_pago_consulta || 0), 0) / pagouConsulta).toFixed(2) : '0'
      }
    } else if (userTipoNegocio?.nome === 'previdenciario') {
      const casosAnalise = filteredLeads.filter(l =>
        l.status_generico === 'qualificado' || l.status_generico === 'analise_viabilidade'
      ).length
      const casosViaveis = filteredLeads.filter(l =>
        l.status_generico === 'caso_viavel' || l.status_generico === 'casos_viaveis'
      ).length
      const casosFechados = filteredLeads.filter(l =>
        l.status_generico === 'fechado' || l.status_generico === 'caso_finalizado'
      ).length

      specificMetrics = {
        casosAnalise,
        casosViaveis,
        casosFechados,
        taxaViabilidade: casosAnalise > 0 ? ((casosViaveis / casosAnalise) * 100).toFixed(1) : '0',
        taxaFechamento: casosViaveis > 0 ? ((casosFechados / casosViaveis) * 100).toFixed(1) : '0',
        valorMedioCaso: casosFechados > 0 ? (valorTotal / casosFechados).toFixed(2) : '0'
      }
    } else if (userTipoNegocio?.nome === 'b2b') {
      const qualificados = filteredLeads.filter(l =>
        l.status_generico === 'qualificado' || l.status_generico === 'qualificacao'
      ).length
      const apresentacoes = filteredLeads.filter(l =>
        l.status_generico === 'em_andamento' || l.status_generico === 'apresentacao'
      ).length
      const propostasEnviadas = filteredLeads.filter(l =>
        l.status_generico === 'caso_viavel' || l.status_generico === 'proposta_enviada'
      ).length
      const dealsFechados = filteredLeads.filter(l =>
        l.status_generico === 'fechado' || l.status_generico === 'deal_fechado'
      ).length

      specificMetrics = {
        qualificados,
        apresentacoes,
        propostasEnviadas,
        dealsFechados,
        taxaQualificacao: total > 0 ? ((qualificados / total) * 100).toFixed(1) : '0',
        taxaFechamento: propostasEnviadas > 0 ? ((dealsFechados / propostasEnviadas) * 100).toFixed(1) : '0',
        ticketMedio: dealsFechados > 0 ? (valorTotal / dealsFechados).toFixed(2) : '0'
      }
    }

    return {
      total,
      comWhatsApp,
      taxaWhatsApp: total > 0 ? ((comWhatsApp / total) * 100).toFixed(1) : '0',
      valorTotal,
      valorMedio: total > 0 ? (valorTotal / total).toFixed(2) : '0',
      statusCounts,
      campanhaCounts,
      campanhaValores,
      origemCounts,
      timeline,
      specific: specificMetrics
    }
  }

  const exportToCSV = () => {
    const filteredLeads = getFilteredLeads()

    const headers = ['Nome', 'Telefone', 'CPF/CNPJ', 'Status', 'Campanha', 'Origem', 'Valor', 'WhatsApp', 'Data']
    const rows = filteredLeads.map(lead => [
      lead.nome_cliente || '',
      lead.telefone || '',
      lead.cpf || lead.cpf_cnpj || '',
      lead.status_generico || '',
      lead.nome_campanha || '',
      lead.origem || '',
      lead.valor_contrato || '0',
      lead.existe_whatsapp ? 'Sim' : 'Não',
      lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : ''
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredLeads = getFilteredLeads()
  const metrics = calculateMetrics(filteredLeads)

  // Preparar dados para gráficos
  const statusChartData = Object.entries(metrics.statusCounts).map(([status, count]) => ({
    name: dashboardConfig?.statusLabels?.[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }))

  const campanhaChartData = Object.entries(metrics.campanhaCounts).map(([campanha, count]) => ({
    campanha,
    leads: count,
    valor: metrics.campanhaValores[campanha] || 0
  }))

  const origemChartData = Object.entries(metrics.origemCounts).map(([origem, count]) => ({
    name: origem,
    value: count
  }))

  const timelineChartData = Object.entries(metrics.timeline)
    .sort((a, b) => new Date(a[0].split('/').reverse().join('-')).getTime() - new Date(b[0].split('/').reverse().join('-')).getTime())
    .map(([date, count]) => ({
      data: date,
      leads: count
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            {dashboardConfig?.title || 'Relatórios e Análises'}
          </h1>
          <p className="mt-2 text-gray-600">
            {dashboardConfig?.subtitle || 'Dashboard completo com métricas e análises'}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FileBarChart className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campanha</label>
            <select
              value={filters.campanha}
              onChange={(e) => setFilters(prev => ({ ...prev, campanha: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {campanhas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <select
              value={filters.origem}
              onChange={(e) => setFilters(prev => ({ ...prev, origem: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {origens.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {userTipoNegocio?.status_personalizados && userTipoNegocio.status_personalizados.map((status: string) => (
                <option key={status} value={status}>
                  {dashboardConfig?.statusLabels?.[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={filters.cnpj}
              onChange={(e) => setFilters(prev => ({ ...prev, cnpj: e.target.value }))}
              placeholder="Filtrar por CNPJ"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ campanha: '', origem: '', status: '', dataInicio: '', dataFim: '', cnpj: '' })}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {dashboardConfig?.title?.replace('Relatórios - ', 'Total de ') || 'Total de Leads'}
              </p>
              <p className="text-3xl font-bold mt-2">{metrics.total}</p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                {userTipoNegocio?.nome === 'b2b' ? 'Com Contato Válido' : 'Com WhatsApp'}
              </p>
              <p className="text-3xl font-bold mt-2">{metrics.comWhatsApp}</p>
              <p className="text-green-100 text-xs mt-1">{metrics.taxaWhatsApp}% do total</p>
            </div>
            <Percent className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                {userTipoNegocio?.nome === 'previdenciario' ? 'Valor Total Estimado' :
                 userTipoNegocio?.nome === 'b2b' ? 'Receita Total' : 'Valor Total'}
              </p>
              <p className="text-3xl font-bold mt-2">R$ {metrics.valorTotal.toLocaleString('pt-BR')}</p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">
                {userTipoNegocio?.nome === 'b2b' ? 'Ticket Médio' :
                 userTipoNegocio?.nome === 'previdenciario' ? 'Valor Médio por Caso' : 'Valor Médio'}
              </p>
              <p className="text-3xl font-bold mt-2">R$ {parseFloat(metrics.valorMedio).toLocaleString('pt-BR')}</p>
            </div>
            <Target className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Cards de Métricas Específicas por Tipo de Negócio */}
      {metrics.specific && Object.keys(metrics.specific).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-blue-600" />
            Métricas Específicas - {dashboardConfig?.title?.replace('Relatórios - ', '') || ''}
          </h2>

          {/* Cards específicos do Limpa Nome */}
          {userTipoNegocio?.nome === 'limpa_nome' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-sm font-medium">Consultas Realizadas</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.pagouConsulta}</p>
                    <p className="text-cyan-100 text-xs mt-1">
                      R$ {metrics.specific.ticketMedioConsulta} médio
                    </p>
                  </div>
                  <FileCheck className="h-12 w-12 text-cyan-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Dívidas Encontradas</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.dividasEncontradas}</p>
                    <p className="text-emerald-100 text-xs mt-1">
                      {metrics.specific.taxaDividas}% das consultas
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-emerald-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Taxa de Conversão</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.taxaConversao}%</p>
                    <p className="text-indigo-100 text-xs mt-1">Dívidas → Clientes</p>
                  </div>
                  <Award className="h-12 w-12 text-indigo-200" />
                </div>
              </div>
            </div>
          )}

          {/* Cards específicos do Previdenciário */}
          {userTipoNegocio?.nome === 'previdenciario' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-100 text-sm font-medium">Casos em Análise</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.casosAnalise}</p>
                  </div>
                  <Clock className="h-12 w-12 text-sky-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Casos Viáveis</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.casosViaveis}</p>
                    <p className="text-teal-100 text-xs mt-1">
                      {metrics.specific.taxaViabilidade}% de viabilidade
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-teal-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100 text-sm font-medium">Taxa de Fechamento</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.taxaFechamento}%</p>
                    <p className="text-violet-100 text-xs mt-1">Viáveis → Fechados</p>
                  </div>
                  <Award className="h-12 w-12 text-violet-200" />
                </div>
              </div>
            </div>
          )}

          {/* Cards específicos do B2B */}
          {userTipoNegocio?.nome === 'b2b' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Qualificados</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.qualificados}</p>
                    <p className="text-blue-100 text-xs mt-1">
                      {metrics.specific.taxaQualificacao}% do total
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Apresentações</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.apresentacoes}</p>
                  </div>
                  <Briefcase className="h-12 w-12 text-indigo-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Propostas Enviadas</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.propostasEnviadas}</p>
                  </div>
                  <FileCheck className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">Taxa de Fechamento</p>
                    <p className="text-3xl font-bold mt-2">{metrics.specific.taxaFechamento}%</p>
                    <p className="text-pink-100 text-xs mt-1">Propostas → Deals</p>
                  </div>
                  <Award className="h-12 w-12 text-pink-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Leads por Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Campanhas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Performance por Campanha
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campanhaChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campanha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Origem */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Leads por Origem
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={origemChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
            Evolução de Leads
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="leads" stroke="#F59E0B" fill="#FCD34D" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Valor por Campanha */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Valor por Campanha
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Médio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campanhaChartData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.campanha}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {(item.valor / item.leads).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
