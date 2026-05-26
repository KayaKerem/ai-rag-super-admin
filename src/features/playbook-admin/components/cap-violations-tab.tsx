import { subDays } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { formatDate } from '@/lib/utils'
import { useCapViolationsAggregate } from '../hooks/use-cap-violations-aggregate'

type DatePreset = '7d' | '30d' | '90d'

interface CapViolationsFilters {
  preset: DatePreset
  companyId: string
  capKind: string
  source: string
}

const CAP_FILTER = {
  defaults: {
    preset: '7d' as DatePreset,
    companyId: '',
    capKind: '',
    source: '',
  } as CapViolationsFilters,
  parse: (p: URLSearchParams): CapViolationsFilters => {
    const rawPreset = p.get('cvPreset') ?? '7d'
    const preset: DatePreset = (['7d', '30d', '90d'] as const).includes(rawPreset as DatePreset)
      ? (rawPreset as DatePreset)
      : '7d'
    return {
      preset,
      companyId: p.get('cvCompanyId') ?? '',
      capKind: p.get('cvCapKind') ?? '',
      source: p.get('cvSource') ?? '',
    }
  },
  serialize: (v: CapViolationsFilters): Record<string, string | undefined> => ({
    cvPreset: v.preset === '7d' ? undefined : v.preset,
    cvCompanyId: v.companyId || undefined,
    cvCapKind: v.capKind || undefined,
    cvSource: v.source || undefined,
  }),
}

function resolvePresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date()
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  return {
    from: subDays(now, days).toISOString(),
    to: now.toISOString(),
  }
}

const MODE_COLORS: Record<string, string> = {
  enforced: 'bg-red-500/10 text-red-700 dark:text-red-400',
  warn: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'dry-run': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

export function CapViolationsTab() {
  const [filters, setFilters] = useUrlFilterState(CAP_FILTER)
  const { preset, companyId, capKind, source } = filters

  const range = resolvePresetRange(preset)

  const { data, isLoading, isError } = useCapViolationsAggregate({
    from: range.from,
    to: range.to,
    companyId: companyId || undefined,
    capKind: capKind || undefined,
    source: source || undefined,
  })

  const effectiveMode =
    companyId && data?.effectiveModeByCompany
      ? data.effectiveModeByCompany[companyId]
      : undefined

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Tarih Aralığı</Label>
              <Select
                value={preset}
                onValueChange={(v: string | null) =>
                  setFilters({ ...filters, preset: (v ?? '7d') as DatePreset })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Son 7 Gün</SelectItem>
                  <SelectItem value="30d">Son 30 Gün</SelectItem>
                  <SelectItem value="90d">Son 90 Gün</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cv-company-id">Şirket ID</Label>
              <Input
                id="cv-company-id"
                value={companyId}
                onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                placeholder="UUID (opsiyonel)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cv-cap-kind">Cap Kind</Label>
              <Input
                id="cv-cap-kind"
                value={capKind}
                onChange={(e) => setFilters({ ...filters, capKind: e.target.value })}
                placeholder="monthly_token_cap, ..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cv-source">Source</Label>
              <Input
                id="cv-source"
                value={source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                placeholder="tenant, agent, ..."
              />
            </div>
          </div>

          {effectiveMode && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Effective Mode:</span>
              <Badge variant="outline" className={MODE_COLORS[effectiveMode] ?? ''}>
                {effectiveMode}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          )}

          {isError && (
            <div className="px-4 py-8 text-center text-sm text-destructive">
              Veriler yüklenirken hata oluştu.
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {data.rows.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Bu aralıkta cap violation yok
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cap Kind</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Son İhlal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, i) => (
                      <TableRow key={`${row.capKind}-${row.source}-${i}`}>
                        <TableCell className="font-mono text-xs">{row.capKind}</TableCell>
                        <TableCell className="font-mono text-xs">{row.source}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(row.lastViolationAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
