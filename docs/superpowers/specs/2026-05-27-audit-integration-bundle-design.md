# Sprint 10 — Audit Integration Bundle (2026-05-27)

**Sub-project:** 1 of 5 (Audit Integration Bundle; 4 new admin pages are separate sub-projects)
**Backend bundle:** PR #177 → dev 083e9735, 2026-05-27
**Backend master doc:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/SUPERADMIN-MASTER.md`
**FE repo:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin`
**Branch strategy:** single worktree → single PR → main

## 1. Scope

12 breaking change + 2 new endpoint wires. `realtime/token` deferred (no consumer this sprint). 4 new pages (webchat-publicchat, platform-cron, translation, wp-plugin) out of scope.

| Tier | Item | Files | Effort |
|------|------|-------|--------|
| T1 | 1.5 `peerKind` +`'system'` | `agent-route-bindings/types.ts` (type + `PEER_KIND_OPTIONS:64-67`), `agent-route-bindings-page.tsx`, `agent-route-bindings-filters.tsx`, `parse-error.ts` | XS |
| T1 | 1.6 activity-log `security` category | `companies/components/activity-log-tab.tsx:46-61` (already 14 entries; only `security` missing) | XS |
| T1 | 1.11 `getCompanyToolConfig.source` enum rename `'plan'\|'override'\|'not_in_plan'` → `'plan'\|'company-override'\|'denied'` | `companies/types.ts:135`, `mocks/data.ts`, `docs/sections/platform-tool-planlari.tsx` (label map), `companies/components/tool-config-tab.tsx` (switch cases + label) | S |
| T1 | 1.9 deprecated usage fields | `companies/types.ts:47-59` (sil: `rerank`, `webSearch`, `proactive`, `cacheHits`; `storage.totalBytes` zaten yok), `mocks/data.ts` reader/aggregator | S |
| T1 | 1.16 `platform_alert_digest` readonly | `email-templates/components/email-template-table.tsx:106` (row click guard) or `email-template-edit-dialog.tsx:35-44` (save guard) | XS |
| T1 | docs cron path | `features/docs/sections/fiyatlandirma-gelir.tsx:126` (`/internal/process-downgrades` → `/internal/platform/process-downgrades`) | XS |
| T2 | 1.1 reactivate planId | `plan-tab.tsx` (status dialog conditional plan select), `hooks/use-company-billing.ts` (signature scalar → `{status, planId?}`), `companies/types.ts` (`UpdateCompanyStatusPayload`) | M |
| T2 | 1.2 companies pagination | `hooks/use-companies.ts` (`{limit, offset}` params + queryKey), `companies-page.tsx` (Önceki/Sonraki footer, URL state `?page=N`), uses `useUrlFilterState` pattern from `cost-health-page.tsx` | M |
| T2 | 1.3 token-based invite | `hooks/use-company-users.ts:30` (payload `{email, role, expiresInDays?}`), `invite-dialog.tsx` (UX: opsiyonel "Geçerlilik (gün)" input, success toast "Davet linki gönderildi") | M |
| T2 | 1.4 service-account /reveal yeni shape + 429 | `service-accounts/types.ts` (new `RevealResponse = {id, serviceName, decryptedPassword, revealedAt}`, `ServiceAccount`'tan `encryptedPassword` SİL), `hooks/use-reveal-password.ts` (429 + Retry-After parse), `service-account-table.tsx:109-116` (column "****" göstergesini sil; reveal sonrası 3s button lockout) | M |
| T2 | 1.7 agent-quality `?agentId` | `use-agent-quality-snapshot.ts` (param + queryKey), `use-agent-quality-trend.ts` (param + queryKey), filter UI (agent select), URL state `?agentId=`. **Agent enumeration kaynağı:** `agentRouteBindings.list` zaten distinct agent listesi sağlayabilir (mevcut hook) — yeni endpoint gerekmeden o consume edilir. | M |
| T2 | 1.14 connector config redacted | `data-sources-tab.tsx` — şu an config render edilmiyor; **bu sprint'te no-op** (Sprint B'ye config viewer eklenirse o zaman redact handling yapılır) | — |
| T2 | 1.20 PlatformUpdateCompanyDto extension | `Company` type'a 3 alan opsiyonel ekle (`brandColor?`, `timezone?`; `logoUrl?` zaten var), `use-company.ts:6` `UpdateCompanyPayload`'a aynı 3 alan, `agent-settings-card.tsx` form fields (color picker, URL input, timezone select). **`language` field DAHİL EDİLMEZ** — backend PATCH kabul ediyor ama persist etmiyor (Sprint B29). | M |
| T3 | 1.18 activity-log verify-chain UI | new hook `companies/hooks/use-activity-log-chain.ts` (`useVerifyActivityLogChain(companyId, {fromSeq?, toSeq?})` with manual `enabled` flag), `query-keys.ts` `companies.verifyChain(id)` ekle, `activity-log-tab.tsx:102` header'a "Zincir Doğrula" button → reuse `AlertDialog` primitive (varolan `playbook-seed-dialog.tsx` paterni) → result modal (valid: success toast; invalid: warning card with brokenAt seq), MSW handler `handlers.ts` içine `// ─── Activity Log Verify-Chain` bölümü altında | M |
| T3 | cap-violations/aggregate (playbook-admin 3. tab) | new query hook `use-cap-violations-aggregate.ts` (`useCapViolationsAggregate({from, to, companyId?, capKind?, source?})`), `query-keys.ts` `admin.capViolationsAggregate(params)` ekle, new component `playbook-admin/components/cap-violations-tab.tsx` (cost-health filter primitives reuse: date preset + companyId search + select), `playbook-admin-page.tsx` AdminTab union + TabsList + TabsContent + URL_STATE_OPTS defaults korur, MSW handler aggregated fixture | L |
| — | `realtime/token` | **deferred** — Sprint B (SSE push) ile beraber consume edilir | — |

