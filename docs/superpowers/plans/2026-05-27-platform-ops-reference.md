# Sub-project 3+4 — Platform Ops Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build static reference admin route `/admin/platform-ops` with 2 tabs (Cron Catalog + Translation Info) — backend `/internal/*` endpoint catalog + translation system info.

**Architecture:** Yeni lazy route, sidebar entry, 2 tab (URL state via useUrlFilterState), tüm içerik static TS const arrays. Snippet copy clipboard ile. Hiç API call yok (Sprint B/D backend dependency'leri disclaimer banner ile işaretli).

**Tech Stack:** React 19, React Router v7 lazy, TypeScript, shadcn/ui (Tabs, Card, Button, Badge), lucide-react icons, sonner toast, `useUrlFilterState` URL state hook.

**Spec:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin/docs/superpowers/specs/2026-05-27-platform-ops-reference-design.md` (committed `c809df3`)

**Acceptance:** `tsc -b` 0 error (baseline 0), `vite build` green, 7-step browser smoke pass (spec §7).

---

## File Structure

**New files (5):**
- `src/features/platform-ops/data/catalog.ts` — `CronEntry` type, `CRON_CATALOG` array, `TRANSLATION_INFO` const
- `src/features/platform-ops/components/cron-card.tsx` — single cron entry Card with snippet copy
- `src/features/platform-ops/components/cron-catalog-tab.tsx` — Cron tab content: grid of cards + Sprint D banner
- `src/features/platform-ops/components/translation-info-tab.tsx` — Translation tab content + Sprint B banner
- `src/features/platform-ops/pages/platform-ops-page.tsx` — Route component: tabs root + URL state

**Modified files (2):**
- `src/App.tsx` — add lazy route `/admin/platform-ops`
- `src/components/layout/sidebar.tsx` — add `platformItems` entry

---

## Task 1: Static catalog data

**Files:**
- Create: `src/features/platform-ops/data/catalog.ts`

- [ ] **Step 1: Create the data file**

Create `src/features/platform-ops/data/catalog.ts`:

```ts
export type CronCategory = 'platform-lifecycle' | 'billing' | 'connectors' | 'sandbox'

export interface CronEntry {
  category: CronCategory
  route: string
  schedule: string  // cron expression or 'per-source'
  scheduleHuman: string
  description: string
  triggerable: boolean  // false for per-source (Trigger.dev managed)
}

export const CATEGORY_LABELS: Record<CronCategory, string> = {
  'platform-lifecycle': 'Platform Lifecycle',
  billing: 'Billing',
  connectors: 'Connectors',
  sandbox: 'Sandbox',
}

export const CRON_CATALOG: CronEntry[] = [
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/storage-sync',
    schedule: '30 2 * * *',
    scheduleHuman: 'Daily 02:30 UTC',
    description:
      "Tüm tenant'lar için company_storage_usage.last_calculated_at heartbeat. S3 listObjectsV2 entegrasyonu TODO.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/budget-monitor',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 UTC',
    description:
      'Tenant bütçe kullanımını hesaplar; budgetDowngradeThresholdPct (default 80) aşılırsa BUDGET_ALERT log + bildirim.',
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/process-downgrades',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly',
    description:
      "pendingPlanId set olan tenant'lar için yeni billing cycle'a girilince downgrade uygular. PLAN_DOWNGRADE_EXECUTED event + email.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/email-lifecycle',
    schedule: '0 9 * * *',
    scheduleHuman: 'Daily 09:00 UTC',
    description: 'Trial ending (3 gün warning) + trial ended (gün 0) lifecycle email\'leri.',
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/subscription-lifecycle',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily 02:00 UTC',
    description:
      'TRIALING → PAST_DUE/ACTIVE self-heal, PAST_DUE → SUSPENDED 7d grace expired sonra.',
    triggerable: true,
  },
  {
    category: 'billing',
    route: '/internal/billing/cleanup-reservations',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly',
    description:
      "RESERVED durumunda kalmış stale budget reservation'ları RELEASED'a çevirir. Default cutoff 1 saat.",
    triggerable: true,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync',
    schedule: 'per-source',
    scheduleHuman: 'Per source (crawlMinIntervalHours)',
    description: 'Tek bir connector source için crawl + ingest. Trigger.dev tarafından çağrılır.',
    triggerable: false,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync-scheduler',
    schedule: '*/30 * * * *',
    scheduleHuman: 'Every 30 min',
    description:
      "Tüm tenant'lar arasında minIntervalHours geçmiş + aktif connector'ları listeleyip Trigger.dev'e fan-out eder.",
    triggerable: true,
  },
  {
    category: 'sandbox',
    route: '/internal/sandbox-quota/reconcile',
    schedule: '0 4 * * *',
    scheduleHuman: 'Daily 04:00 UTC',
    description: 'Counter drift onar — Redis sayılarla DB sayıları arasında mismatch fix.',
    triggerable: true,
  },
  {
    category: 'sandbox',
    route: '/internal/test-sandbox/cleanup',
    schedule: '30 4 * * *',
    scheduleHuman: 'Daily 04:30 UTC',
    description: "Süresi geçmiş sandbox run'larını soft-delete eder (max-age config'e tabi).",
    triggerable: true,
  },
]

