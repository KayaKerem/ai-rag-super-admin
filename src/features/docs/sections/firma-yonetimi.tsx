import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface EndpointRow {
  method: string
  path: string
  purpose: string
  returns: string
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'POST',   path: '/platform/companies',                                    purpose: 'Yeni firma oluştur (opsiyonel planId)',            returns: 'Company' },
  { method: 'GET',    path: '/platform/companies',                                    purpose: 'Tüm firmalar (plan + pendingPlan eager)',          returns: 'Company[]' },
  { method: 'GET',    path: '/platform/companies/:id',                                purpose: 'Tek firma detayı',                                 returns: 'Company' },
  { method: 'PATCH',  path: '/platform/companies/:id',                                purpose: 'Partial güncelleme',                               returns: 'Company' },
  { method: 'DELETE', path: '/platform/companies/:id',                                purpose: 'Hard delete',                                      returns: '204' },
  { method: 'DELETE', path: '/platform/companies/:companyId/leads/:leadId/permanent', purpose: 'KVKK / GDPR kalıcı silme (async)',                 returns: '202 + { taskId, status }' },
  { method: 'PATCH',  path: '/platform/companies/:id/status',                         purpose: 'Manuel abonelik durumu değiştir',                  returns: '{ id, subscriptionStatus, statusChangedAt }' },
  { method: 'GET',    path: '/platform/companies/:id/billing-events',                 purpose: 'Abonelik / plan olay geçmişi (?limit=50 default)', returns: 'BillingEvent[]' },
]

interface PatchFieldRow {
  field: string
  type: string
  sample: string
  desc: string
  crossRef?: { id: string; label: string }
}

const PATCH_FIELDS: PatchFieldRow[] = [
  { field: 'name',                      type: 'string',        sample: '—',            desc: 'Firma adı' },
  { field: 'customerAgentTrustLevel',   type: 'enum',          sample: 'FULL_CONTROL', desc: 'Otonomi: FULL_CONTROL → AUTO_MESSAGE → AUTO_ALL_QUOTE_APPROVAL → FULLY_AUTOMATIC', crossRef: { id: 'firma-config', label: 'Firma Config' } },
  { field: 'autoApproveQuoteThreshold', type: 'number / null', sample: 'null',         desc: 'AUTO_ALL_QUOTE_APPROVAL modunda otomatik onay eşiği (USD)' },
  { field: 'approvalTimeoutMinutes',    type: 'int',           sample: '120',          desc: 'Onay bekleyen aksiyon için timeout (dakika)' },
  { field: 'approvalTimeoutAction',     type: 'enum',          sample: 'REMIND',       desc: 'Timeout aksiyonu: REMIND | AUTO_SEND | HOLD' },
]

interface BillingEventRow {
  code: string
  when: string
  crossRef: boolean
}

const BILLING_EVENTS: BillingEventRow[] = [
  { code: 'status_change',            when: 'Manuel PATCH /:id/status veya otomatik lifecycle geçişi', crossRef: false },
  { code: 'plan_upgrade',             when: 'Yeni plan fiyatı eskisinden yüksek (anlık)',              crossRef: true  },
  { code: 'plan_downgrade_scheduled', when: 'Yeni plan fiyatı düşük — sonraki döneme planlandı',       crossRef: true  },
  { code: 'plan_downgrade_executed',  when: 'Cron planlanmış downgrade uyguladı',                      crossRef: true  },
  { code: 'plan_removed',             when: 'planId: null gönderildi',                                 crossRef: true  },
  { code: 'plan_downgrade_cancelled', when: 'Planlanmış downgrade iptal edildi',                       crossRef: true  },
  { code: 'admin_override',           when: 'Platform admin manuel müdahalesi',                        crossRef: false },
]

export function FirmaYonetimi() {
  return (
    <DocsSectionCard id="firma-yonetimi" title="Firma Yönetimi" icon="🏢">
      <p className="text-sm text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/companies</code> CRUD + status lifecycle + billing-events geçmişi. Tüm endpoint'ler <code className="rounded bg-muted px-1 py-0.5 text-xs">PlatformAdminGuard</code> ile korunur. Liste endpoint'lerinde plan + pendingPlan ilişkileri eager yüklenerek döner.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Endpoint'ler</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Amaç</th>
                <th className="px-3 py-2 text-left">Dönüş</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-violet-400">{e.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.purpose}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{e.returns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">PATCH /platform/companies/:id — Alanlar</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Alan</th>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">GET Örnek</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {PATCH_FIELDS.map((f) => (
                <tr key={f.field} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{f.field}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.sample}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {f.crossRef ? (
                      <>
                        {f.desc} — bkz. <a href={`#${f.crossRef.id}`} className="underline hover:text-foreground">{f.crossRef.label}</a>
                      </>
                    ) : f.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">🔄 Status Lifecycle</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">PATCH /:id/status</code> ile yalnızca <code className="rounded bg-muted px-1 py-0.5 text-xs">active</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">suspended</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">cancelled</code> atanabilir. <code className="rounded bg-muted px-1 py-0.5 text-xs">trialing</code> ve <code className="rounded bg-muted px-1 py-0.5 text-xs">past_due</code> otomatik lifecycle'a aittir — manuel atanırsa <code className="rounded bg-muted px-1 py-0.5 text-xs">400</code> döner. Her değişiklik <code className="rounded bg-muted px-1 py-0.5 text-xs">billing_events</code>'e <code className="rounded bg-muted px-1 py-0.5 text-xs">status_change</code> kaydı ekler (<code className="rounded bg-muted px-1 py-0.5 text-xs">actorId: 'platform-admin'</code>). <code className="rounded bg-muted px-1 py-0.5 text-xs">suspended</code> / <code className="rounded bg-muted px-1 py-0.5 text-xs">cancelled</code> firmaların API erişimi <code className="rounded bg-muted px-1 py-0.5 text-xs">SubscriptionGuard</code> ile <code className="rounded bg-muted px-1 py-0.5 text-xs">403</code> döner.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Billing Event Tipleri — GET /:id/billing-events</div>
          <table className="w-full text-sm">
            <tbody>
              {BILLING_EVENTS.map((b) => (
                <tr key={b.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{b.code}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {b.crossRef ? (
                      <>
                        {b.when} — bkz. <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a>
                      </>
                    ) : b.when}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">🔒 KVKK / GDPR Kalıcı Silme</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">DELETE /:companyId/leads/:leadId/permanent</code> asenkron çalışır — response <code className="rounded bg-muted px-1 py-0.5 text-xs">202 Accepted</code> ve <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{ taskId, status: 'processing' }`}</code> döner. Silme kapsamı: lead + bağlı konuşmalar / teklifler / mesaj geçmişi cascade olarak temizlenir. Task ilerleyişi Trigger.dev üzerinden izlenir.
          </div>
        </CardContent>
      </Card>

      <p className="text-xs italic text-muted-foreground">
        Not: Backend <code className="rounded bg-muted px-1 py-0.5 text-xs">05-analytics.md</code>'nin billing-events örneğinde <code className="rounded bg-muted px-1 py-0.5 text-xs">plan_changed</code> geçiyor — kanonik enum yukarıdaki 7'li listedir, <code className="rounded bg-muted px-1 py-0.5 text-xs">plan_changed</code> dokümantasyon kalıntısı.
      </p>
    </DocsSectionCard>
  )
}
