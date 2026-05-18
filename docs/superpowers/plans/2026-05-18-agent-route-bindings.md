# Agent Route Bindings CRUD UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SuperAdmin için `/admin/agent-route-bindings` CRUD UI'ı kurmak; backend Plan B PR #94'ün 4 endpoint'ini (list/create/update/delete) kullanan list + dialog tabanlı bir yönetim sayfası.

**Architecture:** Mevcut `service-accounts` (list+dialog) + `agent-quality` (lazy route + useUrlFilterState) pattern'lerini birleştirir. Tek `/admin/agent-route-bindings` route + dual-mode dialog (create/edit) + AlertDialog delete confirm. 409 binding_version_conflict UX'i parent state contract ile çözer (list invalidate → useEffect ile selected re-pick → form reset). PR'lara 5'e bölünmüş atomic commit'ler.

**Tech Stack:** React 19 + React Router v7 + TanStack Query v5 + react-hook-form + Zod v4 + shadcn UI (Dialog, AlertDialog, Form, Table, Select, Switch, Input) + lucide-react + axios. Vitest yok — doğrulama: `tsc --noEmit` + `eslint` + `npm run build` + manual smoke vs api.edfu.ai.

**Spec referansı:** `docs/superpowers/specs/2026-05-18-agent-route-bindings-design.md` (commit `7223daf`).

**Backend referansı:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/21-multi-agent-routing.md` (sibling repo). OpenAPI: `/Users/keremkaya/Desktop/firma/ai-rag-template/openapi/openapi.json`.

**Smoke auth:** `kerem at nonamefirm.com` (cred conversation'da; memory'e kaydedilmez). Backend prod `https://api.edfu.ai`, no live users.

---

## PR 1 — Foundation

5 dosya yarat + sidebar/route hook'u + AlertDialog primitive. PR sonunda sayfa açılır, 3 seed binding GET listelenir, mutation/filter henüz yok.

### Task 1: Add @radix-ui/react-alert-dialog dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (npm auto-update)

- [ ] **Step 1: Install package**

Run:
```bash
npm install @radix-ui/react-alert-dialog@^1.1.4
```

Expected: installs ~50KB unpacked, no peer dep warnings (Radix peers React 19 OK).

- [ ] **Step 2: Verify install**

Run:
```bash
node -e "console.log(require('@radix-ui/react-alert-dialog/package.json').version)"
```

Expected: prints `1.1.4` (or newer minor).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): add @radix-ui/react-alert-dialog for delete confirm primitive

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create shadcn AlertDialog primitive

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`

- [ ] **Step 1: Write primitive (shadcn standard template adapted to repo conventions)**

Code (`src/components/ui/alert-dialog.tsx`):
```tsx
import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = 'AlertDialogOverlay'

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg',
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = 'AlertDialogContent'

function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
}
AlertDialogHeader.displayName = 'AlertDialogHeader'

function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
}
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
))
AlertDialogTitle.displayName = 'AlertDialogTitle'

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
AlertDialogDescription.displayName = 'AlertDialogDescription'

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
))
AlertDialogAction.displayName = 'AlertDialogAction'

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
    {...props}
  />
))
AlertDialogCancel.displayName = 'AlertDialogCancel'

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: 0 errors. (Pre-existing repo baseline errors not in this file.)

- [ ] **Step 3: Lint**

Run:
```bash
npx eslint src/components/ui/alert-dialog.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(ui): add shadcn AlertDialog primitive

Used by upcoming agent-route-bindings delete confirm dialog.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create types.ts (hand-typed contract + constants)

**Files:**
- Create: `src/features/agent-route-bindings/types.ts`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/types.ts`):
```typescript
export type PeerKind = 'customer' | 'user'

export interface AgentRouteBinding {
  id: string
  agentId: string
  channel: string
  peerKind: PeerKind
  peerId: string | null
  roles: string[]
  priority: number
  notes: string | null
  versionSeq: number
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
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
  expectedVersionSeq: number
  agentId?: string
  channel?: string
  peerKind?: PeerKind
  peerId?: string | null
  roles?: string[]
  priority?: number
  notes?: string | null
}

// Well-known agents (Backend doc 21 §Veri Modeli > Varsayilan Tohumlanmis Baglamalar).
// AGENT_IDS is a tuple literal so Zod's z.enum can infer the union correctly.
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
export type KnownChannel = (typeof KNOWN_CHANNELS)[number]

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

export function getAgentLabel(agentId: string): string {
  const found = AGENT_OPTIONS.find((a) => a.id === agentId)
  if (found) return found.label
  return `${agentId.slice(0, 8)}…`
}

export function normalizePeerId(input: string): string | null {
  const trimmed = input.trim()
  return trimmed === '' ? null : trimmed
}

export function isKnownChannel(c: string): c is KnownChannel {
  return (KNOWN_CHANNELS as readonly string[]).includes(c)
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: 0 errors in this file.

- [ ] **Step 3: Lint**

Run:
```bash
npx eslint src/features/agent-route-bindings/types.ts
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/agent-route-bindings/types.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): add types + constants

Hand-typed contract (openapi annotation gap on peerId/notes/createdByUserId).
AGENT_IDS tuple for Zod z.enum typing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add inbound Zod schema (runtime parse for contract drift)

**Files:**
- Create: `src/features/agent-route-bindings/lib/inbound-schema.ts`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/lib/inbound-schema.ts`):
```typescript
import { z } from 'zod'

export const agentRouteBindingSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  channel: z.string(),
  peerKind: z.enum(['customer', 'user']),
  peerId: z.string().nullable(),
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

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/lib/inbound-schema.ts
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/lib/inbound-schema.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): inbound Zod parse for contract drift safety

OpenAPI types peerId/notes/createdByUserId as object|null due to annotation gap.
Runtime parse guards FE against backend serialization drift.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Add admin.agentRouteBindings query keys namespace

**Files:**
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Read current file to find the admin block**

Run:
```bash
grep -n "admin:" src/lib/query-keys.ts
```

Expected: shows `admin: {` block around line 43.

- [ ] **Step 2: Add namespace entry after `agentQualityAlerts`**

Modify `src/lib/query-keys.ts`. Find the existing `admin` block and add `agentRouteBindings` after `agentQualityAlerts`. Add this import at the top:

```typescript
import type { AgentRouteBindingsFilters } from '@/features/agent-route-bindings/types'
```

Add inside the `admin:` object, after `agentQualityAlerts: { ... },`:

```typescript
    agentRouteBindings: {
      all: ['admin', 'agent-route-bindings'] as const,
      list: (filters: AgentRouteBindingsFilters) =>
        ['admin', 'agent-route-bindings', 'list', filters] as const,
    },
```

- [ ] **Step 3: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/lib/query-keys.ts
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/query-keys.ts
git commit -m "$(cat <<'EOF'
feat(query-keys): add admin.agentRouteBindings namespace

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add list query hook (with inbound parse)

**Files:**
- Create: `src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts`):
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { agentRouteBindingListSchema } from '../lib/inbound-schema'
import type {
  AgentRouteBindingListResponse,
  AgentRouteBindingsFilters,
} from '../types'

