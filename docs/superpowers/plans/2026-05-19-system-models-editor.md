# systemModels Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 15-role `systemModels` editor section to both the per-company AI config accordion and the platform-defaults page, replacing the deprecated single-model fields removed in Faz 1.

**Architecture:** A single pure-presentational React component (`SystemModelsGrid`) renders the 15 dropdowns. Consumer components (`ai-config-accordion.tsx`, `ai-config-section.tsx`) wire it to RHF via a single `form.watch('systemModels')` read + `setValue('systemModels.${key}', null|string, {shouldDirty: true})` write. `handleSubmit` emits `systemModels` only when `formState.dirtyFields.systemModels` is set, materializing the full 15-key object with explicit `null` for unset roles. Zod validates structure (string|null per key), not model IDs.

**Tech Stack:** React 19, React Hook Form, Zod v4, base-ui / shadcn, Vite. No unit-test framework in this repo — each task verifies via `npm run build` (tsc strict + vite build) and ends with an atomic git commit. Manual UI smoke in Vite dev at the end. Direct-to-main convention.

**Spec:** `docs/superpowers/specs/2026-05-19-system-models-editor-design.md` (commit `748b6e6`).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/features/companies/types.ts` | Add `SYSTEM_MODEL_ROLES` const, `SystemModelRole`, `SystemModels` types |
| Modify | `src/lib/validations.ts` | Add `systemModelsSchema`; reference inside `aiConfigSchema` |
| Create | `src/features/companies/components/system-models-grid.tsx` | Pure presentational 15-cell grid; X/15 counter |
| Modify | `src/features/settings/components/ai-config-section.tsx` | Bug fix: add `form.reset` effect on `currentValues` change |
| Modify | `src/features/companies/components/ai-config-accordion.tsx` | Wire `SystemModelsGrid` + dirty-gated handleSubmit |
| Modify | `src/features/settings/components/ai-config-section.tsx` | Wire `SystemModelsGrid` + dirty-gated handleSubmit |
| Modify | `src/mocks/data.ts` | Add 3 systemModels seeds |
| Read-only | `src/mocks/handlers.ts` | Verify shallow Object.assign round-trips; no code change unless needed |
| Read-only | `ai-rag-template/docs/frontend-admin/02-company-config.md` | Backend contract |

Each task ends with `npm run build` exit 0 and a single `git commit`.

---

## Task 1: Add SystemModels types

**Files:**
- Modify: `src/features/companies/types.ts` (after `AllowedModel` block, before "Tool Governance" section)

- [ ] **Step 1: Add `SYSTEM_MODEL_ROLES` tuple and types**

Insert immediately after the `AllowedModel` interface (currently lines 73-78) and before the `// ─── Tool Governance ───` separator:

```ts
// ─── System Models (per-role AI overrides) ─────────────

export const SYSTEM_MODEL_ROLES = [
  'channel',
  'quote',
  'retry',
  'toolStep',
  'title',
  'summary',
  'compaction',
  'qualityEval',
  'autoTag',
  'research',
  'memoryExtract',
  'freshness',
  'intentClassification',
  'channelSummary',
  'languageDetect',
] as const

export type SystemModelRole = typeof SYSTEM_MODEL_ROLES[number]

// GET responses for older tenants may omit keys; handleSubmit materializes
// the full 15-key object on the wire when the section is dirty.
export type SystemModels = Partial<Record<SystemModelRole, string | null>>
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ built in <ms>` and no TS errors (the new exports are unused yet — `as const` tuple is fine standalone).

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/types.ts
git commit -m "$(cat <<'EOF'
feat(systemmodels): add SystemModelRole tuple and SystemModels type

15-role const tuple used as the single source of iteration order for the
Zod schema, the editor grid, and the handleSubmit normalization.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add `systemModelsSchema` to Zod validations

**Files:**
- Modify: `src/lib/validations.ts:36-60` (the `aiConfigSchema` block)

- [ ] **Step 1: Add `nullableModel` preprocess and `systemModelsSchema`**

Insert immediately before the `export const aiConfigSchema = z.object({` line (currently line 36):

