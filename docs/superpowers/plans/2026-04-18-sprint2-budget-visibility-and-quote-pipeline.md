# Sprint 2 — Budget Visibility & Quote Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Firma Usage tab'ına bütçe-bazlı downgrade durum kartı ve Settings'e statik 7-adımlı Quote Pipeline diyagramı eklenir.

**Architecture:** İki bağımsız modül (M1: per-company budget card, M3: settings static page). M1 iki query zinciri kullanır — `useCompany(companyId)` → `usePricingPlan(planId)` → `budgetUsd`. M3 hiç API call yapmaz.

**Tech Stack:** React 18, TypeScript (strict), Vite, TailwindCSS, react-query.

**Spec:** `docs/superpowers/specs/2026-04-18-sprint2-budget-visibility-and-quote-pipeline-design.md`

**Spec'ten sapan iki nokta (gerekçeli):**
1. **Spec §6 vitest test'i atlandı.** Proje genelinde test framework kurulu değil (package.json'da test script yok, hiç `*.test.*` dosyası yok). Tek util için vitest setup'ı YAGNI — Sprint 2 scope dışı. `computeBudgetBand` küçük ve pure; doğrulama görsel smoke ile (Task 6 Step 4'te 4 bant + 2 edge için mock değerlerle).
2. **Spec §2.1 yanılgısı: `company.plan.budgetUsd` mevcut değil.** `CompanyPlanSummary` (types.ts:1-8) sadece `id, name, slug, monthlyPriceTry, includedUsers, isActive` döner — `budgetUsd` yok. Tam `PricingPlan` (types.ts:215) için ayrı `usePricingPlan(planId)` çağrısı gerekir. Bu plan iki query zinciri kullanır.

---

## Dosya Haritası

