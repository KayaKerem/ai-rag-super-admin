# Sprint 10 — Audit Integration Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate 12 backend breaking changes + 2 new endpoint wires from the 2026-05-27 audit bundle into the super-admin FE, in 14 focused commits.

**Architecture:** Tek worktree → tek PR → main. Mevcut TanStack Query + shadcn + sonner toast + URL state patternlerini takip. Yeni mimari yok. TDD frameworkü yok (proje 0 unit test); doğrulama = `tsc -b` green + manuel browser smoke. Her commit izole + revertable.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, axios, shadcn/ui, sonner toast, MSW (single-file `src/mocks/handlers.ts`), Vite 7, React Router v7.

**Spec:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin/docs/superpowers/specs/2026-05-27-audit-integration-bundle-design.md` (committed `fcbb821`)

**Acceptance:** `tsc -b` 5 baseline error (no new), `vite build` green, 12-step manuel browser smoke pass (spec §5).

---

## File structure

**Modified files (read-edit-verify-commit per task):**
- `src/features/agent-route-bindings/types.ts` (Task 1)
- `src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx` (Task 1)
- `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx` (Task 1)
- `src/features/agent-route-bindings/lib/parse-error.ts` (Task 1)
- `src/features/companies/components/activity-log-tab.tsx` (Tasks 2, 13)
- `src/features/companies/types.ts` (Tasks 3, 4, 7, 12)
- `src/mocks/data.ts` (Tasks 3, 4, 12)
- `src/features/docs/sections/platform-tool-planlari.tsx` (Task 3)
- `src/features/companies/components/tool-config-tab.tsx` (Task 3)
- `src/features/companies/components/email-template-table.tsx` (Task 5) [verify path]
- `src/features/email-templates/components/email-template-table.tsx` (Task 5)
- `src/features/email-templates/components/email-template-edit-dialog.tsx` (Task 5)
- `src/features/docs/sections/fiyatlandirma-gelir.tsx` (Task 6)
- `src/features/companies/hooks/use-company-billing.ts` (Task 7)
- `src/features/companies/components/plan-tab.tsx` (Task 7)
- `src/features/companies/hooks/use-companies.ts` (Task 8)
- `src/features/companies/pages/companies-page.tsx` (Task 8)
- `src/features/companies/hooks/use-company-users.ts` (Task 9)
- `src/features/companies/components/invite-dialog.tsx` (Task 9)
- `src/features/service-accounts/types.ts` (Task 10)
- `src/features/service-accounts/hooks/use-reveal-password.ts` (Task 10)
- `src/features/service-accounts/components/service-account-table.tsx` (Task 10)
- `src/features/agent-quality/hooks/use-agent-quality-snapshot.ts` (Task 11)
- `src/features/agent-quality/hooks/use-agent-quality-trend.ts` (Task 11)
- `src/features/agent-quality/pages/agent-quality-page.tsx` (Task 11)
- `src/lib/query-keys.ts` (Tasks 11, 13, 14)
- `src/features/companies/components/agent-settings-card.tsx` (Task 12)
- `src/features/companies/hooks/use-company.ts` (Task 12)
- `src/mocks/handlers.ts` (Tasks 12, 13, 14)
- `src/features/playbook-admin/pages/playbook-admin-page.tsx` (Task 14)

**New files (per task):**
- `src/features/companies/hooks/use-activity-log-chain.ts` (Task 13)
- `src/features/companies/components/verify-chain-dialog.tsx` (Task 13)
- `src/features/playbook-admin/hooks/use-cap-violations-aggregate.ts` (Task 14)
- `src/features/playbook-admin/components/cap-violations-tab.tsx` (Task 14)

---

## T1 — Quick wins (6 commits)

### Task 1: `peerKind` enum +`'system'`

**Files:**
- Modify: `src/features/agent-route-bindings/types.ts:1`, line ~64-67 (`PEER_KIND_OPTIONS`)
- Modify: `src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx` (label map if any)
- Modify: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx` (label map if any)
- Modify: `src/features/agent-route-bindings/lib/parse-error.ts` (if peerKind referenced)

- [ ] **Step 1: Read types.ts to confirm current state**

Run: `Read src/features/agent-route-bindings/types.ts limit=80`

Expected: line 1 `export type PeerKind = 'customer' | 'user'`; lines 64-67 `PEER_KIND_OPTIONS` array of `{value, label}`.

- [ ] **Step 2: Edit types.ts**

Change line 1:
```ts
export type PeerKind = 'customer' | 'user' | 'system'
```

Add to `PEER_KIND_OPTIONS` array (between existing entries):
```ts
{ value: 'system', label: 'Sistem' },
```

- [ ] **Step 3: Grep consumers for label/style mapping**

Run: `grep -rn "'customer'\|'user'" src/features/agent-route-bindings/ src/lib/parse-error 2>/dev/null`

For each match that's a switch/map, add `'system'` arm with label "Sistem" and a neutral badge variant (use the same variant as 'user' since 'system' is also an internal actor).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 errors (baseline), 0 new.

- [ ] **Step 5: Commit**