export function useAgentRouteBindings(filters: AgentRouteBindingsFilters) {
  return useQuery({
    queryKey: queryKeys.admin.agentRouteBindings.list(filters),
    queryFn: async (): Promise<AgentRouteBindingListResponse> => {
      const params: Record<string, string> = {}
      if (filters.agentId) params.agentId = filters.agentId
      if (filters.channel) params.channel = filters.channel
      if (filters.peerKind) params.peerKind = filters.peerKind
      const { data } = await apiClient.get('/platform/admin/agent-route-bindings', { params })
      // Runtime parse — fails loudly if backend drifts (peerId object vs string, etc.)
      return agentRouteBindingListSchema.parse(data)
    },
  })
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): list query hook with inbound Zod parse

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Page placeholder (header + empty state, no filter/dialog yet)

**Files:**
- Create: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`):
```tsx
import { Loader2 } from 'lucide-react'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'

const EMPTY_FILTERS = { agentId: null, channel: null, peerKind: null }

export function AgentRouteBindingsPage() {
  const { data, isLoading, isError } = useAgentRouteBindings(EMPTY_FILTERS)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-bold">Agent Routing</h1>
        <p className="text-sm text-destructive">Yüklenemedi. Sayfayı yenileyin.</p>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Agent Routing</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} binding · agent + channel + peer eşlemesi
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          Henüz binding yok.
        </div>
      ) : (
        <div className="rounded-md border p-4 text-sm">
          {items.length} binding (tablo PR 2'de eklenecek)
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): page placeholder with header + empty state

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Mount lazy route in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy import after existing lazy declarations**

Modify `src/App.tsx`. After the `AgentQualityAlertsPage` lazy block, add:

```typescript
const AgentRouteBindingsPage = lazy(() =>
  import('@/features/agent-route-bindings/pages/agent-route-bindings-page').then(
    (m) => ({ default: m.AgentRouteBindingsPage })
  )
)
```

- [ ] **Step 2: Add route**

In the `<Routes>` block, after the `/admin/agent-quality/alerts` route, add:

```tsx
              <Route
                path="/admin/agent-route-bindings"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <AgentRouteBindingsPage />
                  </Suspense>
                }
              />
```

- [ ] **Step 3: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/App.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "$(cat <<'EOF'
feat(routes): add lazy /admin/agent-route-bindings route

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Add sidebar entry

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add Network icon to lucide-react import**

Modify the import line:

```typescript
import { LayoutDashboard, Building2, Settings, LogOut, Mail, KeyRound, BookOpen, Activity, Gauge, Bell, Network } from 'lucide-react'
```

- [ ] **Step 2: Add platformItems entry**

Find the `platformItems` array and add a 4th entry:

```typescript
const platformItems: Array<{
  to: string
  icon: typeof Activity
  label: string
  badge?: 'agent-quality-alerts'
}> = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
  { to: '/admin/agent-quality', icon: Gauge, label: 'Agent Kalite' },
  {
    to: '/admin/agent-quality/alerts',
    icon: Bell,
    label: 'Alerts',
    badge: 'agent-quality-alerts',
  },
  { to: '/admin/agent-route-bindings', icon: Network, label: 'Agent Routing' },
]
```

- [ ] **Step 3: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/components/layout/sidebar.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "$(cat <<'EOF'
feat(sidebar): add Agent Routing platform item (Network icon)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: PR 1 build + smoke + push

- [ ] **Step 1: Full build**

Run:
```bash
npm run build
```

Expected: 0 errors. New lazy chunk for `agent-route-bindings-page` reported (a few kB).

- [ ] **Step 2: Note bundle delta**

From the `vite v8` output, capture the new chunk size (raw + gzip) — record in the commit body or PR description.

- [ ] **Step 3: Manual smoke against api.edfu.ai**

Start dev server:
```bash
npm run dev
```

Open `http://localhost:5173/admin/agent-route-bindings`. Login with provided creds if redirected. Expected:

1. Sidebar shows the Network icon under the platform separator.
2. Click it → page loads with header "Agent Routing".
3. List displays "3 binding · ..." (the seed rows from migration `1782000003000-multi-agent-foundation.ts`).
4. Page transition uses `RouteLoadingFallback` briefly during lazy load.
5. Browser network tab: `GET /platform/admin/agent-route-bindings` returns 200; response shape passes Zod parse (no console errors).

If parse fails → check console error; backend may have shipped non-string peerId. STOP and open backend issue before continuing.

- [ ] **Step 4: PR 1 complete — push branch**

```bash
git push origin main
```

(All commits go directly to main; this repo's convention per `project_superadmin_status.md`.)

---

## PR 2 — List + filters + error states

Table + filter bar + URL state + 403/500/Zod-parse error cards.

### Task 11: AgentLabel component

**Files:**
- Create: `src/features/agent-route-bindings/components/agent-label.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/agent-label.tsx`):
```tsx
import { getAgentLabel } from '../types'

interface AgentLabelProps {
  agentId: string
  className?: string
}

export function AgentLabel({ agentId, className }: AgentLabelProps) {
  const label = getAgentLabel(agentId)
  return <span className={className}>{label}</span>
}
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-label.tsx
git add src/features/agent-route-bindings/components/agent-label.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): AgentLabel component (UUID → friendly name)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: AgentRouteBindingsTable component

**Files:**
- Create: `src/features/agent-route-bindings/components/agent-route-bindings-table.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/agent-route-bindings-table.tsx`):
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AgentLabel } from './agent-label'
import type { AgentRouteBinding } from '../types'

interface AgentRouteBindingsTableProps {
  rows: AgentRouteBinding[]
  onRowClick: (row: AgentRouteBinding) => void
}

export function AgentRouteBindingsTable({ rows, onRowClick }: AgentRouteBindingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Bu filtreyle eşleşen binding yok.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Kanal</TableHead>
            <TableHead>Peer Türü</TableHead>
            <TableHead>Peer ID</TableHead>
            <TableHead>Roller</TableHead>
            <TableHead className="text-right">Öncelik</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                <AgentLabel agentId={row.agentId} />
              </TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.channel}</code>
              </TableCell>
              <TableCell className="capitalize">{row.peerKind}</TableCell>
              <TableCell>
                {row.peerId === null ? (
                  <span className="text-xs text-muted-foreground">ANY</span>
                ) : (
                  <code className="text-xs">{row.peerId}</code>
                )}
              </TableCell>
              <TableCell>
                {row.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Hepsi</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {row.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.priority}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-route-bindings-table.tsx
git add src/features/agent-route-bindings/components/agent-route-bindings-table.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): list table with row click + ANY/Hepsi badges

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: AgentRouteBindingsFilters component

**Files:**
- Create: `src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx`):
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import {
  AGENT_OPTIONS,
  KNOWN_CHANNELS,
  PEER_KIND_OPTIONS,
  type AgentRouteBindingsFilters as Filters,
  type PeerKind,
} from '../types'

const ALL = '__all__'

interface AgentRouteBindingsFiltersProps {
  value: Filters
  onChange: (next: Partial<Filters>) => void
  onClear: () => void
}

export function AgentRouteBindingsFilters({ value, onChange, onClear }: AgentRouteBindingsFiltersProps) {
  const hasFilter = value.agentId !== null || value.channel !== null || value.peerKind !== null

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-agent" className="text-xs text-muted-foreground">Agent</Label>
        <Select
          value={value.agentId ?? ALL}
          onValueChange={(v) => onChange({ agentId: v === ALL ? null : v })}
        >
          <SelectTrigger id="filter-agent" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {AGENT_OPTIONS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-channel" className="text-xs text-muted-foreground">Kanal</Label>
        <Select
          value={value.channel ?? ALL}
          onValueChange={(v) => onChange({ channel: v === ALL ? null : v })}
        >
          <SelectTrigger id="filter-channel" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {KNOWN_CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-peer-kind" className="text-xs text-muted-foreground">Peer Türü</Label>
        <Select
          value={value.peerKind ?? ALL}
          onValueChange={(v) =>
            onChange({ peerKind: v === ALL ? null : (v as PeerKind) })
          }
        >
          <SelectTrigger id="filter-peer-kind" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {PEER_KIND_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
          <X className="mr-1 h-3.5 w-3.5" /> Temizle
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx
git add src/features/agent-route-bindings/components/agent-route-bindings-filters.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): filter bar (agent/channel/peerKind) with clear

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Page update — wire filters + table + error states

**Files:**
- Modify: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`

- [ ] **Step 1: Rewrite page file**

Replace the entire content of `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`:

```tsx
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'
import { AgentRouteBindingsFilters } from '../components/agent-route-bindings-filters'
import { AgentRouteBindingsTable } from '../components/agent-route-bindings-table'
import type { AgentRouteBinding, AgentRouteBindingsFilters as Filters, PeerKind } from '../types'

const URL_STATE_OPTS = {
  defaults: { agentId: null, channel: null, peerKind: null } as Filters,
  parse: (params: URLSearchParams): Filters => {
    const pk = params.get('peerKind')
    return {
      agentId: params.get('agentId'),
      channel: params.get('channel'),
      peerKind: pk === 'customer' || pk === 'user' ? (pk as PeerKind) : null,
    }
  },
  serialize: (v: Filters) => ({
    agentId: v.agentId ?? undefined,
    channel: v.channel ?? undefined,
    peerKind: v.peerKind ?? undefined,
  }),
}

export function AgentRouteBindingsPage() {
  const [filters, setFilters] = useUrlFilterState<Filters>(URL_STATE_OPTS)
  const [_selected, setSelected] = useState<AgentRouteBinding | null>(null)
  const { data, isLoading, isError, error, refetch } = useAgentRouteBindings(filters)

  function handleClearFilters() {
    setFilters({ agentId: null, channel: null, peerKind: null })
  }

  function handleRowClick(row: AgentRouteBinding) {
    setSelected(row)
    // Dialog open will be wired in PR 3
  }

  if (isError) {
    const status =
      (error as { response?: { status?: number } } | undefined)?.response?.status ?? 0
    const isForbidden = status === 403
    const isZodParseError = (error as { name?: string } | undefined)?.name === 'ZodError'

    return (
      <div>
        <h1 className="mb-2 text-xl font-bold">Agent Routing</h1>
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm">
          {isForbidden ? (
            <p className="text-destructive">
              Bu sayfayı görmek için platform admin yetkisi gerekli.
            </p>
          ) : isZodParseError ? (
            <p className="text-destructive">
              Veri formatı beklenmedik — backend response Zod parse'tan geçmedi. Devops uyarıldı mı?
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-destructive">
                Binding'ler yüklenemedi. {status > 0 && `(HTTP ${status})`}
              </p>
              <button
                onClick={() => refetch()}
                className="text-xs underline hover:text-foreground"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Agent Routing</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} binding · agent + channel + peer eşlemesi
          </p>
        </div>
      </div>

      <div className="mb-4">
        <AgentRouteBindingsFilters
          value={filters}
          onChange={(next) => setFilters(next)}
          onClear={handleClearFilters}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AgentRouteBindingsTable rows={items} onRowClick={handleRowClick} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint**

Run:
```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
```

Expected: clean. (One unused `_selected` is intentional; it'll wire up in PR 3 — using underscore prefix to bypass lint.)

If `_selected` triggers `no-unused-vars`, suppress it temporarily with `// eslint-disable-next-line @typescript-eslint/no-unused-vars`.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): wire filters + table + error states (403/Zod/generic)

URL-persisted filters via useUrlFilterState.
Row click handler stub; dialog wiring in PR 3.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: PR 2 build + smoke + push

- [ ] **Step 1: Full build**

Run:
```bash
npm run build
```

Expected: 0 errors. Bundle delta should be ~10-15 kB raw on the agent-route-bindings lazy chunk.

- [ ] **Step 2: Manual smoke vs api.edfu.ai**

Start dev:
```bash
npm run dev
```

At `http://localhost:5173/admin/agent-route-bindings`:

1. 3 seed rows visible in the table.
2. Click Agent filter → select "Conversation" → table shrinks to 2 rows.
3. URL changes to `?agentId=00000000-0000-4000-8000-000000000001`.
4. Reload page → filter persists, 2 rows still shown.
5. Click "Temizle" → URL params cleared, 3 rows.
6. Filter by Kanal = whatsapp → 1 row.
7. Filter by Peer Türü = user → 1 row (dashboard).
8. Combination: Agent=Conversation + Kanal=telegram → 1 row.
9. Click a row → no visible action (selected state set silently, no dialog yet).

If 403 error card appears: re-login with correct creds. If Zod parse error: capture response shape from network tab + open backend issue.

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## PR 3 — Create dialog

**ÖN-KOŞUL:** Spec §5.2.1 backend error envelope curl smoke. PR 3'ün ilk task'ı bu.

### Task 16: Backend error envelope smoke (curl, manual)

**Files:**
- Modify: `docs/superpowers/specs/2026-05-18-agent-route-bindings-design.md` (append findings note under §5.2.1)

- [ ] **Step 1: Login + create sandbox row**

Run:
```bash
TOKEN=$(curl -s -X POST https://api.edfu.ai/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"REPLACE_WITH_EMAIL","password":"REPLACE_WITH_PASSWORD"}' | jq -r .accessToken)
echo "Token captured: ${#TOKEN} chars"

CHANNEL="test-envelope-$(date +%s)"
ID=$(curl -s -X POST https://api.edfu.ai/platform/admin/agent-route-bindings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"agentId\":\"00000000-0000-4000-8000-000000000002\",\"channel\":\"$CHANNEL\",\"peerKind\":\"user\",\"priority\":0}" \
  | jq -r .id)
echo "Sandbox row id: $ID"
```

Expected: token captured (>100 chars), id captured (UUID).

- [ ] **Step 2: Trigger 409 binding_duplicate**

```bash
curl -s -X POST https://api.edfu.ai/platform/admin/agent-route-bindings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"agentId\":\"00000000-0000-4000-8000-000000000002\",\"channel\":\"$CHANNEL\",\"peerKind\":\"user\",\"priority\":0}" \
  | jq .
```

Expected: 409 response body. **Capture the JSON shape.** Look for: is the discriminator `code: 'binding_duplicate'` (a top-level field), or is it embedded in `message`? Is there a `conflict: { natkey }` payload?

- [ ] **Step 3: Trigger 409 binding_version_conflict**

```bash
curl -s -X PATCH https://api.edfu.ai/platform/admin/agent-route-bindings/$ID \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"expectedVersionSeq":999,"priority":1}' \
  | jq .
```

Expected: 409 response body. **Capture shape.**

- [ ] **Step 4: Cleanup**

```bash
curl -s -X DELETE https://api.edfu.ai/platform/admin/agent-route-bindings/$ID \
  -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}\n"
```

Expected: `204`.

- [ ] **Step 5: Document findings**

Append a fenced code block under §5.2.1 of the spec with the captured JSON shapes (both 409s). Use this template:

```markdown
### 5.2.1.1 Smoke Bulgu (2026-05-18)

**binding_duplicate (409 POST aynı natkey):**
\`\`\`json
{ ... PASTE SHAPE ... }
\`\`\`

**binding_version_conflict (409 PATCH yanlış expectedVersionSeq):**
\`\`\`json
{ ... PASTE SHAPE ... }
\`\`\`

**Discriminator:** `body.code` (TOP-LEVEL) | `body.message` (string match) | `body.error` — yazılan tek-path parser'ın hangi field'a baktığı:
```

- [ ] **Step 6: Commit findings**

```bash
git add docs/superpowers/specs/2026-05-18-agent-route-bindings-design.md
git commit -m "$(cat <<'EOF'
docs(spec): backend error envelope smoke findings for §5.2.1

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: parse-error.ts (single-path, smoke-informed)

**Files:**
- Create: `src/features/agent-route-bindings/lib/parse-error.ts`

- [ ] **Step 1: Write file using EITHER Variant A OR Variant B based on Task 16 findings**

**Variant A — backend returns `body.code` at top level** (write this if smoke shows `code` field):

Code:
```typescript
import axios from 'axios'

export type RouteBindingErrorCode =
  | 'binding_version_conflict'
  | 'binding_duplicate'
  | 'binding_not_found'
  | 'invalid_agent_id'
  | 'platform_admin_required'
  | 'unknown'

const KNOWN_CODES = new Set<string>([
  'binding_version_conflict',
  'binding_duplicate',
  'binding_not_found',
  'invalid_agent_id',
  'platform_admin_required',
])

export interface ParsedError {
  status: number
  code: RouteBindingErrorCode
  message: string
  conflict?: { natkey: string }
}

export function parseRouteBindingError(error: unknown): ParsedError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { status: 0, code: 'unknown', message: 'Ağ hatası' }
  }
  const status = error.response.status
  const body = error.response.data as Record<string, unknown> | undefined
  const rawCode = typeof body?.code === 'string' ? body.code : 'unknown'
  const code: RouteBindingErrorCode = KNOWN_CODES.has(rawCode)
    ? (rawCode as RouteBindingErrorCode)
    : 'unknown'
  const message = (body?.message as string) ?? `HTTP ${status}`
  const conflict = body?.conflict as { natkey: string } | undefined
  return { status, code, message, conflict }
}
```

**Variant B — backend returns code embedded in `body.message` string** (write this if smoke shows code is `message`):

Code:
```typescript
import axios from 'axios'

