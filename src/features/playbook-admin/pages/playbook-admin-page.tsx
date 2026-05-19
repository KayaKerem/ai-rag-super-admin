import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy } from 'lucide-react'
import { useRecomputePlaybookStatus } from '../hooks/use-playbook-admin'
import { isSyncRecomputeResponse, type RecomputePlaybookResponse } from '../types'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'

type AdminTab = 'single' | 'batch'

const TAB_FILTER = {
  defaults: { tab: 'single' as AdminTab },
  parse: (p: URLSearchParams): { tab: AdminTab } => ({
    tab: p.get('tab') === 'batch' ? 'batch' : 'single',
  }),
  serialize: (v: { tab: AdminTab }): Record<string, string | undefined> => ({
    tab: v.tab === 'single' ? undefined : v.tab,
  }),
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  needs_review: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export function PlaybookAdminPage() {
  const [{ tab }, setFilters] = useUrlFilterState(TAB_FILTER)

  return (
    <div className="space-y-4 p-6">
      <header>
        <h1 className="text-xl font-bold">Playbook Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Section status recompute (idempotent) ve company-level batch trigger.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v: string | null) => setFilters({ tab: (v as AdminTab) ?? 'single' })}>
        <TabsList>
          <TabsTrigger value="single">Tek Playbook</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4">
          <SinglePlaybookTab />
        </TabsContent>
        <TabsContent value="batch" className="mt-4">
          <BatchTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SinglePlaybookTab() {
  const [playbookId, setPlaybookId] = useState('')
  const [result, setResult] = useState<RecomputePlaybookResponse | null>(null)
  const recompute = useRecomputePlaybookStatus()

  function handleRun() {
    const trimmed = playbookId.trim()
    if (!trimmed) return
    recompute.mutate(
      { playbookId: trimmed },
      {
        onSuccess: (data) => {
          setResult(data)
          toast.success('Recompute tamamlandı')
        },
        onError: () => toast.error('Recompute başarısız'),
      },
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="playbookId">Playbook ID</Label>
          <Input
            id="playbookId"
            value={playbookId}
            onChange={(e) => setPlaybookId(e.target.value)}
            placeholder="UUID girin"
          />
          <p className="text-[10px] text-muted-foreground">
            Boş bırakılırsa istek gönderilmez. Tek playbook senkron çalışır, section status&apos;ları döner.
          </p>
        </div>
        <Button onClick={handleRun} disabled={!playbookId.trim() || recompute.isPending} size="sm">
          {recompute.isPending ? 'Hesaplanıyor...' : 'Yeniden Hesapla'}
        </Button>

        {result && isSyncRecomputeResponse(result) && (
          <div className="rounded-md border bg-card">
            <div className="border-b px-3 py-2">
              <p className="text-xs font-medium">Sonuç</p>
              <p className="text-[10px] text-muted-foreground">Playbook: {result.playbookId}</p>
            </div>
            <div className="divide-y">
              {Object.entries(result.sectionStatuses).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-xs">{key}</span>
                  <Badge variant="outline" className={STATUS_COLORS[status] ?? ''}>
                    {status}
                  </Badge>
                </div>
              ))}
              {Object.keys(result.sectionStatuses).length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Section bulunamadı.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BatchTab() {
  const [companyId, setCompanyId] = useState('')
  const [result, setResult] = useState<RecomputePlaybookResponse | null>(null)
  const recompute = useRecomputePlaybookStatus()

  function handleRun() {
    const trimmed = companyId.trim()
    const body: { companyId?: string } = {}
    if (trimmed) body.companyId = trimmed
    recompute.mutate(body, {
      onSuccess: (data) => {
        setResult(data)
        toast.success('Batch tetiklendi')
      },
      onError: () => toast.error('Batch tetikleme başarısız'),
    })
  }

  async function copyTriggerRunId() {
    if (!result || isSyncRecomputeResponse(result)) return
    try {
      await navigator.clipboard.writeText(result.triggerRunId)
      toast.success('Kopyalandı')
    } catch {
      toast.error('Kopyalama başarısız')
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="companyId">Şirket ID</Label>
          <Input
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Boş = tüm şirketler"
          />
          <p className="text-[10px] text-muted-foreground">
            UUID girilirse o şirketin playbook&apos;ları batch&apos;e alınır. Boşsa global batch tetiklenir.
            Async — Trigger.dev üzerinden takip edin.
          </p>
        </div>
        <Button onClick={handleRun} disabled={recompute.isPending} size="sm">
          {recompute.isPending ? 'Tetikleniyor...' : 'Batch Başlat'}
        </Button>

        {result && !isSyncRecomputeResponse(result) && (
          <div className="rounded-md border bg-card p-3 space-y-2">
            <p className="text-xs font-medium">Trigger Run ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">{result.triggerRunId}</code>
              <Button variant="outline" size="sm" onClick={copyTriggerRunId}>
                <Copy className="mr-1 h-3 w-3" /> Kopyala
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Trigger.dev panelinde bu ID ile run&apos;ı izleyebilirsiniz.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
