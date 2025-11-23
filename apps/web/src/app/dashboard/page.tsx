'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Target, Loader2, RefreshCw, FolderKanban } from 'lucide-react'
import { leadsApi, LeadStats } from '@/lib/api'

export default function DashboardPage() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await leadsApi.stats()

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error || 'Erro ao carregar estatisticas')
      }
    } catch (err) {
      console.error('Erro ao carregar stats:', err)
      setError('Erro ao carregar estatisticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visao geral do seu CRM</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
          title="Atualizar dados"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Cards de metricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.leads_com_funil || 0} em funis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.leads_mes_atual || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.leads_recentes_30d || 0} nos ultimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funis Ativos</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.funis_total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Funis configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Funil</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.leads_sem_funil || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads nao categorizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuicao por Funis */}
      {stats?.distribuicao_funis && stats.distribuicao_funis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por Funis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.distribuicao_funis.map((funil) => {
                const percentage = stats.total > 0
                  ? Math.round((funil.total / stats.total) * 100)
                  : 0
                return (
                  <div key={funil.funil_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{funil.nome}</span>
                      <span className="text-muted-foreground">
                        {funil.total} leads ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao DNX CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Acesse o menu lateral para navegar pelo sistema. Use a aba CRM para
            visualizar o Kanban de leads ou Funis para configurar seus funis
            personalizados.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