export type RouteBindingErrorCode =
  | 'binding_version_conflict'
  | 'binding_duplicate'
  | 'binding_not_found'
  | 'invalid_agent_id'
  | 'platform_admin_required'
  | 'unknown'

const KNOWN_CODES: RouteBindingErrorCode[] = [
  'binding_version_conflict',
  'binding_duplicate',
  'binding_not_found',
  'invalid_agent_id',
  'platform_admin_required',
]

export interface ParsedError {
  status: number
  code: RouteBindingErrorCode
  message: string
  conflict?: { natkey: string }
}

export function parseRouteBindingError(error: unknown): ParsedError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { status: 0, code: 'unknown', message: 'Ağ hatası' }
  }
  const status = error.response.status
  const body = error.response.data as Record<string, unknown> | undefined
  const msg = typeof body?.message === 'string' ? body.message : ''
  const matched = KNOWN_CODES.find((c) => msg.includes(c))
  const code: RouteBindingErrorCode = matched ?? 'unknown'
  const conflict = body?.conflict as { natkey: string } | undefined
  return { status, code, message: msg || `HTTP ${status}`, conflict }
}
```

Pick the variant matching Task 16 findings. Delete the other.

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/lib/parse-error.ts
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/lib/parse-error.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): parse-error helper (single-path per smoke)

Variant chosen based on §5.2.1 smoke findings (Task 16).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: form-schema.ts (Zod schema for create/edit form)

**Files:**
- Create: `src/features/agent-route-bindings/lib/form-schema.ts`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/lib/form-schema.ts`):
```typescript
import { z } from 'zod'
import { AGENT_IDS, CHANNEL_REGEX, ROLE_REGEX } from '../types'

export const routeBindingFormSchema = z.object({
  agentId: z.enum(AGENT_IDS, { message: 'Agent seçimi zorunlu' }),
  channel: z
    .string()
    .regex(CHANNEL_REGEX, 'Lowercase a-z ile başlamalı; sadece a-z, 0-9, _, - (max 50 karakter)'),
  peerKind: z.enum(['customer', 'user']),
  peerId: z.string().max(500, 'En fazla 500 karakter').nullable(),
  roles: z
    .array(z.string().regex(ROLE_REGEX, 'Sadece A-Z, a-z, 0-9, _, -'))
    .max(10, 'En fazla 10 rol'),
  priority: z
    .number()
    .int('Tam sayı olmalı')
    .min(0, 'En az 0')
    .max(1000, 'En fazla 1000'),
  notes: z.string().max(1000, 'En fazla 1000 karakter').nullable(),
})

export type RouteBindingFormValues = z.infer<typeof routeBindingFormSchema>
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/lib/form-schema.ts
git add src/features/agent-route-bindings/lib/form-schema.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): RHF + Zod form schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: RolesChipInput primitive

**Files:**
- Create: `src/features/agent-route-bindings/components/roles-chip-input.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/roles-chip-input.tsx`):
```tsx
import { useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_REGEX } from '../types'

