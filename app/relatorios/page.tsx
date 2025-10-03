'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/AuthWrapper'
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
  Clock
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
      fetchLeads()
    }
  }, [user])

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
    const valorTotal = filteredLeads.reduce((sum, l) => sum + (parseFloat(l.valor_negociacao || '0')), 0)

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
      campanhaValores[campanha] = (campanhaValores[campanha] || 0) + parseFloat(lead.valor_negociacao || '0')
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
      const date = new Date(lead.created_at).toLocaleDateString('pt-BR')
      timeline[date] = (timeline[date] || 0) + 1
    })

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
      timeline
    }
  }

  const exportToCSV = () => {
    const filteredLeads = getFilteredLeads()

    const headers = ['Nome', 'Telefone', 'CPF/CNPJ', 'Status', 'Campanha', 'Origem', 'Valor', 'WhatsApp', 'Data']
    const rows = filteredLeads.map(lead => [
      lead.nome_lead,
      lead.telefone,
      lead.cpf || lead.cnpj,
      lead.status_generico,
      lead.nome_campanha || '',
      lead.origem || '',
      lead.valor_negociacao || '0',
      lead.existe_whatsapp ? 'Sim' : 'Não',
      new Date(lead.created_at).toLocaleDateString('pt-BR')
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
    name: status.replace(/_/g, ' ').toUpperCase(),
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
            Relatórios e Análises
          </h1>
          <p className="mt-2 text-gray-600">
            Dashboard completo com métricas e análises dos seus leads
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

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <p className="text-blue-100 text-sm font-medium">Total de Leads</p>
              <p className="text-3xl font-bold mt-2">{metrics.total}</p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Com WhatsApp</p>
              <p className="text-3xl font-bold mt-2">{metrics.comWhatsApp}</p>
              <p className="text-green-100 text-xs mt-1">{metrics.taxaWhatsApp}% do total</p>
            </div>
            <Percent className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Valor Total</p>
              <p className="text-3xl font-bold mt-2">R$ {metrics.valorTotal.toLocaleString('pt-BR')}</p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Valor Médio</p>
              <p className="text-3xl font-bold mt-2">R$ {parseFloat(metrics.valorMedio).toLocaleString('pt-BR')}</p>
            </div>
            <Target className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

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
