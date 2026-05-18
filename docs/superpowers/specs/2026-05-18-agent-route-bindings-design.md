---
title: Agent Route Bindings SuperAdmin CRUD UI
status: draft
date: 2026-05-18
backend_ref: docs/frontend-admin/21-multi-agent-routing.md (ai-rag-template repo)
backend_pr: PR #94 (commit 5ad0c65, merged to dev 2026-05-18)
---

# Agent Route Bindings SuperAdmin CRUD UI

## 1. Bağlam ve Amaç

Backend Plan B #5 (PR #94) `/platform/admin/agent-route-bindings` altında 4 CRUD endpoint shipped. Tablodaki satırlar `AgentRoutingService.resolveAgent`'in `(channel, peerKind)` lookup'unda kullanılır; her satır bir kanal × peer kombinasyonunu bir agent UUID'ye yönlendirir. Backend doc'u `21-multi-agent-routing.md` "Admin UI Spesifikasyonu" bölümü yöneticinin neye bakmak isteyeceğini özetliyor (liste + filtreler + edit + öncelik); bu spec o bölümü FE implementation'a çeviriyor.

Bugün repo'da `/admin/cost-health`, `/admin/agent-quality`, `/admin/agent-quality/alerts` lazy route'ları var; `agent-route-bindings` aynı kategoriden 4. SuperAdmin tooling sayfası olacak.

## 2. Karar Özeti (Brainstorming Çıktısı)