```ts
// Empty string from <ModelSelect> X-clear → null on the wire.
// String value → kept as-is. Backend validates model id against its catalog.
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

- [ ] **Step 2: Reference it inside `aiConfigSchema`**

Modify `aiConfigSchema` to include `systemModels`. Current shape (lines 36-50) ends after `webSearchTier:`. Add `systemModels: systemModelsSchema,` as the LAST field before the closing `})`:

Locate the existing block:

```ts
export const aiConfigSchema = z.object({
  apiKey: z.string().optional(),
  language: z.enum(['tr', 'en']).optional(),
  requestTimeoutMs: posNum,
  budgetUsd: posNum,
  budgetDowngradeThresholdPct: posNum,
  citationGateMode: z.enum(['off', 'warn', 'block']).optional(),
  hybridRrfK: posNum,
  maxOutputTokensRetryCap: posNum,
  vectorSimilarityThreshold: optNum,
  rerankApiKey: z.string().optional(),
  rerankModel: z.string().optional(),
  exaApiKey: z.string().optional(),
  webSearchTier: z.enum(['basic', 'deep', 'deep_reasoning']).optional(),
})
```

Replace its closing `webSearchTier:` line + `})` with:

```ts
  webSearchTier: z.enum(['basic', 'deep', 'deep_reasoning']).optional(),
  systemModels: systemModelsSchema,
})
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ built in <ms>`, no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts
git commit -m "$(cat <<'EOF'
feat(systemmodels): add Zod schema for 15-role systemModels block

Structural validation only (string|null per key). Backend validates the
model id against its OpenRouter catalog so the FE does not maintain a
parallel allow-list. Empty strings from ModelSelect X-clear normalize to
null via preprocess; the schema sits inside aiConfigSchema and is
optional so legacy tenants without a systemModels block still parse.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `SystemModelsGrid` shared component

**Files:**
- Create: `src/features/companies/components/system-models-grid.tsx`

- [ ] **Step 1: Write the component file**

Create the file with this exact content:

```tsx
import { Separator } from '@/components/ui/separator'
import { FieldLabel } from '@/components/ui/field-label'
import { ModelSelect } from '@/components/ui/model-select'
import { SYSTEM_MODEL_ROLES, type SystemModelRole, type SystemModels, type PlatformModel } from '../types'

interface SystemModelsGridProps {
  models: PlatformModel[]
  value: SystemModels
  onChange: (role: SystemModelRole, modelId: string) => void
}

interface RoleMeta {
  key: SystemModelRole
  label: string
  hint: string
}

const ROLE_META: RoleMeta[] = [
  { key: 'channel',              label: 'Kanal Mesajı',        hint: 'WhatsApp ve diğer kanal mesajlarına otomatik yanıt modeli' },
  { key: 'quote',                label: 'Teklif Hazırlama',    hint: 'Teklif hazırlama agent modeli' },
  { key: 'retry',                label: 'Guardrail Retry',     hint: 'Boş/format-fix retry sırasında kullanılan model' },
  { key: 'toolStep',             label: 'Tool Sonrası Adım',   hint: 'Tool çağrısı sonrası adım için downgrade modeli. Boş bırakılırsa ana model kalır (downgrade yok)' },
  { key: 'title',                label: 'Konuşma Başlığı',     hint: 'Sohbet başlığı otomatik üretimi (hafif model)' },
  { key: 'summary',              label: 'Doküman Özeti',       hint: 'Doküman AI özeti' },
  { key: 'compaction',           label: 'Konuşma Compaction',  hint: 'Uzun konuşmaların context özeti' },
  { key: 'qualityEval',          label: 'Kalite Değerlendirme', hint: 'Her turn groundedness/relevance ölçen ucuz model (maliyet için ekonomik model seçin)' },
  { key: 'autoTag',              label: 'Bilgi AutoTag',       hint: 'Knowledge item otomatik tag + özet üretimi' },
  { key: 'research',             label: 'Research Agent',      hint: 'Web search sonuçlarını özetleyen research agent' },
  { key: 'memoryExtract',        label: 'Bellek Çıkarma',      hint: 'Konuşmadan bellek kayıtlarını çıkaran model' },
  { key: 'freshness',            label: 'İçerik Tazelik',      hint: 'Proactive: URL içerik değişim analizi' },
  { key: 'intentClassification', label: 'Lead Intent',         hint: 'Lead intent / urgency sınıflandırma' },
  { key: 'channelSummary',       label: 'Kanal Özeti',         hint: 'Kanal konuşması bitince CRM için oluşturulan özet' },
  { key: 'languageDetect',       label: 'Dil Tespiti',         hint: 'Kullanıcı mesaj dili tespiti' },
]

