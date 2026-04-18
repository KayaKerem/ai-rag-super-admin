import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlatformSummary } from '../hooks/use-platform-summary'
import { useRevenue } from '../hooks/use-revenue'
import { KpiCard } from '../components/kpi-card'
import { CostTrendChart } from '../components/cost-trend-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { RevenueSummary } from '../components/revenue-summary'
import { formatCurrency, formatCurrencyTry } from '@/lib/utils'

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function DashboardPage() {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = usePlatformSummary(months)
  const { data: revenue } = useRevenue()

  const current = data?.months[0]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform genel bakış</p>
        </div>
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

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : current ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <KpiCard label="Toplam Şirket" value={String(revenue?.totalCompanies ?? current.companyCount)} />
            <KpiCard label="Bu Ayın Maliyeti" value={formatCurrency(current.totalCostUsd)} />
            <KpiCard label="Aktif Kullanıcılar" value={String(revenue?.totalActiveUsers ?? 0)} />
            <KpiCard
              label="Memnuniyet Oranı"
              value={current.satisfactionRate ? `%${Math.round(current.satisfactionRate * 100)}` : '—'}
            />
            <KpiCard
              label="MRR"
              value={revenue ? formatCurrencyTry(revenue.mrrTry) : '—'}
              subtitle={revenue ? formatCurrency(revenue.mrrUsd) : undefined}
            />
            <KpiCard
              label="Brüt Kâr"
              value={revenue ? formatCurrencyTry(revenue.marginTry) : '—'}
              subtitleColor="text-green-400"
              subtitle={revenue ? `AI maliyeti: ${formatCurrency(revenue.totalAiCostUsd)}` : undefined}
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              rerank={current.rerank?.costUsd ?? 0}
              webSearch={current.webSearch?.costUsd ?? 0}
              research={current.research.costUsd}
              quotePrepare={current.quotePrepare.costUsd}
              proactive={current.proactive?.costUsd ?? 0}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>

          {revenue && <RevenueSummary data={revenue} />}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
      )}
    </div>
  )
}