```bash
git add src/features/agent-route-bindings/
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): support peerKind 'system'

Backend audit 1.5: peerKind enum widened to include 'system'
(resolver already accepted it; only admin DTO was rejecting).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: activity-log `security` category

**Files:**
- Modify: `src/features/companies/components/activity-log-tab.tsx:46-61`

- [ ] **Step 1: Read activity-log-tab.tsx**

Run: `Read src/features/companies/components/activity-log-tab.tsx offset=40 limit=30`

Expected: 14 entries (`all` + 13 categories: `agent`, `subscription`, `user`, `data_source`, `tool`, `company`, `platform`, `system`, `lead`, `playbook`, `quote`, `channel`). `security` missing.

- [ ] **Step 2: Add `security` entry**

Edit category array — add entry (placement: alphabetical or last):
```tsx
{ value: 'security', label: 'Güvenlik' },
```

- [ ] **Step 3: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 5 baseline, 0 new.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/activity-log-tab.tsx
git commit -m "$(cat <<'EOF'
feat(activity-log): add 'security' category filter

Backend audit 1.6: whitelist expanded to 14 categories.
service_account.* events emit under category='security'.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `getCompanyToolConfig.source` enum rename

**Files:**
- Modify: `src/features/companies/types.ts:135` (`source` enum)
- Modify: `src/mocks/data.ts` (any reference to old values)
- Modify: `src/features/docs/sections/platform-tool-planlari.tsx` (label map row ~22-26)
- Modify: `src/features/companies/components/tool-config-tab.tsx` (switch cases + label)

- [ ] **Step 1: Read types.ts:130-145 to confirm enum**

Run: `Read src/features/companies/types.ts offset=130 limit=20`

Expected: field `source: 'plan' | 'override' | 'not_in_plan'`

- [ ] **Step 2: Rename enum in types.ts**

```ts
source: 'plan' | 'company-override' | 'denied'
```

- [ ] **Step 3: Grep all consumers**

Run: `grep -rn "'override'\|'not_in_plan'" src/`

List every match. Each will be one of: switch case, label map key, or mock data value. Update each:
- `'override'` → `'company-override'`
- `'not_in_plan'` → `'denied'`

- [ ] **Step 4: Update label maps semantically**

In `platform-tool-planlari.tsx` doc section, update Turkish labels:
- `'plan'` → "Plandan geldi" (unchanged)
- `'company-override'` → "Firma override etti"
- `'denied'` → "Plan'da yok / reddedildi"

In `tool-config-tab.tsx`, update badge variants if any (denied = destructive, company-override = secondary, plan = default).

- [ ] **Step 5: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new. If new errors, a consumer was missed — re-grep and fix.

- [ ] **Step 6: Grep zero match check**

Run: `grep -rn "'override'\|'not_in_plan'" src/`

Expected: 0 matches.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "$(cat <<'EOF'
refactor(tool-config): rename source enum to backend contract

Backend audit 1.11: getCompanyToolConfig.source semantics aligned:
- 'override' → 'company-override'
- 'not_in_plan' → 'denied'

Updates: types, mocks, docs label map, tool-config-tab switch cases.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: deprecated `MonthUsageSummaryDto` fields cleanup

**Files:**
- Modify: `src/features/companies/types.ts:47-59` (`UsageMonth` interface)
- Modify: `src/mocks/data.ts` (reader/aggregator loops)

- [ ] **Step 1: Read types.ts:40-70**

Run: `Read src/features/companies/types.ts offset=40 limit=30`

Expected: `UsageMonth` interface with fields including `rerank?`, `webSearch?`, `proactive?`, `cacheHits?`. (Note: `storage.totalBytes` does NOT exist — only `storage.currentBytes`. No change there.)

- [ ] **Step 2: Delete 4 deprecated fields**

Remove these lines from `UsageMonth`:
- `rerank?: {...}`
- `webSearch?: {...}`
- `proactive?: {...}`
- `cacheHits?: number`

- [ ] **Step 3: Grep consumers**

Run: `grep -rn "rerank\|webSearch\|proactive\|cacheHits" src/`

Expected: only `src/mocks/data.ts` (generation + aggregation loops). No UI widgets read these.

- [ ] **Step 4: Clean mocks/data.ts**

Remove:
- Generation lines emitting `rerankCount`, `webSearchCount`, `proactiveRuns`, `cacheHitCount`
- Aggregation reduce loops emitting `rerank: {...}`, `webSearch: {...}`, `proactive: {...}`, `cacheHits` totals

- [ ] **Step 5: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new. If new errors, a consumer was missed.

- [ ] **Step 6: Verify mock generates valid response**

Run: `grep -c "rerank\|webSearch\|proactive\|cacheHits" src/`

Expected: 0 (string literal matches).

- [ ] **Step 7: Commit**

```bash
git add src/features/companies/types.ts src/mocks/data.ts
git commit -m "$(cat <<'EOF'
refactor(usage-summary): remove deprecated fields never emitted

Backend audit 1.9: rerank/webSearch/proactive/cacheHits removed
from MonthUsageSummaryDto contract (deferred to Sprint B15 via
event_type aggregation).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `platform_alert_digest` readonly guard

**Files:**
- Modify: `src/features/email-templates/components/email-template-table.tsx:102-112` (row click) OR `email-template-edit-dialog.tsx:35-44` (save guard)

- [ ] **Step 1: Read email-template-table.tsx**

Run: `Read src/features/email-templates/components/email-template-table.tsx limit=130`

Locate row click handler around line 102-112 (onClick → onSelect).

- [ ] **Step 2: Add row-level guard**

In the row's `onClick` handler (or rendering), check slug:
```tsx
const isReadonly = row.original.slug === 'platform_alert_digest'
// ...
<TableRow
  onClick={isReadonly ? undefined : () => onSelect(row.original)}
  className={isReadonly ? 'opacity-50 cursor-not-allowed' : ''}
  title={isReadonly ? 'Sistem yönetimi (readonly)' : undefined}
>
```

If row uses a button instead of full-row click, add `disabled={isReadonly}` to that button + same title attribute.

- [ ] **Step 3: Defensive guard in dialog save handler**

Read `src/features/email-templates/components/email-template-edit-dialog.tsx` lines 30-50. In the save mutation `onError` (or hook error handler), add:
```ts
if (err.response?.status === 400 && err.response?.data?.code === 'readonly_template') {
  toast.error('Bu şablon readonly, değiştirilemez')
  return
}
```

If toast import missing, add: `import { toast } from 'sonner'`

- [ ] **Step 4: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 5 baseline, 0 new.

- [ ] **Step 5: Commit**

```bash
git add src/features/email-templates/
git commit -m "$(cat <<'EOF'
feat(email-templates): platform_alert_digest readonly guard

Backend audit 1.16: PATCH /platform/email-templates/platform_alert_digest
returns 400 readonly_template. UI disables row + defensive toast.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: docs cron path fix

**Files:**
- Modify: `src/features/docs/sections/fiyatlandirma-gelir.tsx:126`

- [ ] **Step 1: Read line 120-130**

Run: `Read src/features/docs/sections/fiyatlandirma-gelir.tsx offset=120 limit=15`

Expected: line 126 references `POST /internal/process-downgrades`.

- [ ] **Step 2: Fix path**

Change:
```
POST /internal/process-downgrades
```
to:
```
POST /internal/platform/process-downgrades
```

- [ ] **Step 3: Verify TS**

Run: `npx tsc -b 2>&1 | tail -5`

Expected: 5 baseline, 0 new (string change only).

- [ ] **Step 4: Commit**

```bash
git add src/features/docs/sections/fiyatlandirma-gelir.tsx
git commit -m "$(cat <<'EOF'
docs: fix internal cron path prefix

