import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendSparkline, type TrendSparklinePoint } from './trend-sparkline'
import { AgentQualityCostStackedBar } from './agent-quality-cost-stacked-bar'
import type {
  AgentQualityMetric,
  AgentQualityTrendResponse,
} from '../types'

export interface AgentQualityTrendPanelProps {
  companyId: string
  companyName: string | null
  windowDays: number
  data: AgentQualityTrendResponse | undefined
  isLoading: boolean
  isError: boolean
  onBarClick: (date: string, metric: AgentQualityMetric) => void
  onClose: () => void
}

function pickPoints(
  series: AgentQualityTrendResponse['series'],
  field: keyof AgentQualityTrendResponse['series'][number]
): TrendSparklinePoint[] {
  return series.map((d) => ({
    date: d.date,
    value: (d[field] as number | null) ?? null,
  }))
}

export function AgentQualityTrendPanel({
  companyName,
  windowDays,
  data,
  isLoading,
  isError,
  onBarClick,
  onClose,
}: AgentQualityTrendPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {companyName ?? '(adı yok)'} — {windowDays} günlük trend
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Kapat">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {isError && (
          <div className="space-y-2 rounded-md border border-destructive/50 p-4 text-sm text-destructive">
            <p>
              Şirket erişilemez (silinmiş olabilir). Trend yüklenemedi.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-foreground"
            >
              Tabloya geri dön
            </Button>
          </div>
        )}
        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TrendSparkline
                label="Guardrail Fire Rate"
                data={pickPoints(data.series, 'guardrailFireRate')}
                onPointClick={(date, value) => {
                  if (value == null) return
                  onBarClick(date, 'guardrail')
                }}
              />
              <TrendSparkline
                label="Retry Exhausted Rate"
                data={pickPoints(data.series, 'retryExhaustedRate')}
                onPointClick={(date, value) => {
                  if (value == null) return
                  onBarClick(date, 'retry')
                }}
              />
              <TrendSparkline
                label="Force Follow-Up Rate"
                data={pickPoints(data.series, 'forceFollowUpRate')}
                onPointClick={(date, value) => {
                  if (value == null) return
                  onBarClick(date, 'force_followup')
                }}
              />
              <TrendSparkline
                label="Retrieval Quality"
                data={pickPoints(data.series, 'retrievalQualityScore')}
              />
            </div>
            <AgentQualityCostStackedBar
              series={data.series}
              costSeries={data.costByRoleSeries}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