interface RolesChipInputProps {
  value: string[]
  onChange: (next: string[]) => void
  maxChips?: number
  placeholder?: string
  disabled?: boolean
}

export function RolesChipInput({
  value,
  onChange,
  maxChips = 10,
  placeholder = 'Rol ekle ve Enter…',
  disabled,
}: RolesChipInputProps) {
  const [draft, setDraft] = useState('')

  function tryAdd(raw: string): boolean {
    const candidate = raw.trim()
    if (candidate === '') return false
    if (!ROLE_REGEX.test(candidate)) {
      toast.error(`Geçersiz rol "${candidate}" — sadece A-Z, a-z, 0-9, _, - (1-50 karakter)`)
      return false
    }
    if (value.includes(candidate)) {
      toast.error(`"${candidate}" zaten ekli`)
      return false
    }
    if (value.length >= maxChips) {
      toast.error(`En fazla ${maxChips} rol`)
      return false
    }
    onChange([...value, candidate])
    return true
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (tryAdd(draft)) setDraft('')
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (!text.includes(',')) return
    e.preventDefault()
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
    let added = 0
    let skipped = 0
    for (const part of parts) {
      if (value.length + added >= maxChips) {
        skipped++
        continue
      }
      if (!ROLE_REGEX.test(part) || value.includes(part)) {
        skipped++
        continue
      }
      added++
      value = [...value, part]  // local mutation; final onChange below
    }
    if (added > 0) onChange(value)
    if (skipped > 0) {
      toast.message(`${added} rol eklendi, ${skipped} atlandı`)
    }
  }

  function removeChip(role: string) {
    onChange(value.filter((r) => r !== role))
  }

  const reachedMax = value.length >= maxChips

  return (
    <div className="flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5">
      {value.map((role) => (
        <Badge key={role} variant="secondary" className="gap-1 pl-2 pr-1">
          <span>{role}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(role)}
              aria-label={`Rolü kaldır: ${role}`}
              className="rounded hover:bg-background/50"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!reachedMax && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="h-6 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/roles-chip-input.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/components/roles-chip-input.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): RolesChipInput primitive

Enter/comma adds; Backspace removes when empty; paste parses comma-list.
Validates against ROLE_REGEX + max 10 + dedup.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 20: Add create mutation hook

**Files:**
- Modify: `src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts`

- [ ] **Step 1: Append to existing file**

Add imports at top (after existing imports):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { agentRouteBindingSchema } from '../lib/inbound-schema'
import type {
  AgentRouteBinding,
  CreateAgentRouteBindingRequest,
} from '../types'
```

Add at the end of file:

```typescript
export function useCreateAgentRouteBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAgentRouteBindingRequest): Promise<AgentRouteBinding> => {
      const { data } = await apiClient.post('/platform/admin/agent-route-bindings', body)
      return agentRouteBindingSchema.parse(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    },
  })
}
```

Make sure `useQuery` is still imported on the existing line; merge imports if needed.

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): useCreateAgentRouteBinding mutation

Inbound Zod parse on response so newly-created row is shape-validated too.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: AgentRouteBindingDialog component (create-only mode in PR 3)

**Files:**
- Create: `src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx`):
```tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateAgentRouteBinding } from '../hooks/use-agent-route-bindings'
import { parseRouteBindingError } from '../lib/parse-error'
import {
  routeBindingFormSchema,
  type RouteBindingFormValues,
} from '../lib/form-schema'
import {
  AGENT_IDS,
  AGENT_OPTIONS,
  KNOWN_CHANNELS,
  PEER_KIND_OPTIONS,
  isKnownChannel,
  normalizePeerId,
  type AgentRouteBinding,
  type KnownChannel,
} from '../types'
import { RolesChipInput } from './roles-chip-input'

