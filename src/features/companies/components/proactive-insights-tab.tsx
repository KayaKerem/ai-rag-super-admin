import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { useProactiveInsights, useProactiveInsightSummary, useUpdateInsightStatus } from '../hooks/use-proactive-insights'
import { formatDate } from '@/lib/utils'
import type { ProactiveInsight } from '../types'

interface ProactiveInsightsTabProps {
  companyId: string
}

const agentIcons: Record<string, string> = {
  freshness: '🔄',
  gap: '🕳️',
  quality: '📊',
}

const statusColors: Record<string, string> = {
  new: 'destructive',
  acknowledged: 'default',
  resolved: 'secondary',
  dismissed: 'outline',
}

const categoryLabels: Record<string, string> = {
  content_changed: 'İçerik Değişti',
  url_unreachable: 'URL Erişilemez',
  unanswered_topic: 'Cevaplanmamış Konu',
  citation_drop: 'Kaynak Düşüşü',
  satisfaction_drop: 'Memnuniyet Düşüşü',
}

export function ProactiveInsightsTab({ companyId }: ProactiveInsightsTabProps) {
  const [agentType, setAgentType] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  const { data: summary } = useProactiveInsightSummary(companyId)
  const { data, isLoading } = useProactiveInsights(companyId, {
    agentType: agentType || undefined,
    status: status || undefined,
  })
  const updateStatus = useUpdateInsightStatus(companyId)

  function handleAction(insight: ProactiveInsight, newStatus: 'acknowledged' | 'resolved' | 'dismissed') {
    updateStatus.mutate({ insightId: insight.id, status: newStatus })
  }

  return (
    <div>
      {/* Summary KPIs */}
      {summary && (
        <div className="mb-4 grid grid-cols-4 gap-3">
          <KpiCard label="Yeni" value={String(summary.new)} subtitleColor="text-red-400" />
          <KpiCard label="İncelendi" value={String(summary.acknowledged)} />
          <KpiCard label="Çözüldü" value={String(summary.resolved)} />
          <KpiCard label="Reddedildi" value={String(summary.dismissed)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <Select value={agentType} onValueChange={(v: string | null) => setAgentType(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tüm Agentlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="freshness">Freshness</SelectItem>
            <SelectItem value="gap">Gap</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tüm Durumlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tümü</SelectItem>
            <SelectItem value="new">Yeni</SelectItem>
            <SelectItem value="acknowledged">İncelendi</SelectItem>
            <SelectItem value="resolved">Çözüldü</SelectItem>
            <SelectItem value="dismissed">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insight Cards */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : !data?.items?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Proaktif agentlar kapalı veya henüz insight üretilmedi.
            <br />
            <span className="text-xs">Konfigürasyon tab'ından proaktif agentları etkinleştirin.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="flex items-start gap-3 py-3">
                <span className="mt-0.5 text-lg">{agentIcons[insight.agentType] ?? '🔮'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{insight.title}</span>
                    <Badge variant={statusColors[insight.status] as any} className="text-[10px]">
                      {insight.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {categoryLabels[insight.category] ?? insight.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(insight.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {insight.status === 'new' && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(insight, 'acknowledged')}>
                        İncele
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleAction(insight, 'dismissed')}>
                        Reddet
                      </Button>
                    </>
                  )}
                  {insight.status === 'acknowledged' && (
                    <>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAction(insight, 'resolved')}>
                        Çözüldü
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleAction(insight, 'dismissed')}>
                        Reddet
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-2">
            {data.total} insight toplam
          </p>
        </div>
      )}
    </div>
  )
}
