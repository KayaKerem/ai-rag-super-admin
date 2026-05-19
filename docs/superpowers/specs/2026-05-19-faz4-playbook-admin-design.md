# Faz 4 — Playbook Admin (SuperAdmin)

**Status:** Draft for review
**Date:** 2026-05-19
**Predecessor:** Faz 3 polish shipped at `536be83` + MSW agent-route-bindings fix at `a06a34c`.
**Backend ref:** `22-playbook-admin.md` §POST /admin/playbooks/recompute-status, §POST /platform/companies/:companyId/seed-playbook
**Faz 4-A (Knowledge visibility scope) — DROPPED.** Knowledge upload UI is tenant-facing (`ai-rag-ui-template`), not present in this SuperAdmin repo. No surface to add the scope picker to.

## 1. Goal

Add two SuperAdmin surfaces for playbook lifecycle management:

1. **Recompute tool** at `/admin/playbooks/recompute` — page with two tabs:
   - "Tek Playbook" — UUID input, synchronous recompute, response renders the `sectionStatuses` map.
   - "Batch" — optional `companyId` input (empty = global), async dispatch, response shows `triggerRunId` for tracking.
2. **Seed button** on company detail page header — opens a confirmation dialog that POSTs `/platform/companies/:companyId/seed-playbook`. Idempotent on the backend (skips if `system_default` source rows already exist).

Both endpoints are `PlatformAdminGuard` protected.

## 2. Backend contract (recap)

### POST /admin/playbooks/recompute-status

Body:
```json
{ "playbookId": "uuid?", "companyId": "uuid?" }
```

Response when `playbookId` set (200 sync):
```json
{ "playbookId": "uuid", "sectionStatuses": { "section_key": "active" } }
```

Response when `playbookId` omitted (202 async):
```json
{ "triggerRunId": "trigger-run-uuid" }
```

`playbookId` takes precedence; `companyId` ignored if both sent. Neither = global batch.

### POST /platform/companies/:companyId/seed-playbook

Empty body. Response (201):
```json
{ "message": "Playbook seeded successfully" }
```

Idempotent — same response whether seeded or skipped. Operator must `GET /api/playbook-entries` to verify (not exposed in SuperAdmin; skip verification in this UI).

## 3. Scope

### In scope
- New route `/admin/playbooks/recompute` (lazy-loaded, consistent with cost-health / agent-quality / agent-route-bindings)
- New sidebar entry "Playbook Admin" with `BookOpenCheck` (or similar Lucide icon) under platform group
- Page with `Tabs` primitive — "Tek Playbook" and "Batch" tabs
- Two hooks: `useRecomputePlaybookStatus` (mutation), `useSeedPlaybook` (mutation per companyId)
- Types for both endpoints
- `<PlaybookSeedButton>` component embedded in `CompanyHeader` action group, with `AlertDialog` confirmation
- MSW handlers + mock data for the new endpoints
- TR copy throughout

### Out of scope
- Rule-firing log read API (doc §Phase 9c-0 explicitly says "no read API yet")
- Playbook entry CRUD (no FE need surfaced)
- Cron/Trigger.dev integration (FE just shows the `triggerRunId`)
- Per-section status drill-down (response section-status map rendered as flat key→status table)

## 4. UI design

### 4.1 Page `/admin/playbooks/recompute`

Layout matches existing admin pages (cost-health pattern): header h1 "Playbook Admin" + descriptive subtitle, then a Tabs block with 2 tabs.

**Tab 1: "Tek Playbook"**
- Single `Input` for `playbookId` (UUID, with placeholder "UUID girin")
- `Button` "Yeniden Hesapla" — disabled when input empty or mutation pending; spinner+text "Hesaplanıyor..." while pending
- Result area below:
  - On success: an info card showing `playbookId` and a 2-column table (section key → status badge)
  - On error: an error card with the backend error message (parsed via existing api-client error envelope)

**Tab 2: "Batch"**
- Optional `Input` for `companyId` (UUID); placeholder "Boş = tüm şirketler"
- `Button` "Batch Başlat" — always enabled (empty = global)
- Result area:
  - On success: info card with `triggerRunId` (copy-to-clipboard button) and a note "Trigger.dev üzerinden takip edebilirsiniz."
  - On error: error card

State: tab selection persists in URL via `?tab=single` / `?tab=batch` (existing `useUrlFilterState` pattern in this repo).

### 4.2 Company header seed button

In `company-header.tsx` action group (currently has Edit + Delete), add a third button:

```
[Düzenle] [Playbook Seed] [Sil]
```

- Variant `outline` (same as Düzenle), icon: `Sparkles` or `BookMarked` (Lucide)
- onClick opens an `AlertDialog` (base-ui — existing convention from agent-route-bindings delete dialog) with:
  - Title: "Default Playbook Seed"
  - Description: "Bu şirkete varsayılan playbook girişleri (42 entry × 8 kategori) eklenmeye çalışılacak. **İdempotent** — şirketin zaten system_default kayıtları varsa hiçbir şey eklenmez."
  - Cancel button + "Seed Et" confirm button (variant outline)
