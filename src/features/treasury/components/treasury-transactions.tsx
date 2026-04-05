import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTreasuryTransactions } from '../hooks/use-treasury'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TransactionType } from '../types'

const typeLabels: Record<TransactionType, string> = {
  deposit_aave: 'Aave Yatirim',
  withdraw_aave: 'Aave Cekim',
  deposit_benqi: 'BENQI Yatirim',
  withdraw_benqi: 'BENQI Cekim',
  wallet_inflow: 'Cuzdan Giris',
  wallet_outflow: 'Cuzdan Cikis',
  openrouter_topup_detected: 'OpenRouter Top-up',
}

const LIMIT = 20

export function TreasuryTransactions() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const { data, isLoading } = useTreasuryTransactions(
    page,
    LIMIT,
    typeFilter || undefined
  )

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Islemler</CardTitle>
          <Select
            value={typeFilter || 'all'}
            onValueChange={(v) => {
              setTypeFilter(v === 'all' ? '' : (v ?? ''))
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tumu</SelectItem>
              {Object.entries(typeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {!data?.items.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Islem bulunamadi.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Tutar (USDC)</TableHead>
                  <TableHead>Protokol</TableHead>
                  <TableHead>TX Hash</TableHead>
                  <TableHead>Tetikleyen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {typeLabels[tx.type] ?? tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(tx.amountUsdc)}
                    </TableCell>
                    <TableCell>{tx.protocol ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.txHash ? `${tx.txHash.slice(0, 10)}...` : '-'}
                    </TableCell>
                    <TableCell className="text-xs">{tx.triggeredBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Onceki
              </Button>
              <span className="text-xs text-muted-foreground">
                Sayfa {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
