'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  Users,
  MessageSquare,
  Search,
  Database,
  Zap,
  TrendingUp,
  Calendar,
  Loader2,
  ArrowUpRight,
} from 'lucide-react'

interface UsageData {
  // Limites do workspace
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
  // Consumo atual
  leads_consumidos: number
  consultas_realizadas: number
  instancias_ativas: number
  // Plano
  plano_nome: string
  plano_valor: number
  // Período
  periodo_inicio: string
  periodo_fim: string
}

interface UsageReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsageReportDialog({ open, onOpenChange }: UsageReportDialogProps) {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      loadUsage()
    }
  }, [open])

  async function loadUsage() {
    setLoading(true)
    try {
      // TODO: Implementar contexto de workspace quando disponível
      const workspaceId = 1

      // Buscar dados do workspace com limites
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          planos (
            nome,
            valor
          )
        `)
        .eq('id', workspaceId)
        .single()

      if (!error && workspace) {
        // Contar leads do workspace
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)

        // Contar instâncias WhatsApp ativas
        const { count: instancesCount } = await supabase
          .from('whatsapp_instances')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('status', 'connected')

        setUsage({
          limite_leads: workspace.limite_leads || 1000,
          limite_consultas: workspace.limite_consultas || 500,
          limite_instancias: workspace.limite_instancias || 3,
          leads_consumidos: leadsCount || 0,
          consultas_realizadas: workspace.consultas_realizadas || 0,
          instancias_ativas: instancesCount || 0,
          plano_nome: workspace.planos?.nome || 'Básico',
          plano_valor: workspace.planos?.valor || 0,
          periodo_inicio: new Date().toISOString(),
          periodo_fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        })
      }
    } catch (error) {
      console.error('Erro ao carregar uso:', error)
    } finally {
      setLoading(false)
    }
  }

  function getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-primary'
  }

  function getProgressVariant(percentage: number): 'default' | 'destructive' | 'secondary' {
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'secondary'
    return 'default'
  }

  const usageItems = usage ? [
    {
      icon: Users,
      label: 'Leads',
      current: usage.leads_consumidos,
      limit: usage.limite_leads,
      description: 'Leads cadastrados no período',
    },
    {
      icon: Search,
      label: 'Consultas API',
      current: usage.consultas_realizadas,
      limit: usage.limite_consultas,
      description: 'Consultas de enriquecimento realizadas',
    },
    {
      icon: MessageSquare,
      label: 'Instâncias WhatsApp',
      current: usage.instancias_ativas,
      limit: usage.limite_instancias,
      description: 'Conexões WhatsApp ativas',
    },
  ] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Uso e Limites
          </DialogTitle>
          <DialogDescription>
            Acompanhe o consumo dos recursos do seu workspace.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : usage ? (
          <div className="space-y-6">
            {/* Plano atual */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plano atual</p>
                      <p className="text-xl font-bold">{usage.plano_nome}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      R$ {usage.plano_valor.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Período atual</span>
                  </div>
                  <span className="font-medium">
                    {new Date(usage.periodo_inicio).toLocaleDateString('pt-BR')} - {' '}
                    {new Date(usage.periodo_fim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Uso por recurso */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Consumo de Recursos
              </h3>

              {usageItems.map((item) => {
                const percentage = Math.min((item.current / item.limit) * 100, 100)
                const progressColor = getProgressColor(percentage)

                return (
                  <Card key={item.label}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{item.current.toLocaleString('pt-BR')}</span>
                            <span className="text-muted-foreground">/ {item.limit.toLocaleString('pt-BR')}</span>
                          </div>
                          <Badge variant={getProgressVariant(percentage)} className="mt-1">
                            {percentage.toFixed(0)}% usado
                          </Badge>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress
                          value={percentage}
                          className="h-2"
                        />
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all ${progressColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Ação de upgrade */}
            <Card className="border-dashed">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">Precisa de mais recursos?</p>
                  <p className="text-sm text-muted-foreground">
                    Faça upgrade do seu plano para aumentar os limites
                  </p>
                </div>
                <Button className="gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Fazer Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Não foi possível carregar os dados de uso</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}