// Sanity check at module load: ROLE_META must enumerate every role in SYSTEM_MODEL_ROLES.
if (ROLE_META.length !== SYSTEM_MODEL_ROLES.length) {
  throw new Error(`SystemModelsGrid: ROLE_META has ${ROLE_META.length} entries, expected ${SYSTEM_MODEL_ROLES.length}`)
}

function placeholderFor(role: SystemModelRole): string {
  return role === 'toolStep' ? 'Downgrade yok (primary model)' : 'Chat default kullan'
}

export function SystemModelsGrid({ models, value, onChange }: SystemModelsGridProps) {
  if (models.length === 0) {
    return (
      <div className="col-span-2">
        <Separator className="my-3" />
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem Modelleri</p>
        <p className="text-xs text-muted-foreground">Platform modelleri yükleniyor...</p>
      </div>
    )
  }

  const setCount = ROLE_META.reduce((acc, { key }) => {
    const v = value[key]
    return acc + (typeof v === 'string' && v.length > 0 ? 1 : 0)
  }, 0)

  return (
    <>
      <div className="col-span-2">
        <Separator className="my-3" />
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistem Modelleri</p>
          <span className="text-[10px] text-muted-foreground">{setCount}/15 set</span>
        </div>
      </div>
      {ROLE_META.map(({ key, label, hint }) => {
        const currentValue = value[key]
        const stringValue = typeof currentValue === 'string' ? currentValue : ''
        return (
          <div key={key}>
            <FieldLabel label={label} hint={hint} />
            <ModelSelect
              models={models}
              value={stringValue}
              onChange={(v) => onChange(key, v)}
              placeholder={placeholderFor(key)}
            />
          </div>
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ built in <ms>`, no TS errors. Component is exported but unused so far — no orphan warnings expected because vite tree-shakes silently.

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/system-models-grid.tsx
git commit -m "$(cat <<'EOF'
feat(systemmodels): SystemModelsGrid presentational component

Pure 15-cell grid sharing the SYSTEM_MODEL_ROLES tuple from types.ts.
toolStep gets a distinct "Downgrade yok (primary model)" placeholder; the
other 14 use "Chat default kullan". Header shows X/15 set counter where X
is the count of non-empty string values. No RHF coupling — parent owns
value/onChange and decides how to wire it.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Bug-fix — settings page `form.reset` on prop change

**Files:**
- Modify: `src/features/settings/components/ai-config-section.tsx` (top of the function body, after the existing `useForm` block)

This is a standalone bug fix called out in spec §9. Land it independently so the dirty-gated emission in Task 6 behaves correctly.

- [ ] **Step 1: Import `useEffect`**

Locate the imports at the top of the file. The first line is `import { useState } from 'react'`. Change to:

```ts
import { useEffect, useState } from 'react'
```

- [ ] **Step 2: Add the `form.reset` effect**

Locate the `useForm` block (currently around lines 32-36):

```ts
  const form = useForm<Record<string, any>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: (currentValues as Record<string, unknown>) ?? {},
  })
```

Immediately after that block (before the existing `function handleSubmit`), insert:

```ts
  useEffect(() => {
    if (currentValues) {
      form.reset(currentValues as Record<string, unknown>)
    }
  }, [currentValues, form])
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ built in <ms>`, no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/components/ai-config-section.tsx
git commit -m "$(cat <<'EOF'
fix(ai-config-section): reset form on currentValues change

The platform-defaults page's RHF only seeded defaultValues once at mount,
so after a successful PUT (which invalidates the TanStack query and
re-renders the parent with fresh currentValues) the form retained stale
values and dirtyFields never cleared. Mirror the existing effect from
ai-config-accordion.tsx so subsequent saves can rely on dirtyFields for
selective emission (incoming systemModels editor depends on this).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire `SystemModelsGrid` into the company accordion

**Files:**
- Modify: `src/features/companies/components/ai-config-accordion.tsx`

- [ ] **Step 1: Add imports**

Locate the import block at the top. Add the grid + types imports.

Current imports include:
```ts
import { AllowedModelsEditor } from './allowed-models-editor'
import type { PlatformModel, AllowedModel } from '../types'
```

Add immediately above the `AllowedModelsEditor` import:
```ts
import { SystemModelsGrid } from './system-models-grid'
```

And change the type import to include the new types:
```ts
import type { PlatformModel, AllowedModel, SystemModelRole, SystemModels } from '../types'
```

- [ ] **Step 2: Add the dirty-gated `systemModels` emission in `handleSubmit`**

Locate the existing `handleSubmit` (currently around lines 51-64). It looks like:

```ts
  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => {
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
    )
    if (allowedModels.length > 0) {
      cleaned.allowedModels = allowedModels
    }
    onSave('aiConfig', cleaned)
  }
```

Replace it with:

```ts
  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([key, v]) => {
        if (key === 'systemModels') return false // handled below explicitly
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
    )
    if (allowedModels.length > 0) {
      cleaned.allowedModels = allowedModels
    }
    if (form.formState.dirtyFields.systemModels) {
      const raw = (values.systemModels ?? {}) as Record<string, string | null | undefined>
      const systemModels: Record<string, string | null> = {}
      for (const key of SYSTEM_MODEL_ROLES) {
        const v = raw[key]
        systemModels[key] = v === '' || v == null ? null : v
      }
      cleaned.systemModels = systemModels
    }
    onSave('aiConfig', cleaned)
  }
```

Note: This requires importing `SYSTEM_MODEL_ROLES` (the const, not just types). Update the type-only import to a value+type import:

Replace:
```ts
import type { PlatformModel, AllowedModel, SystemModelRole, SystemModels } from '../types'
```

With two imports (the `as const` tuple must be imported as a value):
```ts
import { SYSTEM_MODEL_ROLES, type SystemModelRole, type SystemModels } from '../types'
import type { PlatformModel, AllowedModel } from '../types'
```

- [ ] **Step 3: Wire the grid in the JSX**

Locate the JSX section that ends the form grid (the existing `</div>` that closes `grid grid-cols-2`). Currently the structure is:

```tsx
          {/* Web Search Section */}
          ...
          </div>

          {/* Allowed Models Section */}
          {models.length > 0 && (
            <>
              <Separator className="my-4" />
              <AllowedModelsEditor
                models={models}
                value={allowedModels}
                onChange={setAllowedModels}
              />
            </>
          )}
```

The Web Search section is the last entry inside `<div className="grid grid-cols-2 gap-3">`. Add the System Models grid AT THE END of that grid block, BEFORE its closing `</div>`. Locate this exact closing of the grid (the line `</div>` that immediately precedes `{/* Allowed Models Section */}`):

```tsx
            </Select>
          </div>
          </div>

          {/* Allowed Models Section */}
```

Replace with:

```tsx
            </Select>
          </div>

          <SystemModelsGrid
            models={models}
            value={(form.watch('systemModels') ?? {}) as SystemModels}
            onChange={(role: SystemModelRole, modelId: string) =>
              form.setValue(`systemModels.${role}`, modelId === '' ? null : modelId, { shouldDirty: true })
            }
          />
          </div>

          {/* Allowed Models Section */}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -25`
Expected: `✓ built in <ms>`, no TS errors. Note: `form.setValue` with a template-literal path expects RHF to widen — if tsc complains, cast: `form.setValue(\`systemModels.${role}\` as 'systemModels.channel', ...)` (use any one valid path literal — the tsc-friendly cast is acceptable here since RHF's `FieldPath` widens at the call site).

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/components/ai-config-accordion.tsx
git commit -m "$(cat <<'EOF'
feat(systemmodels): wire SystemModelsGrid into company AI config accordion

Single form.watch('systemModels') feeds the grid value; the onChange
handler writes one role at a time with shouldDirty so handleSubmit can
gate emission on formState.dirtyFields.systemModels. handleSubmit excludes
'systemModels' from the empty-strip filter and emits a full 15-key object
(with explicit null for unset roles) only when the section is dirty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Wire `SystemModelsGrid` into the platform defaults page

**Files:**
- Modify: `src/features/settings/components/ai-config-section.tsx`

- [ ] **Step 1: Add imports**

Mirror Task 5's import changes. Find:
```ts
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import type { PlatformModel, AllowedModel } from '@/features/companies/types'
```

Replace with:
```ts
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import { SystemModelsGrid } from '@/features/companies/components/system-models-grid'
import { SYSTEM_MODEL_ROLES, type SystemModelRole, type SystemModels } from '@/features/companies/types'
import type { PlatformModel, AllowedModel } from '@/features/companies/types'
```

- [ ] **Step 2: Update `handleSubmit` with dirty-gated emission**

Locate the existing `handleSubmit` in this file (currently around lines 38-51). It mirrors the accordion's. Apply the same replacement as Task 5 Step 2 — exclude `systemModels` from the empty-strip filter and add the dirty-gated emission block.

The post-edit shape:

```ts
  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([key, v]) => {
        if (key === 'systemModels') return false
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
    )
    if (allowedModels.length > 0) {
      cleaned.allowedModels = allowedModels
    }
    if (form.formState.dirtyFields.systemModels) {
      const raw = (values.systemModels ?? {}) as Record<string, string | null | undefined>
      const systemModels: Record<string, string | null> = {}
      for (const key of SYSTEM_MODEL_ROLES) {
        const v = raw[key]
        systemModels[key] = v === '' || v == null ? null : v
      }
      cleaned.systemModels = systemModels
    }
    onSave('aiConfig', cleaned)
  }
```

- [ ] **Step 3: Wire the grid in the JSX**

Locate the JSX `grid grid-cols-2` block. The last inner section is "Web Search" (matches accordion). Find the closing `</div>` of the grid (the one immediately before `{models.length > 0 && (` for the AllowedModels block):

```tsx
            </Select>
          </div>
        </div>

        {models.length > 0 && (
```

Insert the grid BEFORE that closing `</div>`:

```tsx
            </Select>
          </div>

          <SystemModelsGrid
            models={models}
            value={(form.watch('systemModels') ?? {}) as SystemModels}
            onChange={(role: SystemModelRole, modelId: string) =>
              form.setValue(`systemModels.${role}`, modelId === '' ? null : modelId, { shouldDirty: true })
            }
          />
        </div>

        {models.length > 0 && (
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -25`
Expected: `✓ built in <ms>`, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/ai-config-section.tsx
git commit -m "$(cat <<'EOF'
feat(systemmodels): wire SystemModelsGrid into platform defaults page

Mirror of the accordion wiring (Task 5): exclude 'systemModels' from the
empty-strip filter, emit the full 15-key object only when dirtyFields
flags the section. With the form.reset effect from the previous commit,
dirtyFields now reliably clears after each save.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add 3 systemModels seeds to mocks

**Files:**
- Modify: `src/mocks/data.ts` (the `mockCompanyConfigs[mockCompanies[0].id].aiConfig` block and the `mockPlatformDefaults.aiConfig` block)

- [ ] **Step 1: Add a `systemModels` block to company #0**

Locate the `mockCompanyConfigs[mockCompanies[0].id].aiConfig` block (currently after the Faz 1 cleanup it reads):

```ts
  [mockCompanies[0].id]: {
    aiConfig: {
      apiKey: 'sk-or-a****wxyz',
      language: 'tr',
      budgetUsd: 100,
      budgetDowngradeThresholdPct: 80,
    },
```

Insert the `systemModels` key as the LAST field of `aiConfig`:

```ts
  [mockCompanies[0].id]: {
    aiConfig: {
      apiKey: 'sk-or-a****wxyz',
      language: 'tr',
      budgetUsd: 100,
      budgetDowngradeThresholdPct: 80,
      systemModels: {
        channel: null,
        quote: null,
        retry: null,
        toolStep: null,
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
    },
```

(Company #1's aiConfig intentionally has NO systemModels — exercises the "all platform defaults" path.)

- [ ] **Step 2: Add a `systemModels` block to platform defaults**

Locate `mockPlatformDefaults.aiConfig`. After Faz 1 it reads:

```ts
  aiConfig: {
    apiKey: 'sk-or-p****efgh',
    language: 'tr',
    requestTimeoutMs: 30000,
    budgetUsd: 200,
    budgetDowngradeThresholdPct: 80,
    citationGateMode: 'warn',
    hybridRrfK: 60,
    maxOutputTokensRetryCap: 4096,
    vectorSimilarityThreshold: 0.5,
    rerankApiKey: 'cohe****abcd',
    rerankModel: 'rerank-v3.5',
    exaApiKey: 'exa-a****wxyz',
    webSearchTier: 'basic',
  },
```

Append `systemModels` as the LAST field:

```ts
    webSearchTier: 'basic',
    systemModels: {
      channel: 'openai/gpt-4o-mini',
      quote: 'anthropic/claude-sonnet-4.6',
      retry: 'openai/gpt-4o-mini',
      toolStep: null,
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
  },
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`
Expected: `✓ built in <ms>`, no TS errors.

- [ ] **Step 4: Commit**

```bash
git add src/mocks/data.ts
git commit -m "$(cat <<'EOF'
feat(systemmodels): mock-seed company #0 and platform defaults

Company #0 mirrors the migration: 4 system roles inherit prior
compactionModel/title/summary/qualityEval values; toolStep is null
(multiModelStepEnabled=true downgraded to null per backend migration
note). Platform defaults populate 14 of 15 roles with reasonable
production-shaped choices (gpt-4o-mini for cheap roles, sonnet-4.6 for
agentic ones, haiku-4-5 for compaction); toolStep stays null so admins
opt into post-tool-call downgrade explicitly. Company #1 is intentionally
left without a systemModels block to exercise the all-defaults path.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Verify MSW handler round-trip

**Files:**
- Read-only check on `src/mocks/handlers.ts`

- [ ] **Step 1: Inspect both PUT handlers**

Run: `grep -n "platform/companies/:id/config\|platform/config/defaults" /Users/keremkaya/Desktop/firma/ai-rag-super-admin/src/mocks/handlers.ts | head -10`

Expected: two handler entries, both `http.put(...)`. Open the file at the matched line ranges and confirm each handler uses an Object.assign-style shallow merge with the request body. If the body's `systemModels` key is preserved on the response (echoed back), no code change is required.

- [ ] **Step 2: Trigger a synthetic round-trip via Vite dev (optional but recommended)**

Run: `npm run dev` in a background terminal. Open `http://localhost:5173/platform/settings` and `http://localhost:5173/platform/companies/<company-0-id>` (find a real company id by checking the companies list). Edit one system role, save. Reload the page and confirm the value persists.

If the handler does NOT preserve `systemModels` (e.g. it uses an allow-list strip), open `src/mocks/handlers.ts` at the PUT handler line and add `systemModels` to its passthrough, then verify build + commit. If pass-through is already working, skip the commit.

- [ ] **Step 3: Commit only if handlers were modified**

If handlers needed a change:

```bash
git add src/mocks/handlers.ts
git commit -m "$(cat <<'EOF'
fix(mocks): preserve systemModels on PUT config handlers

The PUT /platform/companies/:id/config and /platform/config/defaults
handlers were stripping unknown keys; the new systemModels block now
round-trips so the Vite-dev UI flow reflects backend behavior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Otherwise note "handlers verified — no change needed" in the final summary and skip to Task 9.

---

## Task 9: Manual UI smoke (Vite dev)

**Files:**
- None modified — exploratory smoke only

- [ ] **Step 1: Start Vite dev**

Run in a backgrounded terminal:
```bash
npm run dev
```

Expected: server listening on `http://localhost:5173` within ~2s.

- [ ] **Step 2: Smoke company AI config**

Navigate to `http://localhost:5173/platform/companies` and open company #0. Expand the "AI Config" accordion. Confirm:

1. A "Sistem Modelleri" section appears after the Web Search section and before the AllowedModels editor, with separator + heading + "4/15 set" counter (4 from the company-#0 seed).
2. The four pre-set fields (`title`, `summary`, `compaction`, `qualityEval`) show the seeded model labels selected.
3. The other 11 fields show their placeholders. The `toolStep` placeholder is "Downgrade yok (primary model)"; the others are "Chat default kullan".
4. Click a non-set field, pick any model from the dropdown — the counter increments to "5/15 set".
5. Click the X on a previously-set field — the counter decrements.
6. Save with only `apiKey` edited (revert systemModels changes via reload first): inspect the network panel in browser devtools — the PUT body must NOT contain `systemModels`. With at least one systemModels edit: the PUT body must contain a full 15-key `systemModels` object with explicit nulls for unset roles.

- [ ] **Step 3: Smoke platform defaults**

Navigate to `http://localhost:5173/platform/settings`. Locate the AI Config section. Repeat the same UI checks against the platform-defaults seed (expect "14/15 set" initially, `toolStep` empty).

Verify the form-reset bug fix from Task 4: save once, confirm the form's saved values match the just-rendered values (no stale field reappears after refetch).

- [ ] **Step 4: Stop dev server**

Kill the backgrounded `npm run dev` process.

- [ ] **Step 5: No commit needed**

This step is verification only.

---

## Task 10: Optional curl smoke + final memory + push

**Files:**
- Optional: `~/.claude/projects/-Users-keremkaya-Desktop-firma-ai-rag-super-admin/memory/...` (memory update at session end, not in this plan task list)

- [ ] **Step 1: Optional curl smoke against api.edfu.ai**

If the permission classifier allows credential transmission (history of Faz 1 says: denied twice), attempt:

```bash
read -s TOKEN <<< "<paste JWT from /auth/login flow>"
curl -sS -w "\nHTTP=%{http_code}\n" \
  -X PUT https://api.edfu.ai/platform/companies/<test-company-id>/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @- <<'EOF'
{"aiConfig":{"systemModels":{"channel":null,"quote":null,"retry":null,"toolStep":null,"title":null,"summary":null,"compaction":null,"qualityEval":null,"autoTag":null,"research":null,"memoryExtract":null,"freshness":null,"intentClassification":null,"channelSummary":null,"languageDetect":null}}}
EOF
```

Expected: `HTTP=200` with the saved config echoed back. If the classifier blocks, mark smoke as deferred to user's manual UI run and proceed.

- [ ] **Step 2: Final build**

Run: `npm run build 2>&1 | tail -10`
Expected: `✓ built in <ms>`, no errors.

- [ ] **Step 3: Inspect commit log**

Run: `git log origin/main..HEAD --oneline`
Expected: ~7 commits between the spec commit (`748b6e6`) and now: Task 1 (types), Task 2 (zod), Task 3 (grid), Task 4 (settings reset), Task 5 (accordion wire), Task 6 (settings wire), Task 7 (mocks). Task 8 may add a handler commit; Task 9 adds none.

- [ ] **Step 4: AskUserQuestion onay for push origin main**

Use AskUserQuestion to confirm "All tasks done, build green, smoke passed. Push origin main now?" with options "Yes push", "Wait — let me review the commits first", "Hold; specific concern".

- [ ] **Step 5: On approval, push**

```bash
git push origin main
```

Expected: fast-forward push of all Faz 2 commits.

- [ ] **Step 6: Memory update (out of plan scope — final session step)**

Update memory entries:
- `project_post_sprint9_plan.md` → mark Faz 2 shipped
- `project_superadmin_status.md` → new HEAD commit
- Add a brief recap memo: `project_faz2_systemmodels_recap.md`

---

## Self-Review Checklist (performed by author)

**Spec coverage:**
- §1 Background → Tasks 1-7 collectively realize it
- §2 Scope (in/out) → Out-of-scope items not added; Tasks 1-7 cover in-scope
- §3 Backend contract → Task 1 (types), Task 2 (zod), Task 8 (mock verification)
- §4 Role catalog → Task 3 ROLE_META in exact spec order
- §5 UI design (placement, layout, per-field, dirty handleSubmit, X/15 counter) → Tasks 3, 5, 6
- §6 Validation → Task 2
- §7 Types → Task 1
- §8 Mock data (3 seeds) → Task 7 (company #0 + platform defaults; company #1 intentionally untouched)
- §9 Read flow (settings form.reset) → Task 4
- §10 AC#1-10 → each grounded in a task; AC#4 dirty-gating verified in Task 9 Step 2#6
- §11 R1 free-tier (read-flow OK), R2 empty models (Task 3 guard), R3 curl smoke (Task 10 optional), R4 a11y (deferred) → all noted
- §12 Implementation outline → mapped 1:1 to Tasks 1-8

**Placeholder scan:** No "TBD", "TODO", "fill in later". All code blocks are complete copy-paste-ready content.

**Type consistency:**
- `SYSTEM_MODEL_ROLES` (value) imported as a value in Task 3, Task 5, Task 6 — all match Task 1's export
- `SystemModelRole` / `SystemModels` (types) — imported as types where needed
- `placeholderFor` and `ROLE_META` are scoped to Task 3 only — no cross-task name collision
- `form.setValue` path template literal `\`systemModels.${role}\`` consistent in Task 5 + Task 6
- `formState.dirtyFields.systemModels` accessed identically in both consumer tasks

**Task ordering:** Task 4 (settings form.reset bug fix) precedes Task 6 (settings wiring) so dirtyFields clears correctly. Task 3 (grid component) precedes Tasks 5+6 (consumers). Task 7 (mocks) is independent and can run any time after Task 1 (types reference).

No issues found — plan is internally consistent.
