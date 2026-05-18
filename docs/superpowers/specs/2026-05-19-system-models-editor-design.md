# systemModels Editor (15 Rol) — Design Spec

**Status:** Draft for review
**Author:** Claude (post-Sprint 9 Faz 2)
**Date:** 2026-05-19
**Backend ref:** `ai-rag-template/docs/frontend-admin/02-company-config.md` (systemModels block + KALDIRILAN alanlar listesi)
**FE prerequisite:** Faz 1 commits (`cfac6a9`, `23e31fc`, `1812ff8`) shipped to `main` — 7 deprecated AI config fields removed.

## 1. Background & Goal

Backend has restructured AI config so that all per-role model overrides live under a single `systemModels` object (15 nullable keys), replacing the deprecated `model` / `compactionModel` / `titleModel` / `summaryModel` / `qualityEvalModel` / `qualityEvalEnabled` / `multiModelStepEnabled` fields. The chat default model is now read from `allowedModels` (the entry with `isDefault: true`).

Migration on the backend already populated `systemModels.{compaction, title, summary, qualityEval}` from the old fields and set `systemModels.toolStep = null` for tenants that previously had `multiModelStepEnabled: true` (auto-downgrade disabled until an admin opts in explicitly).

**Goal:** Add a "Sistem Modelleri" editor section so superadmins can read and write all 15 `systemModels` roles, in both the per-company AI config (`ai-config-accordion.tsx`) and the platform defaults page (`ai-config-section.tsx`).

## 2. Scope

**In scope**
- Read + write all 15 `systemModels` roles in both components
- Zod schema + types for `systemModels`
- MSW mock + `mockCompanyConfigs` / `mockPlatformDefaults` realistic seeding
- Save payload integration (cleaned object, null vs string handling)
- Build/lint green

**Out of scope (deferred to Faz 3 / Faz 4)**
- `fallbackChain` (array of model IDs) — Faz 3 polish
- `temperatureWeights` (5 numeric weights) — Faz 3 polish
- `proactiveConfig` 8 fields verification — Faz 3 polish
- Tool category labels / users tab / dataRetentionConfig / pricing-plan new fields — Faz 3
- Knowledge visibility scope, Playbook admin pages — Faz 4

## 3. Backend Contract (recap)

The snippet below uses JSON-with-comments (jsonc) for illustration; it is not literal payload JSON.

```jsonc
"systemModels": {
  "channel":              "string | null",
  "quote":                "string | null",
  "retry":                "string | null",
  "toolStep":             "string | null",   // null = NO downgrade, primary model stays
  "title":                "string | null",
  "summary":              "string | null",
  "compaction":           "string | null",
  "qualityEval":          "string | null",
  "autoTag":              "string | null",
  "research":             "string | null",
  "memoryExtract":        "string | null",
  "freshness":            "string | null",
  "intentClassification": "string | null",
  "channelSummary":       "string | null",
  "languageDetect":       "string | null"
}
```

**Null semantics**
- For 14 of 15 roles: `null` ⇒ fall back to chat default (i.e. `allowedModels.find(m => m.isDefault).id`).
- For `toolStep` only: `null` ⇒ no downgrade — the primary model is used for the post-tool-call step. (A non-null string here means "downgrade to this cheaper model on post-tool-call.")

This UX-relevant asymmetry is preserved by labeling the empty placeholder differently for `toolStep`.

**Merge depth — verification required in plan task**
The backend doc (`02-company-config.md:16,35`) states "partial merge — only sent fields are updated" at both endpoint and block level, but does NOT define merge depth **inside** a block. The spec assumes wholesale replace at the `systemModels` block (sending the block replaces it atomically). The implementation plan MUST verify this against `company-config.service.ts` in the backend repo before locking in the §5.4 strategy. If backend actually deep-merges `aiConfig.systemModels.*`, sending a key as explicit `null` still wipes it — so the dirty-tracking strategy below is the safer design regardless of merge depth.

