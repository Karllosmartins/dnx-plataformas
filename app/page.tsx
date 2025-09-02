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
  XCircle
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

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      
      setLeads(data || [])
      calculateMetrics(data || [])
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (leadsData: Lead[]) => {
    // Debug: ver todos os status existentes
    const allStatus = [...new Set(leadsData.map(l => l.status_limpa_nome))]
    console.log('Status encontrados no banco:', allStatus)
    
    const totalLeads = leadsData.length
    const novosLeads = leadsData.filter(l => l.status_limpa_nome === 'novo_lead').length
    const qualificados = leadsData.filter(l => l.status_limpa_nome === 'qualificacao').length
    const pagamentosRealizados = leadsData.filter(l => l.status_limpa_nome === 'pagamento_consulta').length
    const dividasEncontradas = leadsData.filter(l => l.status_limpa_nome === 'consta_divida').length
    const clientesFechados = leadsData.filter(l => l.status_limpa_nome === 'cliente_fechado').length
    const leadsPerdidos = leadsData.filter(l => 
      l.status_limpa_nome === 'lead_perdido' || 
      l.status_limpa_nome === 'descartado' || 
      l.status_limpa_nome === 'desqualificado'
    ).length
    
    const valorTotalConsultas = leadsData.reduce((sum, lead) => {
      return sum + (lead.valor_pago_consulta || 0)
    }, 0)

    const valorTotalContratos = leadsData.reduce((sum, lead) => {
      return sum + (lead.valor_contrato || 0)
    }, 0)

    const taxaConversao = totalLeads > 0 ? (clientesFechados / totalLeads) * 100 : 0

    setMetrics({
      totalLeads,
      novosLeads,
      qualificados,
      pagamentosRealizados,
      dividasEncontradas,
      clientesFechados,
      leadsPerdidos,
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

  const recentLeads = leads.slice(0, 5)

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando dashboard...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Image
          src="/sublogo.png"
          alt="DNX Plataformas"
          width={48}
          height={48}
          className="h-12 w-12"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DNX Plataformas - CRM Limpa Nome</h1>
          <p className="text-gray-600 mt-2">
            Dashboard de recuperação de crédito - Bem-vindo, {user?.name}
          </p>
        </div>
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
          description={`${metrics.clientesFechados} clientes fechados`}
          icon={TrendingUp}
        />
        
        <MetricCard
          title="Consultas Pagas"
          value={formatCurrency(metrics.valorTotalConsultas)}
          description={`${metrics.pagamentosRealizados} pagamentos`}
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
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Funil de Conversão</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.novosLeads}</div>
                <div className="text-xs text-gray-500">Novos Leads</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.qualificados}</div>
                <div className="text-xs text-gray-500">Qualificados</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.pagamentosRealizados}</div>
                <div className="text-xs text-gray-500">Pagou Consulta</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.dividasEncontradas}</div>
                <div className="text-xs text-gray-500">Dívidas Encontradas</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {leads.filter(l => l.status_limpa_nome === 'enviado_para_negociacao').length}
                </div>
                <div className="text-xs text-gray-500">Em Negociação</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.clientesFechados}</div>
                <div className="text-xs text-gray-500">Clientes Fechados</div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.leadsPerdidos}</div>
                <div className="text-xs text-gray-500">Leads Perdidos</div>
              </div>
            </div>
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
                <div key={lead.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.nome_cliente || 'Nome não informado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.origem} • {lead.telefone}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.status_limpa_nome === 'cliente_fechado' 
                        ? 'bg-green-100 text-green-800'
                        : lead.status_limpa_nome === 'consta_divida'
                        ? 'bg-orange-100 text-orange-800'
                        : lead.status_limpa_nome === 'qualificacao'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.status_limpa_nome?.replace('_', ' ') || 'novo lead'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum lead encontrado</p>
                <Link href="/leads" className="text-blue-600 hover:text-blue-800 text-sm">
                  Criar primeiro lead →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
          </div>
          <div className="p-6 space-y-4">
            <Link href="/leads" className="group w-full">
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    Gerenciar Leads
                  </h4>
                  <p className="text-sm text-gray-500">
                    Visualizar e editar leads do funil
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/configuracoes" className="group w-full">
              <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-600">
                    Configurações
                  </h4>
                  <p className="text-sm text-gray-500">
                    Gerenciar usuários e integrações
                  </p>
                </div>
              </div>
            </Link>

            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Relatórios Avançados
                  </h4>
                  <p className="text-sm text-gray-500">
                    Em desenvolvimento
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}