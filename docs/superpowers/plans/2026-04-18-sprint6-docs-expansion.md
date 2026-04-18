# Sprint 6 — /docs Genişletme II Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new `/docs` sections (9 → 13 total) covering firma yönetimi, platform tool planları, platform analytics, and veri kaynakları — expanding admin documentation coverage to 4 more backend areas.

**Architecture:** Each section is a standalone `.tsx` component under `src/features/docs/sections/`, wrapped in the shared `DocsSectionCard` shell. Module-scope typed const arrays render tables; shadcn `Card` primitives render callouts. Hand-built React — **no markdown renderer, no MDX**. Registry (`src/features/docs/lib/sections.ts`) wires all sections in order. Pattern mirrors Sprint 5 shipped sections.

**Tech Stack:** React 19, Vite, TypeScript (strict), Tailwind CSS, shadcn `Card`/`CardContent` primitives. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-18-sprint6-docs-expansion-design.md`

**Backend source docs (ground truth):**
- `01-companies.md` → Task 1 (firma-yonetimi)
- `03-tool-plans.md` → Task 2 (platform-tool-planlari)
- `05-analytics.md` → Task 3 (platform-analytics)
- `07-data-sources-admin.md` → Task 4 (veri-kaynaklari)

---

## File Structure

**Create (5 new files — 4 sections + nothing shared):**
- `src/features/docs/sections/firma-yonetimi.tsx`
- `src/features/docs/sections/platform-tool-planlari.tsx`
- `src/features/docs/sections/platform-analytics.tsx`
- `src/features/docs/sections/veri-kaynaklari.tsx`

**Modify (1 file):**
- `src/features/docs/lib/sections.ts` — add 4 imports + 4 array entries (9 → 13 sections)

**Do not modify:** shared shell `DocsSectionCard`, existing 9 section files, `/docs` route page.

**Commit strategy (5 atomic commits, Sprint 5 pattern):**
1. `feat(docs): add firma-yonetimi section`
2. `feat(docs): add platform-tool-planlari section`
3. `feat(docs): add platform-analytics section`
4. `feat(docs): add veri-kaynaklari section`
5. `feat(docs): register 4 new sections (9→13) — bundle +X.XX kB raw / +Y.YY kB gzipped` (actual delta filled in during task 5)

---

## Task 1: firma-yonetimi section

**Files:**
- Create: `src/features/docs/sections/firma-yonetimi.tsx`

- [ ] **Step 1: Create the section file**

Write `src/features/docs/sections/firma-yonetimi.tsx` with exactly this content:

```tsx
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
```

- [ ] **Step 2: TypeScript compile check**

Run: `npx tsc -b`

Expected: 0 errors. The file defines `FirmaYonetimi` export but is not yet imported — tsc in `-b` mode only checks referenced files, so this step is a sanity check that nothing in the file itself breaks (unused import or bad JSX).

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/firma-yonetimi.tsx
git commit -m "feat(docs): add firma-yonetimi section"
```

---

## Task 2: platform-tool-planlari section

**Files:**
- Create: `src/features/docs/sections/platform-tool-planlari.tsx`

- [ ] **Step 1: Create the section file**

Write `src/features/docs/sections/platform-tool-planlari.tsx` with exactly this content:

```tsx
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
```

- [ ] **Step 2: TypeScript compile check**