## 4. Role Catalog (UI copy)

The 15 roles are presented in the order below in a single grid (rationale in §5). Hint text is consumed by `FieldLabel` (existing component, tooltip-style).

| # | key | Label (TR) | Hint (TR) |
|---|---|---|---|
| 1 | `channel` | Kanal Mesajı | WhatsApp ve diğer kanal mesajlarına otomatik yanıt modeli |
| 2 | `quote` | Teklif Hazırlama | Teklif hazırlama agent modeli |
| 3 | `retry` | Guardrail Retry | Boş/format-fix retry sırasında kullanılan model |
| 4 | `toolStep` | Tool Sonrası Adım | Tool çağrısı sonrası adım için downgrade modeli. Boş bırakılırsa ana model kalır (downgrade yok) |
| 5 | `title` | Konuşma Başlığı | Sohbet başlığı otomatik üretimi (hafif model) |
| 6 | `summary` | Doküman Özeti | Doküman AI özeti |
| 7 | `compaction` | Konuşma Compaction | Uzun konuşmaların context özeti |
| 8 | `qualityEval` | Kalite Değerlendirme | Her turn groundedness/relevance ölçen ucuz model (maliyet azaltmak için ekonomik model seçin) |
| 9 | `autoTag` | Bilgi AutoTag | Knowledge item otomatik tag + özet üretimi |
| 10 | `research` | Research Agent | Web search sonuçlarını özetleyen research agent |
| 11 | `memoryExtract` | Bellek Çıkarma | Konuşmadan bellek kayıtlarını çıkaran model |
| 12 | `freshness` | İçerik Tazelik | Proactive: URL içerik değişim analizi |
| 13 | `intentClassification` | Lead Intent | Lead intent / urgency sınıflandırma |
| 14 | `channelSummary` | Kanal Özeti | Kanal konuşması bitince CRM için oluşturulan özet |
| 15 | `languageDetect` | Dil Tespiti | Kullanıcı mesaj dili tespiti |

## 5. UI Design

### 5.1 Placement

Both `ai-config-accordion.tsx` (company config) and `ai-config-section.tsx` (platform defaults) gain a new section labeled **"Sistem Modelleri"** with a leading `<Separator />` and section heading, placed **before** the `AllowedModelsEditor` block (which becomes "Chat Default" semantically — the editor with the `isDefault` radio in it). Order top to bottom: API key + numeric inputs → Reranking → Web Search → **Sistem Modelleri (NEW)** → AllowedModels (chat default).

Rationale: The chat default chosen in `AllowedModelsEditor` is the fallback for 14 of the 15 system roles, so reading the section top-down maps to data-flow precedence: configure per-role overrides first, then set the global default below them.

### 5.2 Layout

15 dropdowns in a **2-column grid** (matches existing pattern used for numberFields in the same form). All rows visible — no collapsible groups, no tabs.

Rationale considered and rejected:
- **Collapsible groups (doc suggestion):** Hides defaults behind extra clicks; superadmins frequently want a single glance to compare per-role settings. 15 fields fit in a 2-col grid in ~330px vertical space — manageable inside the accordion content.
- **3-column grid:** Each dropdown needs enough horizontal room to show `<label>` + `<model id>` truncated in 200-220px; 3 columns squeeze that too tight on a 720px form.
- **Categorical sub-groups (e.g. "Conversation", "Quality", "Discovery"):** Boundaries between categories are fuzzy (`research` is discovery? quality?), would force opinionated taxonomy, low information gain.

### 5.3 Per-field UX

The grid is a pure presentational component, `<SystemModelsGrid models value onChange />`. Consumer (accordion / section) does a **single** `form.watch('systemModels')` and passes the whole object to the grid; the grid does not import RHF.

Each grid cell renders:
```
<FieldLabel label="<TR label>" hint="<TR hint>" />
<ModelSelect models={models} value={value[key] ?? ''} onChange={(v) => onChange(key, v)} placeholder="<empty placeholder>" />
```

