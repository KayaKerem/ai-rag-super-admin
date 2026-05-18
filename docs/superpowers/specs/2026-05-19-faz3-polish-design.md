# Faz 3 Polish + Smaller Gaps — Design Spec

**Status:** Draft for review
**Author:** Claude (post-Faz-2)
**Date:** 2026-05-19
**Predecessor:** Faz 2 systemModels editor shipped at `7b7e872`.
**Backend refs:**
- `02-company-config.md` (dataRetentionConfig, fallbackChain, temperatureWeights)
- `03-tool-plans.md` (tool categories `action`, `crm`)
- `04-users.md` (avatarUrl, isPlatformAdmin badge)
- `08-pricing-plans.md` (maxAgentPlaybooks, capEnforcementMode, sandbox quota fields)

## 1. Background & Goal

The master plan's Faz 3 bundles five small backend-doc-driven UI gaps. Each is too small to warrant its own spec+plan loop. This spec covers all five in one pass; the implementation plan derived from it ships them as five independent atomic commits in a single worktree.

**Goal:** Close five doc-drift gaps that have low individual cost and high aggregated cleanup value.

## 2. Items (in dependency / size order)

### Item A — Tool category labels (`action`, `crm`)

**Backend:** `03-tool-plans.md` shows tools carry `category ∈ {search, template, action, crm}`. The FE renders category badges via a `CATEGORY_LABELS` map that currently knows only `search`, `template`, `notes`. Tools tagged `action` (e.g. `create_quote`, `escalate_to_human`) and `crm` (`upsertCustomer`, `updateCustomer`) render with their raw English category string instead of a Turkish label.

**Where:**
- `src/features/companies/components/tool-config-tab.tsx` — has `CATEGORY_LABELS`
- `src/features/settings/components/tool-plans-section.tsx` — has its own `CATEGORY_LABELS` (verify via grep; might be one shared, might be two)

