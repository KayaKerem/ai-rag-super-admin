import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCompanyDataSources } from '../hooks/use-data-sources'
import { useDataSourceTypes } from '../hooks/use-data-sources'

interface DataSourcesTabProps {
  companyId: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktif', variant: 'default' },
  syncing: { label: 'Senkronize', variant: 'secondary' },
  paused: { label: 'Duraklatildi', variant: 'outline' },
  error: { label: 'Hata', variant: 'destructive' },
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '—'
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} dk once`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat once`
  const days = Math.floor(hours / 24)
  return `${days} gun once`
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DataSourcesTab({ companyId }: DataSourcesTabProps) {
  const { data, isLoading } = useCompanyDataSources(companyId)
  const { data: dsTypes } = useDataSourceTypes()

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  const items = data?.items ?? []
  const totalItems = items.reduce((s, d) => s + d.itemCount, 0)
  const errorCount = items.filter((d) => d.status === 'error').length

  const typeLabels: Record<string, string> = {}
  dsTypes?.forEach((t) => { typeLabels[t.type] = t.label })

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">Bu sirkete ait veri kaynagi bulunmuyor.</div>
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Kaynak</p>
            <p className="mt-1 text-lg font-bold">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Oge</p>
            <p className="mt-1 text-lg font-bold">{totalItems.toLocaleString('tr-TR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Hatali</p>
            <p className={`mt-1 text-lg font-bold ${errorCount > 0 ? 'text-red-400' : ''}`}>{errorCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Isim</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Oge Sayisi</TableHead>
              <TableHead>Son Sync</TableHead>
              <TableHead>Sonraki Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ds) => {
              const sc = statusConfig[ds.status] ?? statusConfig.active
              return (
                <TableRow key={ds.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{ds.name}</span>
                      {ds.status === 'error' && ds.errorMessage && (
                        <p className="mt-0.5 text-xs text-red-400">{ds.errorMessage}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabels[ds.type] ?? ds.type}</TableCell>
                  <TableCell>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{ds.itemCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(ds.lastSyncAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(ds.nextSyncAt)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
