import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatCurrencyTry } from '@/lib/utils'
import type { RevenueData } from '@/features/companies/types'

interface RevenueSummaryProps {
  data: RevenueData
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gelir Özeti</CardTitle>
        <p className="text-xs text-muted-foreground">
          1 USD = {data.exchangeRate} TRY ({data.exchangeRateSource === 'tcmb' ? 'TCMB' : 'Fallback'})
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">MRR (TRY)</div>
            <div className="text-lg font-bold">{formatCurrencyTry(data.mrrTry)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">MRR (USD)</div>
            <div className="text-lg font-bold">{formatCurrency(data.mrrUsd)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">Brüt Kâr (TRY)</div>
            <div className="text-lg font-bold text-green-400">{formatCurrencyTry(data.marginTry)}</div>
          </div>
        </div>

        {data.byPlan.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Firma</TableHead>
                <TableHead className="text-right">Kullanıcı</TableHead>
                <TableHead className="text-right">Baz MRR</TableHead>
                <TableHead className="text-right">Ek Kul. MRR</TableHead>
                <TableHead className="text-right">Toplam MRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byPlan.map((bp) => (
                <TableRow key={bp.planId}>
                  <TableCell className="font-medium">{bp.planName}</TableCell>
                  <TableCell className="text-right">{bp.companyCount}</TableCell>
                  <TableCell className="text-right">{bp.userCount}</TableCell>
                  <TableCell className="text-right">{formatCurrencyTry(bp.planMrrTry)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyTry(bp.extraUserMrrTry)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrencyTry(bp.totalMrrTry)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
