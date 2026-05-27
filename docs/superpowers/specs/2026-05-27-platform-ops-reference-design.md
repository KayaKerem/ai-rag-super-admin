# Sub-project 3+4 — Platform Ops Reference (2026-05-27)

**Sub-project:** 3 of 4 in original decomp; **birleşik 3+4** çünkü her ikisi de Sprint B/D backend dependency'ye paled. Plan 4 → 3 sub-project oldu (sub-1 + sub-2 + sub-3+4 = 3 total).

**Backend docs:**
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/24-platform-cron.md` (13 section)
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/25-translation.md` (14 section)

**FE repo:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin`
**Prior commit:** `2d8b685` (sub-2 WebChat + Embed Admin)
**Branch strategy:** single-branch ship to main

## 1. Scope

Tek yeni lazy route + sidebar entry + 2 tab. Tüm içerik **static reference** (canlı API yok; backend Sprint B/D'ye bağımlı şeyler disclaimer ile işaretli). ~5 commit.

| Bölge | İçerik | API |
|------|--------|-----|
| Yeni lazy route `/admin/platform-ops` | Sidebar entry "Platform Ops"; AuthGuard otomatik | — |
| **Tab 1: Cron Catalog** (default) | 9 cron card (5 platform-lifecycle + billing cleanup + 2 connector sync + sandbox-quota reconcile + test-sandbox cleanup): route, schedule, açıklama, Coolify YAML snippet copy | Static const |
| **Tab 2: Translation Info** | Cost example (Haiku 4.5, ~$0.00024/turn), rate-limit env defaults (60 RPM / 100k tph), 6-language list (tr/en/ar/fr/es/de), hydrationStatus discriminator (native/cached/translated/failed), glossary location ref (`company_memories.category='glossary'`) | Static const |
| Cross-cut | Sprint B/D follow-up banner her tab'ın üstünde | — |

**Out of scope (kayıt):**
- Cron health / last-run / status (Sprint D, no in-DB cron_runs table yet)
- Cron manuel trigger (security: `x-ai-internal-key` FE'den göndermek secret expose)
- AI_INTERNAL_SECRET rotation (Sprint D)
- Per-tenant translation cost band (Sprint B)
- Per-language coverage % (Sprint B)
- Force-prune endpoint (Sprint B, `DELETE /platform/companies/:id/turn-translations`)
- Per-tenant RPM/TPH override (Sprint B, şu an global env)
- Glossary CRUD UI (Sprint B — backend admin endpoint görülmedi)
- A/B test framework

## 2. Architecture / patterns

- **Lazy route:** Sprint 7-8 paterni — `lazy(() => import('./pages/platform-ops-page'))`. Yeni chunk ~5-8 kB; main bundle değişmez.
- **URL state:** `?tab=cron|translation` — `useUrlFilterState` + module-level `URL_STATE_OPTS` (playbook-admin-page'in cap-violations tab paterni, sub-1 commit 07f4a34).
- **Tabs primitive:** mevcut `@/components/ui/tabs`.
- **Snippet copy:** sub-2 `universal-embed-section.tsx` (commit d357153) paterni — `navigator.clipboard.writeText()` + sonner toast. Helper extract edilmez (8-satır duplicate ile devam — DRY pre-mature; iki use site daha edge edinirse extract ederiz).
- **Static data:** TS const arrays içinde tüm içerik (no fetch, no MSW handler). Versiyonlama: backend doc kaynak. Spec'te "backend doc 24/25 değişirse update" notu.
- **Sidebar entry:** mevcut admin items section'a yeni satır. Sidebar overflow şu ana kadar 12 item ile sorun değil; ekleyince 13 olur.
- **AdminGuard:** route mevcut `<AuthGuard>` paternine güveniyoruz (`isPlatformAdmin` check otomatik).

## 3. Component breakdown

**New files (5):**
| Path | Sorumluluk |
|------|------------|
| `src/features/platform-ops/data/catalog.ts` | Static data: `CRON_CATALOG: CronEntry[]` (9 entry) + `TRANSLATION_INFO` const |
| `src/features/platform-ops/components/cron-card.tsx` | Tek cron için Card (route, schedule, açıklama, snippet copy btn) |
| `src/features/platform-ops/components/cron-catalog-tab.tsx` | Cron Catalog tab content: 9 card grid + Sprint D disclaimer banner |
| `src/features/platform-ops/components/translation-info-tab.tsx` | Translation Info tab content: cost/rate/lang/hydration/glossary cards + Sprint B disclaimer banner |
| `src/features/platform-ops/pages/platform-ops-page.tsx` | Route component: Tabs root + URL state + 2 tab content |

**Modified files (2):**
- `src/App.tsx` — yeni lazy route `/admin/platform-ops`
- `src/components/layout/sidebar.tsx` (line 18-34 `platformItems` array) — yeni entry `{ to: '/admin/platform-ops', icon: Cpu, label: 'Platform Ops' }` (icon lucide-react'tan, mevcut admin item paterni)

## 4. Data shape

```ts
// src/features/platform-ops/data/catalog.ts
export type CronCategory = 'platform-lifecycle' | 'billing' | 'connectors' | 'sandbox'

