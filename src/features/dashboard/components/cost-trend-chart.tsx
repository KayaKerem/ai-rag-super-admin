import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthData {
  month: string
  totalCostUsd: number
}

interface CostTrendChartProps {
  data: MonthData[]
}

export function CostTrendChart({ data }: CostTrendChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5),
    cost: d.totalCostUsd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aylık Maliyet Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Maliyet']}
              contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
            />
            <Bar dataKey="cost" fill="#6d28d9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
