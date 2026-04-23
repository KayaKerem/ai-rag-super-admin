import { useMemo } from 'react'
import { subDays } from 'date-fns'
import { AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useCostHealth } from '../hooks/use-cost-health'
import { CostHealthHeadline } from '../components/cost-health-headline'
import { CostHealthStackedBar } from '../components/cost-health-stacked-bar'
import { CostHealthBreakdownTables } from '../components/cost-health-breakdown-tables'
import type {
  CostHealthFilters,
  DatePreset,
  ResolvedCostHealthRange,
} from '../types'

const FILTER_OPTIONS = {
  defaults: {
    companyId: null,
    preset: '30d',
    from: null,
    to: null,
  } as CostHealthFilters,
  parse: (p: URLSearchParams): CostHealthFilters => {
    const raw = (p.get('preset') ?? '30d') as DatePreset
    const preset: DatePreset = (['7d', '30d', '90d', 'custom'] as const).includes(
      raw
    )
      ? raw
      : '30d'
    return {
      companyId: p.get('companyId') ?? null,
      preset,
      from: preset === 'custom' && p.get('from') ? new Date(p.get('from')!) : null,
      to: preset === 'custom' && p.get('to') ? new Date(p.get('to')!) : null,
    }
  },
  serialize: (v: CostHealthFilters): Record<string, string | undefined> => ({
    companyId: v.companyId ?? undefined,
    preset: v.preset === '30d' ? undefined : v.preset,
    from: v.preset === 'custom' ? v.from?.toISOString() : undefined,
    to: v.preset === 'custom' ? v.to?.toISOString() : undefined,
  }),
}

function resolvePresetRange(
  preset: DatePreset,
  customFrom: Date | null,
  customTo: Date | null
): ResolvedCostHealthRange {
  if (preset === 'custom') return { from: customFrom, to: customTo }
  const now = new Date()
  if (preset === '7d') return { from: subDays(now, 7), to: now }
  if (preset === '30d') return { from: subDays(now, 30), to: now }
  if (preset === '90d') return { from: subDays(now, 90), to: now }
  return { from: null, to: null }
}

export function CostHealthPage() {
  const [filters, setFilters] = useUrlFilterState<CostHealthFilters>(
    FILTER_OPTIONS
  )

  // Pass primitives explicitly so the dep array stays narrow without fighting
  // react-hooks/exhaustive-deps. `filters` is rebuilt every render by
  // useUrlFilterState (fresh object from URLSearchParams parse), so depending
  // on the whole object would recompute the range every render.
  const { preset, from, to } = filters
  const range = useMemo(
    () => resolvePresetRange(preset, from, to),
    [preset, from, to]
  )

  const query = useCostHealth({ companyId: filters.companyId, range })

  if (query.isLoading) {
    return (
      <TooltipProvider delay={0}>
        <div className="space-y-6 p-6">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 animate-pulse rounded bg-muted" />
            <div className="h-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </TooltipProvider>
    )
  }

  if (query.isError) {
    const status = (query.error as { response?: { status?: number } })?.response
      ?.status
    const code = (
      query.error as { response?: { data?: { code?: string } } }
    )?.response?.data?.code
    const isForbidden = status === 403 || code === 'platform_admin_required'
    return (
      <TooltipProvider delay={0}>
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h2 className="text-lg font-semibold">
                {isForbidden
                  ? 'Bu sayfaya erişim yetkiniz yok'
                  : 'Veri yüklenemedi'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isForbidden
                  ? 'Cost Health yalnızca platform yöneticilerine açıktır.'
                  : 'Bir hata oluştu. Lütfen tekrar deneyin.'}
              </p>
              {!isForbidden && (
                <Button onClick={() => query.refetch()}>Tekrar Dene</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    )
  }

  const data = query.data!
  const isEmpty = data.totalCostUsd <= 0

  return (
    <TooltipProvider delay={0}>
      <div className="space-y-6 p-6">
        <CostHealthHeadline
          total={data.totalCostUsd}
          periodStart={data.periodStart}
          periodEnd={data.periodEnd}
          filters={filters}
          onFiltersChange={(next) => setFilters(next)}
          isFetching={query.isFetching}
        />

        {isEmpty ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <Info className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Seçilen dönemde AI harcaması yok.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <CostHealthStackedBar
              breakdown={data.breakdown}
              totalCostUsd={data.totalCostUsd}
            />
            <CostHealthBreakdownTables
              byEventType={data.byEventType}
              byModel={data.byModel}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
