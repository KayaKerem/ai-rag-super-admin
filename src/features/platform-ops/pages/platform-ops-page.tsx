import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { CronCatalogTab } from '../components/cron-catalog-tab'
import { TranslationInfoTab } from '../components/translation-info-tab'

type OpsTab = 'cron-catalog' | 'translation-info'

const TAB_FILTER = {
  defaults: { tab: 'cron-catalog' as OpsTab },
  parse: (p: URLSearchParams): { tab: OpsTab } => {
    const raw = p.get('tab')
    if (raw === 'translation-info') return { tab: 'translation-info' }
    return { tab: 'cron-catalog' }
  },
  serialize: (v: { tab: OpsTab }): Record<string, string | undefined> => ({
    tab: v.tab === 'cron-catalog' ? undefined : v.tab,
  }),
}

export function PlatformOpsPage() {
  const [{ tab }, setFilters] = useUrlFilterState(TAB_FILTER)

  return (
    <div className="space-y-4 p-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Ops</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Backend `/internal/*` cron katalog ve translation system referansı. Static içerik —
          backend doc 24/25 ile senkron.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v: string | null) => setFilters({ tab: (v as OpsTab) ?? 'cron-catalog' })}>
        <TabsList>
          <TabsTrigger value="cron-catalog">Cron Catalog</TabsTrigger>
          <TabsTrigger value="translation-info">Translation</TabsTrigger>
        </TabsList>
        <TabsContent value="cron-catalog" className="mt-4">
          <CronCatalogTab />
        </TabsContent>
        <TabsContent value="translation-info" className="mt-4">
          <TranslationInfoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