interface AgentRouteBindingDialogProps {
  binding: AgentRouteBinding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function makeDefaults(binding: AgentRouteBinding | null): RouteBindingFormValues {
  if (binding) {
    return {
      agentId: binding.agentId as RouteBindingFormValues['agentId'],
      channel: binding.channel,
      peerKind: binding.peerKind,
      peerId: binding.peerId,
      roles: binding.roles,
      priority: binding.priority,
      notes: binding.notes,
    }
  }
  return {
    agentId: AGENT_IDS[0],
    channel: '',
    peerKind: 'customer',
    peerId: '',
    roles: [],
    priority: 0,
    notes: '',
  }
}

export function AgentRouteBindingDialog({
  binding,
  open,
  onOpenChange,
}: AgentRouteBindingDialogProps) {
  const isEdit = binding !== null
  const createMutation = useCreateAgentRouteBinding()

  const form = useForm<RouteBindingFormValues>({
    resolver: zodResolver(routeBindingFormSchema),
    defaultValues: makeDefaults(binding),
  })

  const [channelMode, setChannelMode] = useState<'known' | 'custom'>(
    binding && !isKnownChannel(binding.channel) ? 'custom' : 'known'
  )

  useEffect(() => {
    if (open) {
      form.reset(makeDefaults(binding))
      setChannelMode(binding && !isKnownChannel(binding.channel) ? 'custom' : 'known')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, open])

  function onSubmit(values: RouteBindingFormValues) {
    const peerIdNorm = normalizePeerId(values.peerId ?? '')
    const notesNorm =
      (values.notes ?? '').trim() === '' ? null : (values.notes ?? '').trim()

    if (isEdit) {
      // Edit handler wired in PR 4. Should not be reached in PR 3.
      toast.error('Edit henüz aktif değil (PR 4)')
      return
    }

    createMutation.mutate(
      {
        agentId: values.agentId,
        channel: values.channel,
        peerKind: values.peerKind,
        peerId: peerIdNorm,
        roles: values.roles,
        priority: values.priority,
        notes: notesNorm,
      },
      {
        onSuccess: () => {
          toast.success('Binding oluşturuldu')
          onOpenChange(false)
        },
        onError: (err) => {
          const parsed = parseRouteBindingError(err)
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
          toast.error('Oluşturma başarısız')
        },
      }
    )
  }

  const isPending = createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Binding Düzenle' : 'Yeni Binding'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Agent */}
          <div>
            <Label htmlFor="agentId">Agent *</Label>
            <Select
              value={form.watch('agentId')}
              onValueChange={(v) =>
                form.setValue('agentId', v as RouteBindingFormValues['agentId'], { shouldValidate: true })
              }
            >
              <SelectTrigger id="agentId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_OPTIONS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.agentId && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.agentId.message}
              </p>
            )}
          </div>

