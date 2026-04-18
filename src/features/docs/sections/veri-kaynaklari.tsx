import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface EndpointRow {
  method: string
  path: string
  query: string
  purpose: string
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/platform/data-source-types',          query: '—',                        purpose: 'Kayıtlı connector tipleri' },
  { method: 'GET', path: '/platform/data-sources',               query: 'type, status, companyId',  purpose: 'Tüm firmaların data source\'ları — envelope: { items, total }' },
  { method: 'GET', path: '/platform/companies/:id/data-sources', query: '—',                        purpose: 'Firma-scoped liste' },
]

interface StatusRow {
  status: string
  meaning: string
  rowClass: string
}

const STATUSES: StatusRow[] = [
  { status: 'active',  meaning: 'Sync başarılı, itemCount güncel',              rowClass: 'bg-emerald-500/5' },
  { status: 'syncing', meaning: 'Crawl çalışıyor — itemCount artabilir',        rowClass: 'bg-blue-500/5' },
  { status: 'paused',  meaning: 'Manuel durduruldu — nextSyncAt zamanlanmamış', rowClass: 'bg-zinc-500/5' },
  { status: 'error',   meaning: 'errorMessage alanı ile birlikte hata detayı',  rowClass: 'bg-red-500/5' },
]

interface FieldRow {
  field: string
  type: string
  desc: string
}

const FIELDS: FieldRow[] = [
  { field: 'id',           type: 'uuid',            desc: 'Data source kimliği' },
  { field: 'companyId',    type: 'uuid',            desc: 'Sahip firma' },
  { field: 'companyName',  type: 'string',          desc: 'Platform listesinde eager yüklenir' },
  { field: 'type',         type: 'string',          desc: 'Connector tipi (örn. website_crawler)' },
  { field: 'name',         type: 'string',          desc: 'Data source görünen adı' },
  { field: 'config',       type: 'object',          desc: 'Type-özel JSON — örn. website_crawler: { url }' },
  { field: 'status',       type: 'enum',            desc: 'active | syncing | paused | error' },
  { field: 'errorMessage', type: 'string / null',   desc: 'status=error olduğunda dolu' },
  { field: 'itemCount',    type: 'int',             desc: 'Son sync sonrası index\'lenmiş öğe sayısı' },
  { field: 'lastSyncAt',   type: 'ISO date / null', desc: 'En son sync zamanı' },
  { field: 'nextSyncAt',   type: 'ISO date / null', desc: 'Sonraki sync planı' },
  { field: 'createdAt',    type: 'ISO date',        desc: 'Oluşturulma' },
]

export function VeriKaynaklari() {
  return (
    <DocsSectionCard id="veri-kaynaklari" title="Veri Kaynakları" icon="🔌">
      <p className="text-sm text-muted-foreground">
        Connector sistemi — backend <code className="rounded bg-muted px-1 py-0.5 text-xs">website_crawler</code> gibi tipler tanımlar; firmalar kendi kaynaklarını bu tiplerle ekler. Platform admin tüm firmalardaki source'ları görüntüleyebilir (filtreli). Yazma (oluşturma / güncelleme / silme) firma panelinden yapılır — super admin read-only.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Endpoint'ler</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Query / Filtre</th>
                <th className="px-3 py-2 text-left">Amaç</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-violet-400">{e.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{e.query}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Status Değerleri</div>
          <table className="w-full text-sm">
            <tbody>
              {STATUSES.map((s) => (
                <tr key={s.status} className={`border-b last:border-b-0 ${s.rowClass}`}>
                  <td className="px-3 py-2 font-mono text-xs">{s.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Response Alanları — items[] Elemanı</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Alan</th>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => (
                <tr key={f.field} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{f.field}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">🕷️ Crawler Config (Platform Defaults)</div>
          <div className="mt-2">
            Global crawler ayarları <code className="rounded bg-muted px-1 py-0.5 text-xs">PUT /platform/config/defaults</code> body'sindeki <code className="rounded bg-muted px-1 py-0.5 text-xs">crawlerConfig</code> objesinde: <code className="rounded bg-muted px-1 py-0.5 text-xs">cloudflareAccountId</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">cloudflareApiToken</code> (GET'te maskeli), <code className="rounded bg-muted px-1 py-0.5 text-xs">maxGlobalConcurrentCrawls</code>. Her başarılı sync sonrası <code className="rounded bg-muted px-1 py-0.5 text-xs">crawl_sync</code> usage event yazılır. Firma bazlı sayfa / kaynak limiti <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.crawlMaxPages</code> ve <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.crawlMaxSources</code>'dadır — bkz. <a href="#firma-config" className="underline hover:text-foreground">Firma Config Referansı</a>.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