- `models` prop: `PlatformModel[]` (already passed to both consumer components). Backend doc does not restrict systemModels to `allowedModels`, so we keep the full platform-models list — this matches behavior of the deprecated fields and avoids coupling per-role overrides to per-company allowedModels editing order. Free-tier visibility caveat in §11 R1.
- Consumer side (single source of truth):
  - `const systemModelsValue = (form.watch('systemModels') ?? {}) as SystemModels`
  - `const handleSystemModelsChange = (key: SystemModelRole, v: string) => form.setValue(\`systemModels.${key}\`, v === '' ? null : v, { shouldDirty: true })`
  - `{shouldDirty: true}` ensures `formState.dirtyFields.systemModels` reflects user interaction; used in §5.4 to gate emission.
- `placeholder`:
  - For `toolStep`: `"Downgrade yok (primary model)"`
  - For the other 14: `"Chat default kullan"`

### 5.4 Empty ↔ null semantics in handleSubmit

`ai-config-accordion.tsx` and `ai-config-section.tsx` both share a `handleSubmit` that filters empty/null/masked/NaN entries before sending. We extend that block to **emit `systemModels` only when the user actually touched it**:

```ts
// In handleSubmit(values):
const systemModelsDirty = Boolean(form.formState.dirtyFields.systemModels)
if (systemModelsDirty) {
  const raw = (values.systemModels ?? {}) as Record<string, string | null | undefined>
  const systemModels: Record<string, string | null> = {}
  for (const key of SYSTEM_MODEL_ROLES) {
    const v = raw[key]
    // Empty string from ModelSelect (X-clear) or undefined → null.
    systemModels[key] = v === '' || v == null ? null : v
  }
  cleaned.systemModels = systemModels
}
```

`SYSTEM_MODEL_ROLES` is a const tuple defined once at module scope so the iteration order matches both UI render order and Zod schema declaration order.

**Why dirty-gated (vs. always emit, vs. partial diff):**
1. **Avoid clobbering on unrelated saves.** Both components share one form per `aiConfig` block. A user who only changes `apiKey` should not send `systemModels` at all — the backend keeps the existing block untouched. The original "always send 15 keys" design risks wiping per-role overrides if the GET-hydrated form state is incomplete (e.g. a masked-value path, a race with refetch, or `currentValues.systemModels` being absent in older tenants).
2. **When dirty, send the full 15-key object** (not a partial diff). Even if backend deep-merges sub-objects of `aiConfig`, sending all 15 keys (including explicit `null`s for unset ones) is round-trip-safe and matches the spec's UI invariant ("user-visible state = saved state for this section"). The plan task verifies merge depth (§3) but this strategy is safe under both shallow and deep semantics.
3. **`form.reset(savedValues)` after a successful save** clears `dirtyFields`, so the next unrelated save won't re-emit `systemModels`. This is already the convention in the accordion via `useEffect → form.reset(currentValues)`; settings page needs the same effect added (§9).

### 5.5 Visual indicator (existing convention)

The repo follows a convention (see `feedback_workflow.md` — Sensitive UI 2026-04-06): each config field should show a filled/empty dot indicator. `FieldLabel` does not currently render dots; honoring the convention for 15 new fields is out of scope for this spec and tracked as part of the Faz 3 polish backlog (alongside the broader "visual configured/unconfigured indicator" item already noted in Sprint 7 followups).

The "Sistem Modelleri" section header inside the form body (NOT inside `AccordionTrigger` — that would re-render the whole accordion on every keystroke) will show a small "**X/15 set**" counter, where **X = the number of roles whose current value is a non-empty string**. `toolStep = null` is counted as "unset" for this counter even though it semantically means "no downgrade" — the goal is a quick read of "how many explicit overrides exist," not encoding the toolStep asymmetry. Implementation uses `form.getValues('systemModels')` lazily inside the section body (not `watch`) on each render of the section.

