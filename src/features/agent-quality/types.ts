export type AgentQualityMetric = 'guardrail' | 'retry' | 'force_followup'

export const METRIC_META: Record<
  AgentQualityMetric,
  { label: string; tone: 'red' | 'amber' | 'orange' }
> = {
  guardrail: { label: 'Guardrail', tone: 'red' },
  retry: { label: 'Retry Tükenmiş', tone: 'amber' },
  force_followup: { label: 'Force Follow-Up', tone: 'orange' },
}

// Pagination/window caps — server-authoritative; FE clamps before request.
export const WINDOW_DAYS_OPTIONS = [7, 14, 30, 90] as const
export type WindowDaysOption = (typeof WINDOW_DAYS_OPTIONS)[number]
export const TURNS_PAGE_MAX = 10_000 // 18.md drill-down: page 1..10000
export const TURNS_PAGE_SIZE = 20
export const ALERTS_PAGE_MAX = 500 // 19.md alerts list: page 1..500
export const ALERTS_PAGE_SIZE = 20

export interface AgentQualitySnapshotRow {
  companyId: string
  companyName: string | null
  assistantTurns: number
  lowSignal: boolean
  guardrailFireRate: number
  retryExhaustedRate: number
  forceFollowUpRate: number
  retrievalQualityBySource: {
    knowledge: number | null
    drive: number | null
    notes: number | null
    aggregate: number | null
  }
  costByRole: Record<string, number>
  totalCostUsd: number
}

export interface AgentQualitySnapshotResponse {
  windowDays: number
  generatedAt: string
  tenantsBelowSignalThreshold: number
  tenants: AgentQualitySnapshotRow[]
}

export interface AgentQualityTrendDay {
  date: string // YYYY-MM-DD
  assistantTurns: number
  guardrailFireRate: number | null
  retryExhaustedRate: number | null
  forceFollowUpRate: number | null
  retrievalQualityScore: number | null
}

export interface AgentQualityCostSeriesDay {
  date: string
  byRole: Record<string, number>
}

export interface AgentQualityTrendResponse {
  windowDays: number
  companyId: string
  series: AgentQualityTrendDay[]
  costByRoleSeries: AgentQualityCostSeriesDay[]
}

export type MetricReason =
  | { metric: 'guardrail'; blockingReasonCodes: string[] }
  | { metric: 'retry'; retryExhausted: true }
  | { metric: 'force_followup'; forceFollowUp: true }

export interface AgentQualityTurn {
  id: string
  conversationId: string
  createdAt: string
  role: string
  modelName: string
  costUsd: number
  inputTokens: number
  outputTokens: number
  contentPreview: string | null
  citationCount: number
  metricReason: MetricReason
}

export interface AgentQualityTurnsResponse {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
  pageSize: number
  total: number
  turns: AgentQualityTurn[]
}

export interface AgentQualityAlertRow {
  id: string
  companyId: string
  companyName: string | null
  metric: AgentQualityMetric
  value: number
  threshold: number
  assistantTurns: number
  firedAt: string
  resolvedAt: string | null
}

export interface AgentQualityAlertsFilters {
  status: 'open' | 'all'
  companyId?: string
  metric?: AgentQualityMetric
  page: number
  pageSize: number
}

export interface AgentQualityAlertsResponse {
  total: number
  page: number
  pageSize: number
  alerts: AgentQualityAlertRow[]
}

// Helpers used by URL parsing/clamping (Section 3.6 in spec).
export function clampWindowDays(value: number | undefined): WindowDaysOption {
  if (value === undefined) return 7
  return (WINDOW_DAYS_OPTIONS as readonly number[]).includes(value)
    ? (value as WindowDaysOption)
    : 7
}

export function clampPage(value: number | undefined, max: number): number {
  if (!Number.isFinite(value) || value === undefined) return 1
  if (value < 1) return 1
  if (value > max) return 1
  return Math.floor(value)
}

export function isAgentQualityMetric(v: unknown): v is AgentQualityMetric {
  return v === 'guardrail' || v === 'retry' || v === 'force_followup'
}

export function isYmd(v: unknown): v is string {
  if (typeof v !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  // Reject future dates (drill-down disallows future per 18.md).
  const todayUtc = new Date()
  todayUtc.setUTCHours(0, 0, 0, 0)
  return d.getTime() <= todayUtc.getTime()
}