          {/* Channel mode + value */}
          <div>
            <div className="mb-2 flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={channelMode === 'known'}
                  onChange={() => setChannelMode('known')}
                />
                Bilinen
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={channelMode === 'custom'}
                  onChange={() => setChannelMode('custom')}
                />
                Diğer
              </label>
            </div>
            <Label htmlFor="channel">Kanal *</Label>
            {channelMode === 'known' ? (
              <Select
                value={isKnownChannel(form.watch('channel')) ? form.watch('channel') : ''}
                onValueChange={(v) =>
                  form.setValue('channel', v as KnownChannel, { shouldValidate: true })
                }
              >
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue placeholder="Kanal seçin" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="channel"
                {...form.register('channel')}
                placeholder="örn: instagram-bot"
                maxLength={50}
              />
            )}
            {form.formState.errors.channel && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.channel.message}
              </p>
            )}
          </div>

          {/* Peer Kind + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="peerKind">Peer Türü *</Label>
              <Select
                value={form.watch('peerKind')}
                onValueChange={(v) =>
                  form.setValue('peerKind', v as RouteBindingFormValues['peerKind'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="peerKind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PEER_KIND_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Öncelik (0-1000)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={1000}
                {...form.register('priority', { valueAsNumber: true })}
              />
              {form.formState.errors.priority && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Peer ID */}
          <div>
            <Label htmlFor="peerId">Peer ID</Label>
            <Input
              id="peerId"
              value={form.watch('peerId') ?? ''}
              onChange={(e) => form.setValue('peerId', e.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Boş bırakılırsa tüm peer'lara uygulanır (wildcard).
            </p>
          </div>

          {/* Roles */}
          <div>
            <Label>Roller</Label>
            <RolesChipInput
              value={form.watch('roles')}
              onChange={(next) => form.setValue('roles', next, { shouldValidate: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Boş bırakılırsa her rol geçer. Max 10.
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notlar (opsiyonel)</Label>
            <textarea
              id="notes"
              className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={form.watch('notes') ?? ''}
              onChange={(e) => form.setValue('notes', e.target.value)}
              maxLength={1000}
              placeholder="Operator memo (max 1000 karakter)"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit
```

Expected: 0 errors. The `Form` primitive from shadcn isn't used directly — we wire RHF with `register`/`setValue`/`watch` against shadcn primitives.

- [ ] **Step 3: Lint**

Run:
```bash
npx eslint src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): create dialog with RHF + Zod + channel mode toggle

Local channelMode UI state (known/custom) drives input flavor;
single channel: string schema field, no submit-side branching.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: Page — wire "+ Yeni" CTA + dialog state

**Files:**
- Modify: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`

- [ ] **Step 1: Edit page**

Replace the imports block and the JSX:

```tsx
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'
import { AgentRouteBindingsFilters } from '../components/agent-route-bindings-filters'
import { AgentRouteBindingsTable } from '../components/agent-route-bindings-table'
import { AgentRouteBindingDialog } from '../components/agent-route-binding-dialog'
import type { AgentRouteBinding, AgentRouteBindingsFilters as Filters, PeerKind } from '../types'

// URL_STATE_OPTS unchanged from PR 2
```

Replace the page body's header div and add dialog state:

```tsx
export function AgentRouteBindingsPage() {
  const [filters, setFilters] = useUrlFilterState<Filters>(URL_STATE_OPTS)
  const [selected, setSelected] = useState<AgentRouteBinding | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading, isError, error, refetch } = useAgentRouteBindings(filters)

  function handleClearFilters() {
    setFilters({ agentId: null, channel: null, peerKind: null })
  }

  function handleRowClick(row: AgentRouteBinding) {
    setSelected(row)
    setDialogOpen(true)
  }

  function handleCreate() {
    setSelected(null)
    setDialogOpen(true)
  }

  // ... (isError block unchanged from PR 2)

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Agent Routing</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} binding · agent + channel + peer eşlemesi
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Yeni
        </Button>
      </div>

      <div className="mb-4">
        <AgentRouteBindingsFilters
          value={filters}
          onChange={(next) => setFilters(next)}
          onClear={handleClearFilters}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AgentRouteBindingsTable rows={items} onRowClick={handleRowClick} />
      )}

      <AgentRouteBindingDialog
        binding={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
```

Remove the `_selected` underscore-prefix from PR 2 (now used).

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): wire create dialog + Yeni CTA + row click

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 23: PR 3 build + smoke + push

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: 0 errors. agent-route-bindings lazy chunk grows by ~20-25 kB raw.

- [ ] **Step 2: Manual smoke vs api.edfu.ai**

1. Open `/admin/agent-route-bindings`, login if needed.
2. Click "+ Yeni" → dialog opens, defaults: Agent=Conversation, channelMode=Bilinen (Select empty), peerKind=customer, priority=0, roles=[], notes empty.
3. Submit empty → validation errors on channel field (required regex).
4. Fill: Agent=Quote, channelMode=Diğer, channel=`test-rb-1747574400` (real timestamp), peerKind=user, priority=0, roles add `[admin]` (Enter), notes=`smoke create`.
5. Submit → toast "Binding oluşturuldu", dialog closes, row appears in table.
6. Re-click "+ Yeni" → fill same exact natkey (same agent+channel+peerKind+peerId+priority) → 409 binding_duplicate, toast shows natkey, dialog stays open.
7. Add roles via paste: paste `admin, user, manager,bad space here` → toast "3 rol eklendi, 1 atlandı" (4th has space). Verify chips: admin, user, manager.
8. Click chip × on `user` → removed.
9. Backspace on empty input → removes last chip.
10. Cancel → dialog closes, no new row.

If 409 binding_duplicate toast shows `(natkey unknown)` instead of an actual natkey string: parser variant mismatch with smoke findings — revisit Task 17.

- [ ] **Step 3: Sandbox cleanup**

In dev tools console (cleans any `test-rb*` channel rows — uses client-side prefix filter so multiple smoke timestamps are covered):
```javascript
const TOKEN = localStorage.getItem('auth_access_token')
const allRows = (await (await fetch('https://api.edfu.ai/platform/admin/agent-route-bindings', {
  headers: { Authorization: `Bearer ${TOKEN}` }
})).json()).items
const sandbox = allRows.filter(r => r.channel.startsWith('test-rb'))
for (const r of sandbox) {
  await fetch(`https://api.edfu.ai/platform/admin/agent-route-bindings/${r.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
}
console.log(`Deleted ${sandbox.length} sandbox rows`)
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## PR 4 — Edit + 409 version conflict

### Task 24: Add update mutation hook

**Files:**
- Modify: `src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts`

- [ ] **Step 1: Append hook**

Add after `useCreateAgentRouteBinding`:

```typescript
export function useUpdateAgentRouteBinding(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateAgentRouteBindingRequest): Promise<AgentRouteBinding> => {
      const { data } = await apiClient.patch(`/platform/admin/agent-route-bindings/${id}`, body)
      return agentRouteBindingSchema.parse(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    },
  })
}
```

Update the import line at the top to add `UpdateAgentRouteBindingRequest`:

```typescript
import type {
  AgentRouteBinding,
  AgentRouteBindingListResponse,
  AgentRouteBindingsFilters,
  CreateAgentRouteBindingRequest,
  UpdateAgentRouteBindingRequest,
} from '../types'
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git add src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): useUpdateAgentRouteBinding mutation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 25: Dialog — edit mode pre-fill + versionSeq footer

**Files:**
- Modify: `src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx`

- [ ] **Step 1: Import update hook + queryClient**

Add to imports:

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateAgentRouteBinding } from '../hooks/use-agent-route-bindings'
import { queryKeys } from '@/lib/query-keys'
```

- [ ] **Step 2: Wire update mutation + replace isEdit branch**

Inside the component, replace the createMutation reference area:

```typescript
  const isEdit = binding !== null
  const createMutation = useCreateAgentRouteBinding()
  const updateMutation = useUpdateAgentRouteBinding(binding?.id ?? '')
  const queryClient = useQueryClient()
```

Replace the `if (isEdit) { toast.error(...) }` branch in `onSubmit`:

```typescript
    if (isEdit) {
      updateMutation.mutate(
        {
          expectedVersionSeq: binding!.versionSeq,
          agentId: values.agentId,
          channel: values.channel,
          peerKind: values.peerKind,
          peerId: peerIdNorm,
          roles: values.roles,
          priority: values.priority,
          notes: notesNorm,
        },
        {
          onSuccess: () => {
            toast.success('Binding güncellendi')
            onOpenChange(false)
          },
          onError: (err) => handleMutationError(err, { isEdit: true }),
        }
      )
      return
    }