Run: `npx tsc -b`

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/platform-tool-planlari.tsx
git commit -m "feat(docs): add platform-tool-planlari section"
```

---

## Task 3: platform-analytics section

**Files:**
- Create: `src/features/docs/sections/platform-analytics.tsx`

- [ ] **Step 1: Create the section file**

Write `src/features/docs/sections/platform-analytics.tsx` with exactly this content:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface EndpointRow {
  method: string
  path: string
  query: string
  purpose: string
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/platform/companies/:id/usage',         query: '?months=1-12 (default 1)',       purpose: 'Firma aylık maliyet breakdown' },
  { method: 'GET', path: '/platform/companies/:id/usage/current', query: '—',                              purpose: 'Bu ay özet' },
  { method: 'GET', path: '/platform/usage/summary',               query: '?months=1-12 (default 1)',       purpose: 'Platform toplam maliyet' },
  { method: 'GET', path: '/platform/companies/:id/analytics',     query: '?months=1-12 (default 1)',       purpose: 'Kalite / feedback / tool kullanım' },
  { method: 'GET', path: '/platform/companies/:id/agent-metrics', query: '?windowDays=1-365 (default 30)', purpose: 'Citation / human workflow / alert' },
]

interface CostCategoryRow {
  category: string
  eventType: string
  responseKey: string
  formula: string
}

const COST_CATEGORIES: CostCategoryRow[] = [
  { category: 'ai',           eventType: 'ai_turn',             responseKey: 'ai',           formula: 'providerMetadata.openrouter.cost → computeLlmCost() fallback' },
  { category: 'ai',           eventType: 'ai_turn_cache_hit',   responseKey: 'cacheHits',    formula: '$0.00 (sıfır — cache hit)' },
  { category: 'ai',           eventType: 'web_search',          responseKey: 'webSearch',    formula: '$0.007 + $0.001 × resultCount' },
  { category: 'ai',           eventType: 'ai_rerank',           responseKey: 'rerank',       formula: '$0.0025 / sorgu (~500 token altı)' },
  { category: 'ai',           eventType: 'research_tool',       responseKey: 'research',     formula: 'Exa API + LLM token (~$0.015-0.025 / araştırma)' },
  { category: 'ai',           eventType: 'quote_prepare',       responseKey: 'quotePrepare', formula: 'LLM token (multi-step, ~$0.02-0.08 / teklif)' },
  { category: 'ai',           eventType: 'memory_auto_extract', responseKey: 'ai',           formula: 'Economy model token' },
  { category: 'ai',           eventType: 'proactive_freshness', responseKey: 'proactive',    formula: 'Economy model token (~$0.002-0.005 / çalışma)' },
  { category: 'ai',           eventType: 'proactive_gap',       responseKey: 'proactive',    formula: 'Economy model token' },
  { category: 'ai',           eventType: 'proactive_quality',   responseKey: 'proactive',    formula: 'Economy model token' },
  { category: 'storage',      eventType: '—',                   responseKey: 'storage',      formula: '(bytes / 1e9) × s3PerGbMonthUsd' },
  { category: 'cdn (legacy)', eventType: '—',                   responseKey: 'cdn',          formula: '0 (destek kaldırıldı)' },
  { category: 'trigger',      eventType: '—',                   responseKey: 'trigger',      formula: 'quantity × triggerPerTaskUsd' },
]

interface QualityRow {
  metric: string
  calc: string
  direction: string
}

const QUALITY_METRICS: QualityRow[] = [
  { metric: 'satisfactionRate', calc: 'positiveCount / totalRatings',                      direction: '↑ iyi (0-1)' },
  { metric: 'avgGroundedness',  calc: 'Turn citation dayanıklılık ortalaması',            direction: '↑ iyi (0-1)' },
  { metric: 'avgRelevance',     calc: 'Turn soru-cevap alakalılık ortalaması',            direction: '↑ iyi (0-1)' },
  { metric: 'lowQualityCount',  calc: 'groundedness < 0.5 VEYA relevance < 0.5 turn sayısı', direction: '↓ iyi' },
  { metric: 'noResultRate',     calc: 'Arama sonuç bulamayan oran',                        direction: '↓ iyi (0-1)' },
]

interface AlertRow {
  code: string
  severity: string
  trigger: string
  rowClass: string
}

const ALERTS: AlertRow[] = [
  { code: 'low_citation_coverage',      severity: 'warning',  trigger: 'Citation rate < %60',      rowClass: 'bg-amber-500/5' },
  { code: 'low_feedback_quality_score', severity: 'warning',  trigger: 'Quality score < 70 / 100', rowClass: 'bg-amber-500/5' },
  { code: 'pending_approval_backlog',   severity: 'critical', trigger: '≥ 10 bekleyen onay',       rowClass: 'bg-red-500/5' },
]

export function PlatformAnalytics() {
  return (
    <DocsSectionCard id="platform-analytics" title="Platform Analytics" icon="📊">
      <p className="text-sm text-muted-foreground">
        Üç metrik ailesi: <strong>Usage</strong> (maliyet breakdown), <strong>Analytics</strong> (kalite / feedback / tool kullanım), <strong>Agent Metrics</strong> (citation coverage / human workflow / alert). Gelir analitiği (MRR, byPlan, marginTry) <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/revenue</code> endpoint'i — ayrı bölüm için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a>'e bakın.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Endpoint'ler</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Query</th>
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
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Maliyet Kategorileri — usage response ↔ usage_events</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">eventType (DB)</th>
                <th className="px-3 py-2 text-left">Response Key (API)</th>
                <th className="px-3 py-2 text-left">Formül</th>
              </tr>
            </thead>
            <tbody>
              {COST_CATEGORIES.map((c, i) => (
                <tr key={`${c.eventType}-${i}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{c.category}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.eventType}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.responseKey}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t bg-muted/10 px-3 py-2 text-xs italic text-muted-foreground">
            Event vs key farkı: <code className="rounded bg-muted px-1 py-0.5">eventType</code> snake_case (DB satırı); response aggregation key camelCase (API). Örn. <code className="rounded bg-muted px-1 py-0.5">research_tool</code> → <code className="rounded bg-muted px-1 py-0.5">research.searchCount</code>.
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-blue-400">💨 ai_turn_cache_hit — Response Cache (Phase 1)</div>
          <div className="mt-2">
            LLM çağrılmaz — önceki benzer sorgunun cevabı serve edilir. Event $0 maliyetle yazılır. Dashboard'da <code className="rounded bg-muted px-1 py-0.5 text-xs">cacheHits.hitRate</code> (0-1) ve <code className="rounded bg-muted px-1 py-0.5 text-xs">cacheHits.estimatedSavingsUsd</code> gösterilir — tahmin: <code className="rounded bg-muted px-1 py-0.5 text-xs">SUM(tokenEstimate) × avg_token_cost</code>.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Kalite Metrikleri — /analytics Response</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Metrik</th>
                <th className="px-3 py-2 text-left">Hesap</th>
                <th className="px-3 py-2 text-left">Yön</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_METRICS.map((q) => (
                <tr key={q.metric} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{q.metric}</td>
                  <td className="px-3 py-2 text-muted-foreground">{q.calc}</td>
                  <td className="px-3 py-2 text-xs">{q.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Agent Metrics — alerts[].code</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kod</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Tetik</th>
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a) => (
                <tr key={a.code} className={`border-b last:border-b-0 ${a.rowClass}`}>
                  <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.severity}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">💰 Gelir Analitiği Ayrı Bölüm</div>
          <div className="mt-2">
            MRR (<code className="rounded bg-muted px-1 py-0.5 text-xs">mrrTry</code> / <code className="rounded bg-muted px-1 py-0.5 text-xs">mrrUsd</code>), plan bazlı dağılım (<code className="rounded bg-muted px-1 py-0.5 text-xs">byPlan</code>), kâr marjı (<code className="rounded bg-muted px-1 py-0.5 text-xs">marginTry</code>) ve TCMB kuru <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /platform/revenue</code> endpoint'inden gelir. Formül ve alan açıklaması için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: TypeScript compile check**

Run: `npx tsc -b`

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/platform-analytics.tsx
git commit -m "feat(docs): add platform-analytics section"
```

---

## Task 4: veri-kaynaklari section

**Files:**
- Create: `src/features/docs/sections/veri-kaynaklari.tsx`

- [ ] **Step 1: Create the section file**

Write `src/features/docs/sections/veri-kaynaklari.tsx` with exactly this content:

```tsx
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
```

- [ ] **Step 2: TypeScript compile check**

Run: `npx tsc -b`

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/veri-kaynaklari.tsx
git commit -m "feat(docs): add veri-kaynaklari section"
```

---

## Task 5: Registry wire-up + bundle delta

**Files:**
- Modify: `src/features/docs/lib/sections.ts` — replace entire file content

- [ ] **Step 1: Baseline bundle size measurement (pre-wire)**

Run: `npm run build`

Expected: Build succeeds. Note the `dist/assets/index-*.js` file size (raw and gzipped) from Vite's output. Record these as `BASELINE_RAW_KB` and `BASELINE_GZ_KB` for the delta calculation in Step 5.

Example Vite output line:
```
dist/assets/index-abc123.js   1,370.45 kB │ gzip: 403.12 kB
```

- [ ] **Step 2: Rewrite the registry file**

Replace the entire contents of `src/features/docs/lib/sections.ts` with exactly this:

```ts
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { AuthYetkilendirme } from '../sections/auth-yetkilendirme'
import { FirmaYonetimi } from '../sections/firma-yonetimi'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { PlatformToolPlanlari } from '../sections/platform-tool-planlari'
import { ModelDowngrade } from '../sections/model-downgrade'
import { FiyatlandirmaGelir } from '../sections/fiyatlandirma-gelir'
import { PlatformAnalytics } from '../sections/platform-analytics'
import { QuotePipeline } from '../sections/quote-pipeline'
import { FirmaConfig } from '../sections/firma-config'
import { VeriKaynaklari } from '../sections/veri-kaynaklari'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari',           title: 'Genel Mimari',             icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme',     title: 'Auth & Yetkilendirme',     icon: '🔐', Component: AuthYetkilendirme },
  { id: 'firma-yonetimi',         title: 'Firma Yönetimi',           icon: '🏢', Component: FirmaYonetimi },
  { id: 'mesaj-akisi',            title: 'Mesaj İşlem Akışı',        icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool',             title: 'Agent Tool Sistemi',       icon: '🛠️', Component: AgentTool },
  { id: 'platform-tool-planlari', title: 'Platform Tool Planları',   icon: '🧰', Component: PlatformToolPlanlari },
  { id: 'model-downgrade',        title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir',    title: 'Fiyatlandırma & Gelir',    icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'platform-analytics',     title: 'Platform Analytics',       icon: '📊', Component: PlatformAnalytics },
  { id: 'quote-pipeline',         title: 'Quote Pipeline',           icon: '📄', Component: QuotePipeline },
  { id: 'firma-config',           title: 'Firma Config Referansı',   icon: '⚙️', Component: FirmaConfig },
  { id: 'veri-kaynaklari',        title: 'Veri Kaynakları',          icon: '🔌', Component: VeriKaynaklari },
  { id: 'sorun-giderme',          title: 'Sorun Giderme',            icon: '🔧', Component: SorunGiderme },
]
```

- [ ] **Step 3: TypeScript compile check**

Run: `npx tsc -b`

Expected: 0 errors. All 4 new imports resolve (files created in Tasks 1–4).

- [ ] **Step 4: Production build — measure delta**

Run: `npm run build`

Expected: Build succeeds. Note the new `dist/assets/index-*.js` size. Compute:
- `DELTA_RAW_KB = NEW_RAW_KB - BASELINE_RAW_KB`
- `DELTA_GZ_KB = NEW_GZ_KB - BASELINE_GZ_KB`

Spec estimate: +25 kB raw / +5 kB gzipped. If `DELTA_RAW_KB > 40`, flag for Sprint 7 lazy-route discussion (do not block this commit).

- [ ] **Step 5: Commit with actual delta values**

```bash
git add src/features/docs/lib/sections.ts
git commit -m "feat(docs): register 4 new sections (9→13) — bundle +<DELTA_RAW_KB> kB raw / +<DELTA_GZ_KB> kB gzipped"
```

Replace `<DELTA_RAW_KB>` and `<DELTA_GZ_KB>` with the actual measured values from Step 4 (2 decimal places, e.g., `+24.74`).

- [ ] **Step 6: Manual QA — dev server**

Run: `npm run dev`

Open the `/docs` route in a browser and verify the manual QA checklist from the spec:
- 13 sections render in order (genel-mimari → sorun-giderme, with 4 new sections interleaved)
- TOC sidebar (lg+ viewport) shows 13 entries, scroll-spy highlights active section
- Direct anchor URLs work: `/docs#firma-yonetimi`, `/docs#platform-tool-planlari`, `/docs#platform-analytics`, `/docs#veri-kaynaklari`
- 6 new cross-ref links navigate correctly (with `scroll-mt-20` offset):
  - `firma-yonetimi` PATCH table trust-level row → `#firma-config`
  - `firma-yonetimi` billing events `plan_*` rows → `#fiyatlandirma-gelir`
  - `platform-tool-planlari` resolve callout → `#fiyatlandirma-gelir` + `#agent-tool`
  - `platform-analytics` revenue callout → `#fiyatlandirma-gelir`
  - `veri-kaynaklari` crawler config callout → `#firma-config`
- Keyboard Tab: links focusable, focus-visible ring renders
- Mobile (<lg): TOC hidden, sections stack vertically
- Console: 0 errors

If any check fails, fix in a follow-up commit before pushing.

---

## Self-Review Completed

**Spec coverage:** All 4 new sections from spec §"Yeni Bölümler" have tasks. Registry §"Registry Güncellemesi" → Task 5. Cross-refs §"Cross-reference Linkleri" all present (6 anchors wired in Tasks 1, 3, 4 content). Test plan §"Test & Doğrulama Planı" → Step 6 of Task 5. No gaps.

**Placeholder scan:** No "TBD" / "TODO" / "implement later". Step 5 of Task 5 has `<DELTA_RAW_KB>` / `<DELTA_GZ_KB>` — these are explicitly substitution markers with instructions to measure in Step 4.

**Type consistency:** Component names across imports match exports: `FirmaYonetimi` / `PlatformToolPlanlari` / `PlatformAnalytics` / `VeriKaynaklari`. Registry `id` strings match `DocsSectionCard id=...` props in each section (verified against each section's JSX). `DOCS_SECTIONS` array type matches existing `DocsSection` interface — no change to shape.