| # | Dosya | Sorumluluk | Task |
|---|-------|------------|------|
| 1 | `src/features/companies/lib/budget-band.ts` | **Yeni** util + `BudgetBand` type + `computeBudgetBand()` + renk map'i | Task 1 |
| 2 | `src/features/companies/components/budget-status-card.tsx` | **Yeni** presentation component (numeric props) | Task 2 |
| 3 | `src/features/companies/components/usage-tab.tsx` | `useCompany` + `usePricingPlan` chain + `<BudgetStatusCard />` mount | Task 3 |
| 4 | `src/features/settings/components/quote-pipeline-section.tsx` | **Yeni** statik component (7 adım + intro + config notu) | Task 4 |
| 5 | `src/features/settings/components/settings-nav.tsx` | `quotePipeline` entry ekle (slot: pricingConfig'ten sonra) | Task 5 |
| 6 | `src/features/settings/pages/settings-page.tsx` | `quotePipeline` route case → `<QuotePipelineSection />` | Task 5 |

**Toplam:** 4 yeni, 2 modify.

---

## Task 1: Budget Band Util

**Files:**
- Create: `src/features/companies/lib/budget-band.ts`

- [ ] **Step 1: `src/features/companies/lib/` klasörünü oluştur (yoksa) ve `budget-band.ts`'i yaz**

Eğer `src/features/companies/lib/` yoksa `mkdir -p` ile oluştur.

`src/features/companies/lib/budget-band.ts` içeriği:

```typescript
export type BudgetBand = 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'

export interface BudgetStatus {
  band: BudgetBand
  pct: number
  rawPct: number
  label: string
  barColorClass: string
  badgeClass: string
}

const BAND_META: Record<BudgetBand, { label: string; barColorClass: string; badgeClass: string }> = {
  normal: {
    label: 'Normal',
    barColorClass: 'bg-green-500',
    badgeClass: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  standard: {
    label: "Standard'a Düşürüldü",
    barColorClass: 'bg-yellow-500',
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  economy: {
    label: "Economy'ye Düşürüldü",
    barColorClass: 'bg-orange-500',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  exhausted: {
    label: 'Bütçe Tükendi',
    barColorClass: 'bg-red-500',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  unconfigured: {
    label: 'İzleme Yok',
    barColorClass: 'bg-muted',
    badgeClass: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
}

export function computeBudgetBand(spendUsd: number, capUsd: number | null | undefined): BudgetStatus {
  if (capUsd == null || capUsd <= 0) {
    return { band: 'unconfigured', pct: 0, rawPct: 0, ...BAND_META.unconfigured }
  }

  const rawPct = (spendUsd / capUsd) * 100
  const pct = Math.min(100, Math.max(0, rawPct))

  let band: BudgetBand
  if (rawPct < 80) band = 'normal'
  else if (rawPct < 95) band = 'standard'
  else if (rawPct < 97) band = 'economy'
  else band = 'exhausted'

  return { band, pct, rawPct, ...BAND_META[band] }
}
```

> **Bant sınırları (06-models.md):** `< 80 normal`, `80-95 standard`, `95-97 economy`, `≥ 97 exhausted`. Sınırlar inclusive: 80.0 → standard, 95.0 → economy, 97.0 → exhausted.

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: `tsc -b && vite build` exit 0. Henüz hiçbir yer bu util'i import etmiyor; sadece compile geçmeli.

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/lib/budget-band.ts
git commit -m "feat(budget): add computeBudgetBand util for downgrade visibility"
```

---

## Task 2: BudgetStatusCard Component

**Files:**
- Create: `src/features/companies/components/budget-status-card.tsx`

- [ ] **Step 1: `budget-status-card.tsx`'i yaz**

`src/features/companies/components/budget-status-card.tsx` içeriği:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { computeBudgetBand } from '../lib/budget-band'

interface BudgetStatusCardProps {
  spendUsd: number
  capUsd: number | null
}

export function BudgetStatusCard({ spendUsd, capUsd }: BudgetStatusCardProps) {
  const status = computeBudgetBand(spendUsd, capUsd)

  if (status.band === 'unconfigured') {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Aylık AI Bütçesi</div>
            <div className="text-sm text-muted-foreground">Bu firmaya plan atanmamış — bütçe limiti yok.</div>
          </div>
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', status.badgeClass)}>
            {status.label}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Aylık AI Bütçesi</div>
          <div className="text-base font-semibold tabular-nums">
            {formatCurrency(spendUsd)} / {formatCurrency(capUsd ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">{status.rawPct.toFixed(1)}% kullanıldı</div>
        </div>
        <div className="h-2 rounded-full bg-muted" title={`${status.rawPct.toFixed(1)}% / 100%`}>
          <div
            className={cn('h-full rounded-full transition-all', status.barColorClass)}
            style={{ width: `${status.pct}%` }}
          />
        </div>
        <div className="flex justify-start sm:justify-end">
          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium', status.badgeClass)}>
            {status.label}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
```

> **Tasarım notları:**
> - `grid-cols-1 sm:grid-cols-3` — mobilde stack, ≥640px'de 3 kolon.
> - `tabular-nums` — para gösterimi hizalama.
> - `formatCurrency(capUsd ?? 0)` — TypeScript narrow için; `capUsd === null` zaten `unconfigured` branch'ında handle edildi, ama tip katı olduğundan fallback gerekli.
> - `title` prop bar üzerinde — gerçek pct (>%100 olabilir) tooltip'te görünür.

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: exit 0. `BudgetStatusCard` henüz mount edilmedi, sadece compile geçer.

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/budget-status-card.tsx
git commit -m "feat(budget): add BudgetStatusCard presentation component"
```

---

## Task 3: UsageTab — Wire Budget Card

**Files:**
- Modify: `src/features/companies/components/usage-tab.tsx`

- [ ] **Step 1: `usage-tab.tsx`'in tamamını güncelle**

Mevcut satır 1-6 (importlar):

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanyUsage } from '../hooks/use-company-usage'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { UsageChart } from './usage-chart'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'
```

Yeni satır 1-9:

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanyUsage } from '../hooks/use-company-usage'
import { useCompany } from '../hooks/use-company'
import { usePricingPlan } from '../hooks/use-pricing-plans'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { UsageChart } from './usage-chart'
import { BudgetStatusCard } from './budget-status-card'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'
```

Mevcut satır 19-26 (component başı):

```tsx
export function UsageTab({ companyId }: UsageTabProps) {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = useCompanyUsage(companyId, months)

  const current = data?.months?.[0]

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
  if (!current) return <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
```

Yeni:

```tsx
export function UsageTab({ companyId }: UsageTabProps) {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = useCompanyUsage(companyId, months)
  const { data: company } = useCompany(companyId)
  const { data: plan } = usePricingPlan(company?.planId ?? '')

  const current = data?.months?.[0]
  const budgetCap = plan?.budgetUsd ?? null

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
  if (!current) return <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
```

> `usePricingPlan(company?.planId ?? '')` — `enabled: !!id` kontrolü içinde, boş id ile fetch yapmaz (use-pricing-plans.ts:23). `company.planId === null` durumunda `plan` undefined kalır → `budgetCap = null` → `BudgetStatusCard` "İzleme Yok" gösterir.

Mevcut satır 28-43 (return başı + period select):

```tsx
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 space-y-4">
```

Yeni (period select'in altına `<BudgetStatusCard />` eklenir, `mb-4 space-y-4` bloğunun ÜSTÜNE):

```tsx
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <BudgetStatusCard spendUsd={current.totalCostUsd} capUsd={budgetCap} />
      </div>

      <div className="mb-4 space-y-4">
```

Geri kalanı aynı (KPI grid + chart bloğu değişmez).

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: exit 0. `useCompany` ve `usePricingPlan` zaten var, type'lar uyumlu.

- [ ] **Step 3: Visual smoke check**

`npm run dev` → `/companies/:id` → Kullanım tab.

Beklenen:
- Periyot select'in hemen altında bütçe kartı görünür.
- Plan'ı olan firma → 3 kolon: `$Y / $X` + progress bar + bant rozeti
- Plan'ı olmayan firma (`company.planId === null`) → tek satır "İzleme Yok" rozeti
- Console'da error yok, network'te `/platform/plans/:id` request'i 200 döner

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/usage-tab.tsx
git commit -m "feat(usage): mount BudgetStatusCard with plan budget chain"
```

---

## Task 4: QuotePipelineSection (Static Settings Component)

**Files:**
- Create: `src/features/settings/components/quote-pipeline-section.tsx`

- [ ] **Step 1: `quote-pipeline-section.tsx`'i yaz**

`src/features/settings/components/quote-pipeline-section.tsx` içeriği:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STEPS = [
  { n: 1, title: 'Bütçe Rezervasyonu', desc: 'Firma AI bütçesinden $0.10 rezerve edilir; yetersizse task durdurulur.' },
  { n: 2, title: 'Hazırlama', desc: 'AI agent KB + playbook arar, multi-step tool calling ile içerik üretir.' },
  { n: 3, title: 'Oluşturma', desc: 'Quote entity oluşturulur (advisory lock ile referans numarası).' },
  { n: 4, title: 'Doküman', desc: 'Şablon varsa DOCX dokümanı üretilir.' },
  { n: 5, title: 'Değerlendirme', desc: "Firmanın trust level'ına göre onay gerekliliği belirlenir (TrustLevelService)." },
  { n: 6, title: 'Konuşma Yazımı', desc: 'Sonuç ASSISTANT turn olarak konuşmaya yazılır + QUOTE_PREPARED in-app bildirimi gönderilir.' },
  { n: 7, title: 'Bütçe Kapanışı', desc: 'Gerçek LLM maliyetiyle bütçe rezervasyonu kapatılır.' },
]

export function QuotePipelineSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Quote Pipeline</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Teklif hazırlama süreci <code className="rounded bg-muted px-1 py-0.5 text-xs">quote.prepare.v1</code> Trigger.dev task'ı ile asenkron çalışır. 7 adım sırasıyla ilerler; herhangi bir adım hata verirse bütçe rezervasyonu serbest bırakılır ve task retry'a alınır.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="text-sm font-semibold text-amber-400">⚠ Yapılandırma Notları</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Max 3 retry, 180 saniye timeout</li>
            <li>Internal endpoint'ler <code className="rounded bg-muted px-1 py-0.5 text-xs">AI_INTERNAL_SECRET</code> env ile korunur</li>
            <li>CUSTOMER konuşmalarında <code className="rounded bg-muted px-1 py-0.5 text-xs">research</code> tool çalıştırılmaz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

> Statik component, hiç hook/fetch yok. Tamamen presentational.

- [ ] **Step 2: TypeScript build doğrulaması**

Run: `npm run build`

Expected: exit 0. Component henüz mount edilmedi.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/components/quote-pipeline-section.tsx
git commit -m "feat(settings): add QuotePipelineSection static documentation"
```

---

## Task 5: Settings Nav Entry + Page Route

**Files:**
- Modify: `src/features/settings/components/settings-nav.tsx`
- Modify: `src/features/settings/pages/settings-page.tsx`

- [ ] **Step 1: `settings-nav.tsx`'e `quotePipeline` entry ekle**

Mevcut `NAV_ITEMS` array (satır 9-26):

```tsx
const NAV_ITEMS: NavItem[] = [
  { key: 'pricingPlans', label: 'Fiyatlandırma', icon: '💎' },
  { key: 'pricingConfig', label: 'Pricing', icon: '💰' },
  { key: 'aiConfig', label: 'AI Config', icon: '🤖' },
  { key: 'toolPlans', label: 'Tool Planları', icon: '🔧' },
  ...
]
```

Yeni: `pricingConfig`'ten sonra `quotePipeline` entry ekle (slot semantik komşuluk için — pricing+pipeline aynı ailedir):

```tsx
const NAV_ITEMS: NavItem[] = [
  { key: 'pricingPlans', label: 'Fiyatlandırma', icon: '💎' },
  { key: 'pricingConfig', label: 'Pricing', icon: '💰' },
  { key: 'quotePipeline', label: 'Quote Pipeline', icon: '📋' },
  { key: 'aiConfig', label: 'AI Config', icon: '🤖' },
  { key: 'toolPlans', label: 'Tool Planları', icon: '🔧' },
  { key: 'embeddingConfig', label: 'Embedding', icon: '🧬' },
  { key: 'langfuseConfig', label: 'Langfuse', icon: '📊' },
  { key: 's3Config', label: 'S3 Config', icon: '📦' },
  { key: 'mailConfig', label: 'Mail Config', icon: '✉️' },
  { key: 'triggerConfig', label: 'Trigger', icon: '⚡' },
  { key: 'limitsConfig', label: 'Limits', icon: '🚧' },
  { key: 'crawlerConfig', label: 'Crawler', icon: '🕷️' },
  { key: 'proactiveConfig', label: 'Proaktif', icon: '🔮' },
  { key: 'whatsAppConfig', label: 'WhatsApp', icon: '💬' },
  { key: 'workingHoursConfig', label: 'Çalışma Saatleri', icon: '🕐' },
  { key: 'documentProcessingConfig', label: 'Doc Processing', icon: '📄' },
  { key: 'dataRetentionConfig', label: 'Veri Saklama', icon: '🗑️' },
]
```

- [ ] **Step 2: `settings-page.tsx`'e import ve route case ekle**

Mevcut import bloğu (satır 1-12):

```tsx
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { AiConfigSection } from '../components/ai-config-section'
import { ToolPlansSection } from '../components/tool-plans-section'
import { PricingPlansSection } from '../components/pricing-plans-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { WorkingHoursSection } from '../components/working-hours-section'
import { WhatsAppConfigSection } from '../components/whatsapp-config-section'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import type { ConfigBlockKey } from '@/lib/validations'
```

Yeni: `PricingPlansSection` import'unun altına `QuotePipelineSection` import'u ekle:

```tsx
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { AiConfigSection } from '../components/ai-config-section'
import { ToolPlansSection } from '../components/tool-plans-section'
import { PricingPlansSection } from '../components/pricing-plans-section'
import { QuotePipelineSection } from '../components/quote-pipeline-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { WorkingHoursSection } from '../components/working-hours-section'
import { WhatsAppConfigSection } from '../components/whatsapp-config-section'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import type { ConfigBlockKey } from '@/lib/validations'
```

- [ ] **Step 3: `settings-page.tsx` render conditional'ına `quotePipeline` case ekle**

Mevcut render (satır 224-264) `pricingPlans` ile başlar:

```tsx
        {activeSection === 'pricingPlans' ? (
          <PricingPlansSection key="pricingPlans" />
        ) : activeSection === 'aiConfig' ? (
          <AiConfigSection
            ...
          />
        ) : ...
```

Yeni: `pricingPlans` branch'inden hemen sonra `quotePipeline` branch'i ekle:

```tsx
        {activeSection === 'pricingPlans' ? (
          <PricingPlansSection key="pricingPlans" />
        ) : activeSection === 'quotePipeline' ? (
          <QuotePipelineSection key="quotePipeline" />
        ) : activeSection === 'aiConfig' ? (
          <AiConfigSection
            ...
          />
        ) : ...
```

(Tam Edit operasyonu için `: activeSection === 'aiConfig' ?` patterninin tek occurrence'ı var — direkt önüne yeni branch eklenir.)

- [ ] **Step 4: TypeScript build doğrulaması**

Run: `npm run build`

Expected: exit 0. Yeni section `sectionMeta` Record'una eklenmediği için `meta = sectionMeta[activeSection]` `undefined` olur — render conditional'da explicit case eklendiği için bu sorun değil (`quotePipeline` branch'i `meta` kullanmaz).

- [ ] **Step 5: Visual smoke check**

`npm run dev` → `/settings` → sol nav'da "📋 Quote Pipeline" girişi görünmeli, tıklayınca:
- Üstte intro paragraf
- 7 numarali kart (lg ekranda 4+3, küçük ekranda tek sütun)
- Altta amber renkli "Yapılandırma Notları" kutusu
- Console'da error yok

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/components/settings-nav.tsx src/features/settings/pages/settings-page.tsx
git commit -m "feat(settings): wire QuotePipelineSection into nav and page"
```

---

## Task 6: Final End-to-End Verification

> Bu task kod değişikliği içermez; tüm değişiklikleri bir arada doğrular.

- [ ] **Step 1: Full build + lint**

```bash
npm run build && npm run lint 2>&1 | tail -20
```

Expected:
- `tsc -b && vite build` exit 0
- `eslint .` — bu sprint'te eklenen kodda yeni hata YOK. Pre-existing 84 hata değişmemeli (Sprint 1 baseline).

- [ ] **Step 2: Dev server + visual smoke (ana akış)**

```bash
npm run dev
```

Browser'da şu sayfaları gez:

1. **`/companies/:id` → Kullanım tab — plan'ı OLAN firma:**
   - Periyot select altında bütçe kartı.
   - Sol: `$Y / $X` + `P% kullanıldı`
   - Orta: progress bar (renk pct'ye göre değişir).
   - Sağ: bant rozeti.
   - Hover bar: gerçek pct tooltip'te (≥%100 olabilir).

2. **`/companies/:id` → Kullanım tab — plan'ı OLMAYAN firma:**
   - Tek satır kompakt kart: "Bu firmaya plan atanmamış — bütçe limiti yok." + gri "İzleme Yok" rozeti.

3. **`/settings` → Quote Pipeline:**
   - Sol nav'da "📋 Quote Pipeline" `pricingConfig`'in hemen altında.
   - Sağ panelde 7 numarali kart + amber config notu.
   - Tüm metin Türkçe.

- [ ] **Step 3: Bant edge case'leri visual doğrulama (mock)**

DevTools Console'da geçici override ile 4 bant + 2 edge'i göster:

```js
// React DevTools'tan UsageTab'i bul, prop'ları override et:
// VEYA budget-band.ts'i geçici test et:
import { computeBudgetBand } from '@/features/companies/lib/budget-band'

console.assert(computeBudgetBand(50, 100).band === 'normal')         // 50%
console.assert(computeBudgetBand(85, 100).band === 'standard')       // 85%
console.assert(computeBudgetBand(96, 100).band === 'economy')        // 96%
console.assert(computeBudgetBand(98, 100).band === 'exhausted')      // 98%
console.assert(computeBudgetBand(120, 100).band === 'exhausted')     // >100%
console.assert(computeBudgetBand(120, 100).pct === 100)              // clamp
console.assert(computeBudgetBand(120, 100).rawPct === 120)           // raw
console.assert(computeBudgetBand(50, null).band === 'unconfigured')  // no plan
console.assert(computeBudgetBand(50, 0).band === 'unconfigured')     // zero cap
console.log('budget-band edge cases OK')
```

> Bu console assertion'lar dev sırasında ad-hoc çalıştırılır — proje genelinde test framework olmadığı için resmi unit test yok. Plan'da spec sapması olarak belgelendi.

- [ ] **Step 4: Console error & network kontrolü**

DevTools açık → tüm sayfaları gez → console'da hiç error olmamalı. Network tab'da:
- `/platform/companies/:id` 200
- `/platform/companies/:id/usage` 200
- `/platform/plans/:id` 200 (planı olan firmalarda)
- `/settings/quote-pipeline` route'u client-side; HTTP request yok (statik component)

- [ ] **Step 5: Eğer Step 2-4'te bug bulunursa**

İlgili Task'a geri dön, düzelt, ayrı commit et:

```bash
git commit -m "fix(<area>): <açıklama>"
```

> Bug yoksa ekstra commit yok.

---

## Spec Karşılaştırma (Self-Review Checklist)

| Spec gereksinimi | Karşılayan task |
|------------------|-----------------|
| §3.1 Yerleşim — period select altı | Task 3 Step 1 |
| §3.2 3 kolon layout | Task 2 Step 1 |
| §3.3 4 bant + renk map | Task 1 Step 1 |
| §3.4 Plan atanmamış edge case | Task 2 Step 1 (`unconfigured` branch) |
| §3.5 `computeBudgetBand` util signature | Task 1 Step 1 |
| §3.6 `<BudgetStatusCard />` numeric props | Task 2 Step 1 |
| §4.1 Settings yerleşim — `pricingConfig` sonrası | Task 5 Step 1 |
| §4.2 7 adım kartı + intro + config notu | Task 4 Step 1 |
| §4.3 STEPS array | Task 4 Step 1 |
| §6 Doğrulama | Task 6 |
| §6 Vitest test | **Atlandı (gerekçe başta belgelendi)** — Task 6 Step 3 console assertion |

---

## Risk Notları (Spec §8'den)

- **Bant eşikleri değişirse:** `budget-band.ts:30-34` (computeBudgetBand içindeki `if/else if` zinciri) tek değişim noktası.
- **`useCompany` çift fetch:** `UsageTab` ve `CompanyDetailPage` ikisi de `useCompany(companyId)` çağırırsa react-query aynı cache'i paylaşır — sorun yok.
- **`usePricingPlan('')` empty string:** `enabled: !!id` (use-pricing-plans.ts:23) sayesinde fetch yapmaz.
- **Settings nav 16 → 17 entry sıkışıklık:** mevcut sidebar overflow scroll var.
