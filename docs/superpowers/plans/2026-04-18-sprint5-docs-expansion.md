# Sprint 5 — /docs Genişletme: 4 Yeni Bölüm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new hand-built React docs sections (auth-yetkilendirme, fiyatlandirma-gelir, quote-pipeline, firma-config) to `/docs`, register them in `DOCS_SECTIONS`, wire cross-reference anchor links. Total: 9 /docs sections after completion.

**Architecture:** Hybrid mode — 3 operational-synthesis sections (auth, pricing, quotes) + 1 API-quickref (firma-config, field tables). Each section is a standalone `*.tsx` under `src/features/docs/sections/`, using the shared `DocsSectionCard` shell. No markdown renderer. No lazy-load route (defer to Sprint 6+ based on bundle delta). 5 atomic commits: one per new section + one registry/cross-ref wire-up.

**Tech Stack:** React 19 + Vite + Tailwind + shadcn Card primitives. TypeScript strict. No new deps.

**Spec:** `docs/superpowers/specs/2026-04-18-sprint5-docs-expansion-design.md`

---

## File Structure

**Create:**
- `src/features/docs/sections/auth-yetkilendirme.tsx`
- `src/features/docs/sections/fiyatlandirma-gelir.tsx`
- `src/features/docs/sections/quote-pipeline.tsx`
- `src/features/docs/sections/firma-config.tsx`

**Modify:**
- `src/features/docs/sections/model-downgrade.tsx` — add one inline `<a href="#fiyatlandirma-gelir">` in amber callout
- `src/features/docs/lib/sections.ts` — import 4 new sections + register in `DOCS_SECTIONS` array (new order inserts auth after genel-mimari; pricing/quotes/firma-config before sorun-giderme)

**No new test files** — existing 5 sections have no tests (static content); pattern preserved.

---

## Task 1: auth-yetkilendirme section

**Files:**
- Create: `src/features/docs/sections/auth-yetkilendirme.tsx`

**Source material:** `ai-rag-template/docs/frontend-admin/00-overview.md` (guards, login, error codes) + `04-users.md` (user mgmt endpoints).

- [ ] **Step 1: Create the section file**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface GuardRow {
  order: number
  name: string
  check: string
  failure: string
}

const GUARD_CHAIN: GuardRow[] = [
  { order: 1, name: 'JwtAuthGuard',       check: 'Authorization header\'daki Bearer token\'ı doğrular.',       failure: '401 unauthorized' },
  { order: 2, name: 'PlatformAdminGuard', check: 'user.isPlatformAdmin === true olduğunu kontrol eder.',       failure: '403 platform_admin_required' },
  { order: 3, name: 'Handler',            check: 'İş mantığı çalışır.',                                         failure: 'Endpoint-özel hata' },
]

interface ErrorRow {
  code: string
  http: number
  meaning: string
}

const ERRORS: ErrorRow[] = [
  { code: 'unauthorized',            http: 401, meaning: 'Token yok veya imza geçersiz' },
  { code: 'token_expired',           http: 401, meaning: 'Token süresi dolmuş — yeniden login gerekli' },
  { code: 'platform_admin_required', http: 403, meaning: 'Kullanıcı platform admin değil' },
]

interface UserEndpointRow {
  method: string
  path: string
  purpose: string
}

const USER_ENDPOINTS: UserEndpointRow[] = [
  { method: 'GET',    path: '/platform/companies/:id/users',             purpose: 'Firmanın aktif kullanıcıları' },
  { method: 'POST',   path: '/platform/companies/:id/users',             purpose: 'Direkt kullanıcı oluştur (hemen aktif)' },
  { method: 'POST',   path: '/platform/companies/:id/users/invite',      purpose: 'Davet mail\'i gönder' },
  { method: 'POST',   path: '/platform/companies/:id/users/bulk-import', purpose: 'CSV ile toplu import (max 500 satır)' },
  { method: 'PATCH',  path: '/platform/companies/:id/users/:userId',     purpose: 'Rol veya bilgi güncelle' },
  { method: 'DELETE', path: '/platform/companies/:id/users/:userId',     purpose: 'Soft delete (deaktif et)' },
]