| Karar | Seçim |
|---|---|
| Sayfa layout'u | List + Dialog (service-accounts pattern; create/edit aynı modal, `selected: T \| null`) |
| Form lib | RHF + Zod (regex/min-max constraint'leri declarative kapatır; shadcn Form primitive zaten var) |
| 409 `binding_version_conflict` UX | Manuel — refetch fresh row → form reset → toast → user re-edit + save |
| Agent picker | Sabit Select, 4 well-known UUID (Conversation / Quote / Search / Internal RAG) |
| roles input | Chip-input (Enter veya virgül → chip; her chip `[A-Za-z0-9_-]{1,50}`); boş = match-any |
| peerId input | Tek text Input + helper "Boş bırakılırsa tüm peer'lara uygulanır (wildcard)"; empty/whitespace → `null` normalize mutation hook'unda |
| channel input | Select "Bilinen" (whatsapp / telegram / dashboard) + "Diğer..." → freeform Input (regex hint helper) |
| PR bölünmesi | 5 PR (foundation → list+filters → create dialog → edit+409 → delete+duplicate surfacing) |
| Smoke | Tam CRUD prod'a karşı (`api.edfu.ai`); sandbox channel `test-rb-<timestamp>` ile cleanup |

## 3. Mimari ve Dosya Çatısı

Yeni feature klasörü:

```
src/features/agent-route-bindings/
├── types.ts
├── lib/
│   └── form-schema.ts
├── hooks/
│   └── use-agent-route-bindings.ts
├── components/
│   ├── agent-route-bindings-filters.tsx
│   ├── agent-route-bindings-table.tsx
│   ├── agent-route-binding-dialog.tsx
│   ├── agent-route-binding-delete-dialog.tsx
│   ├── roles-chip-input.tsx
│   └── agent-label.tsx
└── pages/
    └── agent-route-bindings-page.tsx
```

Repo-genel dokunulanlar:

| Dosya | Değişiklik |
|---|---|
| `src/App.tsx` | `AgentRouteBindingsPage` lazy import + `/admin/agent-route-bindings` route (Suspense + RouteLoadingFallback). |
| `src/components/layout/sidebar.tsx` | `platformItems` dizisine 4. entry: `{ to: '/admin/agent-route-bindings', icon: Network, label: 'Agent Routing' }`. |
| `src/lib/query-keys.ts` | `admin.agentRouteBindings = { all: ['admin','agent-route-bindings'], list: (filters) => ['admin','agent-route-bindings','list', filters] }`. |
| `src/components/ui/alert-dialog.tsx` | Repo'da AlertDialog primitive YOK; shadcn AlertDialog ekle (delete confirm için). Eğer ekleme istenmiyorsa: plain Dialog ile confirm fallback — kararı PR 5'te. |

**Auth:** `AuthGuard` zaten `user?.isPlatformAdmin` kontrolü yapıyor (`src/components/layout/auth-guard.tsx:7`). Ekstra route-level guard gerekmez. 403 fallback: page-level error card (`cost-health-page.tsx:98` pattern'i).

**Sidebar ikonu:** `lucide-react` `Network`. Alternatif: `Workflow` (eğer "akış" çağrışımı tercih edilirse). Renk default `text-muted-foreground`, active `bg-primary text-primary-foreground` (mevcut sidebar pattern'i değişmez).

## 4. Veri Modeli — Hand-Typed Contract

Repo'da openapi-typescript pipeline'ı yok; her feature kendi `types.ts`'sini hand-write ediyor. Backend `openapi.json`'dan teyit edilen kontrat:

```typescript
// src/features/agent-route-bindings/types.ts

export type PeerKind = 'customer' | 'user'

export interface AgentRouteBinding {
  id: string                              // uuid
  agentId: string                         // uuid
  channel: string                         // ^[a-z][a-z0-9_-]{0,49}$
  peerKind: PeerKind
  peerId: string | null                   // empty/whitespace input → null
  roles: string[]                         // each ^[A-Za-z0-9_-]{1,50}$, max 10
  priority: number                        // 0..1000 int
  notes: string | null                    // max 1000
  versionSeq: number                      // optimistic lock counter
  createdByUserId: string | null          // null for migration-seeded rows
  createdAt: string                       // ISO
  updatedAt: string                       // ISO
}

export interface AgentRouteBindingListResponse {
  items: AgentRouteBinding[]
  total: number
}

export interface CreateAgentRouteBindingRequest {
  agentId: string
  channel: string
  peerKind: PeerKind
  peerId?: string | null
  roles?: string[]
  priority?: number
  notes?: string | null
}

export interface UpdateAgentRouteBindingRequest {
  expectedVersionSeq: number              // REQUIRED
  agentId?: string
  channel?: string
  peerKind?: PeerKind
  peerId?: string | null
  roles?: string[]
  priority?: number
  notes?: string | null
}

// Well-known agents (spec §Veri Modeli > Varsayilan Tohumlanmis Baglamalar)
// AGENT_IDS tuple literal — Zod v4 z.enum doğru type-narrow için tuple gerek (review I2).
export const AGENT_IDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const AGENT_OPTIONS: { id: AgentId; label: string }[] = [
  { id: AGENT_IDS[0], label: 'Conversation' },
  { id: AGENT_IDS[1], label: 'Quote' },
  { id: AGENT_IDS[2], label: 'Search' },
  { id: AGENT_IDS[3], label: 'Internal RAG' },
]

export const KNOWN_CHANNELS = ['whatsapp', 'telegram', 'dashboard'] as const
export const PEER_KIND_OPTIONS: { value: PeerKind; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'user', label: 'User' },
]

export const ROLE_REGEX = /^[A-Za-z0-9_-]{1,50}$/
export const CHANNEL_REGEX = /^[a-z][a-z0-9_-]{0,49}$/

export interface AgentRouteBindingsFilters {
  agentId: string | null
  channel: string | null
  peerKind: PeerKind | null
}

// Helpers
export function getAgentLabel(agentId: string): string {
  return AGENT_OPTIONS.find((a) => a.id === agentId)?.label ?? agentId.slice(0, 8) + '…'
}

export function normalizePeerId(input: string): string | null {
  const trimmed = input.trim()
  return trimmed === '' ? null : trimmed
}
```

**Tasarım notu:** `createdByUserId` ve `peerId` ve `notes` openapi'de `"type": "object", "nullable": true`. Bu `nestjs-swagger` `@ApiProperty({ type: String, nullable: true })` annotation eksikliğinin yan etkisi (Plan B PR #82 review minor). FE elle `string | null` tipliyor; backend bir gün annotation eklediğinde değişiklik yok.

### 4.1 Inbound Runtime Parse (Review C1 fix)

Hand-typed contract garanti vermez — backend `peerId`'yi gerçekten object döndürürse (annotation drift) FE silently broken olur. Bu yüzden list response'u runtime'da Zod ile parse edilir:

```typescript
// src/features/agent-route-bindings/lib/inbound-schema.ts
import { z } from 'zod'

export const agentRouteBindingSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  channel: z.string(),
  peerKind: z.enum(['customer', 'user']),
  peerId: z.string().nullable(),         // ❗ contract drift olursa burada hata
  roles: z.array(z.string()),
  priority: z.number(),
  notes: z.string().nullable(),
  versionSeq: z.number(),
  createdByUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const agentRouteBindingListSchema = z.object({
  items: z.array(agentRouteBindingSchema),
  total: z.number(),
})
```

Hook'ta `queryFn` içinde `.parse(data)` ile çalıştırılır. Parse fail olursa TanStack Query error state'e düşer → page-level error card "Veri formatı beklenmedik" göstergesi (cost-health 403 pattern'i ile aynı). Smoke step 2'de bir kez geçtikten sonra schema güvende; PR 1'de eklenir.

**Backend issue (parallel track):** `@ApiProperty({ type: String, nullable: true })` annotation'ı `peerId`, `notes`, `createdByUserId` field'larına eklenecek (Plan B PR #82 review minor #2 zaten not). FE bu olmadan da çalışır.

## 5. Query Keys ve Hooks Contract

### 5.1 Query keys

```typescript
// src/lib/query-keys.ts (delta)
admin: {
  // ... mevcutlar
  agentRouteBindings: {
    all: ['admin', 'agent-route-bindings'] as const,
    list: (filters: AgentRouteBindingsFilters) =>
      ['admin', 'agent-route-bindings', 'list', filters] as const,
  },
}
```

Pagination yok (backend tablo küçük, <100 satır). Detail-by-id query yok — list response'undan client-side `.find(id)` ile çekilir (refresh trigger: mutation invalidate).

### 5.2 Hooks

```typescript
// src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts

export function useAgentRouteBindings(filters: AgentRouteBindingsFilters) {
  return useQuery({
    queryKey: queryKeys.admin.agentRouteBindings.list(filters),
    queryFn: async (): Promise<AgentRouteBindingListResponse> => {
      const params: Record<string, string> = {}
      if (filters.agentId) params.agentId = filters.agentId
      if (filters.channel) params.channel = filters.channel
      if (filters.peerKind) params.peerKind = filters.peerKind
      const { data } = await apiClient.get('/platform/admin/agent-route-bindings', { params })
      return data
    },
  })
}

export function useCreateAgentRouteBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAgentRouteBindingRequest): Promise<AgentRouteBinding> => {
      const { data } = await apiClient.post('/platform/admin/agent-route-bindings', body)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all }),
  })
}

export function useUpdateAgentRouteBinding(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateAgentRouteBindingRequest): Promise<AgentRouteBinding> => {
      const { data } = await apiClient.patch(`/platform/admin/agent-route-bindings/${id}`, body)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all }),
  })
}

export function useDeleteAgentRouteBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/platform/admin/agent-route-bindings/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all }),
  })
}
```

### 5.2.1 Pre-Implement Backend Smoke (Review C2 fix — PR 3 önce zorunlu)

Repo'da hiç emsali olmayan bir error envelope parser kurmadan, backend gerçek shape'i 30 dakikalık curl smoke ile netleştirilir. **PR 3 başlamadan** Section 11 step 4'ün curl versiyonu çalıştırılır:

```bash
# 1) Login
TOKEN=$(curl -s -X POST https://api.edfu.ai/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<password>"}' | jq -r .accessToken)

# 2) 409 binding_duplicate — aynı natkey ile iki POST
curl -s -X POST https://api.edfu.ai/platform/admin/agent-route-bindings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"agentId":"00000000-0000-4000-8000-000000000002","channel":"test-dup-X","peerKind":"user","priority":0}' \
  | jq .  # 201 → id capture

curl -s -X POST https://api.edfu.ai/platform/admin/agent-route-bindings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"agentId":"00000000-0000-4000-8000-000000000002","channel":"test-dup-X","peerKind":"user","priority":0}' \
  | jq .  # 409 → BODY SHAPE BURADA NET OLUR

# 3) 409 binding_version_conflict — yanlış expectedVersionSeq
curl -s -X PATCH https://api.edfu.ai/platform/admin/agent-route-bindings/<id> \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"expectedVersionSeq":999,"priority":1}' \
  | jq .  # 409 → BODY SHAPE BURADA NET OLUR

# 4) Cleanup
curl -s -X DELETE https://api.edfu.ai/platform/admin/agent-route-bindings/<id> \
  -H "Authorization: Bearer $TOKEN"
```

Smoke çıktısına göre parser tek-path olarak yazılır. **Olası iki shape:**

**Shape A (Nest custom exception filter ile `code` field):**
```json
{ "statusCode": 409, "message": "Binding already exists", "code": "binding_duplicate", "conflict": { "natkey": "..." } }
```

**Shape B (Nest default `HttpException`, message string'inde code):**
```json
{ "statusCode": 409, "message": "binding_duplicate", "error": "Conflict" }
```

### 5.2.1.1 Smoke Bulgu (2026-05-18, Task 16)

Prod (`api.edfu.ai`) curl smoke: **backend her iki shape'i de kullanıyor**, ama farklı code'lar için farklı shape:

**binding_duplicate (409 POST aynı natkey):**
```json
{
  "error": "binding_duplicate",
  "conflict": {
    "agentId": "00000000-0000-4000-8000-000000000002",
    "channel": "test-dup-1779135267",
    "peerKind": "user",
    "peerId": null,
    "priority": 0
  }
}
```
- Discriminator: `body.error === 'binding_duplicate'` (top-level)
- `body.conflict` **`{natkey: string}` değil** — tam breakdown objesi (5 alan).
- `body.message` yok, `body.statusCode` yok.

**binding_version_conflict (409 PATCH yanlış expectedVersionSeq):**
```json
{
  "message": "binding_version_conflict",
  "error": "Conflict",
  "statusCode": 409
}
```
- Discriminator: `body.message === 'binding_version_conflict'` (Nest HttpException default)
- `body.error` HTTP status adı ("Conflict"), kod değil.
- `body.conflict` yok.

**Karar:** Parser tek-yol değil, **iki kaynaklı tek-pass**: önce `body.error`'a bak (KNOWN_CODES içinde varsa onu kullan), yoksa `body.message`'a bak (KNOWN_CODES içinde varsa onu kullan), yoksa `unknown`. Bu defensive duplikasyon değil — backend deliberate olarak iki shape üretiyor. Plan Task 17 Variant A ve B birleştirilip Variant C (hybrid) olarak yazıldı.

**ParsedError.conflict type düzeltmesi:** `{natkey: string}` yerine full breakdown:
```typescript
conflict?: {
  agentId: string
  channel: string
  peerKind: 'customer' | 'user'
  peerId: string | null
  priority: number
}
```

**Toast message güncelleme (§7.4 handleMutationError):** `parsed.conflict?.natkey` yerine alan-alan format:
```typescript
`Aynı kombinasyon mevcut: agent=${getAgentLabel(ctx.agentId)} · ${ctx.channel} · ${ctx.peerKind}${ctx.peerId ? `:${ctx.peerId}` : ''} · öncelik ${ctx.priority}`
```

### 5.2.2 Error Parser (Single Path)

```typescript
// src/features/agent-route-bindings/lib/parse-error.ts
import axios from 'axios'

export type RouteBindingErrorCode =
  | 'binding_version_conflict'
  | 'binding_duplicate'
  | 'binding_not_found'
  | 'invalid_agent_id'
  | 'platform_admin_required'
  | 'unknown'

export interface ParsedError {
  status: number
  code: RouteBindingErrorCode
  message: string
  conflict?: { natkey: string }
}

// Bu fonksiyon Section 5.2.1 smoke çıktısına göre tek-path implement edilir.
// Spec yazıldığında shape kesinleşmedi — implementer smoke sonucu PR 3'ün
// ilk commit'inde bu helper'ı sade tek-yol haline getirir.
export function parseRouteBindingError(error: unknown): ParsedError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { status: 0, code: 'unknown', message: 'Ağ hatası' }
  }
  const status = error.response.status
  const body = error.response.data as Record<string, unknown> | undefined
  // Implementer: smoke shape'ine göre TEK source-of-truth seç (body.code VEYA body.message).
  // ÇİFT FALLBACK kullanma — bu defensive code değil belirsizlik korkusudur.
  const rawCode = body && typeof body.code === 'string' ? body.code
                : body && typeof body.message === 'string' ? body.message
                : 'unknown'
  const code = KNOWN_CODES.has(rawCode) ? rawCode as RouteBindingErrorCode : 'unknown'
  const message = (body?.message as string) ?? `HTTP ${status}`
  const conflict = body?.conflict as { natkey: string } | undefined
  return { status, code, message, conflict }
}

const KNOWN_CODES = new Set<string>([
  'binding_version_conflict', 'binding_duplicate', 'binding_not_found',
  'invalid_agent_id', 'platform_admin_required',
])
```

PR 3 ilk commit'inde smoke çıktısı `docs/superpowers/specs/2026-05-18-agent-route-bindings-design.md` Section 5.2.1'in altına note olarak işlenir; parser çift-fallback'i tek-path'e indirilir.

### 5.3 URL filter state

`useUrlFilterState<AgentRouteBindingsFilters>` ile `?agentId=&channel=&peerKind=`:

```typescript
const URL_STATE_OPTS = {
  defaults: { agentId: null, channel: null, peerKind: null },
  parse: (params: URLSearchParams) => ({
    agentId: params.get('agentId'),
    channel: params.get('channel'),
    peerKind: (params.get('peerKind') === 'customer' || params.get('peerKind') === 'user')
      ? params.get('peerKind') as PeerKind
      : null,
  }),
  serialize: (v) => ({
    agentId: v.agentId ?? undefined,
    channel: v.channel ?? undefined,
    peerKind: v.peerKind ?? undefined,
  }),
} as const
```

> **Sprint 8 followup hizalaması:** `URL_STATE_OPTS` module-level const olarak tanımlanır (parse stability — agent-quality page'leri de aynısını yapıyor).

## 6. Page Composition

`AgentRouteBindingsPage`:

```
┌─────────────────────────────────────────────────────────────────┐
│ Agent Route Bindings                                  [+ Yeni]  │
│ N binding listeleniyor                                          │
├─────────────────────────────────────────────────────────────────┤
│ Agent: [▼ Hepsi]   Kanal: [▼ Hepsi]   Peer Türü: [▼ Hepsi]      │
├─────────────────────────────────────────────────────────────────┤
│ Agent          Kanal      Peer Türü   Peer ID   Roller   Pri   │
│ ────────────────────────────────────────────────────────────── │
│ Conversation   whatsapp   customer    ANY       Hepsi    100   │
│ Conversation   telegram   customer    ANY       Hepsi    100   │
│ Internal RAG   dashboard  user        ANY       Hepsi    100   │
└─────────────────────────────────────────────────────────────────┘
```

**Sort:** Backend zaten `(channel ASC, peerKind ASC, priority DESC)` döndürüyor. FE ek sort uygulamıyor.

**Row click:** Edit dialog açar (`selected = row`, `dialogOpen = true`).

**Header CTA:** "+ Yeni" → `selected = null`, `dialogOpen = true`.

**Delete:** Her satırın sağ tarafında bir trash icon button → `deleteTargetId = id`, `deleteDialogOpen = true`. Confirm AlertDialog ayrı state. (Row click → edit, ikon click → delete olduğundan event propagation iptal edilmeli: `onClick={(e) => { e.stopPropagation(); ... }}`.)

**Loading state:** `Skeleton` primitive Sprint 8 followup'unda eklenecek; bu spec sırasında repo'da yoksa `<Loader2>` spinner fallback (mevcut pattern).

**Empty state:** "Henüz binding yok. Yeni bir tane oluşturmak için yukarıdaki + Yeni butonuna basın."

**Error state:**
- 403 `platform_admin_required` → cost-health pattern'i: "Bu sayfayı görmek için platform admin yetkisi gerekli."
- Diğer hatalar → "Binding'ler yüklenemedi. Tekrar deneyin." + retry button.

## 7. Create/Edit Dialog (RHF + Zod)

### 7.1 Form schema (Review I2 + I3 fix — sadeleştirildi)

`channelMode` switch field kaldırıldı. Schema tek `channel: string` validate eder; "Bilinen vs Diğer" sadece UI mode'u, local component state. Submit'te dallanma yok.

```typescript
// src/features/agent-route-bindings/lib/form-schema.ts
import { z } from 'zod'
import { AGENT_IDS, CHANNEL_REGEX, ROLE_REGEX } from '../types'

export const routeBindingFormSchema = z.object({
  agentId: z.enum(AGENT_IDS, { message: 'Agent seçimi zorunlu' }),
  channel: z.string().regex(CHANNEL_REGEX, 'Lowercase a-z ile başlamalı; sadece a-z, 0-9, _, - (max 50 karakter)'),
  peerKind: z.enum(['customer', 'user']),
  peerId: z.string().max(500, 'En fazla 500 karakter').nullable(),  // empty string allowed; submit'te normalize
  roles: z.array(z.string().regex(ROLE_REGEX, 'Sadece A-Z, a-z, 0-9, _, -')).max(10, 'En fazla 10 rol'),
  priority: z.number().int('Tam sayı olmalı').min(0, 'En az 0').max(1000, 'En fazla 1000'),
  notes: z.string().max(1000, 'En fazla 1000 karakter').nullable(),
})

export type RouteBindingFormValues = z.infer<typeof routeBindingFormSchema>
```

**Channel UI mode:** Dialog component'i local state tutar:

```typescript
const [channelMode, setChannelMode] = useState<'known' | 'custom'>(
  binding && !KNOWN_CHANNELS.includes(binding.channel as any) ? 'custom' : 'known'
)
// Known mode: <Select> options KNOWN_CHANNELS → onChange = setValue('channel', selected)
// Custom mode: <Input> → register('channel') direkt
// Mode switch'te channel value KORUNUR (custom'a geçince Select değerini Input'a taşır vs).
```

`AGENT_IDS` tuple literal olarak tanımlandığı için `z.enum(AGENT_IDS)` runtime'da çalışır + type inference `AgentId` union'ına narrow eder.

### 7.2 Dialog component contract

```typescript
interface AgentRouteBindingDialogProps {
  binding: AgentRouteBinding | null   // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Mode kuralları:**

| Field | Create | Edit |
|---|---|---|
| `agentId` | Default `Conversation` UUID (AGENT_IDS[0]) | Pre-fill mevcut |
| `channel` | empty string | Pre-fill `binding.channel` |
| `channelMode` (local) | `'known'` default | `KNOWN_CHANNELS.includes(binding.channel) ? 'known' : 'custom'` |
| `peerKind` | `'customer'` default | Pre-fill |
| `peerId` | empty string | Pre-fill (`binding.peerId ?? ''`) |
| `roles` | `[]` | Pre-fill array |
| `priority` | `0` | Pre-fill |
| `notes` | empty string | Pre-fill (`binding.notes ?? ''`) |

`useEffect([binding, open])` ile her açılışta form `reset(defaults | pre-fill)` + local `channelMode` state da yeniden initialize edilir.

### 7.3 Submit handler

```typescript
function onSubmit(values: RouteBindingFormValues) {
  const peerId = normalizePeerId(values.peerId ?? '')
  const notes = (values.notes ?? '').trim() === '' ? null : values.notes!.trim()

  if (binding) {
    // EDIT
    const body: UpdateAgentRouteBindingRequest = {
      expectedVersionSeq: binding.versionSeq,
      agentId: values.agentId,
      channel: values.channel,
      peerKind: values.peerKind,
      peerId,
      roles: values.roles,
      priority: values.priority,
      notes,
    }
    updateMutation.mutate(body, {
      onSuccess: () => {
        toast.success('Binding güncellendi')
        onOpenChange(false)
      },
      onError: (err) => handleMutationError(err, { isEdit: true }),
    })
  } else {
    // CREATE
    const body: CreateAgentRouteBindingRequest = {
      agentId: values.agentId,
      channel: values.channel,
      peerKind: values.peerKind,
      peerId,
      roles: values.roles,
      priority: values.priority,
      notes,
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        toast.success('Binding oluşturuldu')
        onOpenChange(false)
      },
      onError: (err) => handleMutationError(err, { isEdit: false }),
    })
  }
}
```

### 7.4 `handleMutationError` ve Parent State Contract (Review I1 fix)

**Parent component contract (page + dialog):**

```typescript
// page tarafında:
const [selected, setSelected] = useState<AgentRouteBinding | null>(null)
const [dialogOpen, setDialogOpen] = useState(false)

const { data: listData } = useAgentRouteBindings(filters)

// Selected'ı list cache'i yenilendiğinde otomatik fresh row'la sync et.
// Dialog AÇIKKEN list invalidate → fresh fetch geldi → selected'ı re-pick et:
useEffect(() => {
  if (!selected) return
  const fresh = listData?.items.find((b) => b.id === selected.id)
  if (fresh && fresh.versionSeq !== selected.versionSeq) {
    setSelected(fresh)               // dialog'un useEffect([binding, open])'i form'u reset eder
  } else if (!fresh && dialogOpen) {
    setSelected(null)
    setDialogOpen(false)
    toast.error('Bu binding silinmiş. Liste yenilendi.')
  }
}, [listData, selected?.id])
```

Bu kontrat dialog'un üzerinde durur — `selected` her zaman listData'nın güncel yansıması.

**Dialog onError handler:**

```typescript
function handleMutationError(err: unknown, ctx: { isEdit: boolean }) {
  const parsed = parseRouteBindingError(err)

  // 409 binding_version_conflict — sadece edit'te olabilir
  if (parsed.status === 409 && parsed.code === 'binding_version_conflict' && ctx.isEdit) {
    // Tek iş: list cache'i invalidate et. Async refetch döndüğünde parent useEffect
    // selected state'ini fresh DTO ile değiştirir → dialog'un useEffect([binding,open])'i
    // form'u yeni versionSeq + diğer fresh değerlere reset eder.
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    toast.warning(
      'Bu kayıt başkası tarafından değiştirildi. Form yenilendi — değişikliklerini gözden geçirip tekrar kaydet.'
    )
    // Dialog AÇIK kalır. Save butonu disabled değil (user re-edit edip Save'e tekrar basabilir).
    return
  }

  if (parsed.status === 409 && parsed.code === 'binding_duplicate') {
    const natkey = parsed.conflict?.natkey ?? '(natkey unknown)'
    toast.error(
      `Aynı kombinasyon zaten mevcut: ${natkey}. (agentId, channel, peerKind, peerId, priority) eşsiz olmalı.`
    )
    return
  }

  if (parsed.status === 400 && parsed.code === 'invalid_agent_id') {
    toast.error('Geçersiz agent ID — agent veritabanında bulunamadı.')
    return
  }

  if (parsed.status === 404) {
    toast.error('Binding bulunamadı — silinmiş olabilir. Liste yenileniyor.')
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    onOpenChange(false)
    return
  }

  toast.error(ctx.isEdit ? 'Güncelleme başarısız' : 'Oluşturma başarısız')
}
```

**409 conflict UX akışı (manuel mod) — net sıra:**

1. User Save → `PATCH(versionSeq=N)` → backend 409.
2. `handleMutationError` → `invalidateQueries(all)` + toast.warning.
3. TanStack Query refetch tetiklenir; `listData` async güncellenir.
4. Parent `useEffect([listData, selected?.id])` fresh row'u yakalar → `setSelected(fresh)`.
5. Dialog `useEffect([binding, open])` deps'i değişir (`binding` referansı yeni) → form `reset(freshValues)`.
6. UI'da form değerleri güncellenir, versionSeq footer'da yeni değer görünür.
7. Dialog AÇIK. User re-edit → Save → `PATCH(versionSeq=N+1)` → 200.

**Edge case — concurrent DELETE:** Step 4'te fresh row yok → parent `useEffect` `setSelected(null)` + `setDialogOpen(false)` + ayrı toast. Dialog kapanır, user listeye döner.

**Edge case — invalidate sırasında user başka satıra tıklarsa:** `setSelected(newRow)` çağrılır, eski `useEffect` koşar ama yeni selected.id list'te olduğu için OK. Race yok.

### 7.5 Form layout

```
┌──────────────────────────────────────────────────────────────┐
│ Yeni Binding / Binding Düzenle                          [×]  │
├──────────────────────────────────────────────────────────────┤
│ Agent *                  Kanal Modu                          │
│ [▼ Conversation]         (●) Bilinen  ( ) Diğer              │
│                                                              │
│ Kanal *                                                      │
│ [▼ whatsapp]              veya [_____________________]        │
│                                                              │
│ Peer Türü *              Öncelik (0..1000)                   │
│ [▼ customer]             [100]                               │
│                                                              │
│ Peer ID                                                      │
│ [________________________________________________]           │
│ Boş bırakılırsa tüm peer'lara uygulanır (wildcard).          │
│                                                              │
│ Roller                                                       │
│ [admin ×] [agent ×]  ▢ chip ekle ve Enter...                 │
│ Boş bırakılırsa her rol geçer. Max 10.                       │
│                                                              │
│ Notlar (opsiyonel)                                           │
│ [_____________________________________________________]      │
│ [_____________________________________________________]      │
│                                                              │
│ ┌── EDIT MODE'DA ──────────────────────────────────┐        │
│ │ versionSeq: 3   Son güncelleme: 2026-05-17 14:22 │        │
│ └──────────────────────────────────────────────────┘        │
│                                                              │
│                                  [İptal]  [Oluştur/Güncelle] │
└──────────────────────────────────────────────────────────────┘
```

EDIT mode'da `versionSeq` + `updatedAt` küçük muted text olarak gösterilir — concurrent edit shock'u azaltmak için (kullanıcı son güncelleme zamanını görür).

## 8. RolesChipInput Primitive

Reusable; `roles-chip-input.tsx` altında.

**Props:**

```typescript
interface RolesChipInputProps {
  value: string[]
  onChange: (next: string[]) => void
  maxChips?: number          // default 10
  chipRegex?: RegExp         // default ROLE_REGEX
  placeholder?: string
  disabled?: boolean
}
```

**Davranış:**
- Input + altta chip listesi (her chip "× sil" butonlu).
- Enter veya `,` (virgül) tuşu: input'taki trimmed string'i ekle.
  - Boş, dup, regex fail → toast.error + input clear.
- Backspace boşken son chip'i siler.
- Paste (Ctrl+V): virgülle parçalanır, her parça regex'ten geçenler eklenir, kalanlar düşer + toast info "N rol eklendi, M geçersiz atlandı".
- `maxChips` aşılırsa input disabled + helper "Max 10".

**Erişilebilirlik:** her chip `<span>` + remove button `<button aria-label="Rolü kaldır: admin">`.

## 9. Delete Dialog

```
┌──────────────────────────────────────────────┐
│ Binding Sil                                  │
├──────────────────────────────────────────────┤
│ Bu binding'i silmek üzeresiniz:              │
│   Agent:     Conversation                    │
│   Kanal:     whatsapp                        │
│   Peer Tür:  customer                        │
│   Peer ID:   ANY                             │
│                                              │
│ Bu işlem geri alınamaz. Routing kararları    │
│ etkilenebilir. Devam etmek istiyor musunuz? │
│                                              │
│                      [İptal]   [Sil]         │
└──────────────────────────────────────────────┘
```

Delete onError: 404 → "Zaten silinmişti." + invalidate + close. Diğer → "Silme başarısız" toast.

**AlertDialog primitive kararı:** Repo'da yoksa shadcn AlertDialog ekle (`src/components/ui/alert-dialog.tsx`). Tek-shot delete confirm için Dialog'un AlertDialog semantic'ine ihtiyacı var (focus trap + ESC iptal + role=alertdialog). Bağımlılık: `@radix-ui/react-alert-dialog` (zaten Radix kullanıyoruz, ek dep ihmal edilebilir).

## 10. Sidebar ve Route

`src/components/layout/sidebar.tsx` delta:

```typescript
import { ..., Network } from 'lucide-react'

const platformItems = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
  { to: '/admin/agent-quality', icon: Gauge, label: 'Agent Kalite' },
  { to: '/admin/agent-quality/alerts', icon: Bell, label: 'Alerts', badge: 'agent-quality-alerts' },
  { to: '/admin/agent-route-bindings', icon: Network, label: 'Agent Routing' },
]
```

`src/App.tsx` delta (lazy pattern):

```typescript
const AgentRouteBindingsPage = lazy(() =>
  import('@/features/agent-route-bindings/pages/agent-route-bindings-page').then((m) => ({
    default: m.AgentRouteBindingsPage,
  }))
)

// route:
<Route
  path="/admin/agent-route-bindings"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <AgentRouteBindingsPage />
    </Suspense>
  }
/>
```

## 11. Smoke Test (api.edfu.ai prod, no live users)

Auth: `kerem at nonamefirm.com` (cred conversation'da verildi; memory'e kaydedilmez).

| # | Adım | Beklenti |
|---|---|---|
| 1 | POST `/auth/login` | accessToken + isPlatformAdmin=true |
| 2 | UI: `/admin/agent-route-bindings` git | 3 seed binding listelenir (conversation/whatsapp, conversation/telegram, internal-rag/dashboard) |
| 3 | Filter: Agent = Conversation | 2 satır kalır |
| 4 | Filter clear → CTA "+ Yeni" | Dialog açılır, default'lar set |
| 5 | Form fill: agent=Quote, channelMode=Diğer, channel=`test-rb-1747574400`, peerKind=user, priority=0, roles=`[admin]`, notes=`smoke test` → Oluştur | 201, satır listede görünür, toast başarı |
| 6 | Aynı satıra row click → Dialog edit mode | versionSeq=1 görünür, form pre-filled |
| 7 | priority=5 yap → Güncelle | 200, listede priority=5, versionSeq=2 |
| 8 | Concurrent edit simulation (sıralı; Review I5 fix): (a) UI'da aynı satıra tekrar tıkla → dialog edit mode, snapshot versionSeq=2. (b) **Dialog AÇIKKEN** browser console'dan background PATCH ile versionSeq=2→3 yap (expectedVersionSeq:2, priority:99). (c) UI'da dialog'da priority=10 yazıp Save | (b) console fetch → 200 (versionSeq=3). (c) UI Save → 409 binding_version_conflict, toast warning, form fresh değerlere reset (priority=99 görünür, versionSeq=3) |
| 9 | Yeni binding dene aynı natkey ile (agent=Quote, channel=`test-rb-1747574400`, peerKind=user, peerId=null, priority=10 → step 8 sonrası en güncel priority değeri) → Oluştur | 409 binding_duplicate, toast'ta natkey görünür |
| 10 | Listede sandbox satırı bul → trash icon → AlertDialog "Sil" | 204, satır kaybolur, toast başarı |
| 11 | GET tekrar | 3 seed binding (temiz) |
| 12 | Logout → URL'i direkt yaz | /login'e redirect (AuthGuard) |

**Concurrent edit simulation (step 8) — net adım sırası (Review I5):**

Tek tab + console kombinasyonu yeterli; ikinci tab gerekmiyor.

```javascript
// 1. UI'da row click → dialog edit mode, snapshot versionSeq=N (örn 2)
// 2. Dialog açıkken, browser console'da:
const TOKEN = localStorage.getItem('auth_access_token')
const ID = '<sandbox-binding-id>'
await fetch(`https://api.edfu.ai/platform/admin/agent-route-bindings/${ID}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ expectedVersionSeq: 2, priority: 99 })  // → 200, versionSeq=3
})
// 3. UI'da dialog HÂLÂ AÇIK; snapshot hâlâ versionSeq=2. Refetch tetiklenmedi
//    (background PATCH list cache'ini direkt değiştirmiyor — kontrolümüzdeki olay).
// 4. Dialog'da bir alanı değiştir (örn priority=10) ve Save → PATCH(versionSeq=2)
// 5. Backend 409 binding_version_conflict döner.
// 6. handleMutationError → invalidate → listData refresh → parent useEffect →
//    setSelected(fresh: versionSeq=3, priority=99) → dialog useEffect reset → form
//    priority=99 ve versionSeq=3 footer'da görünür.
// 7. Test: priority=11 yaz → Save → PATCH(versionSeq=3) → 200, versionSeq=4.
```

**Cleanup garantisi:** Smoke yarıda kalırsa sandbox channel adı (`test-rb-<timestamp>`) UUID-benzeri unique olduğu için canlı routing'i etkilemez. Manuel cleanup için son `curl -X DELETE` script'i smoke checklist sonunda hazır.

## 12. PR Bölünmesi (5 PR)

### PR 1 — Foundation (Review I4 fix — AlertDialog primitive buraya taşındı)
- `src/features/agent-route-bindings/types.ts` (interface'ler + constants — AGENT_IDS, AGENT_OPTIONS, KNOWN_CHANNELS, regex'ler)
- `src/features/agent-route-bindings/lib/inbound-schema.ts` (Section 4.1 Zod inbound parse)
- `src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts` (sadece `useAgentRouteBindings` list query, inbound parse dahil — diğer mutation'lar PR 3-5'te)
- `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx` (placeholder: header + "Binding yok" empty state)
- `src/components/ui/alert-dialog.tsx` (shadcn AlertDialog primitive — `@radix-ui/react-alert-dialog` dep ekle; PR 5'in delete confirm'i bekleyemez, primitive foundation'da olmalı)
- `src/lib/query-keys.ts` (`admin.agentRouteBindings` namespace)
- `src/App.tsx` (lazy route)
- `src/components/layout/sidebar.tsx` (`Network` icon entry)

**Kabul:** sayfa açılır, listede 3 seed binding görünür, filter yok henüz, mutation yok. AlertDialog primitive `tsc --noEmit` ve `npm run build` clean.

**LOC tahmini:** ~270 (AlertDialog primitive ~120 LOC).

### PR 2 — List + filters (+ Error states — Review M2 fix)
- `src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx`
- `src/features/agent-route-bindings/components/agent-route-bindings-table.tsx`
- `src/features/agent-route-bindings/components/agent-label.tsx`
- `agent-route-bindings-page.tsx` update: filters + table mount, `useUrlFilterState`, **403 / 401 / 500 page-level error card path'leri** (cost-health pattern'i)
- URL contract: `?agentId=<uuid>&channel=<string>&peerKind=customer|user`

**Kabul:** 3 filter combobox'u çalışır, table satırları doğru sort'la görünür, URL persist eder refresh sonrası. 403 `platform_admin_required` error card render edilir; 500/network → "Tekrar Dene" buton'lu error card. Inbound Zod parse fail → "Veri formatı beklenmedik" error card.

**LOC tahmini:** ~280.

### PR 3 — Create dialog

**ÖN-KOŞUL:** Section 5.2.1 backend error envelope smoke (curl) yapılır ve sonuç Section 5.2.1'in altına note olarak eklenir. `parse-error.ts` tek-path olarak yazılır (çift fallback yerine smoke'tan kesinleşen shape'e göre).

- `src/features/agent-route-bindings/lib/form-schema.ts`
- `src/features/agent-route-bindings/lib/parse-error.ts` (tek-path implement, Section 5.2.2)
- `src/features/agent-route-bindings/components/roles-chip-input.tsx`
- `src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx` (create-only mode; local `channelMode` UI state + tek `channel` schema field)
- `hooks/use-agent-route-bindings.ts` update: `useCreateAgentRouteBinding`
- Page update: "+ Yeni" CTA + dialog state + create flow

**Kabul:** "+ Yeni" tıklanır, dialog açılır, RHF + Zod tam validation, submit → 201, liste invalidate, toast başarı. binding_duplicate (409) error path uygulanır + natkey toast'ta görünür.

**LOC tahmini:** ~300.

### PR 4 — Edit + 409 version conflict (parent state contract)
- Dialog update: edit mode (binding pre-fill, versionSeq + updatedAt göster)
- `useUpdateAgentRouteBinding(id)` hook
- **Parent state contract** (Section 7.4): page'de `useEffect([listData, selected?.id])` ile fresh row sync + concurrent DELETE edge case
- `handleMutationError` 409 binding_version_conflict path: invalidate + toast warning (form reset parent contract üzerinden)
- Row click handler page'de
- Concurrent edit simulation testi (Section 11 step 8 smoke)

**Kabul:** Row click → dialog edit mode, edit submit → 200, version conflict simulation → fresh row parent'a inerken form yenilenir, dialog açık kalır. Concurrent DELETE simulation → dialog kapanır + toast.

**LOC tahmini:** ~220.

### PR 5 — Delete confirm
- `src/features/agent-route-bindings/components/agent-route-binding-delete-dialog.tsx` (PR 1'deki AlertDialog primitive'ini kullanır)
- `useDeleteAgentRouteBinding` hook
- Table satır trash icon + `event.stopPropagation` (row click edit'i tetiklemesin)

**Kabul:** Delete icon → AlertDialog → Sil → 204, satır kaybolur, toast başarı. 404 (zaten silinmiş) → invalidate + close + bilgilendirici toast.

**LOC tahmini:** ~100.

**Toplam:** ~1170 LOC, 5 PR, atomic commit'ler.

## 13. Test ve Doğrulama Stratejisi

Repo'da Vitest yok. Doğrulama katmanları:

| Katman | Yöntem |
|---|---|
| Type safety | `tsc --noEmit` her PR'da |
| Lint | `eslint .` her PR'da |
| Build | `npm run build` her PR'da (lazy chunk delta'sını commit message'a ekle) |
| Functional | Manual smoke (Bölüm 11) PR 5 sonunda full pass; PR'lara göre subset |
| Form validation | Tarayıcıda her edge case manuel: empty roles, dup chip, invalid regex (uppercase channel), priority>1000, peerId 501 char |

Smoke checklist'i her PR'a relevant subset olarak eklenir:
- PR 1: smoke #1, #2, #11 (basit ve auth).
- PR 2: + smoke #3.
- PR 3: + smoke #4, #5, #9.
- PR 4: + smoke #6, #7, #8.
- PR 5: + smoke #10.

## 14. Edge Case'ler ve Karar Kaydı

1. **`peerId` empty vs null:** Backend `Empty/whitespace input normalized to null`. FE de aynı: `normalizePeerId('   ') → null`. Form'da empty input'la `peerId: null` arasında **görsel fark yok** (kullanıcı her ikisini de `""` olarak görür). Edit mode'da `binding.peerId === null` ise input'a `""` yazılır; submit'te tekrar null'a normalize edilir. Backend round-trip'te idempotent.

2. **`roles: []` vs `roles: undefined`:** Hem create hem edit'te FE her zaman `roles: array` gönderir (default `[]`). Backend `default: []` zaten — uyumlu.

3. **`notes` boşaltma:** Edit'te user notes alanını silerse, FE `notes: null` gönderir (boş string yerine). Backend tutarlı davranışı varsayıyoruz (PATCH'te `notes: null` → DB'de NULL).

4. **`priority` integer cast:** RHF + Zod `z.number().int()` kullanıcı string yazdığında parse edemez. Form'da Input `type="number"` + `valueAsNumber: true` register option'ı.

5. **`channel` regex case-sensitive:** Backend `^[a-z]...` — uppercase reddedilir. FE'de Zod regex aynı. User "WhatsApp" yazarsa form-level error, submit edilmez.

6. **Channel mode UI switching:** Tek `channel: string` schema field; local `channelMode: 'known' | 'custom'` UI state. "Bilinen → Diğer" geçince mevcut `channel` değeri korunur (Select'in son seçimi Input'a yansır). "Diğer → Bilinen" geçince eğer `channel` value `KNOWN_CHANNELS`'da değilse Select empty olur ve user yeni seçim yapana kadar Zod regex hata vermez ama submit empty value'yu reddeder. Edit mode'da binding pre-fill'i `channel` değerine bakıp mode'u otomatik belirler.

7. **Aynı binding'i iki tab'ta edit:** Step 8 smoke'da test edilir. Refetch + form reset → user değişikliği kaybolur. Bu manuel mod'un bilinen sonucu.

8. **Optimistic update yok:** Mutation'lar onSuccess'te invalidate ile fresh fetch tetikler. UI'da save → spinner → list refresh akışı net.

9. **AGENT_OPTIONS değişimi:** Backend yeni seed agent eklerse FE constant güncellenmeli. Documentation cross-ref: `21-multi-agent-routing.md` defaults tablosu.

10. **AlertCountBadge çakışması:** Sidebar entry'sinde `badge` field yok (mevcut alert system sadece `agent-quality-alerts`'e bağlı). Yeni entry için badge eklenmez.

## 15. Kapsam Dışı (YAGNI)

- **Drag-and-drop priority reorder:** Spec backend doc'ta önerilmiş ama priority numerik input ile yeterli. Drag-drop büyük bir dep + state machine. Eklenmiyor.
- **Bulk operations:** Tablo <100 satır; tek tek mutation yeterli.
- **Activity log surfacing:** Backend her mutation'ı `activity_log`'a yazıyor (`agent_route_binding.{created,updated,deleted}`). FE'de bu log'u göstermek ayrı feature (`/activity-log` global page veya per-binding history). Bu spec kapsamı dışı.
- **Agent picker UUID escape hatch:** "Diğer (UUID)" option'u eklenmez — backend yeni agent eklendiğinde FE constant güncellenir.
- **Cron-health UI / agent-route-binding metrics:** Bu spec sadece CRUD; routing performans dashboard'u Sprint 9+ kapsamında.

## 16. Backend Bağımlılık ve Riskler

| Risk | Hafifletme |
|---|---|
| Error envelope `code` alan adı belirsiz | `parseRouteBindingError` `body.code` ve `body.message` fallback ikisini de okur; PR 4 smoke'da netleştirilir |
| `binding_duplicate` payload `conflict: {natkey}` shape doğrulanmadı | PR 3 smoke step 9 ile teyit; eğer farklıysa parser update'lenir (küçük fix) |
| Backend yeni well-known agent eklerse | `AGENT_OPTIONS` constant'ı manuel güncellemek gerek — düşük frekans, doc cross-ref var |
| Backend `peerId/notes/createdByUserId` typed as object (openapi annotation gap) | FE hand-typed; backend annotation eklemese de uyumlu kalır |
| Backend smoke sırasında error code yerine generic message dönerse | PR 4 smoke #8 ile yakalanır; gerekirse backend issue açılır (`code` field eklensin) |

## 17. Migration & Deployment

- Bundle delta: yeni lazy chunk ~25-35 kB raw (RHF zaten kullanılıyor, Zod zaten kullanılıyor, AlertDialog Radix dep eklenebilir +3kB). Main bundle değişmez.
- Vercel auto-deploy main branch.
- Env değişikliği yok.
- Backend zaten dev'de mergeli (PR #94, commit `5ad0c65`); production deploy state'i öncesi PR 1 commit'i tek başına çalışmalı (sayfa açılır, sadece API olmazsa empty state — backend down ise tüm `/admin/*` aynı durumda).

## 18. Acceptance Criteria (Feature-Level)

- [ ] `/admin/agent-route-bindings` route açılır, AuthGuard tarafından korunur (non-admin → /login).
- [ ] List yüklenir, 3 seed binding görünür (en az dev'de).
- [ ] Agent / Kanal / Peer Türü filtreleri çalışır, URL persist eder.
- [ ] "+ Yeni" → dialog açılır, RHF + Zod validation, başarılı POST → liste invalidate.
- [ ] Row click → dialog edit mode, versionSeq + updatedAt görünür, PATCH başarılı.
- [ ] Concurrent edit (409 binding_version_conflict) → form yenilenir, toast uyarısı.
- [ ] Duplicate (409 binding_duplicate) → natkey toast'ta görünür.
- [ ] Delete trash icon → AlertDialog → 204 → satır kaybolur.
- [ ] Sidebar'da `Network` ikonu görünür, navigate eder.
- [ ] `tsc --noEmit` 0 hata.
- [ ] `npm run build` 0 hata; bundle delta commit message'a yazılır.
- [ ] Manuel smoke 12 step prod'a karşı pass.

## 19. Sonraki Adımlar

1. Spec gözden geçirildi (bağımsız reviewer subagent + user).
2. `superpowers:writing-plans` ile PR-by-PR detaylı task plan (kabul kriterleri + byte-exact code snippet'leri).
3. `superpowers:subagent-driven-development` ile PR-by-PR implement (her PR ayrı commit batch).
4. Final feature-level review.

## 20. Spec Review Sonuçları (2026-05-18)

Bağımsız reviewer subagent (general-purpose) ile review yapıldı. Bulgular ve durumları:

| # | Sev | Bulgu | Durum |
|---|---|---|---|
| C1 | CRITICAL | openapi `peerId/notes/createdByUserId` `type: object` — FE hand-typed `string\|null` runtime garanti vermez | **FIX:** §4.1 inbound Zod parse eklendi; PR 1'de bağlandı |
| C2 | CRITICAL | Backend error envelope shape belirsiz; çift fallback parser kırılgan | **FIX:** §5.2.1 pre-implement curl smoke + §5.2.2 tek-path parser; PR 3 ön-koşulu |
| I1 | IMPORTANT | 409 conflict UX parent state machine ambiguity | **FIX:** §7.4 parent state contract paragrafı + `useEffect([listData, selected?.id])` pattern |
| I2 | IMPORTANT | `z.enum(AGENT_OPTIONS.map(...))` tuple typing kırılgan | **FIX:** §4 `AGENT_IDS` tuple const + §7.1 `z.enum(AGENT_IDS)` |
| I3 | IMPORTANT | `channelMode` switch field over-engineered | **FIX:** §7.1 tek `channel: string` schema + local UI mode state |
| I4 | IMPORTANT | AlertDialog primitive ayrı PR 5'te → PR 5'i şişiriyor | **FIX:** §12 PR 1 foundation'a taşındı; PR 5 daraltıldı |
| I5 | IMPORTANT | Smoke step 8 concurrent edit sırası muğlak | **FIX:** §11 step 8 net 7-adımlı script + dialog AÇIKKEN background PATCH |
| M1 | MINOR | `Network` ikonu vs `Workflow` | Mevcut: Network |
| M2 | MINOR | 401/403/500 error path'leri hangi PR'da | **FIX:** §12 PR 2 kabul kriterine 403 + 500 + Zod parse error eklendi |
| M3 | MINOR | Bundle delta tahmini hafif optimist | §17 not olarak duruyor; gerçek değer PR 1'de commit message'da |
| M4 | MINOR | Concurrent DELETE dokümantasyonu | **FIX:** §7.4 net açıklama |
| M5 | MINOR | Activity log cross-link Sprint 9 followup | Doc'lı: §15 + project_next_session_todo.md güncellenecek |
| M6 | MINOR | `tsc --noEmit` runtime guard yerine geçmez | **FIX:** §4.1 inbound Zod parse C1 ile birlikte kapatır |

Toplam: 2/2 CRITICAL + 5/5 IMPORTANT + 4/6 MINOR fix; kalan 2 MINOR (M1 + M3) cosmetic/no-op. Spec implement edilebilir durumda.
