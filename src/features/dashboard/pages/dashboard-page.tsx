import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlatformSummary } from '../hooks/use-platform-summary'
import { usePlatformDataSources } from '@/features/companies/hooks/use-data-sources'
import { KpiCard } from '../components/kpi-card'
import { CostTrendChart } from '../components/cost-trend-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function DashboardPage() {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = usePlatformSummary(months)
  const { data: activeDs } = usePlatformDataSources({ status: 'active' })
  const { data: errorDs } = usePlatformDataSources({ status: 'error' })

  const current = data?.months[0]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview</p>
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
            <KpiCard label="Toplam Şirket" value={String(current.companyCount)} />
            <KpiCard label="Toplam Maliyet" value={formatCurrency(current.totalCostUsd)} />
            <KpiCard label="AI Token" value={formatNumber(current.ai.totalTokens)} subtitle={formatCurrency(current.ai.costUsd)} />
            <KpiCard label="Storage" value={formatBytes(current.storage.totalBytes)} subtitle={formatCurrency(current.storage.costUsd)} />
            <KpiCard label="Aktif Crawler" value={String(activeDs?.total ?? 0)} />
            <KpiCard
              label="Hatali Kaynak"
              value={String(errorDs?.total ?? 0)}
              subtitleColor={(errorDs?.total ?? 0) > 0 ? 'text-red-400' : undefined}
              subtitle={(errorDs?.total ?? 0) > 0 ? 'Dikkat gerektiriyor' : 'Sorun yok'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              cdn={current.cdn.costUsd}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
      )}
    </div>
  )
}
