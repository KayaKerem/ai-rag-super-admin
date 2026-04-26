import { useEffect, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { AgentQualityFilters } from '../components/agent-quality-filters'
import { AgentQualitySnapshotTable } from '../components/agent-quality-snapshot-table'
import { AgentQualityTrendPanel } from '../components/agent-quality-trend-panel'
import { AgentQualityTurnsDrawer } from '../components/agent-quality-turns-drawer'
import { useAgentQualitySnapshot } from '../hooks/use-agent-quality-snapshot'
import { useAgentQualityTrend } from '../hooks/use-agent-quality-trend'
import {
  TURNS_PAGE_MAX,
  clampPage,
  clampWindowDays,
  isAgentQualityMetric,
  isYmd,
  type AgentQualityMetric,
  type WindowDaysOption,
} from '../types'

interface AgentQualityUrlState {
  windowDays: WindowDaysOption
  company: string | null
  trendDate: string | null
  metric: AgentQualityMetric | null
  page: number
  showLowSignal: boolean
  fireOutOfWindow: boolean        // NEW
}

const DEFAULTS: AgentQualityUrlState = {
  windowDays: 7,
  company: null,
  trendDate: null,
  metric: null,
  page: 1,
  showLowSignal: false,
  fireOutOfWindow: false,         // NEW
}

function parse(params: URLSearchParams): AgentQualityUrlState {
  const windowDays = clampWindowDays(Number(params.get('windowDays')))
  const company = params.get('company') || null

  const rawDate = params.get('trendDate')
  const rawMetric = params.get('metric')
  const rawPage = Number(params.get('page'))

  // Drawer URL invariant — date+metric+page üçü birlikte; eksikse hepsi null.
  const dateValid = rawDate ? isYmd(rawDate) : false
  const metricValid = rawMetric ? isAgentQualityMetric(rawMetric) : false
  const allThree = dateValid && metricValid

  return {
    windowDays,
    company,
    trendDate: allThree ? rawDate : null,
    metric: allThree ? (rawMetric as AgentQualityMetric) : null,
    page: allThree ? clampPage(rawPage, TURNS_PAGE_MAX) : 1,
    showLowSignal: params.get('lowSignal') === '1',
    fireOutOfWindow: params.get('fireOutOfWindow') === '1',
  }
}

function serialize(
  value: AgentQualityUrlState
): Record<string, string | undefined> {
  const drawerOpen = value.trendDate != null && value.metric != null
  return {
    windowDays: value.windowDays === 7 ? undefined : String(value.windowDays),
    company: value.company ?? undefined,
    trendDate: drawerOpen ? value.trendDate ?? undefined : undefined,
    metric: drawerOpen ? value.metric ?? undefined : undefined,
    page: drawerOpen && value.page > 1 ? String(value.page) : undefined,
    lowSignal: value.showLowSignal ? '1' : undefined,
    fireOutOfWindow: value.fireOutOfWindow ? '1' : undefined,
  }
}

const URL_STATE_OPTS = { defaults: DEFAULTS, parse, serialize }

export function AgentQualityPage() {
  const [state, setState] =
    useUrlFilterState<AgentQualityUrlState>(URL_STATE_OPTS)

  const snapshot = useAgentQualitySnapshot(state.windowDays)
  const trend = useAgentQualityTrend(state.company, state.windowDays)

  const selectedRow = useMemo(
    () =>
      snapshot.data?.tenants.find((t) => t.companyId === state.company) ??
      null,
    [snapshot.data, state.company]
  )

  // Spec §6: drawer açıkken windowDays değişirse, yeni window'da date varsa
  // drawer açık kalır; yoksa kapanır.
  useEffect(() => {
    if (state.trendDate && trend.data) {
      const exists = trend.data.series.some((s) => s.date === state.trendDate)
      if (!exists) {
        setState({ trendDate: null, metric: null, page: 1 })
      }
    }
  }, [state.trendDate, trend.data, setState])

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Agent Kalite</h1>
        {snapshot.data && (
          <p className="text-sm text-muted-foreground">
            Generated at {new Date(snapshot.data.generatedAt).toUTCString()}
          </p>
        )}
      </header>

      {state.fireOutOfWindow && state.company && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Bu alarm 90 günden daha eski bir tarihte fire'landı; drawer
          otomatik açılmadı. Trend grafiğindeki bir noktaya tıklayarak
          drill-down açabilirsiniz.
        </div>
      )}

      <AgentQualityFilters
        windowDays={state.windowDays}
        onWindowDaysChange={(v) =>
          setState({
            windowDays: v,
            trendDate: null,
            metric: null,
            page: 1,
            fireOutOfWindow: false,
          })
        }
        showLowSignal={state.showLowSignal}
        onShowLowSignalChange={(v) => setState({ showLowSignal: v })}
        tenantsBelowSignalThreshold={
          snapshot.data?.tenantsBelowSignalThreshold ?? 0
        }
      />

      {snapshot.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Snapshot yükleniyor…
        </div>
      )}
      {snapshot.isError && (
        <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
          Snapshot yüklenemedi.
        </div>
      )}
      {snapshot.data && (
        <AgentQualitySnapshotTable
          rows={snapshot.data.tenants}
          selectedCompanyId={state.company}
          onSelect={(companyId) =>
            setState({
              company: companyId === state.company ? null : companyId,
              trendDate: null,
              metric: null,
              page: 1,
              fireOutOfWindow: false,
            })
          }
          showLowSignal={state.showLowSignal}
        />
      )}

      {state.company && (
        <AgentQualityTrendPanel
          companyId={state.company}
          companyName={selectedRow?.companyName ?? null}
          windowDays={state.windowDays}
          data={trend.data}
          isLoading={trend.isLoading}
          isError={trend.isError}
          onBarClick={(date, metric) =>
            setState({ trendDate: date, metric, page: 1 })
          }
          onClose={() =>
            setState({
              company: null,
              trendDate: null,
              metric: null,
              page: 1,
              fireOutOfWindow: false,
            })
          }
        />
      )}

      <AgentQualityTurnsDrawer
        params={
          state.company && state.trendDate && state.metric
            ? {
                companyId: state.company,
                metric: state.metric,
                date: state.trendDate,
                page: state.page,
              }
            : null
        }
        onClose={() => setState({ trendDate: null, metric: null, page: 1 })}
        onPageChange={(page) => setState({ page })}
      />
    </div>
  )
}