```

- [ ] **Step 3: Add `handleMutationError` helper inside component**

Place this function inside the component, before `onSubmit`:

```typescript
  function handleMutationError(err: unknown, ctx: { isEdit: boolean }) {
    const parsed = parseRouteBindingError(err)

    if (parsed.status === 409 && parsed.code === 'binding_version_conflict' && ctx.isEdit) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.agentRouteBindings.all,
      })
      toast.warning(
        'Bu kayıt başkası tarafından değiştirildi. Form yenilendi — değişikliklerini gözden geçirip tekrar kaydet.'
      )
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.agentRouteBindings.all,
      })
      onOpenChange(false)
      return
    }

    toast.error(ctx.isEdit ? 'Güncelleme başarısız' : 'Oluşturma başarısız')
  }
```

Update the `createMutation.mutate` onError callback to also use this helper:

```typescript
        onError: (err) => handleMutationError(err, { isEdit: false }),
```

(Replace the entire previous inline onError block.)

- [ ] **Step 4: Add versionSeq footer (edit mode only)**

In the JSX, just before the action buttons row (`<div className="flex justify-end gap-2 border-t pt-3">`), add:

```tsx
          {isEdit && binding && (
            <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
              versionSeq: <code className="text-foreground">{binding.versionSeq}</code> ·
              Son güncelleme: <code className="text-foreground">{binding.updatedAt}</code>
            </div>
          )}
```

- [ ] **Step 5: Update isPending**

```typescript
  const isPending = createMutation.isPending || updateMutation.isPending
```

- [ ] **Step 6: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/features/agent-route-bindings/components/agent-route-binding-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): dialog edit mode + 409 conflict handler

versionSeq + updatedAt footer in edit mode. handleMutationError centralizes
409/404/400 error UX; binding_version_conflict triggers list invalidate.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 26: Page — parent state contract (fresh-row sync useEffect)

**Files:**
- Modify: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`

- [ ] **Step 1: Add useEffect for fresh-row sync**

Add to the imports:

```typescript
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
```

(Replace existing `useState` import line.)

After the existing `useAgentRouteBindings` call, add:

```typescript
  // Parent state contract (spec §7.4): when list refetches after a mutation,
  // re-pick `selected` from the fresh list. Handles 409 version conflict refresh
  // and concurrent DELETE edge case.
  useEffect(() => {
    if (!selected) return
    const fresh = data?.items.find((b) => b.id === selected.id)
    if (fresh && fresh.versionSeq !== selected.versionSeq) {
      setSelected(fresh)
    } else if (!fresh && dialogOpen) {
      setSelected(null)
      setDialogOpen(false)
      toast.error('Bu binding silinmiş. Liste yenilendi.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selected?.id])
```

- [ ] **Step 2: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): parent state contract for 409 conflict + DELETE edge

useEffect re-picks `selected` from fresh listData when versionSeq changes;
clears selected + closes dialog when row disappears.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 27: PR 4 build + smoke + push

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: 0 errors. Lazy chunk grows by ~5-8 kB raw.

- [ ] **Step 2: Manual smoke — happy path edit**

1. `/admin/agent-route-bindings`, click "+ Yeni", create sandbox row: agent=Quote, channelMode=Diğer, channel=`test-rb-edit-<unix>`, peerKind=user, priority=5, roles=[]. → 201.
2. Click the new row → dialog opens in edit mode. Footer shows `versionSeq: 1`.
3. Change priority to 10 → Güncelle. → toast "Binding güncellendi", dialog closes, row priority=10.
4. Click row again → footer shows `versionSeq: 2`.

- [ ] **Step 3: Smoke — 409 binding_version_conflict (spec §11 step 8)**

1. With dialog open in edit mode (versionSeq=2 from above), in browser console:

```javascript
const TOKEN = localStorage.getItem('auth_access_token')
const ID = '<sandbox-row-id>'  // copy from URL or table data attribute
await fetch(`https://api.edfu.ai/platform/admin/agent-route-bindings/${ID}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ expectedVersionSeq: 2, priority: 99 })
})  // → 200, versionSeq=3
```

2. In the dialog (still open with versionSeq=2 snapshot), change priority to 50 → Güncelle.
3. Expected: toast.warning "Bu kayıt başkası tarafından değiştirildi...", dialog stays open, after ~1s the form values refresh: priority=99 (the concurrent background value), footer versionSeq=3.
4. Re-edit priority to 51 → Güncelle → 200, versionSeq=4.

If the form does not refresh (still shows priority=50 + versionSeq=2): the parent state useEffect isn't firing. Debug by adding `console.log` to the useEffect.

- [ ] **Step 4: Smoke — concurrent DELETE edge case**

1. Open the same row's edit dialog (versionSeq=N).
2. Console:
```javascript
await fetch(`https://api.edfu.ai/platform/admin/agent-route-bindings/${ID}`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${TOKEN}` }
})  // → 204
```
3. Trigger a refetch from the UI by changing the filter and back (or by submitting the dialog, which will 404).
4. Expected: dialog closes, toast "Bu binding silinmiş. Liste yenilendi." Row gone from table.

- [ ] **Step 5: Cleanup sandbox rows**

Use the Task 23 cleanup snippet adapted to the channel substring used (`test-rb-edit-`).

- [ ] **Step 6: Push**

```bash
git push origin main
```

---

## PR 5 — Delete confirm

### Task 28: Add delete mutation hook

**Files:**
- Modify: `src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts`

- [ ] **Step 1: Append hook**

Add at the end of file:

```typescript
export function useDeleteAgentRouteBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/platform/admin/agent-route-bindings/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    },
  })
}
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git add src/features/agent-route-bindings/hooks/use-agent-route-bindings.ts
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): useDeleteAgentRouteBinding mutation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 29: AgentRouteBindingDeleteDialog component

**Files:**
- Create: `src/features/agent-route-bindings/components/agent-route-binding-delete-dialog.tsx`

- [ ] **Step 1: Write file**

Code (`src/features/agent-route-bindings/components/agent-route-binding-delete-dialog.tsx`):
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useDeleteAgentRouteBinding } from '../hooks/use-agent-route-bindings'
import { parseRouteBindingError } from '../lib/parse-error'
import { getAgentLabel, type AgentRouteBinding } from '../types'

interface AgentRouteBindingDeleteDialogProps {
  binding: AgentRouteBinding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentRouteBindingDeleteDialog({
  binding,
  open,
  onOpenChange,
}: AgentRouteBindingDeleteDialogProps) {
  const deleteMutation = useDeleteAgentRouteBinding()

  function handleConfirm() {
    if (!binding) return
    deleteMutation.mutate(binding.id, {
      onSuccess: () => {
        toast.success('Binding silindi')
        onOpenChange(false)
      },
      onError: (err) => {
        const parsed = parseRouteBindingError(err)
        if (parsed.status === 404) {
          toast.message('Bu binding zaten silinmiş.')
          onOpenChange(false)
          return
        }
        toast.error('Silme başarısız')
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Binding'i Sil</AlertDialogTitle>
          <AlertDialogDescription>
            {binding && (
              <span className="block space-y-1 text-sm">
                <span className="block">
                  Agent: <strong>{getAgentLabel(binding.agentId)}</strong>
                </span>
                <span className="block">
                  Kanal: <code className="rounded bg-muted px-1 text-xs">{binding.channel}</code>
                </span>
                <span className="block capitalize">Peer Türü: {binding.peerKind}</span>
                <span className="block">
                  Peer ID: {binding.peerId === null ? <em>ANY</em> : <code className="text-xs">{binding.peerId}</code>}
                </span>
              </span>
            )}
            <span className="mt-3 block">
              Bu işlem geri alınamaz. Routing kararları etkilenebilir.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Siliniyor…' : 'Sil'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-route-binding-delete-dialog.tsx
git add src/features/agent-route-bindings/components/agent-route-binding-delete-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): delete confirm AlertDialog with summary

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 30: Table — trash icon + stopPropagation

**Files:**
- Modify: `src/features/agent-route-bindings/components/agent-route-bindings-table.tsx`

- [ ] **Step 1: Update imports**

```tsx
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
```

- [ ] **Step 2: Update props**

```tsx
interface AgentRouteBindingsTableProps {
  rows: AgentRouteBinding[]
  onRowClick: (row: AgentRouteBinding) => void
  onDelete: (row: AgentRouteBinding) => void
}

export function AgentRouteBindingsTable({ rows, onRowClick, onDelete }: AgentRouteBindingsTableProps) {
```

- [ ] **Step 3: Add header column + cell with delete button**

In the `<TableHeader>` row, append a new `<TableHead className="w-12" />` (empty header for the action column).

In each `<TableRow>`, append after the priority cell:

```tsx
              <TableCell className="w-12">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(row)
                  }}
                  aria-label="Bindingi sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
