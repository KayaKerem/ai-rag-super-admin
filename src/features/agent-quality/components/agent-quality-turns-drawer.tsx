import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { MetricLabel } from './metric-label'
import { useAgentQualityTurns } from '../hooks/use-agent-quality-turns'
import {
  TURNS_PAGE_SIZE,
  type AgentQualityMetric,
  type MetricReason,
} from '../types'

export interface AgentQualityTurnsDrawerParams {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
}

export interface AgentQualityTurnsDrawerProps {
  params: AgentQualityTurnsDrawerParams | null
  onClose: () => void
  onPageChange: (page: number) => void
}

function ReasonCodes({ reason }: { reason: MetricReason }) {
  if (reason.metric === 'guardrail') {
    const codes = Array.isArray(reason.blockingReasonCodes)
      ? reason.blockingReasonCodes
      : []
    if (codes.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">(no codes)</span>
      )
    }
    return (
      <div className="flex flex-wrap gap-1">
        {codes.map((code) => (
          <Badge key={code} variant="secondary" className="text-xs">
            {code}
          </Badge>
        ))}
      </div>
    )
  }
  if (reason.metric === 'retry') {
    return (
      <Badge variant="secondary" className="text-xs">
        retry_exhausted
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-xs">
      force_follow_up
    </Badge>
  )
}

export function AgentQualityTurnsDrawer({
  params,
  onClose,
  onPageChange,
}: AgentQualityTurnsDrawerProps) {
  const open = params != null
  const query = useAgentQualityTurns(open ? params : null)
  const data = query.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / TURNS_PAGE_SIZE)) : 1
  const currentPage = params?.page ?? 1

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {params ? (
              <>
                {params.date} · <MetricLabel metric={params.metric} />
              </>
            ) : (
              'Turn detayları'
            )}
          </SheetTitle>
          <SheetDescription>
            {data
              ? `Toplam ${data.total} fire eden turn`
              : 'Turn listesi yükleniyor…'}
          </SheetDescription>
        </SheetHeader>

        {query.isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        )}

        {query.isError && (
          <div className="rounded-md border border-destructive/50 p-4 text-sm text-destructive">
            Turn listesi yüklenemedi. Tarih veya filtre geçersiz olabilir.
          </div>
        )}

        {data && data.total === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Bu günde fire eden turn yok.
          </div>
        )}

        {data && data.total > 0 && (
          <>
            <ul className="divide-y">
              {data.turns.map((turn) => (
                <li key={turn.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(turn.createdAt).toUTCString().slice(17, 25)}{' '}
                      UTC
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(turn.costUsd)} · {turn.inputTokens}↑/
                      {turn.outputTokens}↓ · {turn.modelName}
                    </span>
                  </div>
                  {turn.contentPreview && (
                    <p className="mt-1 italic text-foreground/80 line-clamp-3">
                      &quot;{turn.contentPreview}&quot;
                    </p>
                  )}
                  <div className="mt-1">
                    <ReasonCodes reason={turn.metricReason} />
                  </div>
                  <div className="mt-1 text-xs">
                    Conversation:{' '}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {turn.conversationId}
                    </code>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  ‹ Önceki
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  Sonraki ›
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