export interface CronEntry {
  category: CronCategory
  route: string  // /internal/platform/storage-sync
  schedule: string  // cron expression
  scheduleHuman: string  // "Daily 02:30 UTC"
  description: string  // 1-2 sentence
}

export const CRON_CATALOG: CronEntry[] = [
  { category: 'platform-lifecycle', route: '/internal/platform/storage-sync',
    schedule: '30 2 * * *', scheduleHuman: 'Daily 02:30 UTC',
    description: "Tüm tenant'lar için company_storage_usage.last_calculated_at heartbeat. S3 listObjectsV2 entegrasyonu TODO." },
  { category: 'platform-lifecycle', route: '/internal/platform/budget-monitor',
    schedule: '0 3 * * *', scheduleHuman: 'Daily 03:00 UTC',
    description: 'Tenant bütçe kullanımını hesaplar; budgetDowngradeThresholdPct (default 80) aşılırsa BUDGET_ALERT log + bildirim.' },
  { category: 'platform-lifecycle', route: '/internal/platform/process-downgrades',
    schedule: '0 * * * *', scheduleHuman: 'Hourly',
    description: 'pendingPlanId set olan tenant\'lar için yeni billing cycle\'a girilince downgrade uygular. PLAN_DOWNGRADE_EXECUTED event.' },
  { category: 'platform-lifecycle', route: '/internal/platform/email-lifecycle',
    schedule: '0 9 * * *', scheduleHuman: 'Daily 09:00 UTC',
    description: 'Trial ending (3 gün warning) + trial ended (gün 0) lifecycle email\'leri.' },
  { category: 'platform-lifecycle', route: '/internal/platform/subscription-lifecycle',
    schedule: '0 2 * * *', scheduleHuman: 'Daily 02:00 UTC',
    description: 'TRIALING → PAST_DUE/ACTIVE self-heal, PAST_DUE → SUSPENDED 7d grace expired sonra.' },
  { category: 'billing', route: '/internal/billing/cleanup-reservations',
    schedule: '0 * * * *', scheduleHuman: 'Hourly',
    description: 'RESERVED durumunda kalmış stale budget reservation\'ları RELEASED\'a çevirir. Default cutoff 1 saat.' },
  { category: 'connectors', route: '/internal/connectors/sync',
    schedule: 'per-source', scheduleHuman: 'Per source (crawlMinIntervalHours)',
    description: 'Tek bir connector source için crawl + ingest. Trigger.dev tarafından çağrılır.' },
  { category: 'connectors', route: '/internal/connectors/sync-scheduler',
    schedule: '*/30 * * * *', scheduleHuman: 'Every 30 min',
    description: 'Tüm tenant\'lar arasında minIntervalHours geçmiş + aktif connector\'ları listeleyip Trigger.dev\'e fan-out eder.' },
  { category: 'sandbox', route: '/internal/sandbox-quota/reconcile',
    schedule: '0 4 * * *', scheduleHuman: 'Daily 04:00 UTC',
    description: 'Counter drift onar — Redis sayılarla DB sayıları arasında mismatch fix.' },
  { category: 'sandbox', route: '/internal/test-sandbox/cleanup',
    schedule: '30 4 * * *', scheduleHuman: 'Daily 04:30 UTC',
    description: 'Süresi geçmiş sandbox run\'larını soft-delete eder (max-age config\'e tabi).' },
]

