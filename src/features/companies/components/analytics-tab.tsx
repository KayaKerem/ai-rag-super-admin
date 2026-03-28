import { useState } from 'react'
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompanyAnalytics } from '../hooks/use-company-analytics'
import { KpiCard } from '@/features/dashboard/components/kpi-card'

interface AnalyticsTabProps {
  companyId: string
}

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

const reasonLabels: Record<string, string> = {
  incomplete: 'Eksik Cevap',
  hallucination: 'Halusinasyon',
  wrong_source: 'Yanlis Kaynak',
  wrong_template: 'Yanlis Sablon',
  irrelevant: 'Alakasiz',
  other: 'Diger',
}

export function AnalyticsTab({ companyId }: AnalyticsTabProps) {
  const [months, setMonths] = useState(3)
  const { data, isLoading } = useCompanyAnalytics(companyId, months)

  const current = data?.months?.[0]

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>
  if (!current) return <div className="text-sm text-muted-foreground">Veri bulunamadi.</div>

  const satisfactionPct = (current.feedback.satisfactionRate * 100).toFixed(0)
  const groundednessPct = (current.quality.avgGroundedness * 100).toFixed(0)
  const relevancePct = (current.quality.avgRelevance * 100).toFixed(0)

  // Chart data for conversations trend
  const chartData = [...(data?.months ?? [])].reverse().map((m) => ({
    month: m.month.slice(5),
    Sohbet: m.conversations.total,
    Turn: m.turns.total,
  }))

  // Feedback bar widths
  const feedbackTotal = current.feedback.positiveCount + current.feedback.negativeCount
  const positivePct = feedbackTotal > 0 ? (current.feedback.positiveCount / feedbackTotal) * 100 : 0

  // Tool usage max for bar scaling
  const maxToolCount = Math.max(...current.tools.byTool.map((t) => t.count), 1)

  return (
    <div>
      {/* Period selector */}
      <div className="mb-4 flex justify-end">
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard
          label="Memnuniyet Orani"
          value={`%${satisfactionPct}`}
          subtitle={`${current.feedback.totalRatings} degerlendirme`}
          subtitleColor="text-emerald-400"
        />
        <KpiCard
          label="Ort. Groundedness"
          value={`%${groundednessPct}`}
          subtitle={`${current.quality.evaluatedCount} turn degerlendirildi`}
          subtitleColor="text-blue-400"
        />
        <KpiCard
          label="Ort. Relevance"
          value={`%${relevancePct}`}
          subtitle={`${current.quality.evaluatedCount} turn degerlendirildi`}
          subtitleColor="text-violet-400"
        />
        <KpiCard
          label="Dusuk Kalite"
          value={`${current.quality.lowQualityCount} adet`}
          subtitle={`${current.quality.evaluatedCount} turn icinde`}
          subtitleColor="text-red-400"
        />
      </div>

      {/* Metric cards grid */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Sohbet</p>
            <p className="mt-1 text-lg font-bold">{current.conversations.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Aktif Kullanici</p>
            <p className="mt-1 text-lg font-bold">{current.conversations.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Turn</p>
            <p className="mt-1 text-lg font-bold">{current.turns.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ort. Turn/Sohbet</p>
            <p className="mt-1 text-lg font-bold">{current.turns.avgPerConversation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Tool Cagrisi</p>
            <p className="mt-1 text-lg font-bold">{current.tools.totalCalls}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Bos Arama</p>
            <p className="mt-1 text-lg font-bold">{current.search.noResultCount}</p>
            <p className="text-xs text-muted-foreground">%{(current.search.noResultRate * 100).toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations trend chart */}
      {(data?.months?.length ?? 0) > 1 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Sohbet ve Turn Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="Sohbet" fill="#6d28d9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bottom row: feedback + tool usage */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Feedback breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Geri Bildirim Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Visual bar */}
            <div className="mb-3 flex h-4 overflow-hidden rounded-full">
              <div
                className="bg-emerald-500 transition-all"
                style={{ width: `${positivePct}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${100 - positivePct}%` }}
              />
            </div>
            <div className="mb-4 flex justify-between text-xs text-muted-foreground">
              <span>Olumlu: {current.feedback.positiveCount}</span>
              <span>Olumsuz: {current.feedback.negativeCount}</span>
            </div>

            {/* Top negative reasons */}
            <p className="mb-2 text-xs font-medium text-muted-foreground">Olumsuz Sebepler</p>
            <ul className="space-y-1.5">
              {current.feedback.topReasons.map((r) => (
                <li key={r.code} className="flex items-center justify-between text-sm">
                  <span>{reasonLabels[r.code] ?? r.code}</span>
                  <span className="font-mono text-xs text-muted-foreground">{r.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Tool usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tool Kullanimi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {current.tools.byTool.map((t) => (
                <li key={t.name}>
                  <div className="mb-0.5 flex items-center justify-between text-sm">
                    <span className="truncate font-mono text-xs">{t.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{t.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${(t.count / maxToolCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
