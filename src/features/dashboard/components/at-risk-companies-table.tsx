import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { usePricingPlans } from '@/features/companies/hooks/use-pricing-plans'
import { useAtRiskCompanies } from '../hooks/use-at-risk-companies'
import { AtRiskBandBadge } from './at-risk-band-badge'

export function AtRiskCompaniesTable() {
  const navigate = useNavigate()
  const { data, totals, isLoading, isError } = useAtRiskCompanies()
  const { data: plans } = usePricingPlans()

  const planNameById = new Map((plans ?? []).map((p) => [p.id, p.name]))

  const goToCompany = (id: string) => navigate(`/companies/${id}`)

  const exhaustedShown = data?.filter((c) => c.band === 'exhausted').length ?? 0
  const economyShown = data?.filter((c) => c.band === 'economy').length ?? 0
  const isTruncated =
    !!data &&
    (totals.exhausted > exhaustedShown || totals.economy > economyShown)

  return (
    <Card aria-label="Bütçesi tehlikedeki firmalar listesi">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bütçesi Tehlikedeki Firmalar</CardTitle>
        {data && data.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {data.length} firma ≥ %95 bütçe kullanımında
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isError && (
          <div className="text-sm text-destructive">Yüklenemedi</div>
        )}

        {!isError && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {!isError && !isLoading && data && data.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Tüm firmalar güvenli bantta</span>
          </div>
        )}

        {!isError && !isLoading && data && data.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Bütçe</TableHead>
                  <TableHead className="text-right">Harcama</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Band</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    role="link"
                    tabIndex={0}
                    onClick={() => goToCompany(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToCompany(c.id)
                      }
                    }}
                    aria-label={`${c.name} — Usage detayına git`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.planId ? planNameById.get(c.planId) ?? '—' : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.budgetUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(c.currentSpendUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      %{c.spendPct.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <AtRiskBandBadge band={c.band} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isTruncated && (
              <p className="mt-2 text-xs text-muted-foreground">
                İlk 100 firma gösteriliyor (toplam: {totals.exhausted} exhausted,{' '}
                {totals.economy} economy)
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