**Out of scope:** 4 new pages (webchat-publicchat, platform-cron, translation, wp-plugin), tüm Sprint B 36 item + Sprint D 6 item (§7).

## 2. Architecture / patterns

Mevcut konvansiyonları takip — yeni mimari yok.

- **Tip kaynağı:** `src/features/<domain>/types.ts`. Backend doc'unun verdiği shape birebir. Deprecated alanlar silinince consumer'lar da temizlenir.
- **Hook layer:** TanStack Query.
  - Mutation: `useMutation` + `invalidateQueries(queryKeys.<scope>.<key>)` onSuccess
  - Query: `useQuery` + queryKey'e param ekle (`queryKeys` source-of-truth `src/lib/query-keys.ts`)
  - Pagination: `placeholderData: keepPreviousData` (önceki/sonraki butonlarda flicker önler)
- **UI:** shadcn primitives + `sonner` toast (`src/App.tsx:4` Toaster mounted). AlertDialog confirm pattern: reuse `playbook-seed-dialog.tsx` örneği.
- **Error handling:** Inline status/code check (axios). 400 + spesifik `data.code` → spesifik toast; aksi halde generic `toast.error('İşlem başarısız')`. `parse-error.ts`-tarzı genel util sadece complex domain (agent-route-bindings)'da; bu sprint'te per-mutation inline yeterli.
- **429:** Yeni pattern — `error.response?.status === 429` → `Retry-After` header'ı parse et (saniye) → toast + button disabled o süre boyunca (`setTimeout` + local state).
- **URL state:** Sprint 7+8 paterni — `useUrlFilterState` + module-level `URL_STATE_OPTS` const. Pagination ve `agentId` filter URL'de persist eder. Cap-violations tab da `playbook-admin-page.tsx`'in mevcut `TAB_FILTER` URL state'ine eklemli (`AdminTab` union extend).
- **MSW handlers:** Tek dosya `src/mocks/handlers.ts`. Yeni endpoint'ler comment-organized bölüm altında (`// ─── <Domain>`). Fixture data shape'i backend doc'undaki example response'la birebir.
- **Build:** `tsc -b && vite build` (package.json:8). 0 yeni TS error.

## 3. Per-domain detail

### T1 — Quick wins

**1.5 peerKind +'system'**
- `agent-route-bindings/types.ts:1` → `PeerKind = 'customer' | 'user' | 'system'`
- `agent-route-bindings/types.ts:64-67` `PEER_KIND_OPTIONS` array'e `{ value: 'system', label: 'Sistem' }`
- Consumer'larda label/badge style mapping güncelle (search: `'customer'\|'user'`) — `agent-route-bindings-page.tsx`, `agent-route-bindings-filters.tsx`, `parse-error.ts`

