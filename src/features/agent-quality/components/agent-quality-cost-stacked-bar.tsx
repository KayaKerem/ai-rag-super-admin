import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type {
  AgentQualityCostSeriesDay,
  AgentQualityTrendDay,
} from '../types'

const ROLE_ORDER = ['chat', 'toolStep', 'embedding', 'qualityEval', 'other']

const ROLE_FILL: Record<string, string> = {
  chat: '#3b82f6',
  toolStep: '#8b5cf6',
  embedding: '#10b981',
  qualityEval: '#f59e0b',
  other: '#9ca3af',
}

const ROLE_LABEL: Record<string, string> = {
  chat: 'Chat',
  toolStep: 'Tool Step',
  embedding: 'Embedding',
  qualityEval: 'Quality Eval',
  other: 'Diğer',
}

export interface AgentQualityCostStackedBarProps {
  series: AgentQualityTrendDay[]
  costSeries: AgentQualityCostSeriesDay[]
}

export function AgentQualityCostStackedBar({
  series,
  costSeries,
}: AgentQualityCostStackedBarProps) {
  const data = useMemo(() => {
    const costByDate = new Map<string, Record<string, number>>()
    for (const c of costSeries) costByDate.set(c.date, c.byRole)
    return series.map((day) => {
      const byRole = costByDate.get(day.date) ?? {}
      return {
        date: day.date,
        chat: byRole.chat,
        toolStep: byRole.toolStep,
        embedding: byRole.embedding,
        qualityEval: byRole.qualityEval,
        other: byRole.other,
        // Marker for tooltip — true if ANY role logged on this date.
        hasCost: Object.keys(byRole).length > 0,
      }
    })
  }, [series, costSeries])

  const allEmpty = data.every((d) => !d.hasCost)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Maliyet — Role'a Göre</CardTitle>
      </CardHeader>
      <CardContent>
        {allEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Bu pencerede AI usage yok.
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  formatter={(value, name) => {
                    if (typeof value !== 'number') return ['—', String(name)]
                    const key = String(name)
                    return [formatCurrency(value), ROLE_LABEL[key] ?? key]
                  }}
                  labelFormatter={(label) => String(label ?? '')}
                />
                <Legend
                  formatter={(value: string) => ROLE_LABEL[value] ?? value}
                />
                {ROLE_ORDER.map((role) => (
                  <Bar
                    key={role}
                    dataKey={role}
                    stackId="cost"
                    fill={ROLE_FILL[role]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
