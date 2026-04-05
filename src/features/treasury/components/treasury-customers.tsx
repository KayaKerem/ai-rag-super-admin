import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTreasuryCustomers } from '../hooks/use-treasury'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

function usageColor(pct: number): string {
  if (pct >= 90) return 'text-red-500'
  if (pct >= 70) return 'text-amber-500'
  return 'text-green-500'
}

export function TreasuryCustomers() {
  const { data: customers, isLoading } = useTreasuryCustomers()

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>
  if (!customers?.length)
    return <div className="text-sm text-muted-foreground">Musteri verisi bulunamadi.</div>

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Musteri Kullanim Tablosu</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sirket</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Aylik Butce ($)</TableHead>
              <TableHead className="text-right">Harcama ($)</TableHead>
              <TableHead className="text-right">Kullanim (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.companyId}>
                <TableCell className="font-mono text-xs">
                  {c.companyId.slice(0, 8)}...
                </TableCell>
                <TableCell>{c.planName}</TableCell>
                <TableCell className="text-right">{formatCurrency(c.monthlyBudget)}</TableCell>
                <TableCell className="text-right">{formatCurrency(c.currentSpend)}</TableCell>
                <TableCell className={cn('text-right font-semibold', usageColor(c.usagePct))}>
                  {c.usagePct.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
