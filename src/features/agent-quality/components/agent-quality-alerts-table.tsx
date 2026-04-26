import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MetricLabel } from './metric-label'
import type { AgentQualityAlertRow } from '../types'

function formatUtc(iso: string, baseIso?: string): string {
  const d = new Date(iso)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ymd = d.toISOString().slice(0, 10)
  const baseYmd = baseIso ? new Date(baseIso).toISOString().slice(0, 10) : ymd
  return ymd === baseYmd
    ? `${hh}:${mm} UTC`
    : `${ymd.slice(5)} ${hh}:${mm} UTC`
}

export interface AgentQualityAlertsTableProps {
  rows: AgentQualityAlertRow[]
  onRowClick: (row: AgentQualityAlertRow) => void
}

export function AgentQualityAlertsTable({
  rows,
  onRowClick,
}: AgentQualityAlertsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Aktif alarm yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şirket</TableHead>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">Value / Threshold</TableHead>
            <TableHead className="text-right">Turns</TableHead>
            <TableHead>Fired</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() => onRowClick(row)}
            >
              <TableCell className="font-medium">
                {row.companyName ?? <i>(adı yok)</i>}
              </TableCell>
              <TableCell>
                <MetricLabel metric={row.metric} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(row.value * 100).toFixed(1)}% /{' '}
                {(row.threshold * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.assistantTurns}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatUtc(row.firedAt)}
              </TableCell>
              <TableCell>
                {row.resolvedAt ? (
                  <Badge variant="secondary">
                    Resolved {formatUtc(row.resolvedAt, row.firedAt)}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Open</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
