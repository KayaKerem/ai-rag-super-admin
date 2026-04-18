import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface PlanFieldRow {
  field: string
  type: string
  desc: string
  crossRef?: { id: string; label: string }
}

const PLAN_FIELDS: PlanFieldRow[] = [
  { field: 'monthlyPriceTry',             type: 'number / null', desc: 'Aylık fiyat (TRY). null = kurumsal / iletişime geçin' },
  { field: 'includedUsers',               type: 'int',           desc: 'Baz fiyata dahil kullanıcı sayısı' },
  { field: 'extraUserPriceTry',           type: 'number / null', desc: 'Dahil kullanıcı sonrası her ek kullanıcı başı ek ücret' },
  { field: 'budgetUsd',                   type: 'number',        desc: 'Aylık AI bütçesi (USD, >= 0.01)' },
  { field: 'budgetDowngradeThresholdPct', type: 'int (1-100)',   desc: 'Normal → Standard downgrade eşiği (default 80)', crossRef: { id: 'model-downgrade', label: 'Model Downgrade' } },
  { field: 'maxStorageGb',                type: 'number',        desc: 'Maksimum depolama (GB)' },
  { field: 'maxFileSizeMb',               type: 'int',           desc: 'Maksimum dosya boyutu (MB)' },
  { field: 'allowedModels',               type: 'array',         desc: 'İzin verilen AI modelleri — [{ id, label }]' },
  { field: 'allowedTools',                type: 'array',         desc: 'İzin verilen tool\'lar. ["*"] = tümü' },
  { field: 'isActive',                    type: 'boolean',       desc: 'Plan aktif mi' },
]

interface ActionRow {
  action: string
  rule: string
  effective: string
  rowClass: string
}

const ACTIONS: ActionRow[] = [
  { action: 'upgraded',            rule: 'Yeni plan fiyatı > mevcut',  effective: 'Anlık + prorate hesaplanır',                 rowClass: 'bg-emerald-500/5' },
  { action: 'downgrade_scheduled', rule: 'Yeni plan fiyatı <= mevcut', effective: 'Bir sonraki fatura döneminde uygulanır',     rowClass: 'bg-amber-500/5' },
  { action: 'no_change',           rule: 'Aynı plan zaten atanmış',    effective: 'İşlem yapılmaz',                             rowClass: '' },
  { action: 'removed',             rule: 'planId: null gönderildi',    effective: 'Firma plansız hale gelir (saf config modu)', rowClass: 'bg-zinc-500/5' },
]

export function FiyatlandirmaGelir() {
  return (
    <DocsSectionCard id="fiyatlandirma-gelir" title="Fiyatlandırma & Gelir" icon="💰">
      <p className="text-sm text-muted-foreground">
        Platform seviyesinde plan tanımları yapılır, firmalar planlara atanır, billing döngüsü <code className="rounded bg-muted px-1 py-0.5 text-xs">company.createdAt</code>'a göre işler. MRR ve kâr marjı planlardan otomatik hesaplanır.
      </p>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-blue-400">Billing Döngüsü</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li><strong>Trial (14 gün):</strong> Firma oluşumundan itibaren — tüm plan özellikleri aktif, bütçe dahil.</li>
            <li><strong>Normal dönem:</strong> Trial sonrası her 30 günde bir bütçe ve kullanım sayaçları sıfırlanır.</li>
            <li><strong>Örnek:</strong> 15 Mart açılış → trial 29 Mart'ta biter → ilk dönem 29 Mar – 28 Apr → ikinci 28 Apr – 28 May.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Plan Alanları</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Alan</th>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FIELDS.map((f) => (
                <tr key={f.field} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{f.field}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
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

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Plan Geçiş Aksiyonları — PUT /platform/companies/:id/plan</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Tetikleyen Kural</th>
                <th className="px-3 py-2 text-left">Efektif Ne Zaman</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((a) => (
                <tr key={a.action} className={`border-b last:border-b-0 ${a.rowClass}`}>
                  <td className="px-3 py-2 font-mono text-xs">{a.action}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.rule}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.effective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">MRR Formülü</div>
          <pre className="mt-2 overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs">
{`companyMrr = monthlyPriceTry + max(0, userCount - includedUsers) * extraUserPriceTry`}
          </pre>
          <div className="mt-2 text-xs">
            <code className="rounded bg-muted px-1 py-0.5">monthlyPriceTry = null</code> (kurumsal) planlar MRR'a <code className="rounded bg-muted px-1 py-0.5">0</code> olarak dahil edilir. USD dönüşüm TCMB kuru (1 saat cache) üzerinden.
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">⏰ Otomatik Downgrade Cron</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /internal/process-downgrades</code> endpoint'i yeni fatura dönemi başladığında <code className="rounded bg-muted px-1 py-0.5 text-xs">pendingPlanId</code> olan firmaların downgrade'ini uygular. <code className="rounded bg-muted px-1 py-0.5 text-xs">X-AI-Internal-Key</code> header ile korunur. Önerilen zamanlama: <strong>her gün 01:00 UTC</strong>.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