export const TRANSLATION_INFO = {
  model: 'anthropic/claude-haiku-4.5',
  temperature: 0,
  timeoutMs: 5000,
  costPerMtokInput: 0.2,
  costPerMtokOutput: 1.0,
  perTurnCostExample: 0.00024,
  monthlyExampleTenant: 0.72,
  rateLimit: { rpmPerCompany: 60, tokensPerHour: 100_000 },
  languages: ['tr', 'en', 'ar', 'fr', 'es', 'de'],
  hydrationStatuses: [
    { value: 'native', label: 'Native', desc: 'Turn zaten istenen dilde' },
    { value: 'cached', label: 'Cached', desc: 'turn_translations cache hit' },
    { value: 'translated', label: 'Translated', desc: 'Bu istek sırasında yeni çeviri üretildi' },
    { value: 'failed', label: 'Failed', desc: 'Hata — translationError dolu' },
  ],
  glossaryLocation: "company_memories.category = 'glossary' (per-tenant)",
  redactionPatterns: ['TC Kimlik', 'Kredi Kartı', 'Telefon', 'SSN', 'URL', 'Email'],
} as const
```

- [ ] **Step 2: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 0 errors (the file is self-contained, only TypeScript types).

- [ ] **Step 3: Commit**

```bash
git add src/features/platform-ops/
git commit -m "$(cat <<'EOF'
feat(platform-ops): static cron + translation catalog data

CRON_CATALOG (9 entries across 4 categories) + TRANSLATION_INFO
const. Source of truth: backend doc 24-platform-cron.md + 25-translation.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: CronCard + CronCatalogTab

**Files:**
- Create: `src/features/platform-ops/components/cron-card.tsx`
- Create: `src/features/platform-ops/components/cron-catalog-tab.tsx`

- [ ] **Step 1: Create CronCard**

Create `src/features/platform-ops/components/cron-card.tsx`:

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { CronEntry } from '../data/catalog'

interface CronCardProps {
  entry: CronEntry
}

function buildSnippet(entry: CronEntry): string {
  const apiBase = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
  const name = entry.route.split('/').filter(Boolean).pop() ?? 'cron'
  return `- name: ${name}
  schedule: "${entry.schedule}"
  command: |
    curl -X POST ${apiBase}${entry.route} \\
      -H "x-ai-internal-key: $AI_INTERNAL_SECRET"`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Kopyalandı')
  } catch {
    toast.error('Kopyalama başarısız — manuel seç')
  }
}

