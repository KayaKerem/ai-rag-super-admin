import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import { computeBudgetBand } from '../lib/budget-band'

interface BudgetStatusCardProps {
  spendUsd: number
  capUsd: number | null
  thresholdPct?: number
}

export function BudgetStatusCard({ spendUsd, capUsd, thresholdPct }: BudgetStatusCardProps) {
  const status = computeBudgetBand(spendUsd, capUsd, thresholdPct)

  if (status.band === 'unconfigured') {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Aylık AI Bütçesi</div>
            <div className="text-sm text-muted-foreground">Bu firmaya plan atanmamış — bütçe limiti yok.</div>
          </div>
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', status.badgeClass)}>
            {status.label}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Aylık AI Bütçesi</div>
          <div className="text-base font-semibold tabular-nums">
            {formatCurrency(spendUsd)} / {formatCurrency(capUsd ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">{status.rawPct.toFixed(1)}% kullanıldı</div>
        </div>
        <div className="h-2 rounded-full bg-muted" title={`${status.rawPct.toFixed(1)}% / 100%`}>
          <div
            className={cn('h-full rounded-full transition-all', status.barColorClass)}
            style={{ width: `${status.pct}%` }}
          />
        </div>
        <div className="flex justify-start sm:justify-end">
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', status.badgeClass)}>
            {status.label}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