## 6. Validation (Zod)

In `src/lib/validations.ts`:

```ts
const nullableModel = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().nullable(),
)

export const systemModelsSchema = z.object({
  channel: nullableModel,
  quote: nullableModel,
  retry: nullableModel,
  toolStep: nullableModel,
  title: nullableModel,
  summary: nullableModel,
  compaction: nullableModel,
  qualityEval: nullableModel,
  autoTag: nullableModel,
  research: nullableModel,
  memoryExtract: nullableModel,
  freshness: nullableModel,
  intentClassification: nullableModel,
  channelSummary: nullableModel,
  languageDetect: nullableModel,
}).optional()
```

Inside `aiConfigSchema` add `systemModels: systemModelsSchema`. `.optional()` means a config without `systemModels` is valid (backend tolerates absence — platform defaults inherited or all-null). `.partial()` is intentionally NOT added because each field is already nullable via `nullableModel` — combining `.nullable()` per-field with `.partial()` on the object is redundant and inconsistent with the existing pattern in this file (lines 4-13: `posNum` / `optNum` use bare preprocess + `.optional()`).

No model-ID enum: backend already validates against its OpenRouter live catalog and we don't want to maintain a parallel allow-list FE-side. The Zod role is structural (string|null) only.

## 7. Types

Extend `src/features/companies/types.ts` AI config shape (the existing `aiConfig` interface uses `Record<string, unknown>` indirectly via `currentValues` prop; a typed `SystemModels` is still useful for handler/payload code paths):

```ts
export const SYSTEM_MODEL_ROLES = [
  'channel', 'quote', 'retry', 'toolStep', 'title', 'summary',
  'compaction', 'qualityEval', 'autoTag', 'research', 'memoryExtract',
  'freshness', 'intentClassification', 'channelSummary', 'languageDetect',
] as const

export type SystemModelRole = typeof SYSTEM_MODEL_ROLES[number]
// Use Partial because GET responses for older tenants may omit keys entirely;
// handleSubmit (§5.4) materializes the full 15-key object on the wire when dirty.
export type SystemModels = Partial<Record<SystemModelRole, string | null>>
```

The const tuple lives in `types.ts` so both UI components and `handleSubmit` import it from a single source — no duplicated string lists.

## 8. Mock Data

### 8.1 `mockCompanyConfigs[mockCompanies[0].id].aiConfig`

Add a realistic `systemModels` block matching what the migration would produce for a tenant that previously had `compactionModel`/`titleModel`/`summaryModel`/`qualityEvalEnabled`+`qualityEvalModel`/`multiModelStepEnabled=true`:

```ts
systemModels: {
  channel: null,
  quote: null,
  retry: null,
  toolStep: null,         // multiModelStepEnabled=true migrated to null per doc note
  title: 'openai/gpt-4o-mini',
  summary: 'openai/gpt-4o-mini',
  compaction: 'anthropic/claude-haiku-4-5-20251001',
  qualityEval: 'openai/gpt-4o-mini',
  autoTag: null,
  research: null,
  memoryExtract: null,
  freshness: null,
  intentClassification: null,
  channelSummary: null,
  languageDetect: null,
},
```

### 8.2 `mockCompanyConfigs[mockCompanies[1].id].aiConfig`

Leave systemModels absent — exercises the "company has no overrides, all platform defaults" path.

### 8.3 `mockPlatformDefaults.aiConfig`

Add a fully-populated `systemModels` block reflecting that platform defaults set explicit choices for the 4 migrated roles + reasonable defaults elsewhere:

