import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanyUsage } from '../hooks/use-company-usage'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { UsageChart } from './usage-chart'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'

interface UsageTabProps {
  companyId: string
}

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function UsageTab({ companyId }: UsageTabProps) {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = useCompanyUsage(companyId, months)

  const current = data?.months?.[0]

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
  if (!current) return <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>

  return (
    <div>
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

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
        <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
        <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
      </div>

      <UsageChart data={data.months} />
    </div>
  )
}