export function AuthYetkilendirme() {
  return (
    <DocsSectionCard id="auth-yetkilendirme" title="Auth & Yetkilendirme" icon="🔐">
      <p className="text-sm text-muted-foreground">
        Tüm <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/*</code> endpoint'leri iki guard ile korunur: geçerli JWT token + platform admin flag. Superadmin de normal <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /auth/login</code> endpoint'ini kullanır; response'taki <code className="rounded bg-muted px-1 py-0.5 text-xs">user.isPlatformAdmin: true</code> erişimi açar.
      </p>

      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="mb-2 font-semibold text-foreground">Auth Header</div>
          <pre className="overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs">Authorization: Bearer &lt;accessToken&gt;</pre>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Guard Zinciri</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Guard</th>
                <th className="px-3 py-2 text-left">Kontrol</th>
                <th className="px-3 py-2 text-left">Başarısızsa</th>
              </tr>
            </thead>
            <tbody>
              {GUARD_CHAIN.map((g) => (
                <tr key={g.order} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{g.order}</td>
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.check}</td>
                  <td className="px-3 py-2 font-mono text-xs">{g.failure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Auth Hata Kodları</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kod</th>
                <th className="px-3 py-2 text-left">HTTP</th>
                <th className="px-3 py-2 text-left">Anlam</th>
              </tr>
            </thead>
            <tbody>
              {ERRORS.map((e) => (
                <tr key={e.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{e.code}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.http}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">isPlatformAdmin Flag</div>
          <div className="mt-2">
            <code className="rounded bg-muted px-1 py-0.5 text-xs">users</code> tablosundaki boolean kolondur. Veritabanı seviyesinde manuel atanır — UI üzerinden toggle edilmez. Normal admin/member kullanıcılar için her zaman <code className="rounded bg-muted px-1 py-0.5 text-xs">false</code>; yalnızca gerçek platform yöneticilerine <code className="rounded bg-muted px-1 py-0.5 text-xs">true</code> verilir.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Kullanıcı Yönetimi Endpoint'leri</div>
          <table className="w-full text-sm">
            <tbody>
              {USER_ENDPOINTS.map((e) => (
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

      <p className="text-xs italic text-muted-foreground">
        401/403 sorunları için <a href="#sorun-giderme" className="underline hover:text-foreground">Sorun Giderme</a> bölümüne bakın.
      </p>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc -b`
Expected: 0 errors. (Dosya henüz registry'e bağlanmadı; tsc kapsamlı inceler ama kendi kendine referanssız TS hatası vermemeli.)

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/auth-yetkilendirme.tsx
git commit -m "$(cat <<'EOF'
feat(docs): add auth-yetkilendirme section

Operational-synthesis section covering JWT + PlatformAdminGuard
chain, auth errors (401/403), isPlatformAdmin flag semantics, and
platform-level user management endpoints. Cross-refs sorun-giderme
for 401/403 troubleshooting. Backend source: frontend-admin/00-overview.md
+ 04-users.md.

Not yet wired into DOCS_SECTIONS — registry update in final commit.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: fiyatlandirma-gelir section

**Files:**
- Create: `src/features/docs/sections/fiyatlandirma-gelir.tsx`

**Source material:** `ai-rag-template/docs/frontend-admin/08-pricing-plans.md` (plan CRUD, billing cycle, action types, MRR formula, downgrade cron).

- [ ] **Step 1: Create the section file**

```tsx
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
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/fiyatlandirma-gelir.tsx
git commit -m "$(cat <<'EOF'
feat(docs): add fiyatlandirma-gelir section

Operational-synthesis section covering pricing plan fields,
billing cycle (14-day trial + 30-day rolling), upgrade/downgrade
action semantics, MRR formula, and the daily downgrade cron
endpoint. Plan-alanı tablosunda budgetDowngradeThresholdPct satırı
model-downgrade bölümüne cross-ref içerir. Backend source:
frontend-admin/08-pricing-plans.md.

Not yet wired into DOCS_SECTIONS — registry update in final commit.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: quote-pipeline section

**Files:**
- Create: `src/features/docs/sections/quote-pipeline.tsx`

**Source material:** `ai-rag-template/docs/frontend-admin/12-quotes.md` (7-step Trigger.dev task, trust levels, limits, internal-secret env).

- [ ] **Step 1: Create the section file**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface PipelineStep {
  n: number
  title: string
  desc: string
}

const STEPS: PipelineStep[] = [
  { n: 1, title: 'Budget Reserve',         desc: 'Firma bütçesinden $0.10 rezervasyon yapılır. Yetersizse task durur.' },
  { n: 2, title: 'Prepare',                desc: 'AI agent ile teklif hazırlama: KB + playbook arama, multi-step tool calling.' },
  { n: 3, title: 'Create',                 desc: 'Teklif entity\'si oluşturulur (advisory lock ile referans numarası atanır).' },
  { n: 4, title: 'Generate Doc',           desc: 'Şablon varsa DOCX dokümanı üretilir.' },
  { n: 5, title: 'Evaluate',               desc: 'Trust level\'a göre onay değerlendirmesi (otomatik gönderim veya PENDING_APPROVAL).' },
  { n: 6, title: 'Conversation Writeback', desc: 'Sonuç konuşmaya ASSISTANT turn olarak yazılır + QUOTE_PREPARED bildirimi gönderilir.' },
  { n: 7, title: 'Budget Settle',          desc: 'Gerçek LLM maliyeti ile bütçe kapanışı yapılır (rezervasyon ile fark düzeltilir).' },
]

interface TrustRow {
  level: string
  behavior: string
}

const TRUST_LEVELS: TrustRow[] = [
  { level: 'FULL_CONTROL',            behavior: 'Her teklif PENDING_APPROVAL — admin onaylamalı' },
  { level: 'AUTO_MESSAGE',            behavior: 'Her teklif PENDING_APPROVAL' },
  { level: 'AUTO_ALL_QUOTE_APPROVAL', behavior: 'autoApproveQuoteThreshold altındaki teklifler otomatik gönderilir' },
  { level: 'FULLY_AUTOMATIC',         behavior: 'Tüm teklifler otomatik gönderilir' },
]

interface StatusRow {
  status: string
  meaning: string
  rowClass: string
}

const STATUSES: StatusRow[] = [
  { status: 'pending',    meaning: 'Task tetiklendi, queue\'ya alınmadı', rowClass: '' },
  { status: 'queued',     meaning: 'Trigger.dev queue\'sunda',            rowClass: 'bg-blue-500/5' },
  { status: 'processing', meaning: 'Pipeline adımları çalışıyor',         rowClass: 'bg-violet-500/5' },
  { status: 'completed',  meaning: 'Tüm adımlar başarılı, teklif hazır',  rowClass: 'bg-emerald-500/5' },
  { status: 'failed',     meaning: 'Bir adım 3 retry sonrası başarısız',  rowClass: 'bg-red-500/5' },
]

export function QuotePipeline() {
  return (
    <DocsSectionCard id="quote-pipeline" title="Quote Pipeline" icon="📄">
      <p className="text-sm text-muted-foreground">
        Teklif hazırlama <code className="rounded bg-muted px-1 py-0.5 text-xs">quote.prepare.v1</code> Trigger.dev task'i ile asenkron 7 adımda çalışır. Max 3 retry, 180 saniye timeout. Superadmin teklif içeriğine erişmez — yalnızca limit, tool plan ve trust level yapılandırması yapar.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {STEPS.map((step) => (
          <Card key={step.n}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-400">
                  {step.n}
                </span>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Trust Level → Onay Akışı</div>
          <table className="w-full text-sm">
            <tbody>
              {TRUST_LEVELS.map((t) => (
                <tr key={t.level} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{t.level}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Durum Geçişi</div>
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

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">🔐 Internal Endpoint Güvenliği</div>
          <div className="mt-2">
            Task içindeki internal endpoint çağrıları <code className="rounded bg-muted px-1 py-0.5 text-xs">AI_INTERNAL_SECRET</code> env değişkeni ile korunur. Bu secret hem backend hem Trigger.dev worker'da <strong>aynı</strong> olmalı — aksi halde task start'ta 403 döner.
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">📝 Teklif Limitleri</div>
          <div className="mt-2">
            Firma bazlı teklif limitleri <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.maxQuotes</code> (toplam) ve <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.maxQuotesPerLead</code> alanlarıyla kontrol edilir. Limit aşıldıysa yeni teklif <code className="rounded bg-muted px-1 py-0.5 text-xs">409 Conflict</code> döner. Alan açıklaması için <a href="#firma-config" className="underline hover:text-foreground">Firma Config Referansı</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/quote-pipeline.tsx
git commit -m "$(cat <<'EOF'
feat(docs): add quote-pipeline section

Operational-synthesis section covering quote.prepare.v1
Trigger.dev task's 7-step pipeline, trust level → approval flow,
status transitions, and AI_INTERNAL_SECRET handshake with worker.
Limits callout cross-refs firma-config for maxQuotes/maxQuotesPerLead
field details. Backend source: frontend-admin/12-quotes.md.

Not yet wired into DOCS_SECTIONS — registry update in final commit.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: firma-config section

**Files:**
- Create: `src/features/docs/sections/firma-config.tsx`

**Source material:** `ai-rag-template/docs/frontend-admin/02-company-config.md` (aiConfig, embeddingConfig, limitsConfig blocks; masking rules; inheritance chain).

- [ ] **Step 1: Create the section file**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface FieldRow {
  field: string
  type: string
  defaultVal: string
  desc: string
}

const AI_FIELDS: FieldRow[] = [
  { field: 'model',                       type: 'string',         defaultVal: '—',           desc: 'OpenRouter model ID (örn. anthropic/claude-sonnet-4.6)' },
  { field: 'allowedModels',               type: 'array',          defaultVal: '[]',          desc: 'İzin verilen modeller — boş ise yalnızca `model` kullanılır' },
  { field: 'apiKey',                      type: 'string',         defaultVal: '—',           desc: 'OpenRouter API key (GET\'te maskeli)' },
  { field: 'budgetUsd',                   type: 'number',         defaultVal: '—',           desc: 'Aylık bütçe limiti (USD)' },
  { field: 'budgetDowngradeThresholdPct', type: 'number (1-100)', defaultVal: '80',          desc: 'Normal → Standard downgrade eşiği' },
  { field: 'language',                    type: 'tr | en',        defaultVal: 'tr',          desc: 'Firma dili — AI yanıtları + otomatik özetler' },
  { field: 'rerankApiKey / rerankModel',  type: 'string',         defaultVal: 'rerank-v3.5', desc: 'Cohere reranking (masked key)' },
  { field: 'exaApiKey / webSearchTier',   type: 'basic | deep',   defaultVal: 'basic',       desc: 'Exa web search (masked key)' },
  { field: 'citationGateMode',            type: 'off|warn|block', defaultVal: '—',           desc: 'Kaynaksız yanıt davranışı' },
  { field: 'qualityEvalEnabled',          type: 'boolean',        defaultVal: 'true',        desc: 'Otomatik kalite değerlendirme' },
]

const EMBEDDING_FIELDS: FieldRow[] = [
  { field: 'model',      type: 'string', defaultVal: '—',    desc: 'Embedding modeli (örn. openai/text-embedding-3-small)' },
  { field: 'apiKey',     type: 'string', defaultVal: '—',    desc: 'Embedding API key (GET\'te maskeli)' },
  { field: 'dimensions', type: 'number', defaultVal: '1536', desc: 'Vektör boyutu' },
]

const LIMITS_FIELDS: FieldRow[] = [
  { field: 'maxStorageMb',       type: 'number', defaultVal: '—', desc: 'Toplam depolama limiti (MB)' },
  { field: 'maxFileSizeMb',      type: 'number', defaultVal: '—', desc: 'Tek dosya max boyut (MB)' },
  { field: 'chunkMaxChars',      type: 'number', defaultVal: '—', desc: 'Doküman chunking max karakter' },
  { field: 'chunkOverlapChars',  type: 'number', defaultVal: '—', desc: 'Chunk\'lar arası overlap' },
  { field: 'historyTokenBudget', type: 'number', defaultVal: '—', desc: 'Konuşma geçmişi token bütçesi' },
  { field: 'maxLeads',           type: 'number', defaultVal: '—', desc: 'Maks müşteri adayı (null = limitsiz)' },
  { field: 'maxQuotes',          type: 'number', defaultVal: '—', desc: 'Maks teklif sayısı (null = limitsiz)' },
  { field: 'maxQuotesPerLead',   type: 'number', defaultVal: '—', desc: 'Lead başına maks teklif (null = limitsiz)' },
  { field: 'crawlMaxPages',      type: 'number', defaultVal: '—', desc: 'Crawler başına max sayfa' },
  { field: 'crawlMaxSources',    type: 'number', defaultVal: '—', desc: 'Max crawler kaynağı' },
]

interface BlockTableProps {
  title: string
  endpoint: string
  fields: FieldRow[]
}

function BlockTable({ title, endpoint, fields }: BlockTableProps) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <div className="border-b bg-muted/30 px-3 py-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="mt-0.5 font-mono text-xs">{endpoint}</div>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Alan</th>
              <th className="px-3 py-2 text-left">Tip</th>
              <th className="px-3 py-2 text-left">Default</th>
              <th className="px-3 py-2 text-left">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.field} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs">{f.field}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.defaultVal}</td>
                <td className="px-3 py-2 text-muted-foreground">{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export function FirmaConfig() {
  return (
    <DocsSectionCard id="firma-config" title="Firma Config Referansı" icon="⚙️">
      <p className="text-sm text-muted-foreground">
        Firma config'i <code className="rounded bg-muted px-1 py-0.5 text-xs">GET/PUT /platform/companies/:id/config</code> üzerinden yönetilir. PUT partial merge — yalnızca gönderilen alanlar güncellenir. Hassas alanlar (API key'ler, secret'lar) GET response'ta maskeli döner (<code className="rounded bg-muted px-1 py-0.5 text-xs">sk-a****wxyz</code>); maskeli değeri geri göndermeyin — sadece değiştirmek istediğiniz alanları PUT edin.
      </p>

      <BlockTable title="aiConfig"        endpoint="PUT /platform/companies/:id/config — body.aiConfig"        fields={AI_FIELDS} />
      <BlockTable title="embeddingConfig" endpoint="PUT /platform/companies/:id/config — body.embeddingConfig" fields={EMBEDDING_FIELDS} />
      <BlockTable title="limitsConfig"    endpoint="PUT /platform/companies/:id/config — body.limitsConfig"    fields={LIMITS_FIELDS} />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">⚠ Plan Override Davranışı</div>
          <div className="mt-2">
            Firma bir plana atanmışsa, plan alanları config'teki aynı adlı alanları (<code className="rounded bg-muted px-1 py-0.5 text-xs">budgetUsd</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">allowedModels</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">maxStorageGb</code> vb.) efektif olarak override eder. Plan atanmamışsa config değerleri saf olarak kullanılır. Detay için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-blue-400">ℹ Config Miras Zinciri</div>
          <div className="mt-2">
            Bir alan firma config'inde yoksa platform defaults'tan miras alınır (<code className="rounded bg-muted px-1 py-0.5 text-xs">GET /platform/config/defaults</code>). Deep merge nested object'ler için uygulanır; <strong>istisna:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">toolConfig</code> ve <code className="rounded bg-muted px-1 py-0.5 text-xs">toolPlanConfig</code> full replace — bu endpoint'ten gönderilemez, dedicated endpoint kullanın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc -b`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/docs/sections/firma-config.tsx
git commit -m "$(cat <<'EOF'
feat(docs): add firma-config section

API-quickref section with field tables for three config blocks
(aiConfig, embeddingConfig, limitsConfig). Amber callout documents
plan-override behavior and cross-refs fiyatlandirma-gelir; blue
callout explains the config inheritance chain and deep-merge
exceptions (toolConfig, toolPlanConfig full replace). Backend
source: frontend-admin/02-company-config.md.

Not yet wired into DOCS_SECTIONS — registry update in final commit.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Registry wire-up + model-downgrade cross-ref

**Files:**
- Modify: `src/features/docs/lib/sections.ts` (full replace — register 4 new sections in the 9-section order)
- Modify: `src/features/docs/sections/model-downgrade.tsx` (one-line edit — append cross-ref to fiyatlandirma-gelir in amber callout)

- [ ] **Step 1: Rewrite `src/features/docs/lib/sections.ts`**

Replace the entire file with:

```tsx
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { AuthYetkilendirme } from '../sections/auth-yetkilendirme'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { ModelDowngrade } from '../sections/model-downgrade'
import { FiyatlandirmaGelir } from '../sections/fiyatlandirma-gelir'
import { QuotePipeline } from '../sections/quote-pipeline'
import { FirmaConfig } from '../sections/firma-config'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari',        title: 'Genel Mimari',             icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme',  title: 'Auth & Yetkilendirme',     icon: '🔐', Component: AuthYetkilendirme },
  { id: 'mesaj-akisi',         title: 'Mesaj İşlem Akışı',        icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool',          title: 'Agent Tool Sistemi',       icon: '🛠️', Component: AgentTool },
  { id: 'model-downgrade',     title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir', title: 'Fiyatlandırma & Gelir',    icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'quote-pipeline',      title: 'Quote Pipeline',           icon: '📄', Component: QuotePipeline },
  { id: 'firma-config',        title: 'Firma Config Referansı',   icon: '⚙️', Component: FirmaConfig },
  { id: 'sorun-giderme',       title: 'Sorun Giderme',            icon: '🔧', Component: SorunGiderme },
]
```

- [ ] **Step 2: Add cross-ref in `model-downgrade.tsx` amber callout**

Find the line (currently line 52):

```tsx
            Yukarıdaki yüzdeler varsayılandır. <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code> alanı <strong>yalnızca Normal → Standard geçişini</strong> kontrol eder (1–100 arası, default 80). %95 (Economy) ve %97 (Exhausted) eşikleri sabittir, plan-bazında değişmez. Backend §5.3 + §12 ile teyit edildi.
```

Replace with (adds trailing sentence with link to fiyatlandirma-gelir):

```tsx
            Yukarıdaki yüzdeler varsayılandır. <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code> alanı <strong>yalnızca Normal → Standard geçişini</strong> kontrol eder (1–100 arası, default 80). %95 (Economy) ve %97 (Exhausted) eşikleri sabittir, plan-bazında değişmez. Backend §5.3 + §12 ile teyit edildi. Plan alanının tanımı ve billing bağlamı için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc -b`
Expected: 0 errors. All 4 new section imports + 9-entry registry resolve successfully.

- [ ] **Step 4: Production build + bundle delta**

Run: `npm run build`
Expected: Build success. Note the final `dist/` size in output.

Capture the pre-change baseline by running `git stash && npm run build 2>&1 | tail -20 && git stash pop && npm run build 2>&1 | tail -20` — compare the totals. Record the delta in commit body.

Decision point: if raw delta exceeds **+40 kB**, open a follow-up memory note for Sprint 6+ (lazy-load route). Under +40 kB → no action.

- [ ] **Step 5: Manual QA (dev server)**

Run: `npm run dev`

Navigate to `http://localhost:5173/docs` and verify:

- [ ] 9 sections render in the new order (Genel Mimari → Auth → Mesaj → Agent Tool → Model Downgrade → Fiyatlandırma → Quote Pipeline → Firma Config → Sorun Giderme)
- [ ] Sol sidebar TOC (lg+ viewport) 9 başlık gösteriyor ve aktif section highlight çalışıyor
- [ ] `http://localhost:5173/docs#auth-yetkilendirme` adresi direkt o section'a scroll yapıyor (`scroll-mt-20` offset doğru)
- [ ] Aynı şeyi `#fiyatlandirma-gelir`, `#quote-pipeline`, `#firma-config` için de yap
- [ ] Cross-ref linkleri tıklandığında scroll çalışıyor:
  - fiyatlandirma-gelir'de `budgetDowngradeThresholdPct` satırındaki "Model Downgrade" linki → #model-downgrade
  - model-downgrade amber callout'ta eklenen "Fiyatlandırma & Gelir" linki → #fiyatlandirma-gelir
  - firma-config plan-override callout'ta "Fiyatlandırma & Gelir" linki → #fiyatlandirma-gelir
  - auth-yetkilendirme son paragraftaki "Sorun Giderme" linki → #sorun-giderme
  - quote-pipeline teklif-limitleri callout'ta "Firma Config Referansı" linki → #firma-config
- [ ] Keyboard Tab ile inline link'lere odaklanabiliyor, focus-visible ring görünür
- [ ] Mobile (<lg viewport, DevTools ile kontrol): TOC gizli, section'lar alt alta render
- [ ] Console error yok

- [ ] **Step 6: Commit**

```bash
git add src/features/docs/lib/sections.ts src/features/docs/sections/model-downgrade.tsx
git commit -m "$(cat <<'EOF'
feat(docs): register 4 new sections + wire cross-ref links

Adds auth-yetkilendirme, fiyatlandirma-gelir, quote-pipeline and
firma-config to DOCS_SECTIONS in the onboarding-read order (auth
after genel-mimari; pricing after model-downgrade; firma-config
before sorun-giderme). Model-downgrade amber callout gains inline
cross-ref to fiyatlandirma-gelir for the plan-field context.

Bundle delta: <FILL IN FROM STEP 4>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Replace `<FILL IN FROM STEP 4>` with the actual measured delta (e.g. `+18.2 kB raw / +5.1 kB gzipped`).

- [ ] **Step 7: Push**

Only after all 5 task commits are in place and QA is clean:

```bash
git push origin main
```

---

## Post-Implementation Memory Updates

After push, update auto-memory so future sessions know Sprint 5 shipped:

1. `MEMORY.md` — update the "Next Session TODO" line to remove `/docs eklemeleri` (only smoke test left) and add "Sprint 5 Recap" entry line.
2. New file `project_sprint5_plan.md` — short recap memory with commit hashes, bundle delta, 4 new section ids.
3. `project_superadmin_status.md` — bump "Sprint 1-5 + all followups shipped" with latest commit hash.
4. `project_next_session_todo.md` — drop `/docs eklemeleri` from remaining TODOs; add note for 7 remaining backend docs as Sprint 6+ candidates (list from spec's "Scope Dışı" table).

---

## Self-Review Checklist (done before handing off)

**Spec coverage:**
- [x] 4 new sections named + ordered → Tasks 1-4 + registry in Task 5
- [x] Hybrid mode (3 operational-synthesis + 1 API-quickref) reflected → auth/pricing/quotes operational, firma-config quickref (3 field tables + BlockTable helper)
- [x] Cross-ref table (4 pairs) → all 5 links wired (firma-config→pricing, pricing→model-downgrade, model-downgrade→pricing added in Task 5, auth→sorun-giderme, quote→firma-config)
- [x] No markdown renderer, no lazy route → pattern preserved
- [x] Bundle delta measurement + decision threshold → Task 5 Step 4
- [x] Manual QA checklist → Task 5 Step 5
- [x] 5 atomic commits (one per new section + registry) → commit strategy matches spec
- [x] YAGNI items (search, code-copy, versioning, i18n, etc.) → not in any task

**Placeholder scan:** All steps include actual code. Only one `<FILL IN>` — Task 5 Step 6 commit message, gated on Step 4 measurement (acceptable since it's a literal measured value).

**Type consistency:** All 4 exported component names (`AuthYetkilendirme`, `FiyatlandirmaGelir`, `QuotePipeline`, `FirmaConfig`) match their registry imports in Task 5. Section `id` strings match anchors used in cross-ref `<a href="#...">` tags.
