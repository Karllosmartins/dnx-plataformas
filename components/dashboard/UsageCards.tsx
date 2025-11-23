'use client'

import { useState, useEffect } from 'react'
import { workspacesApi } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Search,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'

interface UsageData {
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
  leads_consumidos: number
  consultas_realizadas: number
  instancias_ativas: number
  plano_nome: string
}

export function UsageCards() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [])

  async function loadUsage() {
    try {
      // Buscar workspace atual via API
      const response = await workspacesApi.list()

      if (response.success && response.data) {
        const workspaces = Array.isArray(response.data) ? response.data : [response.data]

        if (workspaces.length > 0) {
          const workspace = workspaces[0] as {
            limite_leads?: number
            limite_consultas?: number
            limite_instancias?: number
            leads_consumidos?: number
            consultas_realizadas?: number
            instancias_ativas?: number
            plano_nome?: string
          }

          setUsage({
            limite_leads: workspace.limite_leads || 1000,
            limite_consultas: workspace.limite_consultas || 500,
            limite_instancias: workspace.limite_instancias || 3,
            leads_consumidos: workspace.leads_consumidos || 0,
            consultas_realizadas: workspace.consultas_realizadas || 0,
            instancias_ativas: workspace.instancias_ativas || 0,
            plano_nome: workspace.plano_nome || 'Básico',
          })
          return
        }
      }

      // Fallback se não encontrar workspace
      setUsage({
        limite_leads: 1000,
        limite_consultas: 500,
        limite_instancias: 3,
        leads_consumidos: 0,
        consultas_realizadas: 0,
        instancias_ativas: 0,
        plano_nome: 'Básico',
      })
    } catch (error) {
      console.error('Erro ao carregar uso:', error)
      // Fallback em caso de erro
      setUsage({
        limite_leads: 1000,
        limite_consultas: 500,
        limite_instancias: 3,
        leads_consumidos: 0,
        consultas_realizadas: 0,
        instancias_ativas: 0,
        plano_nome: 'Básico',
      })
    } finally {
      setLoading(false)
    }
  }

  function getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-amber-500'
    return 'text-primary'
  }

  function getBadgeVariant(percentage: number): 'default' | 'destructive' | 'secondary' {
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'secondary'
    return 'default'
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const usageItems = [
    {
      icon: Users,
      label: 'Leads',
      current: usage.leads_consumidos,
      limit: usage.limite_leads,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Search,
      label: 'Consultas API',
      current: usage.consultas_realizadas,
      limit: usage.limite_consultas,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: MessageSquare,
      label: 'WhatsApp',
      current: usage.instancias_ativas,
      limit: usage.limite_instancias,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  return (
    <Card className="col-span-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Uso do Workspace</h3>
              <p className="text-sm text-muted-foreground">
                Plano {usage.plano_nome}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Upgrade
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {usageItems.map((item) => {
            const percentage = Math.min((item.current / item.limit) * 100, 100)

            return (
              <div key={item.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${item.bgColor}`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge variant={getBadgeVariant(percentage)} className="text-xs">
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={getProgressColor(percentage)}>
                      {item.current.toLocaleString('pt-BR')} usados
                    </span>
                    <span>de {item.limit.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
