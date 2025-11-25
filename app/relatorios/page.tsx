'use client'

// Forcar renderizacao dinamica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/shared/AuthWrapper'
import { funisApi, leadsApi } from '../../lib/api-client'

// Componentes shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { VisualFunnel } from '@/components/charts/visual-funnel'



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

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#EC4899', '#06B6D4', '#84CC16']

interface Funil {
  id: string
  nome: string
  cor: string
  ordem: number
  ativo: boolean
  estagios?: Estagio[]
}

interface Estagio {
  id: string
  funil_id: string
  nome: string
  cor: string
  ordem: number
  ativo: boolean
}

export default function RelatoriosPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [campanhas, setCampanhas] = useState<string[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [funis, setFunis] = useState<Funil[]>([])

  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({
    title: 'Relatórios',
    subtitle: 'Análises e métricas',
    metrics: {
      novosLeads: 'Novos Leads',
      qualificados: 'Qualificados',
      emAndamento: 'Em Andamento',
      casosViaveis: 'Casos Viáveis',
      fechados: 'Fechados',
      negociacao: 'Em Negociação',
      leadsPerdidos: 'Leads Perdidos',
      totalGeral: 'Total Geral'
    }
  })

  const [filters, setFilters] = useState({
    campanha: '',
    origem: '',
    dataInicio: '',
    dataFim: '',
    cnpj: '',
    funil_id: '',
    estagio_id: ''
  })
  const [temporalRange, setTemporalRange] = useState('12m')

  useEffect(() => {
    if (user?.id) {

      fetchFunis()
      fetchLeads()
    }
  }, [user])





  const fetchFunis = async () => {
    if (!user) return

    try {
      // Usar API que já filtra por workspace via JWT
      const response = await funisApi.list(true) // true = incluir estágios

      if (response.success && response.data) {
        const funisData = Array.isArray(response.data) ? response.data : [response.data]

        // Filtrar apenas funis ativos e ordenar estágios
        const funisAtivos = funisData
          .filter((funil: any) => funil.ativo)
          .map((funil: any) => ({
            ...funil,
            estagios: (funil.estagios || [])
              .filter((e: any) => e.ativo)
              .sort((a: any, b: any) => a.ordem - b.ordem)
          }))

        setFunis(funisAtivos as Funil[])
      }
    } catch (error) {
      console.error('Erro ao buscar funis:', error)
    }
  }

  const fetchLeads = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      const response = await leadsApi.list({ limit: '1000' })

      if (response.success && response.data) {
        const leadsData = response.data as Lead[]
        setLeads(leadsData)

        // Extrair campanhas e origens únicas
        const uniqueCampanhas = [...new Set(leadsData.map(l => l.nome_campanha).filter(Boolean))]
        const uniqueOrigens = [...new Set(leadsData.map(l => l.origem).filter(Boolean))]

        setCampanhas(uniqueCampanhas as string[])
        setOrigens(uniqueOrigens as string[])
      }
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
      if (filters.cnpj && !lead.cpf_cnpj?.includes(filters.cnpj)) return false
      if (filters.funil_id && lead.funil_id !== filters.funil_id) return false
      if (filters.estagio_id && lead.estagio_id !== filters.estagio_id) return false

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



    // Análise de Funil de Conversão - Usando Funis e Estágios Reais
    const funnelData: any[] = []

    // Se há filtro de funil específico, mostrar seus estágios
    const funilSelecionado = filters.funil_id
      ? funis.find(f => f.id === filters.funil_id)
      : funis[0] // Usar primeiro funil se nenhum filtro

    if (funilSelecionado && funilSelecionado.estagios) {
      funilSelecionado.estagios.forEach((estagio: Estagio, index: number) => {
        // Contar leads neste estágio
        const count = filteredLeads.filter(l => l.estagio_id === estagio.id).length

        // Calcular taxa de conversão para o próximo estágio
        let conversionRate = 0
        if (index > 0) {
          const prevCount = funnelData[index - 1]?.count || 0
          conversionRate = prevCount > 0 ? ((count / prevCount) * 100) : 0
        }

        funnelData.push({
          status: estagio.id,
          label: estagio.nome,
          count,
          conversionRate: conversionRate.toFixed(1),
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
          cor: estagio.cor
        })
      })

      // Adicionar leads sem estágio se houver
      const leadsSemEstagio = filteredLeads.filter(l =>
        l.funil_id === funilSelecionado.id && !l.estagio_id
      ).length

      if (leadsSemEstagio > 0) {
        funnelData.unshift({
          status: 'sem_estagio',
          label: 'Sem Estágio',
          count: leadsSemEstagio,
          conversionRate: '0',
          percentage: total > 0 ? ((leadsSemEstagio / total) * 100).toFixed(1) : '0',
          cor: '#9CA3AF'
        })
      }
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
      temporal: monthlyComparison,
      funnel: funnelData
    }
  }

  const exportToCSV = () => {
    const filteredLeads = getFilteredLeads()

    // Headers base
    const baseHeaders = ['Nome', 'Telefone', 'CPF/CNPJ', 'Status', 'Campanha', 'Origem', 'Valor', 'WhatsApp', 'Data']



    const headers = [...baseHeaders]

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

      return [...baseValues]
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
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <FileBarChart className="h-5 w-5 mr-2 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select
                value={filters.campanha}
                onValueChange={(value) => setFilters(prev => ({ ...prev, campanha: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {campanhas.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={filters.origem}
                onValueChange={(value) => setFilters(prev => ({ ...prev, origem: value === 'all' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {origens.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Funil</Label>
              <Select
                value={filters.funil_id}
                onValueChange={(value) => setFilters(prev => ({ ...prev, funil_id: value === 'all' ? '' : value, estagio_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
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

            <div className="space-y-2">
              <Label>Estágio</Label>
              <Select
                value={filters.estagio_id}
                onValueChange={(value) => setFilters(prev => ({ ...prev, estagio_id: value === 'all' ? '' : value }))}
                disabled={!filters.funil_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filters.funil_id && funis.find(f => f.id === filters.funil_id)?.estagios?.map((estagio) => (
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

            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                type="text"
                value={filters.cnpj}
                onChange={(e) => setFilters(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="Filtrar por CNPJ"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Inicio</Label>
              <DatePicker
                date={filters.dataInicio ? new Date(filters.dataInicio) : undefined}
                onSelect={(date) => setFilters(prev => ({ ...prev, dataInicio: date ? date.toISOString().split('T')[0] : '' }))}
                placeholder="Selecione"
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <DatePicker
                date={filters.dataFim ? new Date(filters.dataFim) : undefined}
                onSelect={(date) => setFilters(prev => ({ ...prev, dataFim: date ? date.toISOString().split('T')[0] : '' }))}
                placeholder="Selecione"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setFilters({ campanha: '', origem: '', dataInicio: '', dataFim: '', cnpj: '', funil_id: '', estagio_id: '' })}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {'Com WhatsApp'}
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
                {'Valor Total Estimado'}
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
                {'Valor Médio'}
              </p>
              <p className="text-3xl font-bold mt-2">R$ {parseFloat(metrics.valorMedio).toLocaleString('pt-BR')}</p>
            </div>
            <Target className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafico de Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2 text-primary" />
              Leads por Status
            </CardTitle>
            <CardDescription>Distribuição de leads por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusChartData.reduce((acc, item, index) => {
                acc[item.name] = {
                  label: item.name,
                  color: COLORS[index % COLORS.length]
                }
                return acc
              }, {} as ChartConfig)}
              className="mx-auto aspect-square h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grafico de Campanhas - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Performance por Campanha
            </CardTitle>
            <CardDescription>Quantidade de leads por campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                leads: {
                  label: "Leads",
                  color: "hsl(var(--chart-1))"
                }
              }}
              className="h-[300px]"
            >
              <BarChart data={campanhaChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="campanha"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grafico de Origem - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Leads por Origem
            </CardTitle>
            <CardDescription>Distribuição por canal de origem</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Leads",
                  color: "hsl(var(--chart-2))"
                }
              }}
              className="h-[300px]"
            >
              <BarChart data={origemChartData} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Timeline - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Evolução de Leads
            </CardTitle>
            <CardDescription>Tendência de entrada de leads ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                leads: {
                  label: "Leads",
                  color: "hsl(var(--chart-4))"
                }
              }}
              className="h-[300px]"
            >
              <AreaChart data={timelineChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="var(--color-leads)"
                  fill="url(#fillLeads)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Funil de Conversão */}
      {metrics.funnel && metrics.funnel.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <Filter className="h-6 w-6 mr-2 text-indigo-600" />
            Funil de Conversão - {
              filters.funil_id
                ? funis.find(f => f.id === filters.funil_id)?.nome
                : funis[0]?.nome || 'Geral'
            }
          </h2>

          <VisualFunnel stages={metrics.funnel} />
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
            <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${metrics.temporal.leadsGrowth >= 0 ? 'border-green-500' : 'border-red-500'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Crescimento</span>
                {metrics.temporal.leadsGrowth >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className={`text-3xl font-bold mb-1 ${metrics.temporal.leadsGrowth >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                {metrics.temporal.leadsGrowth >= 0 ? '+' : ''}{metrics.temporal.leadsGrowth}%
              </div>
              <div className="text-sm text-gray-500">Variação de leads</div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className={`text-sm font-medium ${metrics.temporal.valueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  Receita: {metrics.temporal.valueGrowth >= 0 ? '+' : ''}{metrics.temporal.valueGrowth}%
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução Temporal - Interativo */}
          <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
              <div className="grid flex-1 gap-1">
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Evolução Temporal
                </CardTitle>
                <CardDescription>
                  Acompanhamento de leads e receita ao longo do tempo
                </CardDescription>
              </div>
              <Select
                value={temporalRange}
                onValueChange={setTemporalRange}
              >
                <SelectTrigger
                  className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                  aria-label="Selecione o período"
                >
                  <SelectValue placeholder="Últimos 12 meses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="12m" className="rounded-lg">
                    Últimos 12 meses
                  </SelectItem>
                  <SelectItem value="6m" className="rounded-lg">
                    Últimos 6 meses
                  </SelectItem>
                  <SelectItem value="3m" className="rounded-lg">
                    Últimos 3 meses
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={{
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--chart-1))"
                  },
                  valor: {
                    label: "Receita (R$)",
                    color: "hsl(var(--chart-2))"
                  }
                }}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart data={(() => {
                  const data = metrics.temporal.monthlyTimeline || []
                  const months = temporalRange === '12m' ? 12 : temporalRange === '6m' ? 6 : 3
                  return data.slice(-months)
                })()}>
                  <defs>
                    <linearGradient id="fillLeadsTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillValorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-valor)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-valor)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => value}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="leads"
                    type="natural"
                    fill="url(#fillLeadsTemp)"
                    stroke="var(--color-leads)"
                    stackId="a"
                  />
                  <Area
                    dataKey="valor"
                    type="natural"
                    fill="url(#fillValorTemp)"
                    stroke="var(--color-valor)"
                    stackId="b"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>

              {/* Resumo Estatístico */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Maior Volume</div>
                    <div className="text-lg font-bold text-primary">
                      {Math.max(...(metrics.temporal.monthlyTimeline || []).map((m: any) => m.leads || 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">leads/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Menor Volume</div>
                    <div className="text-lg font-bold text-primary">
                      {Math.min(...(metrics.temporal.monthlyTimeline || [{ leads: 0 }]).map((m: any) => m.leads || 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">leads/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Média Mensal</div>
                    <div className="text-lg font-bold text-primary">
                      {((metrics.temporal.monthlyTimeline || []).reduce((sum: number, m: any) => sum + (m.leads || 0), 0) / Math.max((metrics.temporal.monthlyTimeline || []).length, 1)).toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">leads/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Receita Total</div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {(metrics.temporal.monthlyTimeline || []).reduce((sum: number, m: any) => sum + (m.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground">período selecionado</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
