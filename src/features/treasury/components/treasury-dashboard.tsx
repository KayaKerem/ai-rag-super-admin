import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { useTreasuryDashboard, useTreasurySnapshots } from '../hooks/use-treasury'
import { formatCurrency, formatDate } from '@/lib/utils'

const dayOptions = [7, 30, 90] as const

export function TreasuryDashboard() {
  const [days, setDays] = useState<number>(30)
  const { data: dash, isLoading: dashLoading } = useTreasuryDashboard()
  const { data: snapshots, isLoading: snapLoading } = useTreasurySnapshots(days)

  if (dashLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>
  if (!dash) return <div className="text-sm text-muted-foreground">Veri bulunamadi.</div>

  const chartData = (snapshots ?? []).map((s) => ({
    date: s.createdAt.slice(5, 10),
    value: s.totalTreasuryValue,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total Treasury" value={formatCurrency(dash.totals.total_treasury)} />
        <KpiCard label="Likit USDC" value={formatCurrency(dash.totals.effective_liquid)} />
        <KpiCard label="Staked Toplam" value={formatCurrency(dash.totals.total_staked)} />
        <KpiCard
          label="Gunluk Yakim"
          value={formatCurrency(dash.metrics.daily_burn_rate)}
          subtitleColor="text-orange-400"
        />
        <KpiCard
          label="Tahmini Omur"
          value={`${dash.metrics.projected_runway_days} gun`}
          subtitleColor="text-blue-400"
        />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Bekleyen Aksiyonlar
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold">{dash.pending_actions_count}</span>
              {dash.pending_actions_count > 0 && (
                <Badge variant="destructive">{dash.pending_actions_count}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Treasury Degisimi</CardTitle>
            <div className="flex gap-1">
              {dayOptions.map((d) => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}g
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {snapLoading ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Yukleniyor...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Snapshot verisi yok
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
                  formatter={(v: any) => [`$${(v as number).toFixed(2)}`, 'Treasury']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6d28d9"
                  fill="#6d28d9"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* OpenRouter Mini */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">OpenRouter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Bakiye</p>
              <p className="font-semibold">{formatCurrency(dash.openrouter.balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Runway</p>
              <p className="font-semibold">{dash.openrouter.runway_days} gun</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Onerilen Top-up</p>
              <p className="font-semibold">
                {formatCurrency(dash.openrouter_topup.recommended_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tahmini Top-up Tarihi</p>
              <p className="font-semibold">
                {formatDate(dash.openrouter_topup.estimated_topup_date)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
