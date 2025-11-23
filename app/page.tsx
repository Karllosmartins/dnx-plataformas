'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../components/shared/AuthWrapper'
import { funisApi, leadsApi } from '../lib/api-client'
import MetricCard from '../components/features/leads/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User,
  XCircle,
  Target,
  Loader2,
  Layers
} from 'lucide-react'

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
  leads_count?: number
}

interface Lead {
  id: string
  nome_cliente: string
  telefone: string
  status_generico?: string
  funil_id?: string
  estagio_id?: string
  created_at: string
}

interface DashboardMetrics {
  totalLeads: number
  totalFunis: number
  leadsNovos: number
  leadsEmAndamento: number
  leadsConvertidos: number
  leadsPerdidos: number
}

export default function HomePage() {
  const { user } = useAuth()
  const [funis, setFunis] = useState<Funil[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [selectedFunil, setSelectedFunil] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    totalFunis: 0,
    leadsNovos: 0,
    leadsEmAndamento: 0,
    leadsConvertidos: 0,
    leadsPerdidos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  useEffect(() => {
    filterLeadsByDate()
  }, [leads, startDate, endDate])

  useEffect(() => {
    calculateMetrics()
  }, [filteredLeads, funis])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Carregar funis com estágios
      const funisResponse = await funisApi.list(true)

      if (funisResponse.success && funisResponse.data) {
        const funisData = Array.isArray(funisResponse.data)
          ? funisResponse.data
          : [funisResponse.data]

        setFunis(funisData as Funil[])

        // Selecionar primeiro funil por padrão
        if (funisData.length > 0) {
          setSelectedFunil(funisData[0].id)
        }
      }

      // Carregar todos os leads
      const leadsResponse = await leadsApi.list({ limit: '1000' })

      if (leadsResponse.success && leadsResponse.data) {
        const leadsData = Array.isArray(leadsResponse.data)
          ? leadsResponse.data
          : []

        setLeads(leadsData as Lead[])
        setFilteredLeads(leadsData as Lead[])
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeadsByDate = () => {
    if (!startDate && !endDate) {
      setFilteredLeads(leads)
      return
    }

    const filtered = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)

      if (startDate && endDate) {
        return leadDate >= startDate && leadDate <= endDate
      } else if (startDate) {
        return leadDate >= startDate
      } else if (endDate) {
        return leadDate <= endDate
      }

      return true
    })

    setFilteredLeads(filtered)
  }

  const calculateMetrics = () => {
    const totalLeads = filteredLeads.length
    const totalFunis = funis.length

    // Contar leads por status genérico
    const leadsNovos = filteredLeads.filter(l =>
      l.status_generico === 'novo_lead' || !l.status_generico
    ).length

    const leadsEmAndamento = filteredLeads.filter(l =>
      l.status_generico &&
      !['novo_lead', 'cliente_fechado', 'desqualificado'].includes(l.status_generico)
    ).length

    const leadsConvertidos = filteredLeads.filter(l =>
      l.status_generico === 'cliente_fechado'
    ).length

    const leadsPerdidos = filteredLeads.filter(l =>
      l.status_generico === 'desqualificado'
    ).length

    setMetrics({
      totalLeads,
      totalFunis,
      leadsNovos,
      leadsEmAndamento,
      leadsConvertidos,
      leadsPerdidos
    })
  }

  const getLeadsByFunil = (funilId: string) => {
    return filteredLeads.filter(l => l.funil_id === funilId)
  }

  const getLeadsByEstagio = (estagioId: string) => {
    return filteredLeads.filter(l => l.estagio_id === estagioId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard - Gestão de Funis
        </h1>
        <p className="text-gray-600">
          Bem-vindo(a), {user?.name}! Aqui está uma visão geral do seu pipeline de vendas.
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="funil-filter">Funil</Label>
              <select
                id="funil-filter"
                className="w-full mt-1 p-2 border rounded"
                value={selectedFunil || ''}
                onChange={(e) => setSelectedFunil(e.target.value || null)}
              >
                <option value="">Todos os funis</option>
                {funis.map(funil => (
                  <option key={funil.id} value={funil.id}>
                    {funil.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Data Início</Label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>Data Fim</Label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate(undefined)
                  setEndDate(undefined)
                  setSelectedFunil(null)
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          trend={null}
          color="blue"
        />

        <MetricCard
          title="Funis Ativos"
          value={metrics.totalFunis}
          icon={<Layers className="h-6 w-6 text-purple-600" />}
          trend={null}
          color="purple"
        />

        <MetricCard
          title="Novos Leads"
          value={metrics.leadsNovos}
          icon={<Target className="h-6 w-6 text-green-600" />}
          trend={null}
          color="green"
        />

        <MetricCard
          title="Em Andamento"
          value={metrics.leadsEmAndamento}
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
          trend={null}
          color="yellow"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetricCard
          title="Leads Convertidos"
          value={metrics.leadsConvertidos}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend={null}
          color="green"
        />

        <MetricCard
          title="Leads Perdidos"
          value={metrics.leadsPerdidos}
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          trend={null}
          color="red"
        />
      </div>

      {/* Visão por Funis */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Distribuição por Funis</CardTitle>
        </CardHeader>
        <CardContent>
          {funis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layers className="mx-auto h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhum funil cadastrado</p>
              <p className="mb-4">Crie seu primeiro funil para começar a organizar seus leads</p>
              <Link href="/funis">
                <Button>Criar Funil</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {funis
                .filter(f => !selectedFunil || f.id === selectedFunil)
                .map(funil => {
                  const funilLeads = getLeadsByFunil(funil.id)

                  return (
                    <div key={funil.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: funil.cor || '#3b82f6' }}
                          />
                          <h3 className="text-lg font-semibold">{funil.nome}</h3>
                          <Badge variant="outline">{funilLeads.length} leads</Badge>
                        </div>
                        <Link href={`/leads?funilId=${funil.id}`}>
                          <Button variant="ghost" size="sm">Ver todos</Button>
                        </Link>
                      </div>

                      {/* Estágios do funil */}
                      {funil.estagios && funil.estagios.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {funil.estagios.map(estagio => {
                            const estagioLeads = getLeadsByEstagio(estagio.id)

                            return (
                              <div
                                key={estagio.id}
                                className="border rounded-lg p-3 bg-white"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: estagio.cor || '#gray' }}
                                  />
                                  <span className="text-sm font-medium">{estagio.nome}</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {estagioLeads.length}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">leads</p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum estágio configurado para este funil</p>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/leads" className="block">
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Ver Todos os Leads
              </Button>
            </Link>

            <Link href="/leads?novo=true" className="block">
              <Button className="w-full" variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Adicionar Novo Lead
              </Button>
            </Link>

            <Link href="/configuracoes" className="block">
              <Button className="w-full" variant="outline">
                <Layers className="mr-2 h-4 w-4" />
                Gerenciar Funis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