**Fix:** Add two entries to whichever map(s) define category labels:
```ts
action: 'Aksiyon',
crm: 'CRM',
```
And remove any stale `notes` entry if the doc no longer mentions a `notes` category (verify: §03's `registeredTools` array shows `notes` ID with `category: 'action'`, NOT category `notes`).

**Scope:** ≤ 6 lines across 1-2 files.

### Item B — Users tab: avatar + isPlatformAdmin badge

**Backend:** `04-users.md` user GET response now includes `avatarUrl`, `bio`, `phoneNumber`, `expertiseAreas`, `deactivatedAt`, `isPlatformAdmin`. Of these:
- `avatarUrl` (nullable URL) — high visual value
- `isPlatformAdmin` (boolean) — meaningful badge for super-admin readers
- The other four are optional information; out of scope for this item

**Where:**
- `src/features/companies/components/users-tab.tsx` (verify exact path with grep)
- The `CompanyUser` type in `src/features/companies/types.ts` already has `isPlatformAdmin: boolean` and `isActive: boolean` (verified post-Faz-2). It does NOT have `avatarUrl`. Extend the type:
  ```ts
  avatarUrl: string | null
  ```

**UI:**
- Render avatar as a small circular img (24px) next to the user's name in the row. Fallback: initials in a colored circle if `avatarUrl === null`.
- Render an `isPlatformAdmin && <Badge>Platform Admin</Badge>` next to the role badge.

**Scope:** ~30-40 lines across types.ts + users-tab.tsx.

### Item C — `dataRetentionConfig` editor (ALREADY SHIPPED — verify only)

**Status:** `dataRetentionConfig` is already mounted in `settings-page.tsx:167-174` (in `sectionMeta`) and exposed in `settings-nav.tsx:26` ("Veri Saklama" with 🗑️ icon). The generic `ConfigSection` component renders the toggle + retention-days input.

**Action:** Implementation plan task is a one-step check: open `/platform/settings` → "Veri Saklama" in Vite dev, confirm the section renders, the toggle and number input work, save persists. No FE code change.

**Originally specced (kept for archival):** `02-company-config.md:310-327` describes a platform-defaults-only config block:
```jsonc
{
  "enabled": "boolean (default: false)",
  "leadRetentionDays": "number (default: 365)"
}
```

It is intentionally NOT exposed at company level. When `enabled: true`, a nightly Trigger.dev job hard-deletes leads past the retention window. The doc explicitly warns: *"Aktif edildiginde suresi gecmis lead'ler geri dondurulmez sekilde silinir."*

**Where:** Platform defaults page — new section. The settings page (`src/features/settings/pages/settings-page.tsx`) currently mounts a sequence of config sections (`AiConfigSection`, `S3ConfigSection`, etc). Add a new `DataRetentionConfigSection` component.

**FE files:**
- Create: `src/features/settings/components/data-retention-config-section.tsx`
- Modify: `src/features/settings/pages/settings-page.tsx` to mount the new section
- Verify: `src/lib/validations.ts` already has `dataRetentionConfigSchema` (lines 166-169 post-Faz-2-cleanup) — confirmed exists; component just consumes it.

**UI:** Single card with:
- `<Switch>` for `enabled` (default off)
- `<Input type="number">` for `leadRetentionDays` (min 30, max 3650, default 365)
- A warning paragraph reading: *"Aktif edildiğinde süresi geçmiş leadler geri döndürülmez şekilde silinir."* (TR)
- `<Button>Kaydet</Button>` wired to the existing settings save flow (likely `onSave` callback prop)

**Scope:** ~80-100 line new component + 1-line mount registration.

### Item D — Pricing plan new fields

**Backend:** `08-pricing-plans.md:340-349`:
- `maxAgentPlaybooks: int` — `-1` (unlimited) or positive integer; `0` is rejected.
- `capEnforcementMode: enum` ∈ `disabled | log_only | enforce` (default `log_only`).
- `sandboxQuotaPerDay: int | null` — `null` (inherit env), `-1` (unlimited), positive integer; `0` rejected.
- `sandboxQuotaEnforcementMode: enum` ∈ `log_only | enforce | bypass` (default `log_only`).

**Where:**
- `src/features/companies/types.ts` — extend `PricingPlan` interface with the 4 new fields
- `src/features/companies/types.ts` — extend `CreatePlanRequest` interface accordingly
- `src/features/settings/components/pricing-plans-section.tsx` — add fields to `PlanFormData`, `emptyForm`, `planToForm`, `formToRequest`, and the `<PlanDialog>` JSX
- `src/lib/validations.ts` — no plan-level Zod schema lives there (plans use string-based form state validated inline in `formToRequest`). No change needed in validations.

**UI within `<PlanDialog>`:**
Add a new "Phase 10 Limitleri" section between "Limitler" and "Tool'lar":
- `maxAgentPlaybooks` — Input type=number, allow `-1` (unlimited) and positive integers, reject `0` with an inline error
- `capEnforcementMode` — Select with 3 options + default `log_only`
- `sandboxQuotaPerDay` — Input number, allow empty (`null`/inherit), `-1`, or positive int; reject `0`
- `sandboxQuotaEnforcementMode` — Select with 3 options + default `log_only`

Each field gets a tooltip-style hint via `FieldLabel`/`Label` describing the semantics in TR.

**Validation in `formToRequest`:**
- `maxAgentPlaybooks`: if empty → omit (use plan default); if `0` → submit blocked; allow `-1` and positives via `clamp(Math.floor, -1, ...)` (existing `clamp` doesn't support this — write a small `intOrUnlimited(value, default)` helper).
- `sandboxQuotaPerDay`: same shape but empty → `null` (explicit), `0` rejected.

**Scope:** ~120 lines across types.ts + pricing-plans-section.tsx.

### Item E — `fallbackChain` + `temperatureWeights` in AI config

**Backend:** `02-company-config.md:110-117`:
- `fallbackChain: string[]` — ordered list of OpenRouter model IDs. Empty / absent ⇒ no fallback (single-model behavior).
- `temperatureWeights: { activity, progression, quote, engagement, recency }` — five numeric weights (defaults 30/20/25/15/10).

Both fields live alongside `systemModels` in `aiConfig`. Both consumers (`ai-config-accordion.tsx`, `ai-config-section.tsx`) get them.

**Where:**
- `src/lib/validations.ts` — extend `aiConfigSchema`:
  ```ts
  fallbackChain: z.array(z.string()).optional(),
  temperatureWeights: z.object({
    activity: optNum,
    progression: optNum,
    quote: optNum,
    engagement: optNum,
    recency: optNum,
  }).optional(),
  ```
- New component: `src/features/companies/components/fallback-chain-editor.tsx` — a re-orderable list of model IDs (multi-select from `PlatformModel[]`, with up/down arrows). Empty allowed.
- `temperatureWeights` is rendered inline in both consumers as a small grid of 5 number inputs (reuse the `numberFields` map pattern).
- Both consumers add a new section "Fallback Zinciri" + "Sıcaklık Ağırlıkları" between "Web Search" and "Sistem Modelleri".

**Dirty-gating:**
- `fallbackChain` is an array — handleSubmit must include it if `dirtyFields.fallbackChain` truthy. Empty array = "no fallback"; null/undefined absence = "inherit / no change". Send `[]` only if user explicitly cleared a previously-set chain; otherwise omit.
- `temperatureWeights` follows the same dirty-gate pattern as `systemModels` (object with 5 keys).

**Scope:** ~150 lines: new FallbackChainEditor (~80 lines), schema additions (~15), 2 consumer integrations (~25 each).

## 3. Out of scope (deferred)

- `proactiveConfig` 8 fields (`02-company-config.md:330-346`) — separate Faz 4 (already on master plan).
- Knowledge visibility scope, Playbook admin — Faz 4.
- `users-tab.tsx` for the other 4 user fields (bio, phone, expertise, deactivatedAt) — file as Sprint 10 polish.
- ModelSelect free-tier inclusion — Faz 2 followup.

## 4. Cross-item invariants

1. **No `any` widening.** Use the existing `Record<string, any>` cast that `useForm` already requires; do not add new `as any`.
2. **TR strings** hard-coded inline (no i18n framework in repo).
3. **Atomic commits.** One commit per item (A through E). Item B may need two commits if `types.ts` change is logically separate from `users-tab.tsx`; pragmatic call at implementation time.
4. **Build green after each commit.**
5. **Direct-to-main convention.**

## 5. Acceptance Criteria

1. **Item A:** `categoryLabels.action === 'Aksiyon'` and `categoryLabels.crm === 'CRM'` render correctly when a tool with those categories is shown.
2. **Item B:** A user row shows a 24px avatar (or initials fallback) and, if `isPlatformAdmin === true`, an inline "Platform Admin" badge.
3. **Item C:** Visiting `/platform/settings` shows a new "Veri Saklama" card with a working toggle + retention-days input; saving sends `{ dataRetentionConfig: { enabled, leadRetentionDays } }` to the PUT defaults endpoint.
4. **Item D:** `<PlanDialog>` shows 4 new inputs in a "Phase 10 Limitleri" section; create+update preserve and emit the new fields; `0` for `maxAgentPlaybooks` or `sandboxQuotaPerDay` is visually blocked before submit.
5. **Item E:** Both `ai-config-accordion.tsx` and `ai-config-section.tsx` show a "Fallback Zinciri" + "Sıcaklık Ağırlıkları" section; chain reordering UI works; saving emits both blocks only when dirty.
6. `npm run build` exits 0 after each commit and at the end.

## 6. Risks & Decisions

- **R1: Item D's clamp helper.** Existing `clamp(v, min, fallback)` doesn't allow `-1`. Add a sibling `intOrSentinel(v, sentinel, min, fallback)` inline; or special-case in the few call sites. Decision: inline helper, scoped to pricing-plans-section.
- **R2: Item E fallbackChain order encoding.** Array order matters (first model tried first). Use a simple list with up/down arrows; do not introduce drag-and-drop libraries.
- **R3: Item B avatar fallback.** No avatar component in the repo. Render `<div className="h-6 w-6 rounded-full ...">{initials}</div>` inline; if a future Avatar primitive lands, refactor at that time.
- **R4: Item C settings-page mount.** Read `settings-page.tsx` first to learn the mount pattern (likely it imports each section and renders them in order). Add the new section in a position that matches the doc's logical grouping (after AI config, since data retention is platform-only and policy-related).

## 7. Implementation Order

A → B → E → D. (C dropped to verify-only after discovery that it's already shipped.) Rationale: A is a 5-minute warmup; B is independent; E builds on AI config sections we already touched in Faz 2; D is the largest and benefits from earlier items being shipped (less chance of conflict).

## 8. Out-of-spec anti-goals

- Do not refactor existing config sections beyond what each item requires.
- Do not add new shadcn primitives just for these items (use what exists).
- Do not write per-item README/docs files.
