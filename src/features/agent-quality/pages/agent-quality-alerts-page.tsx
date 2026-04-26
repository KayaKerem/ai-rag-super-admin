import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { Button } from '@/components/ui/button'
import { AgentQualityAlertsFilters } from '../components/agent-quality-alerts-filters'
import { AgentQualityAlertsTable } from '../components/agent-quality-alerts-table'
import { useAgentQualityAlerts } from '../hooks/use-agent-quality-alerts'
import {
  ALERTS_PAGE_MAX,
  ALERTS_PAGE_SIZE,
  clampPage,
  isAgentQualityMetric,
  type AgentQualityMetric,
  type AgentQualityAlertRow,
} from '../types'

interface AlertsUrlState {
  status: 'open' | 'all'
  company: string | null
  metric: AgentQualityMetric | null
  page: number
}

const DEFAULTS: AlertsUrlState = {
  status: 'open',
  company: null,
  metric: null,
  page: 1,
}

function parse(params: URLSearchParams): AlertsUrlState {
  const rawStatus = params.get('status')
  const rawMetric = params.get('metric')
  return {
    status: rawStatus === 'all' ? 'all' : 'open',
    company: params.get('company') || null,
    metric: rawMetric && isAgentQualityMetric(rawMetric) ? rawMetric : null,
    page: clampPage(Number(params.get('page')), ALERTS_PAGE_MAX),
  }
}

function serialize(value: AlertsUrlState): Record<string, string | undefined> {
  return {
    status: value.status === 'open' ? undefined : value.status,
    company: value.company ?? undefined,
    metric: value.metric ?? undefined,
    page: value.page > 1 ? String(value.page) : undefined,
  }
}

const URL_STATE_OPTS = { defaults: DEFAULTS, parse, serialize }

function pickWindowForFire(firedAt: string): 7 | 30 | 90 {
  // Normalize both to UTC-midnight day boundaries to avoid TZ-dependent
  // off-by-one near midnight (firedAt is UTC ISO; new Date() is local clock).
  const firedYmd = firedAt.slice(0, 10)
  const fired = new Date(`${firedYmd}T00:00:00Z`)
  const now = new Date()
  const todayUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  )
  const days = Math.round((todayUtc.getTime() - fired.getTime()) / 86_400_000)
  if (days <= 6) return 7   // 7-day window covers today + 6 prior UTC days
  if (days <= 29) return 30
  return 90
}

export function AgentQualityAlertsPage() {
  const navigate = useNavigate()
  const [state, setState] = useUrlFilterState<AlertsUrlState>(URL_STATE_OPTS)

  const filters = useMemo(
    () => ({
      status: state.status,
      companyId: state.company ?? undefined,
      metric: state.metric ?? undefined,
      page: state.page,
      pageSize: ALERTS_PAGE_SIZE,
    }),
    [state]
  )

  const query = useAgentQualityAlerts(filters)
  const data = query.data
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / ALERTS_PAGE_SIZE))
    : 1

  function handleRowClick(row: AgentQualityAlertRow) {
    const firedDay = row.firedAt.slice(0, 10)
    const window = pickWindowForFire(row.firedAt)
    const fireWithinWindow = (() => {
      const fired = new Date(`${firedDay}T00:00:00Z`)
      const now = new Date()
      const start = new Date(now)
      start.setUTCDate(start.getUTCDate() - (window - 1))
      start.setUTCHours(0, 0, 0, 0)
      return fired.getTime() >= start.getTime()
    })()
    const params = new URLSearchParams()
    if (window !== 7) params.set('windowDays', String(window))
    params.set('company', row.companyId)
    if (fireWithinWindow) {
      params.set('trendDate', firedDay)
      params.set('metric', row.metric)
    } else {
      params.set('fireOutOfWindow', '1')
    }
    navigate(`/admin/agent-quality?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Alerts</h1>
          <p className="text-xs text-muted-foreground">
            Alarmlar 15 dk cron ile yenilenir.
          </p>
        </div>
      </header>

      <AgentQualityAlertsFilters
        value={{
          status: state.status,
          companyId: state.company,
          metric: state.metric,
        }}
        onChange={(next) =>
          setState({
            ...state,
            status: next.status ?? state.status,
            company:
              next.companyId === undefined ? state.company : next.companyId,
            metric: next.metric === undefined ? state.metric : next.metric,
            page: 1,
          })
        }
      />

      {query.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
        </div>
      )}
      {query.isError && (
        <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
          Alarm listesi yüklenemedi.
        </div>
      )}
      {data && (
        <>
          <AgentQualityAlertsTable
            rows={data.alerts}
            onRowClick={handleRowClick}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={state.page <= 1}
                onClick={() => setState({ page: state.page - 1 })}
              >
                ‹ Önceki
              </Button>
              <span className="text-xs text-muted-foreground">
                {state.page} / {totalPages} ({data.total} alarm)
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={state.page >= totalPages}
                onClick={() => setState({ page: state.page + 1 })}
              >
                Sonraki ›
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