Backend audit 1.12: correct path is /internal/platform/process-downgrades
(old doc was 404-ing for any caller).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T2 — Mid-effort (6 commits)

### Task 7: Reactivate `planId` (status dialog conditional)

**Files:**
- Modify: `src/features/companies/hooks/use-company-billing.ts:9` (hook signature)
- Modify: `src/features/companies/types.ts` (add `UpdateCompanyStatusPayload`)
- Modify: `src/features/companies/components/plan-tab.tsx:71-81, 298-320` (dialog)

- [ ] **Step 1: Read hook**

Run: `Read src/features/companies/hooks/use-company-billing.ts limit=60`

Note current signature: `useUpdateCompanyStatus(companyId)` returning mutation accepting `status: 'active' | 'suspended' | 'cancelled'` scalar.

- [ ] **Step 2: Add payload type in types.ts**

Append to `src/features/companies/types.ts`:
```ts
export interface UpdateCompanyStatusPayload {
  status: 'active' | 'suspended' | 'cancelled'
  planId?: string
}
```

- [ ] **Step 3: Change hook signature**

In `use-company-billing.ts`, change mutationFn:
```ts
import type { UpdateCompanyStatusPayload } from '../types'

// In useUpdateCompanyStatus:
mutationFn: async (payload: UpdateCompanyStatusPayload) => {
  const body = payload.planId
    ? { status: payload.status, planId: payload.planId }
    : { status: payload.status }
  const { data } = await apiClient.patch(`/platform/companies/${companyId}/status`, body)
  return data
}
```

- [ ] **Step 4: Update plan-tab.tsx call site**

Read `src/features/companies/components/plan-tab.tsx:21-81` first.

Add state:
```tsx
const [reactivatePlanId, setReactivatePlanId] = useState<string>('')
const needsPlan = statusValue === 'active' && company.status === 'cancelled'
```

Replace `handleStatusChange`:
```tsx
function handleStatusChange() {
  if (!statusValue) return
  if (needsPlan && !reactivatePlanId) return
  updateStatus.mutate(
    { status: statusValue as 'active' | 'suspended' | 'cancelled', planId: needsPlan ? reactivatePlanId : undefined },
    {
      onSuccess: () => {
        setStatusConfirmOpen(false)
        setStatusValue('')
        setReactivatePlanId('')
        toast.success('Abonelik durumu güncellendi')
      },
      onError: (err: any) => {
        if (err.response?.status === 400 && err.response?.data?.code === 'reactivation_requires_plan') {
          toast.error('Plan seçimi gerekli')
        } else {
          toast.error('Durum güncellenemedi')
        }
      },
    }
  )
}
```

In the status confirm dialog (line ~298), add inside `<DialogContent>` body before the action buttons:
```tsx
{needsPlan && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Plan Seç (cancelled→active için zorunlu)</label>
    <Select value={reactivatePlanId} onValueChange={setReactivatePlanId}>
      <SelectTrigger>
        <SelectValue placeholder="Plan seç" />
      </SelectTrigger>
      <SelectContent>
        {plans?.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

Update Onayla button:
```tsx
<Button
  variant={statusValue === 'active' ? 'default' : 'destructive'}
  onClick={handleStatusChange}
  disabled={updateStatus.isPending || (needsPlan && !reactivatePlanId)}
>
  {updateStatus.isPending ? 'Güncelleniyor...' : 'Onayla'}
