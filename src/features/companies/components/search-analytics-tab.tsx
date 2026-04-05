import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useSearchAnalytics } from '../hooks/use-search-analytics'

interface SearchAnalyticsTabProps {
  companyId: string
}

const windowOptions = [
  { value: '7', label: '7 gun' },
  { value: '30', label: '30 gun' },
  { value: '90', label: '90 gun' },
]

export function SearchAnalyticsTab({ companyId }: SearchAnalyticsTabProps) {
  const [windowDays, setWindowDays] = useState(30)
  const { data, isLoading } = useSearchAnalytics(companyId, windowDays)

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>
  if (!data) return <div className="text-sm text-muted-foreground">Veri bulunamadi.</div>

  const toolEntries = Object.entries(data.byTool)

  return (
    <div>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Arama Analitigi</h3>
        <Select
          value={String(windowDays)}
          onValueChange={(v: string | null) => setWindowDays(Number(v ?? '30'))}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {windowOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Sorgu</p>
            <p className="mt-1 text-lg font-bold">{data.totalQueries.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Bos Sonuc Orani</p>
            <p className="mt-1 text-lg font-bold">%{(data.emptyRate * 100).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ort. Yanit Suresi</p>
            <p className="mt-1 text-lg font-bold">{data.avgResponseTimeMs} ms</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend chart */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Gunluk Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" name="Toplam" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="empty" name="Bos" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Queries table */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">En Cok Aranan Sorgular</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorgu</TableHead>
                <TableHead className="w-24 text-right">Adet</TableHead>
                <TableHead className="w-32 text-right">Bos Oran (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topQueries.map((q) => (
                <TableRow key={q.queryText}>
                  <TableCell className="font-mono text-sm">{q.queryText}</TableCell>
                  <TableCell className="text-right">{q.count}</TableCell>
                  <TableCell className="text-right">%{(q.emptyRate * 100).toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unanswered Queries table */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            Cevapsiz Sorgular
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Icerik Eksigi</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorgu</TableHead>
                <TableHead className="w-24 text-right">Adet</TableHead>
                <TableHead className="w-40 text-right">Son Sorulan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.unansweredQueries.map((q) => (
                <TableRow key={q.queryText}>
                  <TableCell className="font-mono text-sm">{q.queryText}</TableCell>
                  <TableCell className="text-right">{q.count}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(q.lastAsked).toLocaleDateString('tr-TR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-Tool Breakdown table */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tool Bazinda Dagilim</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="w-24 text-right">Toplam</TableHead>
                <TableHead className="w-24 text-right">Bos</TableHead>
                <TableHead className="w-32 text-right">Ort. Sure (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolEntries.map(([name, stats]) => (
                <TableRow key={name}>
                  <TableCell className="font-mono text-sm">{name}</TableCell>
                  <TableCell className="text-right">{stats.total}</TableCell>
                  <TableCell className="text-right">{stats.empty}</TableCell>
                  <TableCell className="text-right">{stats.avgResponseTimeMs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Feedback Correlation table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Olumsuz Geri Bildirim Korelasyonu
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({data.feedbackCorrelation.queriesWithNegativeFeedback} sorgu olumsuz geri bildirim aldi)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorgu</TableHead>
                <TableHead className="w-32 text-right">Olumsuz</TableHead>
                <TableHead className="w-24 text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.feedbackCorrelation.topNegativeQueries.map((q) => (
                <TableRow key={q.queryText}>
                  <TableCell className="font-mono text-sm">{q.queryText}</TableCell>
                  <TableCell className="text-right text-red-400">{q.negativeCount}</TableCell>
                  <TableCell className="text-right">{q.totalCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
