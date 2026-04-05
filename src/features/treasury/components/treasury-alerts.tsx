import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTreasuryAlerts, useAcknowledgeAlert } from '../hooks/use-treasury'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AlertSeverity } from '../types'

const severityConfig: Record<AlertSeverity, { label: string; className: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  WARNING: { label: 'WARNING', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  INFO: { label: 'INFO', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

export function TreasuryAlerts() {
  const [severity, setSeverity] = useState<string>('')
  const [showAcknowledged, setShowAcknowledged] = useState(false)

  const { data: alerts, isLoading } = useTreasuryAlerts(
    severity || undefined,
    showAcknowledged ? 'true' : 'false'
  )
  const acknowledgeMutation = useAcknowledgeAlert()

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Select
          value={severity || 'all'}
          onValueChange={(v) => setSeverity(v === 'all' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumu</SelectItem>
            <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            <SelectItem value="WARNING">WARNING</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showAcknowledged ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAcknowledged(!showAcknowledged)}
        >
          {showAcknowledged ? 'Gorulenleri Goster' : 'Gorulmeyenleri Goster'}
        </Button>
      </div>

      {/* Alert cards */}
      {!alerts?.length ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Uyari bulunamadi.</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const sev = severityConfig[alert.severity]
            return (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                            sev.className
                          )}
                        >
                          {sev.label}
                        </span>
                        <Badge variant="secondary">{alert.category}</Badge>
                      </div>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {alert.acknowledgedAt ? (
                        <span className="text-xs text-green-500">
                          &#10003; {formatDate(alert.acknowledgedAt)}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={acknowledgeMutation.isPending}
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                        >
                          Gordum
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
