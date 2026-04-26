import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency } from '@/lib/utils'
import { RatePill } from './rate-pill'
import type { AgentQualitySnapshotRow } from '../types'

export interface AgentQualitySnapshotTableProps {
  rows: AgentQualitySnapshotRow[]
  selectedCompanyId: string | null
  onSelect: (companyId: string) => void
  showLowSignal: boolean
}

function pickPrimaryRole(costByRole: Record<string, number>): string {
  let best = ''
  let max = 0
  for (const [role, value] of Object.entries(costByRole)) {
    if (value > max) {
      max = value
      best = role
    }
  }
  return best || '—'
}

export function AgentQualitySnapshotTable({
  rows,
  selectedCompanyId,
  onSelect,
  showLowSignal,
}: AgentQualitySnapshotTableProps) {
  const visible = useMemo(() => {
    if (showLowSignal) return rows
    return rows.filter((r) => !r.lowSignal)
  }, [rows, showLowSignal])

  if (visible.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Henüz kalite verisi yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şirket</TableHead>
            <TableHead className="text-right">Turns</TableHead>
            <TableHead className="text-right">Guardrail</TableHead>
            <TableHead className="text-right">Retry</TableHead>
            <TableHead className="text-right">Follow-Up</TableHead>
            <TableHead className="text-right">Retr Q</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Primary Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => (
            <TableRow
              key={row.companyId}
              data-state={
                selectedCompanyId === row.companyId ? 'selected' : undefined
              }
              onClick={() => onSelect(row.companyId)}
              className={cn(
                'cursor-pointer',
                row.lowSignal && 'opacity-60'
              )}
            >
              <TableCell className="font-medium">
                {row.companyName ?? <i>(adı yok)</i>}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.assistantTurns}
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.guardrailFireRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.retryExhaustedRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill value={row.lowSignal ? null : row.forceFollowUpRate} />
              </TableCell>
              <TableCell className="text-right">
                <RatePill
                  value={
                    row.lowSignal
                      ? null
                      : row.retrievalQualityBySource.aggregate
                  }
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(row.totalCostUsd)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {pickPrimaryRole(row.costByRole)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