**1.6 activity-log security category**
- `companies/components/activity-log-tab.tsx:46-61` array'e `{ value: 'security', label: 'Güvenlik' }` ekle

**1.11 source enum rename**
- `companies/types.ts:135` rename
- 3 consumer:
  - `src/mocks/data.ts` — generation değerlerini yeni enum'a çevir
  - `src/features/docs/sections/platform-tool-planlari.tsx` — label map'in tüm 3 değerini güncelle
  - `src/features/companies/components/tool-config-tab.tsx` — switch case + label rendering
- Backend semantic değişikliği: `'company-override'` artık plan'ı override eden tenant config; `'denied'` plan'da yok demek
- Build green check (`tsc -b`) post-edit

**1.9 deprecated usage fields**
- `companies/types.ts:47-59` `UsageMonth` interface'ten sil: `rerank`, `webSearch`, `proactive`, `cacheHits`
- `src/mocks/data.ts` generation + aggregation loops temizle (`rerankCount`, `webSearchCount`, vb.)
- Read-side: hiç UI widget bulunmadı (önceki review). `storage.totalBytes` FE'de zaten yok — değişiklik yok.

**1.16 platform_alert_digest readonly**
- Tercih: `email-template-table.tsx:106` row click handler'da `if (row.original.slug === 'platform_alert_digest') return` + tooltip ile disabled hover state
- Edit dialog'da defensive guard (`email-template-edit-dialog.tsx:35-44` save handler'da slug check)
- 400 `readonly_template` response fallback toast: "Bu şablon readonly, değiştirilemez"

**Docs cron path**
- `features/docs/sections/fiyatlandirma-gelir.tsx:126` tek satır string fix
- Diğer 4 path (storage-sync, budget-monitor, email-lifecycle, subscription-lifecycle) bu repo'da yok — scope dışı

### T2 — Mid-effort

**1.1 Reactivate planId**
- `hooks/use-company-billing.ts` `useUpdateCompanyStatus`:
  - Şu an: `mutate(status: 'active' | 'suspended' | 'cancelled')` scalar
  - Yeni: `mutate({status, planId?}: {status: ..., planId?: string})` — axios PATCH body `{status, ...(planId && {planId})}`
- `companies/types.ts` `UpdateCompanyStatusPayload` interface ekle (export et)
- `plan-tab.tsx`:
  - `statusConfirmOpen` dialog'unda conditional: `statusValue === 'active' && company.status === 'cancelled'` ise plan Select görünür (mevcut `plans` zaten `usePricingPlans()` ile fetch'lenmiş)
  - `selectedReactivatePlanId` state
  - Onay button disabled: `(needsPlan && !selectedReactivatePlanId) || updateStatus.isPending`
  - 400 `reactivation_requires_plan` fallback toast: "Plan seçimi gerekli"

**1.2 Companies pagination**
- `hooks/use-companies.ts`: signature `useCompanies({limit, offset}: {limit?: number; offset?: number} = {})`
  - axios `GET /platform/companies?limit=&offset=`
  - queryKey: `[...queryKeys.companies.all, {limit, offset}]`
  - `placeholderData: keepPreviousData`
- `companies-page.tsx`:
  - `useUrlFilterState` (cost-health-page.tsx:18-44 pattern)
  - `URL_STATE_OPTS = { defaults: {page: 0}, parse: (p) => ({page: Number(p.get('page')) || 0}), serialize: ({page}) => page > 0 ? {page: String(page)} : {} }`
  - Limit const: `const LIMIT = 50`
  - Footer JSX: `<div>[← Önceki] Sayfa {page+1} [Sonraki →]</div>` — Önceki disabled `page === 0`, Sonraki disabled `data.length < LIMIT`
  - Search/filter değişince `setFilters({page: 0})`

**1.3 Token-based invite + expiresInDays**
- `hooks/use-company-users.ts:30` `useInviteUser`:
  - Payload `{email, role, expiresInDays?: number}` (default backend 7)
  - Response shape (backend): `{id, email, role, token, expiresAt}` — temp password yok
