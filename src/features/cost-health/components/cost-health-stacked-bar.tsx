import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { CostBucket, CostSource } from '../types'

export interface CostHealthStackedBarProps {
  breakdown: Record<CostSource, CostBucket>
  totalCostUsd: number
}

const SEGMENT_META: Record<
  CostSource,
  { label: string; bg: string; dot: string }
> = {
  provider: {
    label: 'Provider (Gerçek Fatura)',
    bg: 'bg-green-500',
    dot: 'bg-green-500',
  },
  estimate: {
    label: 'Estimate (Token Tahmini)',
    bg: 'bg-yellow-500',
    dot: 'bg-yellow-500',
  },
  missing: {
    label: 'Missing (Hiç Kayıt Yok)',
    bg: 'bg-red-500',
    dot: 'bg-red-500',
  },
  legacy: {
    label: 'Legacy (Migration Öncesi)',
    bg: 'bg-gray-400',
    dot: 'bg-gray-400',
  },
}

const SEGMENT_ORDER: CostSource[] = ['provider', 'estimate', 'missing', 'legacy']

export function CostHealthStackedBar({
  breakdown,
  totalCostUsd,
}: CostHealthStackedBarProps) {
  if (totalCostUsd <= 0) return null

  const sumPct = SEGMENT_ORDER.reduce(
    (acc, key) => acc + breakdown[key].pct,
    0
  )
  const normalize = (pct: number) => (sumPct > 0 ? (pct / sumPct) * 100 : 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Maliyet Kalite Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-8 w-full overflow-hidden rounded-md">
          {SEGMENT_ORDER.map((source) => {
            const bucket = breakdown[source]
            const width = normalize(bucket.pct)
            if (width === 0) return null
            const meta = SEGMENT_META[source]
            return (
              <Tooltip key={source}>
                <TooltipTrigger
                  render={
                    <div
                      className={`${meta.bg} flex h-full items-center justify-center text-xs font-medium text-white`}
                      style={{ width: `${width}%` }}
                    >
                      {bucket.pct >= 6 && `%${bucket.pct.toFixed(1)}`}
                    </div>
                  }
                />
                <TooltipContent side="top">
                  <div className="text-xs">
                    <strong>{source}:</strong>{' '}
                    {formatCurrency(bucket.costUsd)} ({bucket.eventCount} event,
                    %{bucket.pct.toFixed(1)})
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {SEGMENT_ORDER.map((source) => {
            const meta = SEGMENT_META[source]
            const bucket = breakdown[source]
            return (
              <div key={source} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-sm ${meta.dot}`} />
                <span className="text-muted-foreground">
                  {meta.label} <strong>%{bucket.pct.toFixed(1)}</strong>
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