export function CronCard({ entry }: CronCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs font-mono">{entry.route}</code>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {entry.scheduleHuman}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{entry.description}</p>
        {entry.triggerable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(buildSnippet(entry))}
            className="w-full"
          >
            <Copy className="h-3 w-3 mr-2" />
            Coolify YAML kopyala
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Trigger.dev managed — Coolify cron yok
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create CronCatalogTab**

Create `src/features/platform-ops/components/cron-catalog-tab.tsx`:

```tsx
import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { CronCard } from './cron-card'
import { CRON_CATALOG, CATEGORY_LABELS, type CronCategory } from '../data/catalog'

export function CronCatalogTab() {
  const grouped = useMemo(() => {
    const map = new Map<CronCategory, typeof CRON_CATALOG>()
    for (const entry of CRON_CATALOG) {
      const arr = map.get(entry.category) ?? []
      arr.push(entry)
      map.set(entry.category, arr)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-6">
      {/* Sprint D follow-up banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Sprint D follow-up:</span> Cron health
            monitoring (son çalışma timestamp + success/fail status), AI_INTERNAL_SECRET rotation
            wizard, per-route audit log henüz yok.
          </p>
          <p className="text-xs">
            Şu an Coolify Cron veya GitHub Actions schedule üzerinden tetiklenir. Manuel trigger UI{' '}
            <strong>security risk</strong> (secret expose) için eklenmedi.
          </p>
        </div>
      </div>

      {grouped.map(([category, entries]) => (
        <section key={category} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {entries.map((entry) => (
              <CronCard key={entry.route} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/platform-ops/
git commit -m "$(cat <<'EOF'
feat(platform-ops): CronCard + CronCatalogTab

9 cron entry grouped by category (platform-lifecycle, billing,
connectors, sandbox). Coolify YAML snippet copy button per entry
(disabled for Trigger.dev-managed per-source). Sprint D follow-up
banner at top.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TranslationInfoTab

**Files:**
- Create: `src/features/platform-ops/components/translation-info-tab.tsx`

- [ ] **Step 1: Create TranslationInfoTab**

Create `src/features/platform-ops/components/translation-info-tab.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { TRANSLATION_INFO } from '../data/catalog'

export function TranslationInfoTab() {
  return (
    <div className="space-y-4">
      {/* Sprint B follow-up banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Sprint B follow-up:</span> Per-tenant
            cost band, per-language coverage %, force-prune endpoint, per-tenant rate-limit
            override, glossary CRUD UI henüz yok.
          </p>
          <p className="text-xs">Şu an default config env-managed; aşağıdaki değerler referans.</p>
        </div>
      </div>

      {/* Cost example */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Example (Haiku 4.5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Model:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.model}</code>
          </p>
          <p>
            <span className="text-muted-foreground">Input:</span> $
            {TRANSLATION_INFO.costPerMtokInput.toFixed(2)}/Mtok &nbsp;{' '}
            <span className="text-muted-foreground">Output:</span> $
            {TRANSLATION_INFO.costPerMtokOutput.toFixed(2)}/Mtok
          </p>
          <p>
            <span className="text-muted-foreground">Tipik turn (200→200 token TR↔AR):</span>{' '}
            ~${TRANSLATION_INFO.perTurnCostExample.toFixed(5)}
          </p>
          <p>
            <span className="text-muted-foreground">100 turn/gün × 30:</span>{' '}
            ~${TRANSLATION_INFO.monthlyExampleTenant.toFixed(2)}/ay/tenant
          </p>
        </CardContent>
      </Card>

      {/* Rate limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rate Limits (env-managed)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Per-company RPM:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.rateLimit.rpmPerCompany}</code>{' '}
            <span className="text-xs text-muted-foreground">(TRANSLATION_RPM_PER_COMPANY)</span>
          </p>
          <p>
            <span className="text-muted-foreground">Per-company tokens/saat:</span>{' '}
            <code className="text-xs">
              {TRANSLATION_INFO.rateLimit.tokensPerHour.toLocaleString()}
            </code>{' '}
            <span className="text-xs text-muted-foreground">(TRANSLATION_TOKENS_PER_HOUR)</span>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Aşılırsa graceful degrade — operator orijinali görür ({`{ kind: 'skipped', reason: 'rate_limited' }`}).
          </p>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Desteklenen Diller (AppLanguage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRANSLATION_INFO.languages.map((lang) => (
              <Badge key={lang} variant="secondary" className="text-xs uppercase">
                {lang}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hydration statuses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">hydrationStatus Discriminator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {TRANSLATION_INFO.hydrationStatuses.map((s) => (
            <div key={s.value} className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {s.label}
              </Badge>
              <span className="text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Glossary + PII */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Glossary + PII Redaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Glossary entries:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.glossaryLocation}</code>
          </p>
          <p className="text-muted-foreground">Her LLM çağrısı öncesi maskeli desenler:</p>
          <div className="flex flex-wrap gap-2">
            {TRANSLATION_INFO.redactionPatterns.map((p) => (
              <Badge key={p} variant="outline" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/platform-ops/
git commit -m "$(cat <<'EOF'
feat(platform-ops): TranslationInfoTab static reference

Cost example (Haiku 4.5 pricing), rate limit env defaults,
6-language list, hydrationStatus discriminator, glossary location +
PII redaction patterns. All static, sourced from backend doc
25-translation.md. Sprint B follow-up banner at top.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: PlatformOpsPage with tabs + URL state

**Files:**
- Create: `src/features/platform-ops/pages/platform-ops-page.tsx`

- [ ] **Step 1: Read playbook-admin-page.tsx for URL state pattern**

Run: `Read src/features/playbook-admin/pages/playbook-admin-page.tsx`

Confirm: `AdminTab` union type, `TAB_FILTER` (defaults / parse / serialize) shape, `useUrlFilterState(TAB_FILTER)` usage.

- [ ] **Step 2: Create PlatformOpsPage**

Create `src/features/platform-ops/pages/platform-ops-page.tsx`:

```tsx
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
```

Note: `onValueChange` typing in this project uses `(value: string | null) => void` (base-ui pattern, confirmed via sub-1 commit 07f4a34 + sub-2 12). Cast to `OpsTab` with fallback for type safety.

- [ ] **Step 3: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 0 errors. If `useUrlFilterState` import path differs, grep: `grep -rn "useUrlFilterState" src/lib/`.

- [ ] **Step 4: Commit**

```bash
git add src/features/platform-ops/
git commit -m "$(cat <<'EOF'
feat(platform-ops): PlatformOpsPage with tabs + URL state

Tabs root: cron-catalog (default) + translation-info. URL state
?tab=translation-info persists; default omitted from URL (clean
links). Mirrors playbook-admin TAB_FILTER pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Lazy route + sidebar entry + final verify

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Read App.tsx + sidebar.tsx**

Run:
```
Read src/App.tsx
Read src/components/layout/sidebar.tsx
```

In App.tsx, locate:
- Lazy import block (around lines 17-41 per spec; cost-health, agent-quality, etc.)
- Routes block (around line 67+)
- `RouteLoadingFallback` component or whatever fallback is used in `<Suspense>`

In sidebar.tsx, locate:
- `platformItems` array (around line 18-34) with shape `{ to, icon, label }`
- Icon import block from `lucide-react`

- [ ] **Step 2: Add lazy import in App.tsx**

After the last existing lazy import (likely playbook-admin), add:

```tsx
const PlatformOpsPage = lazy(() =>
  import('@/features/platform-ops/pages/platform-ops-page').then((m) => ({
    default: m.PlatformOpsPage,
  }))
)
```

- [ ] **Step 3: Add Route in App.tsx**

In the Routes block, after the last `/admin/*` route, add:

```tsx
<Route
  path="/admin/platform-ops"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <PlatformOpsPage />
    </Suspense>
  }
/>
```

(Use whatever Suspense fallback component the existing admin routes use — copy exact pattern.)

- [ ] **Step 4: Add sidebar entry**

In `src/components/layout/sidebar.tsx`:

Add `Cpu` to the lucide-react icon imports (or use an alternative icon like `Server` or `Settings` — match aesthetics with existing icons):

```tsx
import { ..., Cpu } from 'lucide-react'
```

In the `platformItems` array, add (placement: end or grouped logically):

```tsx
{ to: '/admin/platform-ops', icon: Cpu, label: 'Platform Ops' },
```

Match the exact shape of existing items (if they include a different field like `description` or `section`, mirror it).

- [ ] **Step 5: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -20
```

Expected:
- 0 TS errors
- vite build green
- New chunk `platform-ops-page-<hash>.js` ~5-8 kB raw (lazy chunk)
- Main bundle no significant change

- [ ] **Step 6: Grep regression sanity**

```
grep -rn "platform-ops\|PlatformOps" src/App.tsx src/components/layout/sidebar.tsx
```

Expected: lazy import + Route + sidebar item entries — 3 hits across 2 files.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/layout/sidebar.tsx
git commit -m "$(cat <<'EOF'
feat(platform-ops): lazy route + sidebar entry

/admin/platform-ops registered as lazy route under AuthGuard
(automatic isPlatformAdmin gate). Sidebar entry 'Platform Ops'
added to platformItems with Cpu icon. New lazy chunk ~5-8 kB.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Final verify + push + memory

### Task 6: Manual smoke + push + memory recap

- [ ] **Step 1: Full TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -25
```

Expected: 0 errors. Bundle delta < 10 kB raw vs prior commit.

- [ ] **Step 2: Manual browser smoke (dev mode)**

Run: `npm run dev` (background)

Spec §7 7-step checklist:
1. `/admin/platform-ops` route opens (lazy load, Suspense fallback briefly visible)
2. Default tab "Cron Catalog" shows 9 cards grouped by 4 categories
3. URL `?tab=translation-info` switches to Translation tab; 5 info cards
4. On a triggerable cron card, click "Coolify YAML kopyala" → sonner success toast + paste clipboard contents matches the YAML block format
5. Connector `sync` (per-source) card shows `Lock` icon + "Trigger.dev managed" instead of copy button
6. Sidebar entry "Platform Ops" appears in admin section (logged in as platform admin)
7. Non-admin user visiting `/admin/platform-ops` → redirected by existing AuthGuard

Fix-it-forward if any step fails; commit additional polish.

- [ ] **Step 3: Push to origin**

```bash
git push origin main 2>&1 | tail -5
```

- [ ] **Step 4: Update memory**

Write `~/.claude/projects/-Users-keremkaya-Desktop-firma-ai-rag-super-admin/memory/project_sub3_platform_ops_recap.md` with:
- Sub-projects 3+4 birleştirildi → Platform Ops Reference shipped
- Commit range (prior `2d8b685` → final HEAD)
- Plan 4 → 3 sub-project finalized

Update `MEMORY.md` index entry + `project_next_session_todo.md` (mark all sub-projects shipped; sprint 10 complete; next: new audit or polish).

---

## Acceptance criteria

- [ ] 5 task commits land on main (C1 through C5)
- [ ] `tsc -b` returns 0 errors
- [ ] `vite build` green, new lazy chunk ~5-8 kB
- [ ] 7-step browser smoke checklist passes
- [ ] `/admin/platform-ops` reachable; default tab cron-catalog; URL state works
- [ ] Coolify YAML snippet copies as valid cron YAML
- [ ] Per-source connector entry shows non-copyable Trigger.dev badge
- [ ] AuthGuard automatically gates non-admin users

---

## Reference cards

**Existing patterns to reuse:**
- Lazy route: `src/App.tsx` (cost-health, agent-quality, agent-route-bindings, playbook-admin)
- URL state TAB_FILTER: `src/features/playbook-admin/pages/playbook-admin-page.tsx`
- Tabs primitive: `@/components/ui/tabs`
- Clipboard copy: `src/features/companies/components/universal-embed-section.tsx` (sub-2 d357153) — inline duplicate (8-line, no extract)
- Sidebar items: `src/components/layout/sidebar.tsx:18-34` `platformItems`
- AuthGuard: `src/components/layout/auth-guard.tsx` (isPlatformAdmin auto)
- Info banner: sub-2 webchat-tab.tsx B17 banner pattern

**Backend doc references:**
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/24-platform-cron.md` (cron catalog source)
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/25-translation.md` (translation info source)

**Out-of-scope reminders:**
- No cron health endpoint (Sprint D)
- No translation cost API (Sprint B)
- No glossary CRUD (Sprint B — backend admin endpoint not present)
- No manual trigger (security: secret expose)
- No per-tenant RPM/TPH override (Sprint B)
- No per-language coverage % (Sprint B)