- `invite-dialog.tsx:30-31`:
  - Form'a opsiyonel "Geçerlilik (gün)" number input (placeholder 7, min 1, max 30)
  - Success: toast "Davet gönderildi" + dialog kapat (token URL'i email'e gider — UI'da göstermiyoruz)
- Revoke/resend butonları **out of scope** (Sprint B B30)

**1.4 Service-account /reveal yeni shape + 429**
- `service-accounts/types.ts`:
  - `ServiceAccount` interface'ten `encryptedPassword` SİL
  - `decryptedPassword?: string` korunur
  - Yeni export: `type RevealResponse = {id: string; serviceName: string; decryptedPassword: string; revealedAt: string}`
- `hooks/use-reveal-password.ts`:
  - Mutation/query response tipi `RevealResponse`
  - Error handler: `if (err.response?.status === 429) { const retryAfter = Number(err.response.headers['retry-after']) || 30; toast.error(\`Çok sık deneme. ${retryAfter}s sonra tekrar.\`) }`
- `service-account-table.tsx:109-116`:
  - `encryptedPassword` column'unu SİL (artık tipte yok, derleme zorlar)
  - "Göster" butonu reveal sonrası 3 saniye disabled (`useState` lockout + `setTimeout`)
- `service-account-dialog.tsx` PATCH body'sinden eski `encryptedPassword: '****'` round-trip varsa SİL (defensive cleanup; review'a göre zaten yok ama grep doğrula)

**1.7 Agent-quality agentId filter**
- `use-agent-quality-snapshot.ts`:
  - Signature: `useAgentQualitySnapshot({windowDays, agentId}: {windowDays: number; agentId?: string})`
  - axios `GET /platform/admin/agent-quality?windowDays=&agentId=`
  - `queryKeys.admin.agentQuality.snapshot` signature: `(windowDays: number, agentId?: string)` → key `['admin', 'agent-quality', 'snapshot', windowDays, agentId ?? '']`
- `use-agent-quality-trend.ts`: aynı pattern, `agentId?` ek
- `agent-quality-page.tsx`:
  - URL state'e `agentId: string | null` ekle (defaults null = tüm agent'lar)
  - Filter UI: `<Select>` agent listesi — kaynak: `queryKeys.admin.agentRouteBindings.list` zaten distinct agent ID'leri sağlıyor; o hook'tan unique `agentId` array türet (memo)
  - "Tüm Agent'lar" default seçim = `null` = param yok

**1.14 Connector config redacted display**
- `data-sources-tab.tsx` şu an config object'ini render etmiyor (verified §3b review). **Bu sprint'te no-op.**
- Sprint B'de "config viewer" eklenirse o zaman `value === '***REDACTED***'` → `<Badge variant="outline">redacted</Badge>` patterni uygulanır
- Spec'te dokümante et ki yeni dev "neden redact handling yok" diye şaşırmasın

**1.20 PlatformUpdateCompanyDto extension**
- `Company` type (`src/features/companies/types.ts`): 2 alan opsiyonel ekle (`brandColor?: string | null`, `timezone?: string | null`). `logoUrl?: string | null` zaten var (types.ts:18).
- `use-company.ts:6` `UpdateCompanyPayload`'a 3 alan opsiyonel (brandColor, logoUrl, timezone)
- `agent-settings-card.tsx` form fields:
  - `brandColor`: shadcn `<Input type="color" />` veya simple `<Input>` + hex format validation
  - `logoUrl`: `<Input type="url">`
  - `timezone`: `<Select>` opsiyonlar `['Europe/Istanbul', 'UTC', 'Europe/London', 'America/New_York']` (yaygın 4 değer)
- **`language` field bu sprint'te EKLENMEZ:** backend PATCH'i kabul eder, **persist etmez** (Sprint B29 follow-up). FE'ye eklenirse user "kaydedildi" sanır ama backend yok sayar — confused UX. B29 landing'ı ile birlikte eklenecek.
- MSW handler (`handlers.ts:120-133` PATCH handler): 3 alanı handle edecek şekilde güncelle. `mocks/data.ts:4-12` mock companies'e default değer ata (`brandColor: '#0066cc'`, `timezone: 'Europe/Istanbul'`).
- Read-side defaults (backend NULL crash önlemi): `brandColor ?? '#000000'`, `timezone ?? 'Europe/Istanbul'`
- 400 DTO error fallback: form-field-level inline message
- Note: super-admin slug rename **out of scope** (Sprint B B6)

### T3 — New endpoint wires