export const TRANSLATION_INFO = {
  model: 'anthropic/claude-haiku-4.5',
  temperature: 0,
  timeoutMs: 5000,
  costPerMtokInput: 0.20,  // USD
  costPerMtokOutput: 1.00,
  perTurnCostExample: 0.00024,  // 200→200 token TR↔AR
  monthlyExampleTenant: 0.72,  // 100 turns/day × 30
  rateLimit: { rpmPerCompany: 60, tokensPerHour: 100_000 },
  languages: ['tr', 'en', 'ar', 'fr', 'es', 'de'] as const,
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

## 5. Snippet generation (Cron Catalog)

Her cron card'da "Coolify YAML kopyala" butonu için template:

```ts
function buildSnippet(entry: CronEntry): string {
  const apiBase = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
  const name = entry.route.split('/').filter(Boolean).pop() ?? 'cron'
  return `- name: ${name}
  schedule: "${entry.schedule}"
  command: |
    curl -X POST ${apiBase}${entry.route} \\
      -H "x-ai-internal-key: $AI_INTERNAL_SECRET"`
}
```

Copy button: `<Button onClick={() => copyToClipboard(buildSnippet(entry))}>Coolify YAML kopyala</Button>`.

Note: connector schedule `per-source` ve `*/30 * * * *` farklı — `per-source` için snippet'te "Schedule: Trigger.dev manages" gibi placeholder, Coolify cron value placeholder ile copy edilmez. Implementer karar: snippet button'u sadece sabit schedule entry'lerde (8 cron), 1 entry'de ("per-source") "Trigger.dev managed — Coolify cron yok" disabled badge.

## 6. Error / edge cases

- **Clipboard fail:** sonner error toast (sub-2'deki paterni inline duplicate; 8-satır)
- **No data states needed** (static const)
- **`per-source` connector entry:** snippet button disabled + badge "Trigger.dev managed"

## 7. Testing + verification

Sub-1 ve sub-2 ile aynı: 0 unit test framework. Verify:

- TS `npx tsc -b 2>&1 | tail -10` → 0 error
- Build `npm run build` → green
- Lazy chunk ~5-8 kB (yeni admin route)
- Manuel smoke:
  1. `/admin/platform-ops` route açılır (lazy load)
  2. Default tab "Cron Catalog" — 9 card görünür (kategori başlıkları okunabilir)
  3. URL `?tab=translation` → Translation Info tab; 5 info card
  4. Cron card'da "Coolify YAML kopyala" → toast + pano içerik snippet ile match (5 cron için happy path)
  5. `per-source` cron card'ında snippet button disabled + badge görünür
  6. Sidebar entry "Platform Ops" admin section'da
  7. Non-admin user `/admin/platform-ops` URL'i → redirect (mevcut AuthGuard)

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backend cron schedule değişir → FE static data stale | M | Düşük | Spec'te "Quarterly review" notu; cross-link `24-platform-cron.md` |
| Sidebar overflow (13 item) | Düşük | Düşük | Şu ana kadar sorun değil; gelecekte collapsible group |
| Lazy chunk başarısız import | Düşük | Düşük | Mevcut lazy route paterni stabil |
| Translation glossary CRUD beklenir → kullanıcı confusing | Düşük | Düşük | Banner açıkça "Sprint B" |
| Sidebar item path/dosyası beklenenden farklı | M | Düşük | İmplementer grep'le bulur, plan'da "grep first" instruction |

## 9. Out of scope (Sprint B/D backlog detay)

**Sprint B:**
- B15-related: per-tenant translation cost band widget
- B16-related: translation cost/coverage drill-down
- Force-prune endpoint UI (B-class manual KVKK)
- Glossary CRUD UI (backend admin endpoint görülmedi)
- Per-tenant RPM/TPH override config

**Sprint D:**
- Cron health monitoring (in-DB cron_runs tablosu, structured log aggregation)
- AI_INTERNAL_SECRET rotation wizard (dual-secret window)
- Per-route audit log (kim tetikledi)
- Internal endpoint Swagger toggle (staging-only)

**Sub-2 carryover:** kill-switch status backend endpoint geldiğinde `/settings` WebChannelSection'a status badge

## 10. Implementation order

5 commit:

1. **C1** — `data/catalog.ts` (static CRON_CATALOG + TRANSLATION_INFO)
2. **C2** — `cron-card.tsx` + `cron-catalog-tab.tsx` (snippet copy + disclaimer banner)
3. **C3** — `translation-info-tab.tsx` (cards + disclaimer banner)
4. **C4** — `platform-ops-page.tsx` (Tabs root + URL state)
5. **C5** — `App.tsx` lazy route + sidebar entry + final TS/build verify

Acceptance: tsc 0 error, vite build green, 7-step manual smoke pass.

## 11. References

- Backend: `24-platform-cron.md`, `25-translation.md`
- Lazy route pattern: `src/App.tsx` (cost-health, agent-quality, agent-route-bindings, playbook-admin)
- URL state pattern: `src/features/playbook-admin/pages/playbook-admin-page.tsx` (Sprint 9 + sub-1 cap-violations tab)
- Clipboard copy pattern: `src/features/companies/components/universal-embed-section.tsx` (sub-2 d357153)
- Cross-link cards pattern: sub-2 `webchat-tab.tsx` B17 banner