</Button>
```

- [ ] **Step 5: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new.

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/
git commit -m "$(cat <<'EOF'
feat(companies): require planId on cancelled→active reactivation

Backend audit 1.1: PATCH /platform/companies/:id/status now accepts
{status, planId?}. cancelled→active without planId returns 400
reactivation_requires_plan. UI shows conditional plan picker in
status dialog.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Companies list pagination

**Files:**
- Modify: `src/features/companies/hooks/use-companies.ts:6-13`
- Modify: `src/features/companies/pages/companies-page.tsx:1-80`

- [ ] **Step 1: Read both files + reference cost-health pagination pattern**

Run:
```
Read src/features/companies/hooks/use-companies.ts limit=30
Read src/features/companies/pages/companies-page.tsx limit=80
Read src/features/cost-health/pages/cost-health-page.tsx offset=1 limit=60
```

Note `useUrlFilterState` + `URL_STATE_OPTS` pattern from cost-health.

- [ ] **Step 2: Update hook signature**

Edit `use-companies.ts`:
```ts
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export function useCompanies(params: { limit?: number; offset?: number } = {}) {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  return useQuery({
    queryKey: [...queryKeys.companies.all, { limit, offset }] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<Company[]>(
        `/platform/companies?limit=${limit}&offset=${offset}`
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}
```

- [ ] **Step 3: Update companies-page.tsx**

Add at top of file (after imports):
```tsx
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'

const LIMIT = 50

const URL_STATE_OPTS = {
  defaults: { page: 0 },
  parse: (p: URLSearchParams) => ({ page: Number(p.get('page')) || 0 }),
  serialize: (v: { page: number }): Record<string, string | undefined> => ({
    page: v.page > 0 ? String(v.page) : undefined,
  }),
}
```

In component body, replace `useCompanies()` call:
```tsx
const [filters, setFilters] = useUrlFilterState(URL_STATE_OPTS)
const { data: companies = [], isLoading } = useCompanies({ limit: LIMIT, offset: filters.page * LIMIT })
```

Add pagination footer JSX after the existing table:
```tsx
<div className="flex items-center justify-end gap-2 mt-4 text-sm">
  <Button
    variant="outline"
    size="sm"
    disabled={filters.page === 0}
    onClick={() => setFilters({ page: filters.page - 1 })}
  >
    ← Önceki
  </Button>
  <span className="text-muted-foreground">Sayfa {filters.page + 1}</span>
  <Button
    variant="outline"
    size="sm"
    disabled={companies.length < LIMIT}
    onClick={() => setFilters({ page: filters.page + 1 })}
  >
    Sonraki →
  </Button>
</div>
```

If page has search/filter, reset page to 0 on filter change.

- [ ] **Step 4: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new. If `useUrlFilterState` import path differs, grep `grep -rn "useUrlFilterState" src/lib/`.

- [ ] **Step 5: Manual smoke (dev mode if MSW handler returns enough data)**

Optional: `npm run dev` and verify `/companies?page=1` URL works, Önceki disabled at page 0, Sonraki disabled when fewer than 50 rows.

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/
git commit -m "$(cat <<'EOF'
feat(companies): paginate list with ?limit&offset

Backend audit 1.2: GET /platform/companies accepts ?limit=1..200&offset=int
(default 50/0). UI uses Önceki/Sonraki buttons, no total (envelope-less).
URL state ?page= persists position.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Token-based invite + `expiresInDays`

**Files:**
- Modify: `src/features/companies/hooks/use-company-users.ts:30-40`
- Modify: `src/features/companies/components/invite-dialog.tsx:30-31`

- [ ] **Step 1: Read both files**

Run:
```
Read src/features/companies/hooks/use-company-users.ts
Read src/features/companies/components/invite-dialog.tsx
```

- [ ] **Step 2: Update hook payload**

In `use-company-users.ts` `useInviteUser`:
```ts
mutationFn: async (payload: { email: string; role: string; expiresInDays?: number }) => {
  const body: Record<string, unknown> = { email: payload.email, role: payload.role }
  if (payload.expiresInDays !== undefined) body.expiresInDays = payload.expiresInDays
  const { data } = await apiClient.post(`/platform/companies/${companyId}/users/invite`, body)
  return data as { id: string; email: string; role: string; token: string; expiresAt: string }
}
```

- [ ] **Step 3: Update invite-dialog.tsx**

Add state:
```tsx
const [expiresInDays, setExpiresInDays] = useState<string>('')
```

Add form input (near email/role inputs):
```tsx
<div className="space-y-1">
  <label className="text-sm">Geçerlilik (gün, opsiyonel)</label>
  <Input
    type="number"
    min={1}
    max={30}
    placeholder="7"
    value={expiresInDays}
    onChange={(e) => setExpiresInDays(e.target.value)}
  />
</div>
```

Update submit handler payload:
```tsx
const payload: { email: string; role: string; expiresInDays?: number } = { email, role }
const days = Number(expiresInDays)
if (Number.isInteger(days) && days >= 1 && days <= 30) payload.expiresInDays = days
inviteUser.mutate(payload, {
  onSuccess: () => {
    toast.success('Davet gönderildi')
    setOpen(false)
    setEmail(''); setRole(''); setExpiresInDays('')
  },
  onError: () => toast.error('Davet gönderilemedi'),
})
```

- [ ] **Step 4: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new.

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/
git commit -m "$(cat <<'EOF'
feat(invite): token-based platform admin invite + expiresInDays

Backend audit 1.3: invite endpoint now creates CompanyInvite row
(hashed token + expiry) instead of active user with temp password.
UI exposes optional expiresInDays (default 7).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Service-account `/reveal` new shape + 429 throttle

**Files:**
- Modify: `src/features/service-accounts/types.ts`
- Modify: `src/features/service-accounts/hooks/use-reveal-password.ts`
- Modify: `src/features/service-accounts/components/service-account-table.tsx:109-116`
- Possibly: `src/features/service-accounts/components/service-account-dialog.tsx` (remove '****' round-trip if present)

- [ ] **Step 1: Read all 4 files**

Run:
```
Read src/features/service-accounts/types.ts
Read src/features/service-accounts/hooks/use-reveal-password.ts
Read src/features/service-accounts/components/service-account-table.tsx limit=200
Read src/features/service-accounts/components/service-account-dialog.tsx
```

- [ ] **Step 2: Update types.ts**

Remove `encryptedPassword` field from `ServiceAccount` interface (keep `decryptedPassword?: string`).

Add new export:
```ts
export interface RevealResponse {
  id: string
  serviceName: string
  decryptedPassword: string
  revealedAt: string
}
```

- [ ] **Step 3: Update reveal hook**

In `use-reveal-password.ts`:
```ts
import type { RevealResponse } from '../types'

export function useRevealPassword() {
  return useMutation({
    mutationFn: async (id: string): Promise<RevealResponse> => {
      const { data } = await apiClient.post<RevealResponse>(`/platform/service-accounts/${id}/reveal`)
      return data
    },
    onError: (err: any) => {
      if (err.response?.status === 429) {
        const retryAfter = Number(err.response.headers?.['retry-after']) || 30
        toast.error(`Çok sık deneme. ${retryAfter}s sonra tekrar.`)
        return
      }
      toast.error('Şifre gösterilemedi')
    },
  })
}
```

- [ ] **Step 4: Update service-account-table.tsx**

Remove the `encryptedPassword` column entirely (lines 109-116 area). If it's the password reveal column, replace with a column whose accessor uses local lockout state:

Add component-level:
```tsx
const [lockoutId, setLockoutId] = useState<string | null>(null)

// On successful reveal:
function handleReveal(id: string) {
  reveal.mutate(id, {
    onSuccess: () => {
      setLockoutId(id)
      setTimeout(() => setLockoutId(null), 3000)
    },
  })
}
```

Update reveal button render:
```tsx
<Button
  size="sm"
  variant="ghost"
  disabled={reveal.isPending || lockoutId === row.original.id}
  onClick={() => handleReveal(row.original.id)}
>
  {lockoutId === row.original.id ? 'Az önce gösterildi' : 'Göster'}
</Button>
```

If the table previously displayed `row.original.encryptedPassword` as masked "****", remove that cell — `decryptedPassword` is shown via a separate reveal dialog.

- [ ] **Step 5: Defensive check service-account-dialog.tsx**

Run: `grep -n "encryptedPassword\|'\\*\\*\\*\\*'" src/features/service-accounts/components/service-account-dialog.tsx`

If any PATCH body includes `encryptedPassword: '****'` or similar round-trip, remove it. (Spec review says it shouldn't exist but verify.)

- [ ] **Step 6: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new. TS will fail if `encryptedPassword` still referenced — fix those references.

- [ ] **Step 7: Commit**

```bash
git add src/features/service-accounts/
git commit -m "$(cat <<'EOF'
feat(service-accounts): /reveal new shape + 429 throttle UX

Backend audit 1.4:
- /reveal returns {id, serviceName, decryptedPassword, revealedAt}
  (encryptedPassword removed from contract)
- Endpoint throttled 3/min; 4th call returns 429 + Retry-After
- UI: 3s button lockout post-reveal, 429 toast with retry-after

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Agent-quality `?agentId` filter

**Files:**
- Modify: `src/features/agent-quality/hooks/use-agent-quality-snapshot.ts`
- Modify: `src/features/agent-quality/hooks/use-agent-quality-trend.ts`
- Modify: `src/features/agent-quality/pages/agent-quality-page.tsx`
- Modify: `src/lib/query-keys.ts:52-56` (extend signatures)

- [ ] **Step 1: Read all 4 files**

Run:
```
Read src/features/agent-quality/hooks/use-agent-quality-snapshot.ts
Read src/features/agent-quality/hooks/use-agent-quality-trend.ts
Read src/features/agent-quality/pages/agent-quality-page.tsx
Read src/lib/query-keys.ts offset=44 limit=35
```

- [ ] **Step 2: Update query-keys.ts**

Change `snapshot` and `trend` factory signatures:
```ts
snapshot: (windowDays: number, agentId?: string) =>
  ['admin', 'agent-quality', 'snapshot', windowDays, agentId ?? ''] as const,
trend: (companyId: string, windowDays: number, agentId?: string) =>
  ['admin', 'agent-quality', 'trend', companyId, windowDays, agentId ?? ''] as const,
```

- [ ] **Step 3: Update snapshot hook**

```ts
export function useAgentQualitySnapshot(params: { windowDays: number; agentId?: string }) {
  const { windowDays, agentId } = params
  return useQuery({
    queryKey: queryKeys.admin.agentQuality.snapshot(windowDays, agentId),
    queryFn: async () => {
      const qs = new URLSearchParams({ windowDays: String(windowDays) })
      if (agentId) qs.set('agentId', agentId)
      const { data } = await apiClient.get(`/platform/admin/agent-quality?${qs}`)
      return data
    },
  })
}
```

- [ ] **Step 4: Update trend hook**

```ts
export function useAgentQualityTrend(params: { companyId: string; windowDays: number; agentId?: string }) {
  const { companyId, windowDays, agentId } = params
  return useQuery({
    queryKey: queryKeys.admin.agentQuality.trend(companyId, windowDays, agentId),
    queryFn: async () => {
      const qs = new URLSearchParams({ windowDays: String(windowDays) })
      if (agentId) qs.set('agentId', agentId)
      const { data } = await apiClient.get(`/platform/admin/agent-quality/trend/${companyId}?${qs}`)
      return data
    },
    enabled: !!companyId,
  })
}
```

(Adapt endpoint path if current hook uses a different shape — grep for `/agent-quality/trend` to confirm.)

- [ ] **Step 5: Update agent-quality-page.tsx**

Locate URL state options. Add `agentId: string | null` (default null):
```ts
// In URL_STATE_OPTS or equivalent:
defaults: { ...existing, agentId: null },
parse: (p) => ({ ..., agentId: p.get('agentId') || null }),
serialize: (v) => ({ ..., agentId: v.agentId ?? undefined }),
```

Add agent select UI. Source: `useAgentRouteBindings()` (existing hook) provides distinct agent IDs:
```tsx
import { useAgentRouteBindings } from '@/features/agent-route-bindings/hooks/use-agent-route-bindings'

// Inside component:
const { data: bindings = [] } = useAgentRouteBindings({}) // adjust args to existing signature
const agentIds = useMemo(() => {
  const set = new Set<string>()
  bindings.forEach((b: any) => b.agentId && set.add(b.agentId))
  return Array.from(set).sort()
}, [bindings])

// Filter UI:
<Select
  value={filters.agentId ?? 'all'}
  onValueChange={(v: string) => setFilters({ agentId: v === 'all' ? null : v })}
>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Tüm Agent'lar" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Tüm Agent'lar</SelectItem>
    {agentIds.map((id) => (
      <SelectItem key={id} value={id}>{id}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Pass `agentId: filters.agentId ?? undefined` into both snapshot and trend hook calls.

- [ ] **Step 6: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new.

- [ ] **Step 7: Commit**

```bash
git add src/features/agent-quality/ src/lib/query-keys.ts
git commit -m "$(cat <<'EOF'
feat(agent-quality): per-tenant agentId filter on snapshot+trend

Backend audit 1.7: ?agentId=<uuid> now honored (was silently dropped).
UI: agent select dropdown sourced from agent-route-bindings distinct
list, URL state agentId persists.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: PlatformUpdateCompanyDto extension (`brandColor`/`logoUrl`/`timezone`)

**Files:**
- Modify: `src/features/companies/types.ts:15-33` (`Company` interface)
- Modify: `src/features/companies/hooks/use-company.ts:6` (`UpdateCompanyPayload`)
- Modify: `src/features/companies/components/agent-settings-card.tsx` (form fields)
- Modify: `src/mocks/data.ts:4-12` (seed brandColor/timezone defaults)
- Modify: `src/mocks/handlers.ts:120-133` (PATCH handler)

**Note:** `language` field intentionally NOT included — backend B29 persist gap.

- [ ] **Step 1: Read all 5 files**

Run:
```
Read src/features/companies/types.ts limit=40
Read src/features/companies/hooks/use-company.ts limit=40
Read src/features/companies/components/agent-settings-card.tsx
Read src/mocks/data.ts limit=40
Read src/mocks/handlers.ts offset=115 limit=30
```

- [ ] **Step 2: Extend Company type**

Add to `Company` interface (after `logoUrl?: string | null`):
```ts
brandColor?: string | null
timezone?: string | null
```

- [ ] **Step 3: Extend UpdateCompanyPayload**

In `use-company.ts:6`:
```ts
export interface UpdateCompanyPayload {
  name?: string
  customerAgentTrustLevel?: number
  autoApproveQuoteThreshold?: number
  approvalTimeoutMinutes?: number
  approvalTimeoutAction?: string
  customerOperationsBudgetUsd?: number
  brandColor?: string | null
  logoUrl?: string | null
  timezone?: string | null
}
```

(Match existing field names exactly — read file first to confirm.)

- [ ] **Step 4: Add form fields in agent-settings-card.tsx**

After existing fields, add:
```tsx
<div className="space-y-2">
  <Label htmlFor="brandColor">Marka Rengi</Label>
  <Input
    id="brandColor"
    type="color"
    value={form.brandColor ?? '#000000'}
    onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
  />
</div>
<div className="space-y-2">
  <Label htmlFor="logoUrl">Logo URL</Label>
  <Input
    id="logoUrl"
    type="url"
    placeholder="https://..."
    value={form.logoUrl ?? ''}
    onChange={(e) => setForm({ ...form, logoUrl: e.target.value || null })}
  />
</div>
<div className="space-y-2">
  <Label htmlFor="timezone">Zaman Dilimi</Label>
  <Select value={form.timezone ?? 'Europe/Istanbul'} onValueChange={(v) => setForm({ ...form, timezone: v })}>
    <SelectTrigger id="timezone">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Europe/Istanbul">Europe/Istanbul (TR)</SelectItem>
      <SelectItem value="UTC">UTC</SelectItem>
      <SelectItem value="Europe/London">Europe/London</SelectItem>
      <SelectItem value="America/New_York">America/New_York</SelectItem>
    </SelectContent>
  </Select>
</div>
```

(Adapt `form`/`setForm` to existing form state pattern — could be `react-hook-form` register or plain useState.)

Submit handler payload: include `brandColor`, `logoUrl`, `timezone` from form state.

- [ ] **Step 5: Update mocks/data.ts**

For each seed company, add (if missing):
```ts
brandColor: '#0066cc',
timezone: 'Europe/Istanbul',
```

(logoUrl probably already exists.)

- [ ] **Step 6: Update mocks/handlers.ts PATCH**

In the `PATCH /platform/companies/:id` handler (line ~120-133), extend the update body merge to include the 3 new fields:
```ts
const updated = {
  ...existing,
  ...(body.name !== undefined && { name: body.name }),
  // ... existing fields ...
  ...(body.brandColor !== undefined && { brandColor: body.brandColor }),
  ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
  ...(body.timezone !== undefined && { timezone: body.timezone }),
}
```

(Adapt to actual handler style — read the file first.)

- [ ] **Step 7: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 5 baseline, 0 new.

- [ ] **Step 8: Commit**

```bash
git add src/features/companies/ src/mocks/
git commit -m "$(cat <<'EOF'
feat(companies): PATCH brand/logo/timezone (DTO extension)

Backend audit 1.20: PlatformUpdateCompanyDto accepts brandColor,
logoUrl, timezone (in addition to existing fields).
language field deferred — backend B29 persist gap.

MSW handler + seed data extended for dev parity.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T3 — New endpoint wires (2 commits)

### Task 13: Activity-log verify-chain UI

**Files:**
- Modify: `src/lib/query-keys.ts:21` (add `verifyChain`)
- Create: `src/features/companies/hooks/use-activity-log-chain.ts`
- Create: `src/features/companies/components/verify-chain-dialog.tsx`
- Modify: `src/features/companies/components/activity-log-tab.tsx:83-105` (header button)
- Modify: `src/mocks/handlers.ts` (new handler)

- [ ] **Step 1: Add queryKey**

In `src/lib/query-keys.ts` `companies` namespace (after line 21):
```ts
verifyChain: (id: string) => ['companies', id, 'verify-chain'] as const,
```

- [ ] **Step 2: Create hook**

Create `src/features/companies/hooks/use-activity-log-chain.ts`:
```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export interface VerifyChainResponse {
  valid: boolean
  brokenAt?: number
  totalChecked: number
}

export function useVerifyActivityLogChain(
  companyId: string,
  params: { fromSeq?: number; toSeq?: number } = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.companies.verifyChain(companyId), params] as const,
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.fromSeq !== undefined) qs.set('fromSeq', String(params.fromSeq))
      if (params.toSeq !== undefined) qs.set('toSeq', String(params.toSeq))
      const query = qs.toString() ? `?${qs}` : ''
      const { data } = await apiClient.get<VerifyChainResponse>(
        `/platform/companies/${companyId}/activity-log/verify-chain${query}`
      )
      return data
    },
    enabled: options?.enabled ?? false,
  })
}
```

- [ ] **Step 3: Create dialog component**

Create `src/features/companies/components/verify-chain-dialog.tsx`:
```tsx
import { useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useVerifyActivityLogChain } from '../hooks/use-activity-log-chain'