- Confirm fires `useSeedPlaybook(companyId)` mutation; on success toast "Playbook seed isteği gönderildi", close dialog. On error toast "Seed başarısız".

### 4.3 Sidebar

Add `{ to: '/admin/playbooks/recompute', icon: BookOpenCheck, label: 'Playbook Admin' }` to `platformItems` in `sidebar.tsx` after agent-route-bindings.

## 5. Hooks + types

### types

New file `src/features/playbook-admin/types.ts`:
```ts
export interface RecomputePlaybookRequest {
  playbookId?: string
  companyId?: string
}

export interface RecomputePlaybookSyncResponse {
  playbookId: string
  sectionStatuses: Record<string, string>
}

export interface RecomputePlaybookAsyncResponse {
  triggerRunId: string
}

export type RecomputePlaybookResponse =
  | RecomputePlaybookSyncResponse
  | RecomputePlaybookAsyncResponse

export interface SeedPlaybookResponse {
  message: string
}

export function isSyncRecomputeResponse(
  r: RecomputePlaybookResponse
): r is RecomputePlaybookSyncResponse {
  return 'playbookId' in r && 'sectionStatuses' in r
}
```

### hooks

`src/features/playbook-admin/hooks/use-playbook-admin.ts`:
```ts
export function useRecomputePlaybookStatus() {
  return useMutation({
    mutationFn: async (body: RecomputePlaybookRequest): Promise<RecomputePlaybookResponse> => {
      const { data } = await apiClient.post('/admin/playbooks/recompute-status', body)
      return data
    },
  })
}

export function useSeedPlaybook(companyId: string) {
  return useMutation({
    mutationFn: async (): Promise<SeedPlaybookResponse> => {
      const { data } = await apiClient.post(`/platform/companies/${companyId}/seed-playbook`)
      return data
    },
  })
}
```

(No query invalidation — neither endpoint affects a cached list.)

## 6. MSW handlers + mock data

In `src/mocks/handlers.ts`, append two handlers:

- `POST /admin/playbooks/recompute-status` — branch on body presence:
  - `playbookId` set → return `{ playbookId, sectionStatuses: { conversation_rules: 'active', pricing_rules: 'active', escalation_rules: 'needs_review' } }` with 200
  - Otherwise → return `{ triggerRunId: 'trg-' + random }` with 202
- `POST /platform/companies/:companyId/seed-playbook` — always `{ message: 'Playbook seeded successfully' }` with 201; no body validation needed (backend accepts empty body)

No new mock data structure needed (no listing).

## 7. Acceptance criteria

1. `/admin/playbooks/recompute` route loads lazy, both tabs render, URL persists `?tab=single|batch`.
2. Tek Playbook tab: empty input → button disabled; valid UUID → POST → result table renders 3 mock section keys with status badges.
3. Batch tab: button always clickable; submit shows mock `triggerRunId`; companyId UUID filter is optional.
4. Company detail page header shows "Playbook Seed" button between Düzenle and Sil; click opens confirmation; confirm fires POST + toast.
5. Sidebar shows "Playbook Admin" entry between "Agent Routing" and bottom of platform group.
6. `npm run build` clean; tsc strict; no `any` widening.
7. Vite-dev manual smoke confirms both surfaces work against MSW mocks.

## 8. Implementation tasks

1. `types.ts` (new) — add the 4 types above.
2. `use-playbook-admin.ts` (new) — two mutation hooks.
3. `mocks/handlers.ts` — append the 2 handlers.
4. `playbook-admin-page.tsx` (new) — the recompute page with two tabs.
5. `playbook-seed-dialog.tsx` (new) — the seed confirmation dialog component.
6. `company-header.tsx` — add the Playbook Seed button + dialog mount.
7. `sidebar.tsx` — add the platform nav entry.
8. `App.tsx` — add lazy route.
9. Build + manual smoke + push.

8 atomic commits estimated. No reviewer dispatch — backend contract is short and explicit; build is the gate.

## 9. Risks / decisions

- **R1: AlertDialog primitive.** The repo standardized on `@base-ui/react/alert-dialog` for confirmations during Sprint 9 (the binding delete dialog). Reuse that, not Radix or shadcn AlertDialog.
- **R2: URL tab persistence.** Use the existing `useUrlFilterState` hook (Sprint 7 pattern). If state encoding is complex, fallback to local `useState` for v1 and add URL persistence as a followup.
- **R3: Error envelope parser.** Sprint 9 PR 3 introduced a hybrid `body.error || body.message` extractor. Reuse if available; otherwise generic toast.error('Hesaplama başarısız').
- **R4: Async batch tracking.** The doc says response is `202 Accepted` for async batch but FE just renders the `triggerRunId`. No polling/SSE — operator visits Trigger.dev dashboard externally. Out of scope to wire this in FE.
