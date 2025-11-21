'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/shared/AuthWrapper'

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
  FileCheck,
  Filter,
  ArrowDownRight,
  CalendarRange,
  ArrowUpRight
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
      // Buscar tipo de negócio do usuário através da tabela intermediária
      const { data: userTypesData, error: typesError } = await supabase
        .from('user_tipos_negocio')
        .select(`
          tipos_negocio (
            id, nome, nome_exibicao, cor,
            campos_personalizados, status_personalizados, metricas_config
          )
        `)
        .eq('user_id', parseInt(user.id || '0'))
        .eq('ativo', true)

      if (typesError) throw typesError

      if (userTypesData && userTypesData.length > 0) {
        const tipoData = userTypesData[0].tipos_negocio as any

        if (tipoData) {
          // Parsear metricas_config se vier como string
          if (typeof tipoData.metricas_config === 'string') {
            try {
              tipoData.metricas_config = JSON.parse(tipoData.metricas_config)
            } catch (e) {
              console.error('Erro ao parsear metricas_config:', e)
            }
          }

          // Parsear campos_personalizados se vier como string
          if (typeof tipoData.campos_personalizados === 'string') {
            try {
              tipoData.campos_personalizados = JSON.parse(tipoData.campos_personalizados)
            } catch (e) {
              console.error('Erro ao parsear campos_personalizados:', e)
            }
          }

          // Parsear status_personalizados se vier como string
          if (typeof tipoData.status_personalizados === 'string') {
            try {
              tipoData.status_personalizados = JSON.parse(tipoData.status_personalizados)
            } catch (e) {
              console.error('Erro ao parsear status_personalizados:', e)
            }
          }

          setUserTipoNegocio(tipoData)
          configureDashboard(tipoData)
        }
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

    // Análise de campos personalizados
    const customFieldsData: Record<string, Record<string, number>> = {}

    if (userTipoNegocio?.campos_personalizados && Array.isArray(userTipoNegocio.campos_personalizados)) {
      userTipoNegocio.campos_personalizados.forEach((campo: any) => {
        const fieldName = campo.nome || campo.name
        if (fieldName) {
          customFieldsData[fieldName] = {}

          filteredLeads.forEach(lead => {
            if (lead.dados_personalizados) {
              try {
                const dados = typeof lead.dados_personalizados === 'string'
                  ? JSON.parse(lead.dados_personalizados)
                  : lead.dados_personalizados

                const valor = dados[fieldName]
                if (valor) {
                  const valorStr = String(valor)
                  customFieldsData[fieldName][valorStr] = (customFieldsData[fieldName][valorStr] || 0) + 1
                }
              } catch (e) {
                // Ignora erros de parsing
              }
            }
          })
        }
      })
    }

    // Análise de Funil de Conversão Dinâmico
    const funnelData: any[] = []

    if (userTipoNegocio?.status_personalizados && Array.isArray(userTipoNegocio.status_personalizados)) {
      userTipoNegocio.status_personalizados.forEach((status: string, index: number) => {
        const count = filteredLeads.filter(l => l.status_generico === status).length
        const label = dashboardConfig?.statusLabels?.[status] ||
                      status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        // Calcular taxa de conversão para o próximo estágio
        let conversionRate = 0
        if (index > 0) {
          const prevCount = funnelData[index - 1]?.count || 0
          conversionRate = prevCount > 0 ? ((count / prevCount) * 100) : 0
        }

        funnelData.push({
          status,
          label,
          count,
          conversionRate: conversionRate.toFixed(1),
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
        })
      })
    }

    // Métricas Principais Dinâmicas (baseadas em metricas_config)
    const metricasPrincipais: any[] = []

    if (userTipoNegocio?.metricas_config?.metricas_principais && Array.isArray(userTipoNegocio.metricas_config.metricas_principais)) {
      userTipoNegocio.metricas_config.metricas_principais.forEach((metricaConfig: any) => {
        let valor: any = null

        switch (metricaConfig.tipo) {
          case 'media':
            // Calcular média de um campo específico
            if (metricaConfig.campo) {
              const leadsComCampo = filteredLeads.filter(l => {
                // Verificar se é campo padrão ou personalizado
                if (l[metricaConfig.campo as keyof Lead]) {
                  return l[metricaConfig.campo as keyof Lead]
                }
                // Verificar em dados_personalizados
                if (l.dados_personalizados) {
                  try {
                    const dados = typeof l.dados_personalizados === 'string'
                      ? JSON.parse(l.dados_personalizados)
                      : l.dados_personalizados
                    return dados[metricaConfig.campo]
                  } catch (e) {
                    return false
                  }
                }
                return false
              })

              if (leadsComCampo.length > 0) {
                const soma = leadsComCampo.reduce((sum, l) => {
                  let val = l[metricaConfig.campo as keyof Lead]
                  if (!val && l.dados_personalizados) {
                    try {
                      const dados = typeof l.dados_personalizados === 'string'
                        ? JSON.parse(l.dados_personalizados)
                        : l.dados_personalizados
                      val = dados[metricaConfig.campo]
                    } catch (e) {}
                  }
                  return sum + (parseFloat(val as string) || 0)
                }, 0)
                valor = (soma / leadsComCampo.length).toFixed(2)
              } else {
                valor = '0.00'
              }
            }
            break

          case 'percentual':
            // Calcular percentual entre dois conjuntos de status
            if (metricaConfig.numerador_status && metricaConfig.denominador_status) {
              const numerador = filteredLeads.filter(l =>
                metricaConfig.numerador_status.includes(l.status_generico)
              ).length
              const denominador = filteredLeads.filter(l =>
                metricaConfig.denominador_status.includes(l.status_generico)
              ).length
              valor = denominador > 0 ? ((numerador / denominador) * 100).toFixed(1) : '0.0'
            }
            break

          case 'tempo_entre_status':
            // Calcular tempo médio entre dois status
            if (metricaConfig.status_inicial && metricaConfig.status_final) {
              const leadsCompletos = filteredLeads.filter(l =>
                l.status_generico === metricaConfig.status_final
              )

              if (leadsCompletos.length > 0) {
                const tempos = leadsCompletos
                  .filter(l => l.created_at && l.updated_at)
                  .map(l => {
                    const dataInicio = new Date(l.created_at!)
                    const dataFim = new Date(l.updated_at!)
                    return (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24) // dias
                  })

                if (tempos.length > 0) {
                  const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length
                  valor = tempoMedio.toFixed(1)
                } else {
                  valor = '0.0'
                }
              } else {
                valor = '0.0'
              }
            }
            break

          case 'distribuicao':
            // Para distribuição, vamos calcular o total e criar dados do gráfico
            if (metricaConfig.campo) {
              const distribuicao: Record<string, number> = {}
              filteredLeads.forEach(l => {
                let val = l[metricaConfig.campo as keyof Lead]
                if (!val && l.dados_personalizados) {
                  try {
                    const dados = typeof l.dados_personalizados === 'string'
                      ? JSON.parse(l.dados_personalizados)
                      : l.dados_personalizados
                    val = dados[metricaConfig.campo]
                  } catch (e) {}
                }
                if (val) {
                  const valStr = String(val)
                  distribuicao[valStr] = (distribuicao[valStr] || 0) + 1
                }
              })
              valor = distribuicao
            }
            break

          default:
            valor = null
        }

        if (valor !== null) {
          metricasPrincipais.push({
            nome: metricaConfig.nome,
            label: metricaConfig.label,
            tipo: metricaConfig.tipo,
            valor: valor,
            campo: metricaConfig.campo
          })
        }
      })
    }

    // Análise Temporal (mês a mês)
    const monthlyData: Record<string, any> = {}
    const now = new Date()
    const last12Months: string[] = []

    // Gerar array com os últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      last12Months.push(monthKey)

      monthlyData[monthKey] = {
        monthKey,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        leads: 0,
        valor: 0,
        comWhatsApp: 0
      }
    }

    // Agrupar leads por mês
    filteredLeads.forEach(lead => {
      if (lead.created_at) {
        const date = new Date(lead.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].leads += 1
          monthlyData[monthKey].valor += lead.valor_contrato || 0
          if (lead.existe_whatsapp) {
            monthlyData[monthKey].comWhatsApp += 1
          }
        }
      }
    })

    // Calcular métricas comparativas (mês atual vs mês anterior)
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthKey = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

    const currentMonth = monthlyData[currentMonthKey] || { leads: 0, valor: 0 }
    const lastMonth = monthlyData[lastMonthKey] || { leads: 0, valor: 0 }

    const leadsGrowth = lastMonth.leads > 0
      ? (((currentMonth.leads - lastMonth.leads) / lastMonth.leads) * 100).toFixed(1)
      : '0'

    const valueGrowth = lastMonth.valor > 0
      ? (((currentMonth.valor - lastMonth.valor) / lastMonth.valor) * 100).toFixed(1)
      : '0'

    const monthlyComparison = {
      currentMonth: currentMonth,
      lastMonth: lastMonth,
      leadsGrowth: parseFloat(leadsGrowth),
      valueGrowth: parseFloat(valueGrowth),
      monthlyTimeline: last12Months.map(key => monthlyData[key])
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
      customFields: customFieldsData,
      funnel: funnelData,
      temporal: monthlyComparison,
      metricasPrincipais: metricasPrincipais
    }
  }

  const exportToCSV = () => {
    const filteredLeads = getFilteredLeads()

    // Headers base
    const baseHeaders = ['Nome', 'Telefone', 'CPF/CNPJ', 'Status', 'Campanha', 'Origem', 'Valor', 'WhatsApp', 'Data']

    // Adicionar headers de campos personalizados
    const customFieldHeaders: string[] = []
    const customFieldNames: string[] = []

    if (userTipoNegocio?.campos_personalizados && Array.isArray(userTipoNegocio.campos_personalizados)) {
      userTipoNegocio.campos_personalizados.forEach((campo: any) => {
        const fieldName = campo.nome || campo.name
        if (fieldName) {
          customFieldNames.push(fieldName)
          // Formatar nome do campo para o header
          const formattedName = fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase())
          customFieldHeaders.push(formattedName)
        }
      })
    }

    const headers = [...baseHeaders, ...customFieldHeaders]

    const rows = filteredLeads.map(lead => {
      // Valores base
      const baseValues = [
        lead.nome_cliente || '',
        lead.telefone || '',
        lead.cpf || lead.cpf_cnpj || '',
        lead.status_generico || '',
        lead.nome_campanha || '',
        lead.origem || '',
        lead.valor_contrato || '0',
        lead.existe_whatsapp ? 'Sim' : 'Não',
        lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : ''
      ]

      // Extrair valores de campos personalizados
      const customValues: string[] = []
      if (customFieldNames.length > 0 && lead.dados_personalizados) {
        try {
          const dados = typeof lead.dados_personalizados === 'string'
            ? JSON.parse(lead.dados_personalizados)
            : lead.dados_personalizados

          customFieldNames.forEach(fieldName => {
            const valor = dados[fieldName]
            customValues.push(valor ? String(valor) : '')
          })
        } catch (e) {
          // Se houver erro no parsing, preencher com vazios
          customFieldNames.forEach(() => customValues.push(''))
        }
      } else {
        // Se não houver dados_personalizados, preencher com vazios
        customFieldNames.forEach(() => customValues.push(''))
      }

      return [...baseValues, ...customValues]
    })

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

      {/* Métricas Principais Dinâmicas */}
      {metrics.metricasPrincipais && metrics.metricasPrincipais.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-2 text-yellow-500" />
            Métricas Principais - {userTipoNegocio?.nome_exibicao}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {metrics.metricasPrincipais.map((metrica: any, index: number) => {
              // Cores para os cards - usando valores RGB diretos
              const colors = [
                { gradient: 'linear-gradient(to bottom right, #06b6d4, #0891b2)' }, // cyan
                { gradient: 'linear-gradient(to bottom right, #10b981, #059669)' }, // emerald
                { gradient: 'linear-gradient(to bottom right, #8b5cf6, #7c3aed)' }, // violet
                { gradient: 'linear-gradient(to bottom right, #f43f5e, #e11d48)' }, // rose
                { gradient: 'linear-gradient(to bottom right, #f59e0b, #d97706)' }, // amber
                { gradient: 'linear-gradient(to bottom right, #6366f1, #4f46e5)' }, // indigo
                { gradient: 'linear-gradient(to bottom right, #ec4899, #db2777)' }, // pink
                { gradient: 'linear-gradient(to bottom right, #14b8a6, #0d9488)' }, // teal
              ]
              const color = colors[index % colors.length]

              // Ícones baseados no tipo
              const IconComponent =
                metrica.tipo === 'media' ? DollarSign :
                metrica.tipo === 'percentual' ? Percent :
                metrica.tipo === 'tempo_entre_status' ? Clock :
                metrica.tipo === 'distribuicao' ? BarChart3 :
                Activity

              // Formatar valor de forma segura
              let valorFormatado: string | number = '-'

              if (metrica.tipo === 'media') {
                if (typeof metrica.valor === 'number') {
                  valorFormatado = `R$ ${metrica.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                } else if (typeof metrica.valor === 'string') {
                  const num = parseFloat(metrica.valor)
                  if (!isNaN(num)) {
                    valorFormatado = `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                }
              } else if (metrica.tipo === 'percentual') {
                if (typeof metrica.valor === 'number' || typeof metrica.valor === 'string') {
                  valorFormatado = `${metrica.valor}%`
                }
              } else if (metrica.tipo === 'tempo_entre_status') {
                if (typeof metrica.valor === 'number' || typeof metrica.valor === 'string') {
                  valorFormatado = `${metrica.valor} dias`
                }
              } else if (metrica.tipo === 'distribuicao') {
                if (typeof metrica.valor === 'object' && metrica.valor !== null) {
                  // Para distribuição, mostrar o item mais comum
                  const entries = Object.entries(metrica.valor)
                  if (entries.length > 0) {
                    const [topItem, topCount] = entries.reduce((a, b) =>
                      ((b[1] as number) > (a[1] as number)) ? b : a
                    )
                    valorFormatado = `${topItem}: ${topCount}`
                  } else {
                    valorFormatado = 'Sem dados'
                  }
                } else if (typeof metrica.valor === 'string' || typeof metrica.valor === 'number') {
                  valorFormatado = String(metrica.valor)
                }
              } else {
                // Fallback: converter qualquer valor para string
                if (typeof metrica.valor === 'object' && metrica.valor !== null) {
                  valorFormatado = 'N/A'
                } else {
                  valorFormatado = String(metrica.valor || '-')
                }
              }

              return (
                <div
                  key={metrica.nome}
                  className="rounded-lg shadow-lg p-6"
                  style={{ background: color.gradient }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {metrica.label}
                      </p>
                      <p className="text-2xl font-bold mt-2" style={{ color: '#ffffff' }}>
                        {valorFormatado}
                      </p>
                    </div>
                    <IconComponent className="h-10 w-10" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </div>
                </div>
              )
            })}
          </div>
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

      {/* Gráficos de Campos Personalizados */}
      {metrics.customFields && Object.keys(metrics.customFields).length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-purple-600" />
            Análise de Campos Personalizados
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(metrics.customFields).map(([fieldName, fieldData]) => {
              // Só renderizar se houver dados
              if (Object.keys(fieldData).length === 0) return null

              const chartData = Object.entries(fieldData)
                .map(([value, count]) => ({
                  name: value,
                  value: count as number
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10) // Máximo de 10 itens para não poluir o gráfico

              // Formatando o nome do campo
              const formattedFieldName = fieldName
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())

              return (
                <div key={fieldName} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    {formattedFieldName}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" name={formattedFieldName}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Resumo */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de variações:</span>
                      <span className="font-semibold text-gray-900">{Object.keys(fieldData).length}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Mais comum:</span>
                      <span className="font-semibold text-purple-600">
                        {chartData[0]?.name} ({chartData[0]?.value} leads)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Análise de Funil de Conversão */}
      {metrics.funnel && metrics.funnel.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Filter className="h-6 w-6 mr-2 text-indigo-600" />
            Funil de Conversão - {dashboardConfig?.title?.replace('Relatórios - ', '') || ''}
          </h2>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              {metrics.funnel.map((stage: any, index: number) => {
                const maxCount = metrics.funnel[0]?.count || 1
                const widthPercentage = (stage.count / maxCount) * 100

                // Cores gradientes para cada estágio do funil
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-cyan-500 to-cyan-600',
                  'from-teal-500 to-teal-600',
                  'from-green-500 to-green-600',
                  'from-emerald-500 to-emerald-600',
                  'from-lime-500 to-lime-600',
                ]

                return (
                  <div key={stage.status} className="relative">
                    {/* Barra do funil */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700 flex items-center">
                          {index > 0 && <ArrowDownRight className="h-4 w-4 mr-1 text-gray-400" />}
                          {stage.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {stage.count} leads ({stage.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-10 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full flex items-center justify-between px-4 text-white font-medium text-sm transition-all duration-500`}
                          style={{ width: `${Math.max(widthPercentage, 10)}%` }}
                        >
                          <span>{stage.count}</span>
                          {index > 0 && (
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                              {stage.conversionRate}% conversão
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Linha de conexão entre estágios */}
                    {index < metrics.funnel.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <div className="h-6 w-0.5 bg-gray-300"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Resumo do Funil */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium">Topo do Funil</span>
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-2">
                    {metrics.funnel[0]?.count || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">{metrics.funnel[0]?.label}</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-600 font-medium">Fundo do Funil</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-900 mt-2">
                    {metrics.funnel[metrics.funnel.length - 1]?.count || 0}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {metrics.funnel[metrics.funnel.length - 1]?.label}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-600 font-medium">Taxa Global</span>
                    <Percent className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mt-2">
                    {metrics.funnel[0]?.count > 0
                      ? ((metrics.funnel[metrics.funnel.length - 1]?.count / metrics.funnel[0]?.count) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Conversão Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Análise Temporal - Comparativo Mês a Mês */}
      {metrics.temporal && metrics.temporal.monthlyTimeline && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CalendarRange className="h-6 w-6 mr-2 text-orange-600" />
            Comparativo Temporal - Últimos 12 Meses
          </h2>

          {/* Cards de Comparação Mês Atual vs Anterior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Mês Atual */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Mês Atual</span>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {metrics.temporal.currentMonth.leads}
              </div>
              <div className="text-sm text-gray-500">
                {dashboardConfig?.title?.replace('Relatórios - ', '') || 'Leads'}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Receita: R$ {metrics.temporal.currentMonth.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Mês Anterior */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-400">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Mês Anterior</span>
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-3xl font-bold text-gray-700 mb-1">
                {metrics.temporal.lastMonth.leads}
              </div>
              <div className="text-sm text-gray-500">
                {dashboardConfig?.title?.replace('Relatórios - ', '') || 'Leads'}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Receita: R$ {metrics.temporal.lastMonth.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Crescimento */}
            <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
              metrics.temporal.leadsGrowth >= 0 ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Crescimento</span>
                {metrics.temporal.leadsGrowth >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className={`text-3xl font-bold mb-1 ${
                metrics.temporal.leadsGrowth >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {metrics.temporal.leadsGrowth >= 0 ? '+' : ''}{metrics.temporal.leadsGrowth}%
              </div>
              <div className="text-sm text-gray-500">Variação de leads</div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className={`text-sm font-medium ${
                  metrics.temporal.valueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Receita: {metrics.temporal.valueGrowth >= 0 ? '+' : ''}{metrics.temporal.valueGrowth}%
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução Temporal */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Evolução nos Últimos 12 Meses
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={metrics.temporal.monthlyTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Receita (R$)') {
                      return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                    return value
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Leads"
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="valor"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Receita (R$)"
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Resumo Estatístico */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Maior Volume</div>
                  <div className="text-lg font-bold text-blue-900">
                    {Math.max(...metrics.temporal.monthlyTimeline.map((m: any) => m.leads))}
                  </div>
                  <div className="text-xs text-gray-500">leads/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Menor Volume</div>
                  <div className="text-lg font-bold text-blue-900">
                    {Math.min(...metrics.temporal.monthlyTimeline.map((m: any) => m.leads))}
                  </div>
                  <div className="text-xs text-gray-500">leads/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Média Mensal</div>
                  <div className="text-lg font-bold text-blue-900">
                    {(metrics.temporal.monthlyTimeline.reduce((sum: number, m: any) => sum + m.leads, 0) / 12).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">leads/mês</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Total 12 Meses</div>
                  <div className="text-lg font-bold text-green-900">
                    R$ {metrics.temporal.monthlyTimeline.reduce((sum: number, m: any) => sum + m.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">receita total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
