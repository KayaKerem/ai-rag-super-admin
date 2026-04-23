import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { getEstimateBand, BAND_CLASSES } from '../lib/cost-health-threshold'
import type { CostByEventType, CostByModel } from '../types'

export interface CostHealthBreakdownTablesProps {
  byEventType: CostByEventType[]
  byModel: CostByModel[]
}

function EstimatePctBadge({ pct }: { pct: number }) {
  const band = getEstimateBand(pct)
  return (
    <Badge variant="outline" className={BAND_CLASSES[band]}>
      %{pct.toFixed(1)}
    </Badge>
  )
}

export function CostHealthBreakdownTables({
  byEventType,
  byModel,
}: CostHealthBreakdownTablesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Type'a Göre</CardTitle>
        </CardHeader>
        <CardContent>
          {byEventType.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Bu dönemde kayıt yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">Estimate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byEventType.map((row) => (
                  <TableRow key={row.eventType}>
                    <TableCell className="font-mono text-xs">
                      {row.eventType}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalCostUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EstimatePctBadge pct={row.estimatePct} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model'e Göre</CardTitle>
        </CardHeader>
        <CardContent>
          {byModel.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Bu dönemde kayıt yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">Estimate %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byModel.map((row) => (
                  <TableRow key={row.modelName}>
                    <TableCell className="font-mono text-xs">
                      {row.modelName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.totalCostUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <EstimatePctBadge pct={row.estimatePct} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
