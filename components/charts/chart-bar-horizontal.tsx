"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

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

interface ChartBarHorizontalProps {
  title?: string
  description?: string
  data: Array<{
    name: string
    value: number
  }>
  config: ChartConfig
  dataKey?: string
  nameKey?: string
  footer?: {
    trend?: string
    trendUp?: boolean
    description?: string
  }
}

export function ChartBarHorizontal({
  title = "Bar Chart - Horizontal",
  description = "Dados por categoria",
  data,
  config,
  dataKey = "value",
  nameKey = "name",
  footer
}: ChartBarHorizontalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" dataKey={dataKey} hide />
            <YAxis
              dataKey={nameKey}
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={dataKey} fill="var(--color-value)" radius={5} />
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
