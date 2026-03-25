import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UsageMonth } from '../types'

interface UsageChartProps {
  data: UsageMonth[]
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5),
    AI: d.ai.costUsd,
    CDN: d.cdn.costUsd,
    Storage: d.storage.costUsd,
    Trigger: d.trigger.costUsd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aylık Maliyet Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any) => `$${(v as number).toFixed(2)}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="AI" stackId="a" fill="#6d28d9" />
            <Bar dataKey="CDN" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Storage" stackId="a" fill="#22c55e" />
            <Bar dataKey="Trigger" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
