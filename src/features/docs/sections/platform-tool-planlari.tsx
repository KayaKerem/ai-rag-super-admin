import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface EndpointRow {
  method: string
  path: string
  purpose: string
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/platform/tool-plans',                   purpose: 'Tüm planlar + kayıtlı tool metadata' },
  { method: 'PUT', path: '/platform/tool-plans',                   purpose: 'Plan CRUD + defaultPlan ayarla' },
  { method: 'GET', path: '/platform/companies/:id/tool-config',    purpose: 'Firma plan + override + resolvedTools' },
  { method: 'PUT', path: '/platform/companies/:id/tool-config',    purpose: 'Firma plan ata + tool toggle' },
]

interface SourceRow {
  value: string
  meaning: string
}

const SOURCE_VALUES: SourceRow[] = [
  { value: 'plan',        meaning: 'Tool seçili plan içinde tanımlı' },
  { value: 'override',    meaning: 'Firma override\'ı ile açıldı veya kapatıldı' },
  { value: 'not_in_plan', meaning: 'Planda yok — UI\'de toggle için gösterilir' },
]

interface ValidationRow {
  rule: string
  detail: string
  http: string
}

const VALIDATIONS: ValidationRow[] = [
  { rule: 'Plan ID regex',       detail: '/^[a-z0-9-]{2,50}$/ — küçük harf + rakam + tire, 2-50 karakter', http: '422' },
  { rule: 'Plan label',          detail: 'Zorunlu, max 100 karakter',                                      http: '422' },
  { rule: 'Max plan sayısı',     detail: '20',                                                             http: '422' },
  { rule: 'defaultPlan varlığı', detail: 'defaultPlan plans objesinde olmalı',                             http: '422' },
  { rule: 'Tool ID',             detail: 'registeredTools\'da olmalı — ["*"] wildcard istisna',           http: '422' },
  { rule: 'Default plan silme',  detail: 'defaultPlan silinemez',                                          http: '422' },
]

export function PlatformToolPlanlari() {
  return (
    <DocsSectionCard id="platform-tool-planlari" title="Platform Tool Planları" icon="🧰">
      <p className="text-sm text-muted-foreground">
        Plan governance sistemi: registry (plan tanımları) + firma atama + tool toggle. Amaç tool erişimini plan bazında açıp kapatmak; firma seviyesinde override'a izin vermek. Tool config generic <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/companies/:id/config</code> endpoint'inden <strong>hariçtir</strong> — oraya gönderilirse <code className="rounded bg-muted px-1 py-0.5 text-xs">400</code> döner.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Endpoint'ler</div>
          <table className="w-full text-sm">
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-violet-400">{e.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">⚖️ resolvedTools — Öncelik Zinciri</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Firma <code className="rounded bg-muted px-1 py-0.5 text-xs">PricingPlan</code>'a bağlıysa: plan'ın <code className="rounded bg-muted px-1 py-0.5 text-xs">allowedTools</code>'u tek otorite. <code className="rounded bg-muted px-1 py-0.5 text-xs">toolPlanConfig</code> yok sayılır. Bkz. <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a>.</li>
            <li>Plan yoksa: <code className="rounded bg-muted px-1 py-0.5 text-xs">toolPlanConfig.plan</code> → ilgili plan'ın <code className="rounded bg-muted px-1 py-0.5 text-xs">tools</code> listesi.</li>
            <li>Üzerine <code className="rounded bg-muted px-1 py-0.5 text-xs">{`overrides: { toolId: boolean }`}</code> biner — true ekler, false kapatır.</li>
          </ol>
          <div className="mt-2 text-xs">
            Çalışma zamanında agent'a iletilen filtrelenmiş tool set için <a href="#agent-tool" className="underline hover:text-foreground">Agent Tool Sistemi</a>'ne bakın — orada tool'lar kullanıcı UI'sine göre gruplanmıştır; <code className="rounded bg-muted px-1 py-0.5 text-xs">registeredTools</code> raw set.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">source Değerleri — resolvedTools İçinde</div>
          <table className="w-full text-sm">
            <tbody>
              {SOURCE_VALUES.map((s) => (
                <tr key={s.value} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{s.value}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t bg-muted/10 px-3 py-2 text-xs italic text-muted-foreground">
            Not: <code className="rounded bg-muted px-1 py-0.5">enabled</code> nihai hesaptır ve <code className="rounded bg-muted px-1 py-0.5">source</code>'tan bağımsız olabilir — plan'da olan bir tool override ile kapatıldıysa <code className="rounded bg-muted px-1 py-0.5">{`{ enabled: false, source: 'plan' }`}</code> döner.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">PUT Validasyonu — plans Body</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kural</th>
                <th className="px-3 py-2 text-left">Detay</th>
                <th className="px-3 py-2 text-left">HTTP</th>
              </tr>
            </thead>
            <tbody>
              {VALIDATIONS.map((v) => (
                <tr key={v.rule} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{v.rule}</td>
                  <td className="px-3 py-2 text-muted-foreground">{v.detail}</td>
                  <td className="px-3 py-2 font-mono text-xs">{v.http}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">🔒 registeredTools — Read-Only</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">registeredTools</code> array'i backend tarafından kod düzeyinde belirlenir — super admin düzenleyemez. Tool eklemek / kaldırmak backend release'i gerektirir. Güncel liste her zaman <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /platform/tool-plans</code> response'undan alınır (Nisan 2026'da 24 tool kayıtlı).
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