interface Props {
  companyId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function VerifyChainDialog({ companyId, open, onOpenChange }: Props) {
  const [fromSeq, setFromSeq] = useState('')
  const [toSeq, setToSeq] = useState('')
  const [enabled, setEnabled] = useState(false)
  const params = {
    fromSeq: fromSeq ? Number(fromSeq) : undefined,
    toSeq: toSeq ? Number(toSeq) : undefined,
  }
  const { data, isFetching, refetch } = useVerifyActivityLogChain(companyId, params, { enabled })

  function handleVerify() {
    setEnabled(true)
    refetch().then((r) => {
      if (r.data?.valid) {
        toast.success(`Zincir bütün — ${r.data.totalChecked} kayıt doğrulandı`)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activity Log Zincirini Doğrula</AlertDialogTitle>
          <AlertDialogDescription>
            Tamper-evident hash chain doğrulaması yapılır. Aralık opsiyonel.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-sm">From Seq (ops.)</label>
            <Input type="number" value={fromSeq} onChange={(e) => setFromSeq(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm">To Seq (ops.)</label>
            <Input type="number" value={toSeq} onChange={(e) => setToSeq(e.target.value)} />
          </div>
        </div>

        {data && !data.valid && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="flex items-start gap-2 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Manuel doğrulama: kayıt #{data.brokenAt} bozuk.</p>
                <p className="text-xs text-muted-foreground">Backend ekibine bildir. Toplam kontrol: {data.totalChecked}.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data && data.valid && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="flex items-start gap-2 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <p className="text-sm">Zincir bütün — {data.totalChecked} kayıt doğrulandı.</p>
            </CardContent>
          </Card>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Kapat</AlertDialogCancel>
          <AlertDialogAction onClick={handleVerify} disabled={isFetching}>
            {isFetching ? 'Doğrulanıyor...' : 'Doğrula'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 4: Wire button in activity-log-tab.tsx**

Read `src/features/companies/components/activity-log-tab.tsx:83-110`. Locate header flex container.

Add at top of component:
```tsx
const [chainOpen, setChainOpen] = useState(false)
```

Add button to header:
```tsx
<Button variant="outline" size="sm" onClick={() => setChainOpen(true)}>
  Zincir Doğrula
</Button>
```

Render dialog at end of returned JSX:
```tsx
<VerifyChainDialog companyId={companyId} open={chainOpen} onOpenChange={setChainOpen} />
```

Add import: `import { VerifyChainDialog } from './verify-chain-dialog'`

- [ ] **Step 5: Add MSW handler**

In `src/mocks/handlers.ts`, find an appropriate location (companies section). Add:
```ts
// ─── Activity Log Verify-Chain
http.get(`${BASE}/platform/companies/:companyId/activity-log/verify-chain`, ({ request }) => {
  const url = new URL(request.url)
  const fromSeq = Number(url.searchParams.get('fromSeq') || '0')
  // Deterministic: if fromSeq is between 60-70, return broken at 67
  if (fromSeq >= 60 && fromSeq <= 70) {
    return HttpResponse.json({ valid: false, brokenAt: 67, totalChecked: 67 })
  }
  return HttpResponse.json({ valid: true, totalChecked: 142 })
}),
```

(Match existing handler style — confirm `BASE` constant + `http` + `HttpResponse` imports already present.)

- [ ] **Step 6: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

Expected: 5 baseline TS errors, 0 new; vite build green.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "$(cat <<'EOF'
feat(activity-log): verify-chain endpoint UI

Backend audit 1.18: GET /platform/companies/:companyId/activity-log/verify-chain
returns {valid, brokenAt?, totalChecked} for tamper-evident hash chain.
UI: 'Zincir Doğrula' button → AlertDialog with optional from/to seq
range → success toast or warning card with broken seq.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Cap-violations aggregate (playbook-admin 3rd tab)

**Files:**
- Modify: `src/lib/query-keys.ts` `admin` namespace (add `capViolationsAggregate`)
- Create: `src/features/playbook-admin/hooks/use-cap-violations-aggregate.ts`
- Create: `src/features/playbook-admin/components/cap-violations-tab.tsx`
- Modify: `src/features/playbook-admin/pages/playbook-admin-page.tsx`
- Modify: `src/mocks/handlers.ts` (new handler)

- [ ] **Step 1: Add queryKey**

In `src/lib/query-keys.ts` `admin` namespace:
```ts
capViolationsAggregate: (params: {
  from?: string
  to?: string
  companyId?: string
  capKind?: string
  source?: string
}) => ['admin', 'cap-violations', params] as const,
```

- [ ] **Step 2: Create hook**

Create `src/features/playbook-admin/hooks/use-cap-violations-aggregate.ts`:
```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export interface CapViolationRow {
  capKind: string
  source: string
  count: number
  lastViolationAt: string
}

export interface CapViolationsAggregateResponse {
  rows: CapViolationRow[]
  effectiveModeByCompany: Record<string, 'enforced' | 'warn' | 'dry-run'>
}

export function useCapViolationsAggregate(params: {
  from?: string
  to?: string
  companyId?: string
  capKind?: string
  source?: string
}) {
  return useQuery({
    queryKey: queryKeys.admin.capViolationsAggregate(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
      const { data } = await apiClient.get<CapViolationsAggregateResponse>(
        `/platform/cap-violations/aggregate?${qs}`
      )
      return data
    },
  })
}
```

- [ ] **Step 3: Create tab component**

Create `src/features/playbook-admin/components/cap-violations-tab.tsx`:
```tsx
import { useMemo } from 'react'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useCapViolationsAggregate } from '../hooks/use-cap-violations-aggregate'

interface Filters {
  preset: '7d' | '30d' | '90d'
  companyId: string
  capKind: string
  source: string
}

const FILTER_OPTS = {
  defaults: { preset: '7d' as const, companyId: '', capKind: '', source: '' },
  parse: (p: URLSearchParams): Filters => ({
    preset: (p.get('preset') as Filters['preset']) || '7d',
    companyId: p.get('companyId') || '',
    capKind: p.get('capKind') || '',
    source: p.get('source') || '',
  }),
  serialize: (v: Filters): Record<string, string | undefined> => ({
    preset: v.preset !== '7d' ? v.preset : undefined,
    companyId: v.companyId || undefined,
    capKind: v.capKind || undefined,
    source: v.source || undefined,
  }),
}

function presetToRange(preset: Filters['preset']): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  from.setDate(from.getDate() - days)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function CapViolationsTab() {
  const [filters, setFilters] = useUrlFilterState<Filters>(FILTER_OPTS)
  const range = useMemo(() => presetToRange(filters.preset), [filters.preset])

  const { data, isLoading, error } = useCapViolationsAggregate({
    from: range.from,
    to: range.to,
    companyId: filters.companyId || undefined,
    capKind: filters.capKind || undefined,
    source: filters.source || undefined,
  })

  const mode = filters.companyId && data?.effectiveModeByCompany?.[filters.companyId]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Select value={filters.preset} onValueChange={(v) => setFilters({ ...filters, preset: v as Filters['preset'] })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
              <SelectItem value="90d">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Company ID"
            value={filters.companyId}
            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
            className="w-56"
          />
          <Input
            placeholder="Cap kind"
            value={filters.capKind}
            onChange={(e) => setFilters({ ...filters, capKind: e.target.value })}
            className="w-40"
          />
          <Input
            placeholder="Source"
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="w-40"
          />
        </CardContent>
      </Card>

      {mode && (
        <div className="text-sm">
          <Badge variant="outline">Bu firma için aktif mod: {mode}</Badge>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cap Kind</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Last Violation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Yükleniyor...</TableCell></TableRow>
              )}
              {error && (
                <TableRow><TableCell colSpan={4} className="text-center text-destructive">Veri alınamadı</TableCell></TableRow>
              )}
              {data?.rows?.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Bu aralıkta cap violation yok</TableCell></TableRow>
              )}
              {data?.rows?.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.capKind}</TableCell>
                  <TableCell className="font-mono text-xs">{r.source}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.lastViolationAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Integrate into playbook-admin-page.tsx**

Read `src/features/playbook-admin/pages/playbook-admin-page.tsx` first.

Update `AdminTab` union:
```ts
type AdminTab = 'single' | 'batch' | 'cap-violations'
```

Update `TAB_FILTER.parse` to accept all 3 values:
```ts
parse: (p: URLSearchParams): { tab: AdminTab } => {
  const t = p.get('tab')
  return { tab: t === 'batch' || t === 'cap-violations' ? t : 'single' }
},
serialize: (v: { tab: AdminTab }): Record<string, string | undefined> => ({
  tab: v.tab !== 'single' ? v.tab : undefined,
}),
```

Add to `TabsList` (after Batch trigger):
```tsx
<TabsTrigger value="cap-violations">Cap Violations</TabsTrigger>
```

Add `TabsContent`:
```tsx
<TabsContent value="cap-violations" className="mt-4">
  <CapViolationsTab />
</TabsContent>
```

Add import:
```tsx
import { CapViolationsTab } from '../components/cap-violations-tab'
```

- [ ] **Step 5: Add MSW handler**

In `src/mocks/handlers.ts`, add new section:
```ts
// ─── Cap Violations Aggregate
http.get(`${BASE}/platform/cap-violations/aggregate`, ({ request }) => {
  const url = new URL(request.url)
  const companyId = url.searchParams.get('companyId')
  return HttpResponse.json({
    rows: [
      { capKind: 'monthly_token_cap', source: 'tenant', count: 12, lastViolationAt: new Date(Date.now() - 86_400_000).toISOString() },
      { capKind: 'request_rate', source: 'agent', count: 3, lastViolationAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      { capKind: 'storage_quota', source: 'tenant', count: 1, lastViolationAt: new Date(Date.now() - 7 * 86_400_000).toISOString() },
    ],
    effectiveModeByCompany: companyId ? { [companyId]: 'enforced' } : {},
  })
}),
```

- [ ] **Step 6: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -15
```

Expected: 5 baseline TS errors, 0 new; vite build green; new chunk size < ~10kB added to playbook-admin.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "$(cat <<'EOF'
feat(playbook-admin): cap-violations aggregate tab

Backend audit: GET /platform/cap-violations/aggregate returns
aggregated rows + effectiveModeByCompany resolver.
UI: 3rd tab in /admin/playbooks/recompute with date preset +
companyId/capKind/source filters. URL state ?tab=cap-violations.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Polish & verify (post-T3)

### Final: Build + smoke + PR

- [ ] **Step 1: Full TS check**

Run: `npx tsc -b 2>&1 | tail -20`

Expected: exactly 5 baseline errors. If more, regression — fix before PR.

- [ ] **Step 2: Production build**

Run: `npm run build 2>&1 | tail -25`

Expected: green, bundle size delta from `main` < 30 kB raw (no new route). Note any lazy-chunk increase.

- [ ] **Step 3: Manual browser smoke (dev mode)**

Run: `npm run dev` (background)

Walk through the 12-step checklist from spec §5:
1. `/companies?page=1` → Önceki/Sonraki pagination
2. Reactivate cancelled firma → plan select görünür → seçmeden disabled
3. `/companies/:id` activity-log dropdown'da 14 kategori (`security` görünür)
4. `/admin/agent-quality` agentId filter URL persist
5. `/service-accounts` 4 reveal → 4. 429 toast
6. Service-account PATCH (DevTools network) → `encryptedPassword` body'de yok
7. `/email-templates` `platform_alert_digest` row disabled
8. (connector page no-op — skip)
9. `/companies/:id` settings: brandColor/logoUrl/timezone PATCH başarılı
10. Activity-log "Zincir Doğrula" happy + broken (fromSeq=65)
11. `/admin/playbooks/recompute?tab=cap-violations` filter + rows
12. Tool catalog 26 tool render (otomatik backend payload)

Eksiklik varsa fix commit + tekrar smoke.

- [ ] **Step 4: Push branch**

```bash
git push -u origin main
```

(Spec says single-PR but since branch is `main`, push directly. If working on a feature branch, create PR instead.)

- [ ] **Step 5: Update memory**

Append `project_audit_20260527_recap.md` to user memory tracking shipped items + commit SHA range.

---

## Acceptance criteria

- [ ] All 14 commits land on main
- [ ] `tsc -b` returns exactly 5 baseline errors
- [ ] `vite build` green
- [ ] 12-step browser smoke checklist passes
- [ ] No deprecated field reads remain (`grep -rn "encryptedPassword\|rerank\|webSearch\|proactive\|cacheHits\|'override'\|'not_in_plan'" src/` → 0 matches in non-comment lines)
- [ ] Backend smoke (read-only dev) confirms FE works against real responses

---

## Reference cards (engineer cheat sheet)

**Existing patterns to reuse:**
- `useUrlFilterState` + `URL_STATE_OPTS`: `src/features/cost-health/pages/cost-health-page.tsx:18-44`
- AlertDialog confirm: `src/features/playbook-admin/components/playbook-seed-dialog.tsx`
- Warning card: `src/features/cost-health/pages/cost-health-page.tsx:92-123` (AlertTriangle + Card)
- Error parse for complex domain: `src/features/agent-route-bindings/lib/parse-error.ts` (don't copy — inline status/code check is enough for this sprint)
- queryKey factory: `src/lib/query-keys.ts`
- MSW handler: single-file `src/mocks/handlers.ts`, comment-organized sections (`// ─── <Domain>`)

**Backend doc references:**
- Master: `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/SUPERADMIN-MASTER.md`
- Per-change citation: see spec §1 table column "Files" and master doc §1 breaking-change number (1.1, 1.4, etc.)

**Out-of-scope reminders (don't expand):**
- 4 new admin pages (webchat/cron/translation/wp-plugin) — separate sub-projects
- `realtime/token` — defer
- Sprint B/D backlog — defer (see spec §7)
- `language` field — defer (B29 persist gap)
- Connector config viewer/redact — defer (no viewer today)