```

- [ ] **Step 4: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/components/agent-route-bindings-table.tsx
git add src/features/agent-route-bindings/components/agent-route-bindings-table.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): table trash button with stopPropagation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 31: Page — wire delete dialog state

**Files:**
- Modify: `src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx`

- [ ] **Step 1: Import + state**

Add to imports:

```typescript
import { AgentRouteBindingDeleteDialog } from '../components/agent-route-binding-delete-dialog'
```

Inside the component (near existing useState calls):

```typescript
  const [deleteTarget, setDeleteTarget] = useState<AgentRouteBinding | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function handleDelete(row: AgentRouteBinding) {
    setDeleteTarget(row)
    setDeleteDialogOpen(true)
  }
```

- [ ] **Step 2: Pass onDelete to the table + mount delete dialog**

In the JSX, update the table render:

```tsx
        <AgentRouteBindingsTable rows={items} onRowClick={handleRowClick} onDelete={handleDelete} />
```

Add the dialog at the same level as the edit dialog:

```tsx
      <AgentRouteBindingDeleteDialog
        binding={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
```

- [ ] **Step 3: Type-check + lint + commit**

```bash
npx tsc --noEmit && npx eslint src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git add src/features/agent-route-bindings/pages/agent-route-bindings-page.tsx
git commit -m "$(cat <<'EOF'
feat(agent-route-bindings): wire delete confirm dialog into page

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 32: PR 5 build + smoke + push

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: 0 errors. Final lazy chunk size ~50-60 kB raw / 15-18 kB gzip.

- [ ] **Step 2: Manual smoke — delete happy path**

1. Create sandbox row (any unique channel).
2. Click trash icon on that row → AlertDialog opens with binding summary.
3. Verify: row info (Agent name, channel code, peerKind, peer ID = ANY or value) renders correctly.
4. Cancel → dialog closes, row still in table.
5. Click trash → Sil → toast "Binding silindi", dialog closes, row gone.

- [ ] **Step 3: Smoke — row click vs delete click independence**

1. Click trash icon: only delete dialog opens (no edit dialog).
2. Click row body: only edit dialog opens (no delete dialog).
3. Verify stopPropagation working.

- [ ] **Step 4: Smoke — 404 already deleted**

1. Create another sandbox row, capture ID.
2. From console: `DELETE` directly.
3. From UI: click trash on the (now stale) row → Sil → toast "Bu binding zaten silinmiş.", dialog closes.
4. List should refresh and the row disappears.

- [ ] **Step 5: Final smoke — full spec §11 smoke checklist (12 steps)**

Run through spec §11 end-to-end. All 12 steps should pass.

- [ ] **Step 6: Cleanup ALL test-rb sandbox rows**

```javascript
const TOKEN = localStorage.getItem('auth_access_token')
const allRows = (await (await fetch('https://api.edfu.ai/platform/admin/agent-route-bindings', {
  headers: { Authorization: `Bearer ${TOKEN}` }
})).json()).items
const sandbox = allRows.filter(r => r.channel.startsWith('test-rb'))
for (const r of sandbox) {
  await fetch(`https://api.edfu.ai/platform/admin/agent-route-bindings/${r.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
}
console.log(`Cleaned ${sandbox.length} sandbox rows`)
```

Verify the list back to exactly 3 seed rows.

- [ ] **Step 7: Push**

```bash
git push origin main
```

---

## Final Verification

After PR 5 pushed:

- [ ] **Check git log**

```bash
git log --oneline -32
```

Expected: ~32 commits from this plan, all atomic, all `Co-Authored-By: Claude Opus 4.7`.

- [ ] **Check build is green**

```bash
npm run build
```

Expected: 0 errors. Note total lazy chunk size for `agent-route-bindings-page-*.js`.

- [ ] **Update memory**

Add a new memory entry summarizing this sprint's outcome:
- File: `/Users/keremkaya/.claude/projects/-Users-keremkaya-Desktop-firma-ai-rag-super-admin/memory/project_sprint9_agent_routing.md`
- Index entry in `MEMORY.md`.

- [ ] **Update project_next_session_todo.md**

Remove "Sprint 9 candidates: Agent Route Bindings" from pending; mark as shipped. Add new pending items if any (e.g., AgentRouteBinding activity log surfacing as Sprint 10 candidate, per spec §15 + reviewer M5).

---

## Acceptance Criteria (Plan-Level)

- [ ] `/admin/agent-route-bindings` accessible only to `isPlatformAdmin=true` users (verified by AuthGuard).
- [ ] List shows seed bindings; filters work + persist via URL.
- [ ] Create dialog: RHF + Zod validation, 409 binding_duplicate surfaces natkey toast.
- [ ] Edit dialog: pre-fills, versionSeq footer visible, 409 binding_version_conflict triggers list invalidate + form reset via parent useEffect.
- [ ] Delete confirm: AlertDialog with summary, 404 handled gracefully.
- [ ] All commits atomic with Co-Authored-By header.
- [ ] `tsc --noEmit` + `npm run build` + `eslint .` all green at every PR boundary.
- [ ] Spec §11 12-step manual smoke passes against api.edfu.ai.
- [ ] No sandbox rows left in production after smoke.
- [ ] Sidebar entry visible under platform separator.
- [ ] Bundle delta documented in PR descriptions.
