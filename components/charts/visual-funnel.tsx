'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FunnelStage {
  status: string
  label: string
  count: number
  percentage: number
  conversionRate?: number
  value?: number
  avgTime?: string
}

interface VisualFunnelProps {
  stages: FunnelStage[]
  title?: string
  className?: string
}

// Cores para cada etapa do funil
const stageColors = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-500' },
  { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-500' },
  { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500' },
  { bg: 'bg-lime-500', light: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-500' },
  { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' },
  { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
]

export function VisualFunnel({ stages, title, className }: VisualFunnelProps) {
  if (!stages || stages.length === 0) return null

  // Normalizar dados para garantir que são números
  const normalizedStages = stages.map(stage => ({
    ...stage,
    count: Number(stage.count) || 0,
    percentage: Number(stage.percentage) || 0,
    conversionRate: stage.conversionRate !== undefined ? Number(stage.conversionRate) : undefined,
    value: stage.value !== undefined ? Number(stage.value) : undefined,
  }))

  const totalValue = normalizedStages.reduce((sum, stage) => sum + (stage.value || 0), 0)
  const totalCount = normalizedStages.reduce((sum, stage) => sum + stage.count, 0)

  // Calcular largura do funil para cada etapa (diminui progressivamente)
  const getFunnelWidth = (index: number) => {
    const baseWidth = 100
    const reduction = (100 - 30) / (normalizedStages.length - 1 || 1) // Reduz até 30% do original
    return Math.max(baseWidth - (reduction * index), 30)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cards de cada etapa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {normalizedStages.map((stage, index) => {
          const colors = stageColors[index % stageColors.length]

          return (
            <Card
              key={stage.status}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg dark:bg-card",
                "border-l-4",
                colors.border
              )}
            >
              <CardContent className="p-4">
                {/* Indicador colorido e nome */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-3 h-3 rounded-full", colors.bg)} />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {stage.label}
                  </span>
                </div>

                {/* Valor monetário */}
                {stage.value !== undefined && (
                  <div className="mb-2">
                    <span className="text-xl font-bold text-foreground">
                      R$ {stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Quantidade */}
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Quantidade:</span>
                  <span className={cn("font-semibold", colors.text)}>
                    {stage.count} leads
                  </span>
                </div>

                {/* Porcentagem */}
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Percentual:</span>
                  <span className={cn("font-semibold", colors.text)}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Taxa de conversão */}
                {stage.conversionRate !== undefined && index > 0 && (
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Conversão:</span>
                    <span className={cn("font-semibold", colors.text)}>
                      {stage.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Tempo médio */}
                {stage.avgTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tempo médio:</span>
                    <span className="font-medium text-foreground">
                      {stage.avgTime}
                    </span>
                  </div>
                )}

                {/* Badge de posição */}
                <div className={cn(
                  "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  colors.bg
                )}>
                  {index + 1}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Visual do Funil com Wave */}
      <div className="bg-card rounded-lg shadow p-6 border dark:border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
          Visualização do Funil
        </h3>

        {/* Funil visual */}
        <div className="relative flex flex-col items-center gap-0">
          {normalizedStages.map((stage, index) => {
            const colors = stageColors[index % stageColors.length]
            const width = getFunnelWidth(index)
            const nextWidth = index < normalizedStages.length - 1 ? getFunnelWidth(index + 1) : width

            return (
              <div key={stage.status} className="relative w-full flex flex-col items-center">
                {/* Barra do funil */}
                <div
                  className={cn(
                    "relative flex items-center justify-center py-3 transition-all duration-300",
                    colors.bg,
                    index === 0 && "rounded-t-lg",
                    index === normalizedStages.length - 1 && "rounded-b-lg"
                  )}
                  style={{
                    width: `${width}%`,
                    clipPath: index < normalizedStages.length - 1
                      ? `polygon(0 0, 100% 0, ${50 + (nextWidth/2)}% 100%, ${50 - (nextWidth/2)}% 100%)`
                      : undefined
                  }}
                >
                  <div className="flex items-center gap-4 text-white">
                    <span className="font-semibold text-sm truncate max-w-[150px]">
                      {stage.label}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                      {stage.count}
                    </span>
                    <span className="bg-white/30 px-2 py-1 rounded text-xs font-bold">
                      {stage.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Seta/Indicador de conversão entre etapas */}
                {index < normalizedStages.length - 1 && stage.conversionRate !== undefined && (
                  <div className="absolute -bottom-3 z-10 bg-background border border-border rounded-full px-3 py-1 text-xs font-semibold shadow">
                    <span className={colors.text}>{stage.conversionRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Resumo abaixo do funil */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {normalizedStages[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Entrada do Funil</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {normalizedStages[normalizedStages.length - 1]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Saída do Funil</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {normalizedStages[0]?.count > 0
                  ? ((normalizedStages[normalizedStages.length - 1]?.count / normalizedStages[0]?.count) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Conversão Global</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {totalCount}
              </div>
              <div className="text-sm text-muted-foreground">Total de Leads</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VisualFunnel
