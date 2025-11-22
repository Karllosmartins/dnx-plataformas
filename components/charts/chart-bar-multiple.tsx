"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarMultipleProps {
  title?: string
  description?: string
  data: Array<{
    [key: string]: string | number
  }>
  config: ChartConfig
  dataKeys: string[]
  xAxisKey?: string
  footer?: {
    trend?: string
    trendUp?: boolean
    description?: string
  }
}

export function ChartBarMultiple({
  title = "Bar Chart - Multiple",
  description = "Comparativo de dados",
  data,
  config,
  dataKeys,
  xAxisKey = "month",
  footer
}: ChartBarMultipleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.length > 3) {
                  return value.slice(0, 3)
                }
                return value
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {dataKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      {footer && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footer.trend && (
            <div className="flex gap-2 leading-none font-medium">
              {footer.trend} {footer.trendUp !== undefined && <TrendingUp className="h-4 w-4" />}
            </div>
          )}
          {footer.description && (
            <div className="text-muted-foreground leading-none">
              {footer.description}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
