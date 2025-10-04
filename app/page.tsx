'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase, Lead } from '../lib/supabase'
import { useAuth } from '../components/AuthWrapper'
import MetricCard from '../components/MetricCard'
import {
  Settings,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User,
  XCircle,
  Target
} from 'lucide-react'
import Image from 'next/image'

interface DashboardMetrics {
  totalLeads: number
  novosLeads: number
  qualificados: number
  pagamentosRealizados: number
  dividasEncontradas: number
  clientesFechados: number
  leadsPerdidos: number
  valorTotalConsultas: number
  valorTotalContratos: number
  taxaConversao: number
}

export default function HomePage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    novosLeads: 0,
    qualificados: 0,
    pagamentosRealizados: 0,
    dividasEncontradas: 0,
    clientesFechados: 0,
    leadsPerdidos: 0,
    valorTotalConsultas: 0,
    valorTotalContratos: 0,
    taxaConversao: 0
  })
  const [loading, setLoading] = useState(true)
  const [userBusinessTypes, setUserBusinessTypes] = useState<any[]>([])
  const [dashboardConfig, setDashboardConfig] = useState<any>(null)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  useEffect(() => {
    filterLeadsByDate()
  }, [leads, startDate, endDate])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Carregar leads do usuário
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', parseInt(user.id || '0'))

      if (leadsError) throw leadsError
      
      // Carregar tipos de negócio do usuário
      const { data: userTypesData, error: typesError } = await supabase
        .from('user_tipos_negocio')
        .select(`
          tipos_negocio (
            id, nome, nome_exibicao, cor,
            campos_personalizados, status_personalizados
          )
        `)
        .eq('user_id', parseInt(user.id || '0'))
        .eq('ativo', true)

      if (typesError) throw typesError

      const businessTypes = userTypesData?.map(item => {
        const tipo = item.tipos_negocio as any;
        if (tipo) {
          return {
            ...tipo,
            campos_personalizados: typeof tipo.campos_personalizados === 'string' 
              ? JSON.parse(tipo.campos_personalizados) 
              : tipo.campos_personalizados || [],
            status_personalizados: typeof tipo.status_personalizados === 'string'
              ? JSON.parse(tipo.status_personalizados)
              : tipo.status_personalizados || []
          };
        }
        return null;
      }).filter(Boolean) || [];

      setUserBusinessTypes(businessTypes)
      setLeads(leadsData || [])
      setFilteredLeads(leadsData || [])

      // Configurar dashboard baseado no primeiro tipo de negócio do usuário
      if (businessTypes.length > 0) {
        configureDashboard(businessTypes[0])
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const configureDashboard = (businessType: any) => {
    const config: any = {}

    // Usar configuração de métricas do banco se disponível
    if (businessType.metricas_config && typeof businessType.metricas_config === 'object') {
      const metricasConfig = businessType.metricas_config
      config.title = `Dashboard ${businessType.nome_exibicao}`
      config.subtitle = businessType.descricao || 'Gestão de leads'
      config.metrics = {
        novosLeads: metricasConfig.label_novos || 'Novos',
        qualificados: metricasConfig.label_qualificados || 'Qualificados',
        emAndamento: metricasConfig.label_em_andamento || 'Em Andamento',
        casosViaveis: metricasConfig.label_casos_viaveis || 'Casos Viáveis',
        fechados: metricasConfig.label_fechados || 'Fechados',
        negociacao: metricasConfig.label_negociacao || 'Em Negociação'
      }
    } else {
      // Fallback baseado no nome do tipo
      if (businessType.nome === 'limpa_nome') {
        config.title = 'Dashboard Limpa Nome'
        config.subtitle = 'Recuperação de crédito'
        config.metrics = {
          novosLeads: 'Novos Leads',
          qualificados: 'Qualificados',
          emAndamento: 'Pagou Consulta',
          casosViaveis: 'Dívidas Encontradas',
          fechados: 'Clientes Fechados',
          negociacao: 'Em Negociação'
        }
      } else if (businessType.nome === 'previdenciario') {
        config.title = 'Dashboard Previdenciário'
        config.subtitle = 'Casos previdenciários'
        config.metrics = {
          novosLeads: 'Novos Casos',
          qualificados: 'Análise Viabilidade',
          emAndamento: 'Contratos Enviados',
          casosViaveis: 'Casos Viáveis',
          fechados: 'Casos Finalizados',
          negociacao: 'Processos Iniciados'
        }
      } else if (businessType.nome === 'b2b') {
        config.title = 'Dashboard B2B'
        config.subtitle = 'Prospecção empresarial'
        config.metrics = {
          novosLeads: 'Novos Contatos',
          qualificados: 'Qualificação',
          emAndamento: 'Apresentações',
          casosViaveis: 'Propostas Enviadas',
          fechados: 'Deals Fechados',
          negociacao: 'Em Negociação'
        }
      } else {
        // Fallback genérico
        config.title = `Dashboard ${businessType.nome_exibicao || 'CRM'}`
        config.subtitle = businessType.descricao || 'Gestão de leads'
        config.metrics = {
          novosLeads: 'Novos Leads',
          qualificados: 'Qualificados',
          emAndamento: 'Em Andamento',
          casosViaveis: 'Casos Viáveis',
          fechados: 'Fechados',
          negociacao: 'Em Negociação'
        }
      }
    }

    setDashboardConfig(config)
  }

  const filterLeadsByDate = () => {
    let filtered = leads

    if (startDate) {
      filtered = filtered.filter(lead => {
        if (!lead.created_at) return false
        const leadDate = new Date(lead.created_at)
        const filterStartDate = new Date(startDate)
        return leadDate >= filterStartDate
      })
    }

    if (endDate) {
      filtered = filtered.filter(lead => {
        if (!lead.created_at) return false
        const leadDate = new Date(lead.created_at)
        const filterEndDate = new Date(endDate + 'T23:59:59')
        return leadDate <= filterEndDate
      })
    }

    setFilteredLeads(filtered)
    calculateMetrics(filtered)
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
    setFilteredLeads(leads)
    calculateMetrics(leads)
  }

  const calculateMetrics = (leadsData: Lead[]) => {
    const totalLeads = leadsData.length

    if (userBusinessTypes.length === 0) {
      // Fallback se não conseguir carregar tipos de negócio
      return setMetrics({
        totalLeads,
        novosLeads: 0,
        qualificados: 0,
        pagamentosRealizados: 0,
        dividasEncontradas: 0,
        clientesFechados: 0,
        leadsPerdidos: 0,
        valorTotalConsultas: 0,
        valorTotalContratos: 0,
        taxaConversao: 0
      })
    }

    const businessType = userBusinessTypes[0] // Usar primeiro tipo do usuário
    const statusPersonalizados = businessType.status_personalizados || []

    console.log('Tipo de negócio:', businessType.nome)
    console.log('Status personalizados:', statusPersonalizados)

    // Usar status_generico (novo sistema) ou status_limpa_nome (fallback para limpa nome)
    const getStatus = (lead: Lead) => {
      if (businessType.nome === 'limpa_nome') {
        return lead.status_limpa_nome || 'novo_lead'
      }
      return lead.status_generico || 'novo_lead'
    }

    // Debug: ver todos os status existentes nos leads
    const allStatus = [...new Set(leadsData.map(l => getStatus(l)))]
    console.log('Status encontrados nos leads:', allStatus)

    // Calcular métricas baseado nos status específicos do tipo de negócio
    let novosLeads = 0, qualificados = 0, emAndamento = 0, casosViaveis = 0, fechados = 0, perdidos = 0

    // Se há status personalizados, usar mapeamento dinâmico
    if (statusPersonalizados.length > 0) {
      // Mapear status baseado na posição e nomenclatura comum
      const primeiroStatus = statusPersonalizados[0] // Geralmente 'novo_*'
      const segundoStatus = statusPersonalizados[1] // Geralmente qualificação/análise

      // Encontrar status que indicam progresso
      const statusAndamento = statusPersonalizados.find((s: string) =>
        s.includes('contrato') || s.includes('pagamento') || s.includes('apresentacao')
      )
      const statusViavel = statusPersonalizados.find((s: string) =>
        s.includes('viavel') || s.includes('divida') || s.includes('proposta')
      )
      const statusFechado = statusPersonalizados.find((s: string) =>
        s.includes('finalizado') || s.includes('fechado') || s.includes('deal')
      )
      const statusPerdido = statusPersonalizados.find((s: string) =>
        s.includes('inviavel') || s.includes('desqualificado') || s.includes('perdido')
      )

      novosLeads = leadsData.filter(l => getStatus(l) === primeiroStatus).length
      qualificados = segundoStatus ? leadsData.filter(l => getStatus(l) === segundoStatus).length : 0
      emAndamento = statusAndamento ? leadsData.filter(l => getStatus(l) === statusAndamento).length : 0
      casosViaveis = statusViavel ? leadsData.filter(l => getStatus(l) === statusViavel).length : 0
      fechados = statusFechado ? leadsData.filter(l => getStatus(l) === statusFechado).length : 0
      perdidos = statusPerdido ? leadsData.filter(l => getStatus(l) === statusPerdido).length : 0

    } else {
      // Fallback para tipos conhecidos
      if (businessType.nome === 'limpa_nome') {
        novosLeads = leadsData.filter(l => getStatus(l) === 'novo_lead').length
        qualificados = leadsData.filter(l => getStatus(l) === 'qualificacao').length
        emAndamento = leadsData.filter(l => getStatus(l) === 'pagamento_consulta').length
        casosViaveis = leadsData.filter(l => getStatus(l) === 'consta_divida').length
        fechados = leadsData.filter(l => getStatus(l) === 'cliente_fechado').length
        perdidos = leadsData.filter(l => getStatus(l) === 'desqualificado').length
      } else if (businessType.nome === 'previdenciario') {
        novosLeads = leadsData.filter(l => getStatus(l) === 'novo_caso').length
        qualificados = leadsData.filter(l => getStatus(l) === 'analise_viabilidade').length
        emAndamento = leadsData.filter(l => getStatus(l) === 'contrato_enviado').length
        casosViaveis = leadsData.filter(l => getStatus(l) === 'caso_viavel').length
        fechados = leadsData.filter(l => getStatus(l) === 'caso_finalizado').length
        perdidos = leadsData.filter(l => getStatus(l) === 'caso_inviavel').length
      } else if (businessType.nome === 'b2b') {
        novosLeads = leadsData.filter(l => getStatus(l) === 'novo_contato').length
        qualificados = leadsData.filter(l => getStatus(l) === 'qualificacao_inicial').length
        emAndamento = leadsData.filter(l => getStatus(l) === 'apresentacao_realizada').length
        casosViaveis = leadsData.filter(l => getStatus(l) === 'proposta_enviada').length
        fechados = leadsData.filter(l => getStatus(l) === 'deal_fechado').length
        perdidos = leadsData.filter(l => getStatus(l) === 'desqualificado').length
      }
    }

    const valorTotalConsultas = leadsData.reduce((sum, lead) => {
      return sum + (lead.valor_pago_consulta || 0)
    }, 0)

    const valorTotalContratos = leadsData.reduce((sum, lead) => {
      return sum + (lead.valor_contrato || 0)
    }, 0)

    const taxaConversao = totalLeads > 0 ? (fechados / totalLeads) * 100 : 0

    setMetrics({
      totalLeads,
      novosLeads,
      qualificados,
      pagamentosRealizados: emAndamento,
      dividasEncontradas: casosViaveis,
      clientesFechados: fechados,
      leadsPerdidos: perdidos,
      valorTotalConsultas,
      valorTotalContratos,
      taxaConversao
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  }

  const recentLeads = filteredLeads.slice(0, 5)

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {dashboardConfig?.title || 'DNX Plataformas'}
        </h1>
        <p className="mt-2 text-gray-600">
          {dashboardConfig?.subtitle || 'Dashboard CRM'} - Bem-vindo, {user?.name}
        </p>
      </div>

      {/* Filtro de Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilter}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(startDate || endDate) && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando dados de {filteredLeads.length} leads
            {startDate && ` a partir de ${new Date(startDate).toLocaleDateString('pt-BR')}`}
            {endDate && ` até ${new Date(endDate).toLocaleDateString('pt-BR')}`}
          </div>
        )}
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads.toString()}
          description={`${metrics.novosLeads} novos leads`}
          icon={Users}
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.taxaConversao.toFixed(1)}%`}
          description={`${metrics.clientesFechados} ${dashboardConfig?.metrics?.fechados?.toLowerCase() || 'fechados'}`}
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.valorTotalConsultas)}
          description={`${metrics.pagamentosRealizados} ${dashboardConfig?.metrics?.emAndamento?.toLowerCase() || 'em andamento'}`}
          icon={DollarSign}
        />
        
        <MetricCard
          title="Contratos Fechados"
          value={formatCurrency(metrics.valorTotalContratos)}
          description={`${metrics.clientesFechados} contratos`}
          icon={CheckCircle}
        />
      </div>

      {/* Funil de Conversão */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Funil de Conversão</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-100" />
            <div className="text-2xl font-bold">{metrics.novosLeads}</div>
            <div className="text-xs text-blue-100 mt-1">{dashboardConfig?.metrics?.novosLeads || 'Novos Leads'}</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-4 text-white text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-100" />
            <div className="text-2xl font-bold">{metrics.qualificados}</div>
            <div className="text-xs text-yellow-100 mt-1">{dashboardConfig?.metrics?.qualificados || 'Qualificados'}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-100" />
            <div className="text-2xl font-bold">{metrics.pagamentosRealizados}</div>
            <div className="text-xs text-purple-100 mt-1">{dashboardConfig?.metrics?.emAndamento || 'Em Andamento'}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 text-white text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-orange-100" />
            <div className="text-2xl font-bold">{metrics.dividasEncontradas}</div>
            <div className="text-xs text-orange-100 mt-1">{dashboardConfig?.metrics?.casosViaveis || 'Casos Viáveis'}</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-4 text-white text-center">
            <User className="h-8 w-8 mx-auto mb-2 text-indigo-100" />
            <div className="text-2xl font-bold">
              {leads.filter(l => {
                const status = l.status_generico || l.status_limpa_nome || ''
                return status.includes('negociacao') || status.includes('apresentacao') || status.includes('proposta')
              }).length}
            </div>
            <div className="text-xs text-indigo-100 mt-1">{dashboardConfig?.metrics?.negociacao || 'Em Negociação'}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-100" />
            <div className="text-2xl font-bold">{metrics.clientesFechados}</div>
            <div className="text-xs text-green-100 mt-1">{dashboardConfig?.metrics?.fechados || 'Fechados'}</div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-4 text-white text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-100" />
            <div className="text-2xl font-bold">{metrics.leadsPerdidos}</div>
            <div className="text-xs text-red-100 mt-1">Leads Perdidos</div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-4 text-white text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-gray-100" />
            <div className="text-2xl font-bold">{leads.length}</div>
            <div className="text-xs text-gray-100 mt-1">Total Geral</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Leads Recentes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.nome_cliente || 'Nome não informado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.origem} • {lead.telefone}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(() => {
                      const status = lead.status_generico || lead.status_limpa_nome || 'novo'
                      if (status.includes('fechado') || status.includes('finalizado') || status.includes('convertido'))
                        return 'bg-green-100 text-green-800'
                      if (status.includes('divida') || status.includes('viavel') || status.includes('consta'))
                        return 'bg-orange-100 text-orange-800'
                      if (status.includes('qualific') || status.includes('analise'))
                        return 'bg-yellow-100 text-yellow-800'
                      return 'bg-blue-100 text-blue-800'
                    })()}`}>
                      {(lead.status_generico || lead.status_limpa_nome)?.replace(/_/g, ' ') || 'novo lead'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">Nenhum lead encontrado</p>
                <Link href="/leads" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm">
                  Criar primeiro lead →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
          </div>
          <div className="p-6 space-y-3">
            <Link href="/leads" className="group block">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Gerenciar Leads
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Visualizar e editar leads do funil
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/configuracoes-admin" className="group block">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Configurações
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Gerenciar planos e tipos de negócio
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/relatorios" className="group block">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Relatórios
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Análises e métricas detalhadas
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}