```ts
systemModels: {
  channel: 'openai/gpt-4o-mini',
  quote: 'anthropic/claude-sonnet-4.6',
  retry: 'openai/gpt-4o-mini',
  toolStep: null,                                       // platform-default no auto-downgrade
  title: 'openai/gpt-4o-mini',
  summary: 'openai/gpt-4o-mini',
  compaction: 'anthropic/claude-haiku-4-5-20251001',
  qualityEval: 'openai/gpt-4o-mini',
  autoTag: 'openai/gpt-4o-mini',
  research: 'anthropic/claude-sonnet-4.6',
  memoryExtract: 'openai/gpt-4o-mini',
  freshness: 'openai/gpt-4o-mini',
  intentClassification: 'openai/gpt-4o-mini',
  channelSummary: 'openai/gpt-4o-mini',
  languageDetect: 'openai/gpt-4o-mini',
},
```

### 8.4 MSW handlers

PUT handler at `src/mocks/handlers.ts` for `/platform/companies/:id/config` and `/platform/config/defaults` (existing) — these already echo back `body` content; verify they round-trip `systemModels` correctly. If they currently strip unknown keys, extend them to preserve the block. (Read the file before editing — the spec assumes generic echo behavior; plan tasks will verify.)

## 9. Read Flow (currentValues → form)

The accordion already does `form.reset(currentValues)` on prop change (lines 41-49 post-Faz 1). The settings page (`ai-config-section.tsx`) currently does NOT — it only seeds `defaultValues` once at mount. This is a real bug today: after a successful PUT to `/platform/config/defaults`, the TanStack-Query-backed parent updates `currentValues`, but the form retains the old values; `dirtyFields` also never resets, so on a subsequent save we would re-emit fields the user already saved.

**Action (in plan task, mandatory — not optional):** add the matching effect to `ai-config-section.tsx`:

```ts
useEffect(() => {
  if (currentValues) {
    form.reset(currentValues as Record<string, unknown>)
  }
}, [currentValues, form])
```

This makes the §5.4 dirty-tracking strategy correct in both components.

## 10. Acceptance Criteria

1. Both `ai-config-accordion.tsx` and `ai-config-section.tsx` render a "Sistem Modelleri" section with 15 dropdowns, ordered per §4.
2. Each dropdown's placeholder is `"Chat default kullan"` except `toolStep` which is `"Downgrade yok (primary model)"`.
3. Selecting a model in a dropdown and saving sends `systemModels.<key>: "<modelId>"` to backend. Clearing a dropdown (X button) sends `systemModels.<key>: null` for that key.
4. **Dirty-gating:** Editing only a non-systemModels field (e.g. `apiKey`) and saving emits a request body WITHOUT a `systemModels` key. Editing at least one systemModels role emits the full 15-key object.
5. Loading existing config with `systemModels: {...}` populates the dropdowns; missing keys render as empty (placeholder visible).
6. Section body shows "X/15 set" counter where X = number of roles whose current form value is a non-empty string. `toolStep = null` counts as unset.
7. `ai-config-section.tsx` resets the form on `currentValues` change (post-Faz-2 bug fix, §9).
8. `npm run build` exits 0; tsc strict mode passes.
9. Zod parse of a config with no `systemModels` succeeds (optional block); parse of `systemModels: {channel: null, ...}` succeeds; parse of `systemModels: {channel: 123}` fails.
10. Mock company #0 shows 4 pre-set roles (matching the migration); mock company #1 shows all empty placeholders; platform defaults shows 14 set + `toolStep` empty.

## 11. Risks & Open Questions (resolved inline)