**1.18 Activity-log verify-chain UI**
- `query-keys.ts` `companies` namespace'e ekle: `verifyChain: (id: string) => ['companies', id, 'verify-chain'] as const`
- `companies/hooks/use-activity-log-chain.ts` (yeni):
  ```ts
  export function useVerifyActivityLogChain(
    companyId: string,
    params: { fromSeq?: number; toSeq?: number } = {},
    options?: { enabled?: boolean }
  )
  ```
  - axios `GET /platform/companies/${companyId}/activity-log/verify-chain?fromSeq=&toSeq=`
  - Response: `{ valid: boolean; brokenAt?: number; totalChecked: number }`
  - Manual `enabled` flag (button-triggered)
- `activity-log-tab.tsx:102` (header area):
  - "Zincir Doğrula" button → AlertDialog (range opsiyonel input'larıyla) → onay sonrası `refetch()`
  - Result modal:
    - `valid === true` → success toast `Zincir bütün — ${totalChecked} kayıt doğrulandı`
    - `valid === false` → warning card (cost-health pattern, `cost-health-page.tsx:92-123` reuse):
      - AlertTriangle ikonu
      - Mesaj: "Manuel doğrulama: kayıt #${brokenAt} bozuk. Backend ekibine bildir."
      - Mevcut activity-log tablosunda o seq'i highlight (opsiyonel polish)
- MSW handler (`src/mocks/handlers.ts` `// ─── Activity Log Verify-Chain` bölümü altında):
  - Happy: `{valid: true, totalChecked: 142}`
  - Broken: `{valid: false, brokenAt: 67, totalChecked: 67}` (URL'de `?fromSeq=60` ise broken fixture döner — deterministic)

**cap-violations/aggregate → playbook-admin 3. tab**
- `query-keys.ts` `admin` namespace'e ekle:
  ```ts
  capViolationsAggregate: (params: {
    from?: string
    to?: string
    companyId?: string
    capKind?: string
    source?: string
  }) => ['admin', 'cap-violations', params] as const
  ```
- `playbook-admin/hooks/use-cap-violations-aggregate.ts` (yeni):
  ```ts
  export function useCapViolationsAggregate(params: {
    from?: string; to?: string; companyId?: string; capKind?: string; source?: string
  })
  ```
  - axios `GET /platform/cap-violations/aggregate?...`
  - Response: `{ rows: Array<{capKind, source, count, lastViolationAt}>, effectiveModeByCompany: Record<companyId, mode> }`
- `playbook-admin/components/cap-violations-tab.tsx` (yeni):
  - Filter primitives: date preset (`7d` default), `companyId` Input, `capKind` Select, `source` Select
  - URL state: tab içi filter (cost-health-page.tsx:18-44 pattern)
  - Tablo: aggregated rows
  - Sidebar/footer: `effectiveModeByCompany` lookup — companyId filter aktifse "Bu firma için aktif mod: enforced/warn/dry-run" badge
- `playbook-admin-page.tsx`:
  - `AdminTab` union: `'single' | 'batch' | 'cap-violations'`
  - `TAB_FILTER.parse`/`serialize` 3. değeri kabul edecek şekilde extend
  - `<TabsTrigger value="cap-violations">Cap Violations</TabsTrigger>` + `<TabsContent value="cap-violations"><CapViolationsTab /></TabsContent>`
  - Default `'single'` korunur — eski `?tab=single|batch` linkleri backward compatible
- MSW handler aggregated fixture (3-5 satır mock, deterministic)

## 4. Error handling

- **400 `reactivation_requires_plan`** — inline guard zaten UI'da plan select zorunluluğunu enforce ediyor; backend yine de döner ise fallback toast "Plan seçimi gerekli"
- **400 `readonly_template`** — `email-template-edit-dialog.tsx` save handler `catch`'inde `if (err.response?.data?.code === 'readonly_template') toast.error('Bu şablon readonly')`
- **400 `invalid_category`** — 14 kategori dropdown UI'da görünür olunca leak yok; defensive: yine de generic toast
- **429** (service-account /reveal) — yeni pattern: `err.response?.status === 429` → `Retry-After` header parse (saniye) → `toast.error(\`Çok sık deneme. ${seconds}s sonra tekrar.\`)` + reveal button local lockout state (`setTimeout(clear, seconds*1000)`)
- **400 DTO** (PlatformUpdateCompanyDto extension) — `err.response?.data?.message` mesajını alıp form-level inline error (`react-hook-form` `setError` mevcut paterne göre)
- **verify-chain `valid:false`** — error değil, warning card. Result modal'da broken-at seq açıkça gösterilir
- **Cap-violations boş response** — empty state "Bu aralıkta cap violation yok"

Pattern: `sonner` (`@/components/ui/sonner` mounted in `App.tsx:4`). 400 parse `error.response?.data` shape: `{ message, code? }`. Inline status/code check yeterli — `parse-error.ts` gibi domain-specific util sadece complex flow'larda.

## 5. Testing + verification

**Projede 0 unit test, vitest/jest/RTL install değil.** Yeni test framework eklemek bu sprint'in scope'unda yok. Testing stratejisi:

- **TypeScript baseline:** `tsc -b` 0 yeni error (mevcut baseline = 5; aynı kalmalı)
- **Build green:** `vite build` 0 error, bundle delta < 10kB (yeni route yok)
- **MSW handler smoke:** her yeni/değişen endpoint için happy + 1 error fixture; manuel dev-mode tıklama
- **Manuel browser smoke (post-merge):** Migration checklist §7'den 12 madde golden path:
  1. Companies list pagination: page 1→2→1, URL `?page=` persist
  2. Reactivate: cancelled firmada `active` seçimi → plan select görünür → seçmeden Onay disabled → seçince başarılı
  3. Activity-log dropdown: 14 kategori (security görünür), filter çalışır
  4. Agent-quality snapshot + trend: agentId filter URL'de persist, "Tüm Agent'lar" tüm sonuç
  5. Service-account: ardışık 4 reveal → 4. 429 toast + button lockout
  6. Service-account PATCH (network tab): `encryptedPassword` body'de yok
  7. Email-templates: `platform_alert_digest` row disabled (hover tooltip)
  8. Connector page: no-op (config viewer yok)
  9. Settings form: brandColor/logoUrl/timezone PATCH başarılı, GET'te geri gelir (`language` bu sprint'te FE'de yok)
  10. Activity-log "Zincir Doğrula": happy path success toast; broken fixture warning card
  11. Playbook-admin "Cap Violations" tab: filter ile rows, `?tab=cap-violations` URL state
  12. Tool catalog page: 26 tool görünür (backend payload otomatik regen — search_sources unified, 5 Mod 13 tool eklendi)

- **Out-of-band:** Backend dev/staging environment'ta read-only smoke; PATCH'leri test tenant'ta

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Find-replace `not_in_plan`/`override` 3 consumer'da kaçırılırsa derleme/render bozulur | M | Düşük | tsc green-check; grep 0 match `not_in_plan` / `'override'` post-edit |
| Reactivate dialog'da plan select boş kalır → backend 400 | M | Düşük | UI disabled until selected + defensive toast |
| `encryptedPassword` silinince başka okuyucu kaldıysa derleme kırılır | M | Düşük | tsc fail = caught early; grep `encryptedPassword` post-edit |
| Companies type'a yeni 3 alan (brandColor/timezone/`logoUrl` zaten var) eklemek mocks/diğer consumer'ları bozar | M | Düşük | Field'lar opsiyonel; mocks'a default değer |
| Cap-violations tab `?tab=single\|batch` eski URL'leri bozar | Düşük | Düşük | Union'a sadece ekleme, default `'single'` korunur |
| Agent enumeration kaynağı (agentRouteBindings.list) farklı agent ID'leri için yetersizse filter eksik kalır | M | Düşük | Memoized distinct list; veriler eklendikçe büyür; "Tüm Agent'lar" default zaten safety |
| Verify-chain `valid:false` UI'da panik yaratır | Düşük | M | Net copy "manuel doğrulama, backend ekibine bildir"; warning card (error değil) |
| MSW handler fixture'lar gerçek response'la uyumsuz | M | Düşük | Backend doc example birebir kopya; `handlers.ts:120-133` PATCH handler ve `mocks/data.ts:4-12` 3 yeni field (brandColor/logoUrl/timezone) için update |
| 3 yeni Company field (brandColor/logoUrl/timezone) backend NULL döner → form crash | M | M | Read-side defaults (`brandColor ?? '#000000'` vb.); type'larda `string \| null` |
| `language` field FE'ye eklenirse silent persist gap → user "kaydedildi" sanır | — | M | Bu sprint'te `language` field FE'ye EKLENMEZ; B29 ile birlikte eklenecek |

**Rollout:** tek worktree → tek PR → main. Feature flag yok. Rollback = revert PR.

## 7. Out of scope

Bu spec'te YOK:

- **4 yeni admin sayfası** (her biri ayrı sub-project):
  - `23-webchat-publicchat` — per-tenant widget config
  - `24-platform-cron` — internal cron ops dashboard
  - `25-translation` — Mod 10 cost/coverage
  - `26-wp-plugin` — plugin admin (2-panel)
- `realtime/token` endpoint wire (SSE push tüketicisi Sprint B)
- Connector config viewer + redact display (Sprint B)
- Tüm Sprint B 36 item (master doc §5): agent-credentials UI (B1), platform admins (B2), model cooldowns (B3), agent knob editor (B4), ModelRouterService (B5), slug override (B6), budget unblock (B7), soft-delete + restore (B8), ADMIN_OVERRIDE emit (B9), cron-health (B10), alert ack (B11), threshold override (B12), SSE push (B13), errorKind projection (B14), new usage breakdowns (B15), insights summary (B16), visitor-session-stats super-admin (B17), sandbox-quota inspect (B18), effectiveMode pushdown (B19), email-logs viewer (B20), connector pause/dry-run (B21), CSV export (B22), PII scrub (B23), retention job (B24), email_logs cleanup (B25), agent_route_binding category normalize (B26), plan_upgraded Handlebars removal (B27), aggregate band SQL pushdown (B28), language persistence (B29), INVITE_DEBUG (B30), WebChat list (B31), widget config UI (B32), translation coverage (B33), WP plugin admin (B34), plugin version comparison (B35), playbook_runtime_events (B36)
- Sprint D 6 security item: MFA on /reveal (D1), AES key rotation (D2), AI_INTERNAL_SECRET rotation (D3), audit retention review (D4), RLS on billing_events (D5), AI_INTERNAL_SECRET granular scopes (D6)
- Invite revoke/resend UI (B30 ile birlikte)

## 8. Implementation order

Tier-grouped sequential commits within single PR:

Per-commit list (her madde global breaking-change numarasıyla; tek PR içinde sıralı commit'ler):

1. **T1 commit batch** (XS + S, ~6 commit):
   - C1: §1.5 peerKind +'system' (type + options + 3 consumer)
   - C2: §1.6 activity-log `security` kategorisi
   - C3: §1.11 source enum rename + 3 consumer
   - C4: §1.9 deprecated usage fields + `mocks/data.ts` cleanup
   - C5: §1.16 `platform_alert_digest` readonly guard
   - C6: docs cron path fix

2. **T2 commit batch** (M, ~6 commit):
   - C7: §1.1 reactivate planId (hook signature + types + dialog conditional select)
   - C8: §1.2 companies pagination (hook + page + URL state)
   - C9: §1.3 token invite + `expiresInDays` (hook + dialog)
   - C10: §1.4 service-account /reveal new shape + 429 + button lockout
   - C11: §1.7 agent-quality `agentId` filter (snapshot + trend hooks + filter UI)
   - C12: §1.20 PlatformUpdateCompanyDto extension (type + form + MSW)

3. **T3 commit batch** (M + L, ~2-3 commit):
   - C13: §1.18 verify-chain UI (hook + button + result modal + MSW)
   - C14: cap-violations aggregate tab (hook + component + page integration + MSW)

4. **Polish + verify:**
   4.1 tsc baseline check, vite build
   4.2 Browser smoke checklist (§5)
   4.3 PR description with migration checklist mapping

Acceptance: tsc 5 baseline error (no new), vite build green, 12-step manual smoke pass.

## 9. References

- Backend master: `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/SUPERADMIN-MASTER.md`
- Domain docs: `01-companies.md`, `03-tool-plans.md`, `04-users.md`, `09-email-templates.md`, `10-activity-log.md`, `15-service-accounts.md`, `18-agent-quality.md`, `21-multi-agent-routing.md`, `22-playbook-admin.md`
- Cost-health filter primitives: `src/features/cost-health/pages/cost-health-page.tsx:18-44`
- AlertDialog reuse pattern: `src/features/playbook-admin/components/playbook-seed-dialog.tsx`
- Cost-health error card: `src/features/cost-health/pages/cost-health-page.tsx:92-123`
- Error parse pattern (complex domain only): `src/features/agent-route-bindings/lib/parse-error.ts`
