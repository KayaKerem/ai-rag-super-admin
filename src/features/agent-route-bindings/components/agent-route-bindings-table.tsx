import { Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AgentLabel } from './agent-label'
import type { AgentRouteBinding } from '../types'

interface AgentRouteBindingsTableProps {
  rows: AgentRouteBinding[]
  onRowClick: (row: AgentRouteBinding) => void
  onDelete: (row: AgentRouteBinding) => void
}

export function AgentRouteBindingsTable({ rows, onRowClick, onDelete }: AgentRouteBindingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Bu filtreyle eşleşen binding yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Kanal</TableHead>
            <TableHead>Peer Türü</TableHead>
            <TableHead>Peer ID</TableHead>
            <TableHead>Roller</TableHead>
            <TableHead className="text-right">Öncelik</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                <AgentLabel agentId={row.agentId} />
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.channel}</code>
              </TableCell>
              <TableCell className="capitalize">{row.peerKind}</TableCell>
              <TableCell>
                {row.peerId === null ? (
                  <span className="text-xs text-muted-foreground">ANY</span>
                ) : (
                  <code className="text-xs">{row.peerId}</code>
                )}
              </TableCell>
              <TableCell>
                {row.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Hepsi</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {row.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.priority}</TableCell>
              <TableCell className="w-12">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(row)
                  }}
                  aria-label="Bindingi sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