- **R1: Free-tier models hidden in ModelSelect.** The existing `ModelSelect` filters to `premium/standard/economy` only (model-select.tsx:32-38) — free tier is excluded from the dropdown. Backend has no such restriction. Current Faz 2 mock seeds (§8) use only non-free models (`gpt-4o-mini` = `economy`, etc.) so the read flow is safe today. **Known gap (NOT fixed in Faz 2):** if a tenant's saved `systemModels.<role>` references a free-tier model, the current selection will be invisible in the dropdown — the field will display as if empty. Mitigation: also show the currently-selected model in the trigger label using `models.find(m => m.id === value)`, even if it would be filtered out (current ModelSelect at line 40 already does this — `selectedModel` is computed from the unfiltered list, only the dropdown LIST filters). Read flow is OK; only NEW selections of free-tier models are unreachable. Tracked as a Faz 3 followup ("expose free tier in ModelSelect dropdown") if pain emerges. No spec changes needed.
- **R2: `models` prop empty case.** When `models.length === 0` we already skip `AllowedModelsEditor`. Apply the same guard to the new "Sistem Modelleri" section — render a single line "Platform modelleri yükleniyor..." text and no dropdowns.
- **R3: Smoke against prod backend.** `curl` to `api.edfu.ai/auth/login` was blocked twice by the permission classifier in Faz 1 (credential leakage policy). For Faz 2, the plan task will attempt curl smoke via stdin pipe with a one-shot user-supplied token (paste-in flow) — fallback is build + Vite-dev manual UI smoke + user-driven prod smoke. Do not block ship on automated curl.
- **R4: A11y on 15 dropdowns.** `ModelSelect` is a custom button + popover (not native `<select>`). Internal focus moves to the search input on open but there is no roving focus across the 15 cells of the grid, and `FieldLabel` does not yet link via `aria-labelledby`. For a superadmin internal page this is accepted; Faz 3 polish backlog item "improve form a11y" tracks the gap. No fix in Faz 2.

## 12. Implementation Outline (to be expanded by writing-plans)

In dependency order:

1. **`types.ts`** — add `SYSTEM_MODEL_ROLES`, `SystemModelRole`, `SystemModels`.
2. **`validations.ts`** — add `systemModelsSchema` (per §6), fold into `aiConfigSchema`.
3. **`system-models-grid.tsx` (NEW shared component)** at `src/features/companies/components/system-models-grid.tsx` — pure presentational grid (15 cells), props: `value: SystemModels`, `onChange: (key: SystemModelRole, v: string) => void`, `models: PlatformModel[]`. Imports `SYSTEM_MODEL_ROLES` for iteration. Renders the X/15 counter at the section header inside the component. Both accordion and section consume it via the same prop API.
4. **`ai-config-section.tsx` — add `useEffect → form.reset(currentValues)`** (§9 bug fix, independent of systemModels editor; small but mandatory for §5.4 correctness).
5. **`ai-config-accordion.tsx`** — import `SystemModelsGrid`, wire single `form.watch('systemModels')` + `handleSystemModelsChange` consumer, integrate dirty-gated `systemModels` emission into `handleSubmit`.
6. **`ai-config-section.tsx`** — same wiring as accordion.
7. **`mocks/data.ts`** — add 3 systemModels seeds per §8.
8. **`mocks/handlers.ts` — verify only.** The PUT handlers at lines ~149-156 and ~369-374 use `Object.assign(target, body)` which shallow-merges; sending `systemModels: {...}` overwrites the prior block atomically (matches §5.4). No code change required, but the plan task verifies the round-trip explicitly.
9. **Backend merge-depth verification (§3 note)** — read the backend `company-config.service.ts` to confirm `systemModels` is replaced wholesale on PUT and document the finding in a commit message or follow-up memo. If deep-merged, the FE strategy still works (we always send 15 keys when dirty), but the behavior summary in §5.4 (#1) needs a correction.
10. Build (`npm run build`) green, manual Vite-dev UI smoke for both pages, optional curl smoke if classifier allows.

Estimated 8 atomic commits (steps 1, 2, 3, 4, 5, 6, 7, 9-doc-update) + 1 final config tidy commit. Plan task will refine and add review checkpoints.

## 13. Out-of-Spec Anti-Goals

- Do **not** re-introduce any of the 7 deprecated field UI elements removed in Faz 1.
- Do **not** add fallbackChain / temperatureWeights / proactiveConfig editors here — Faz 3.
- Do **not** restrict systemModels to allowedModels — backend doc explicitly allows any platform model.
- Do **not** add per-role recommended-model suggestion text on this pass — keep hints generic; opinion-laden defaults belong to platform defaults seed, not UI guidance.
