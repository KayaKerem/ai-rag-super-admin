import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanyUsage } from '../hooks/use-company-usage'
import { useCompany } from '../hooks/use-company'
import { usePricingPlan } from '../hooks/use-pricing-plans'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { UsageChart } from './usage-chart'
import { BudgetStatusCard } from './budget-status-card'
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
  const { data, isLoading: isUsageLoading } = useCompanyUsage(companyId, months)
  const { data: company, isLoading: isCompanyLoading } = useCompany(companyId)
  const { data: plan, isLoading: isPlanLoading } = usePricingPlan(company?.planId ?? '')

  const current = data?.months?.[0]
  const budgetCap = plan?.budgetUsd ?? null

  if (isUsageLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
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

      {!isCompanyLoading && !isPlanLoading && (
        <div className="mb-4">
          <BudgetStatusCard spendUsd={current.totalCostUsd} capUsd={budgetCap} />
        </div>
      )}

      <div className="mb-4 space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI</h3>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
            <KpiCard label="Rerank" value={formatCurrency(current.rerank?.costUsd ?? 0)} subtitle={`${formatNumber(current.rerank?.searchCount ?? 0)} sorgu`} subtitleColor="text-pink-400" />
            <KpiCard label="Web Search" value={formatCurrency(current.webSearch?.costUsd ?? 0)} subtitle={`${formatNumber(current.webSearch?.searchCount ?? 0)} arama`} subtitleColor="text-teal-400" />
            <KpiCard label="Research" value={formatCurrency(current.research?.costUsd ?? 0)} subtitle={`${formatNumber(current.research?.searchCount ?? 0)} araştırma`} subtitleColor="text-cyan-400" />
            <KpiCard label="Quote Hazırlama" value={formatCurrency(current.quotePrepare?.costUsd ?? 0)} subtitle={`${formatNumber(current.quotePrepare?.quoteCount ?? 0)} teklif`} subtitleColor="text-indigo-400" />
            <KpiCard label="Proaktif" value={formatCurrency(current.proactive?.costUsd ?? 0)} subtitle={`${formatNumber(current.proactive?.insightCount ?? 0)} insight`} subtitleColor="text-orange-400" />
            <KpiCard label="Cache Tasarruf" value={formatCurrency(current.cacheHits?.estimatedSavingsUsd ?? 0)} subtitle={`%${Math.round((current.cacheHits?.hitRate ?? 0) * 100)} hit rate`} subtitleColor="text-emerald-400" />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Altyapı</h3>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
            <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
          </div>
        </div>
      </div>

      <UsageChart data={data.months} />
    </div>
  )
}
