# Subscription Status & Billing Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sirket abonelik durumu yonetimi ve fatura olay gecmisi eklemek.

**Architecture:** Mevcut Company tipine subscriptionStatus ekle, plan-tab'a durum yonetimi ve billing events timeline entegre et.

**Tech Stack:** React 19, TypeScript, TanStack Query, MSW 2, shadcn/ui, Tailwind CSS

---

### Task 1: Types, Query Keys, Company Extension

**Files:**
- Modify: `src/features/companies/types.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: SubscriptionStatus type ve ilgili tipleri ekle**

`src/features/companies/types.ts` — Company interface'inden ONCE ekle:

```typescript
export type SubscriptionStatus = 'trialing' | 'active' | 'suspended' | 'cancelled' | 'past_due'
```

Company interface'ine 2 alan ekle (downgradeScheduledAt'tan sonra):
```typescript
subscriptionStatus: SubscriptionStatus
statusChangedAt: string | null
```

Dosyanin sonuna (EmailPreviewResponse'dan sonra, Revenue'dan once) ekle:

```typescript
// ─── Subscription & Billing ───────────────────────

export interface UpdateCompanyStatusRequest {
  status: 'active' | 'suspended' | 'cancelled'
}

export interface UpdateCompanyStatusResponse {
  id: string
  subscriptionStatus: SubscriptionStatus
  statusChangedAt: string
}

export interface BillingEvent {
  id: string
  companyId: string
  eventType: 'status_change' | 'plan_upgrade' | 'plan_downgrade_scheduled' | 'plan_downgrade_executed' | 'plan_removed' | 'plan_downgrade_cancelled' | 'admin_override'
  metadata: Record<string, string>
  actorId: string
  createdAt: string
}
```

- [ ] **Step 2: Query key ekle**

`src/lib/query-keys.ts` — companies objesine ekle:

```typescript
billingEvents: (id: string) => ['companies', id, 'billing-events'] as const,
```

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/types.ts src/lib/query-keys.ts
git commit -m "feat: add subscription status and billing event types"
```

---

### Task 2: Mock Data + MSW Handlers

**Files:**
- Modify: `src/mocks/data.ts`
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: mockCompanies'e subscriptionStatus ve statusChangedAt ekle**

Her company objesine 2 alan ekle. Ornekler:
- Firma Alpha: `subscriptionStatus: 'active', statusChangedAt: '2026-02-15T10:00:00Z'`
- Tech Beta: `subscriptionStatus: 'active', statusChangedAt: '2026-03-10T09:00:00Z'`
- Green Corp: `subscriptionStatus: 'trialing', statusChangedAt: null`
- Data Dynamics: `subscriptionStatus: 'active', statusChangedAt: '2026-01-20T12:00:00Z'`
- CloudNine AI: `subscriptionStatus: 'active', statusChangedAt: '2026-02-01T08:00:00Z'`
- Stellar Systems: `subscriptionStatus: 'suspended', statusChangedAt: '2026-03-25T14:00:00Z'`
- Nexus Labs: `subscriptionStatus: 'active', statusChangedAt: '2026-03-01T10:00:00Z'`
- Apex Digital: `subscriptionStatus: 'cancelled', statusChangedAt: '2026-03-20T16:00:00Z'`

- [ ] **Step 2: mockBillingEvents ekle**

`src/mocks/data.ts` — mockEmailTemplates'tan sonra:

```typescript
// Billing events per company
export const mockBillingEvents: Record<string, any[]> = {}
mockCompanies.forEach((c: any) => {
  const events: any[] = [
    { id: `be-${c.id.slice(0,4)}-1`, companyId: c.id, eventType: 'status_change', metadata: { from: 'trialing', to: 'active', reason: 'plan_assigned' }, actorId: 'system', createdAt: c.statusChangedAt ?? c.createdAt },
  ]
  if (c.planId) {
    events.push({ id: `be-${c.id.slice(0,4)}-2`, companyId: c.id, eventType: 'plan_upgrade', metadata: { planName: c.plan?.name ?? 'Unknown' }, actorId: 'platform-admin', createdAt: c.updatedAt })
  }
  if (c.subscriptionStatus === 'suspended') {
    events.push({ id: `be-${c.id.slice(0,4)}-3`, companyId: c.id, eventType: 'status_change', metadata: { from: 'active', to: 'suspended', reason: 'admin_action' }, actorId: 'platform-admin', createdAt: c.statusChangedAt })
  }
  if (c.subscriptionStatus === 'cancelled') {
    events.push({ id: `be-${c.id.slice(0,4)}-3`, companyId: c.id, eventType: 'status_change', metadata: { from: 'active', to: 'cancelled', reason: 'admin_action' }, actorId: 'platform-admin', createdAt: c.statusChangedAt })
  }
  if (c.pendingPlanId) {
    events.push({ id: `be-${c.id.slice(0,4)}-4`, companyId: c.id, eventType: 'plan_downgrade_scheduled', metadata: { currentPlan: c.plan?.name, newPlan: c.pendingPlan?.name }, actorId: 'platform-admin', createdAt: c.updatedAt })
  }
  mockBillingEvents[c.id] = events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})
```

- [ ] **Step 3: MSW handlers ekle**

`src/mocks/handlers.ts` — import'a `mockBillingEvents` ekle. Handlers dizisine ekle:

```typescript
// ─── Company Status & Billing Events ─────────────
http.patch(`${BASE}/platform/companies/:id/status`, async ({ params, request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const company = mockCompanies.find((c: any) => c.id === params.id)
  if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
  const validStatuses = ['active', 'suspended', 'cancelled']
  if (!validStatuses.includes(body.status)) return HttpResponse.json({ message: 'Invalid status. trialing and past_due are managed automatically.' }, { status: 400 })
  const oldStatus = company.subscriptionStatus
  company.subscriptionStatus = body.status
  company.statusChangedAt = new Date().toISOString()
  // Add billing event
  if (!mockBillingEvents[company.id]) mockBillingEvents[company.id] = []
  mockBillingEvents[company.id].unshift({
    id: 'be-' + Date.now(),
    companyId: company.id,
    eventType: 'status_change',
    metadata: { from: oldStatus, to: body.status, reason: 'admin_action' },
    actorId: 'platform-admin',
    createdAt: company.statusChangedAt,
  })
  return HttpResponse.json({ id: company.id, subscriptionStatus: company.subscriptionStatus, statusChangedAt: company.statusChangedAt })
}),

http.get(`${BASE}/platform/companies/:id/billing-events`, async ({ params, request }) => {
  await delay(200)
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '50')
  const id = params.id as string
  const events = mockBillingEvents[id] ?? []
  return HttpResponse.json(events.slice(0, limit))
}),
```

- [ ] **Step 4: Commit**

```bash
git add src/mocks/data.ts src/mocks/handlers.ts
git commit -m "feat: add subscription status mock data and billing events handlers"
```

---

### Task 3: Hooks

**Files:**
- Create: `src/features/companies/hooks/use-company-billing.ts`

- [ ] **Step 1: Hook dosyasini olustur**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { UpdateCompanyStatusResponse, BillingEvent } from '../types'

export function useUpdateCompanyStatus(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status: 'active' | 'suspended' | 'cancelled'): Promise<UpdateCompanyStatusResponse> => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/status`, { status })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
      qc.invalidateQueries({ queryKey: queryKeys.companies.billingEvents(companyId) })
    },
  })
}

export function useCompanyBillingEvents(companyId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.companies.billingEvents(companyId),
    queryFn: async (): Promise<BillingEvent[]> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/billing-events?limit=${limit}`)
      return data
    },
    enabled: !!companyId,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/companies/hooks/use-company-billing.ts
git commit -m "feat: add company status update and billing events hooks"
```

---

### Task 4: Plan Tab — Subscription Status + Billing Events UI

**Files:**
- Modify: `src/features/companies/components/plan-tab.tsx`

- [ ] **Step 1: Import'lari ekle**

```typescript
import { useUpdateCompanyStatus, useCompanyBillingEvents } from '../hooks/use-company-billing'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // zaten import edilmis olabilir
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
```

- [ ] **Step 2: Hook'lari component icinde cagir**

PlanTab component'inin basina (mevcut hook'lardan sonra):

```typescript
const updateStatus = useUpdateCompanyStatus(companyId)
const { data: billingEvents } = useCompanyBillingEvents(companyId)
const [statusValue, setStatusValue] = useState<string>('')
const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
```

- [ ] **Step 3: Status degistirme handler**

```typescript
function handleStatusChange() {
  if (!statusValue) return
  updateStatus.mutate(statusValue as 'active' | 'suspended' | 'cancelled', {
    onSuccess: () => {
      setStatusConfirmOpen(false)
      setStatusValue('')
      toast.success('Abonelik durumu güncellendi')
    },
    onError: () => toast.error('Durum güncellenemedi'),
  })
}
```

- [ ] **Step 4: Subscription status section'i ekle**

Plan Degistir Card'dan sonra (remove plan dialog'dan once):

```tsx
{/* Subscription Status */}
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Abonelik Durumu</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Mevcut:</span>
      <Badge variant={
        company.subscriptionStatus === 'active' ? 'default' :
        company.subscriptionStatus === 'trialing' ? 'secondary' :
        company.subscriptionStatus === 'suspended' ? 'outline' :
        'destructive'
      } className={
        company.subscriptionStatus === 'suspended' ? 'border-yellow-500 text-yellow-500' :
        company.subscriptionStatus === 'past_due' ? 'border-orange-500 text-orange-500' : ''
      }>
        {company.subscriptionStatus === 'trialing' ? 'Deneme' :
         company.subscriptionStatus === 'active' ? 'Aktif' :
         company.subscriptionStatus === 'suspended' ? 'Askıya Alındı' :
         company.subscriptionStatus === 'cancelled' ? 'İptal Edildi' :
         'Ödeme Gecikmiş'}
      </Badge>
      {company.statusChangedAt && (
        <span className="text-xs text-muted-foreground">({formatDate(company.statusChangedAt)})</span>
      )}
    </div>
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Select value={statusValue} onValueChange={setStatusValue}>
          <SelectTrigger>
            <SelectValue placeholder="Yeni durum seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="suspended">Askıya Al</SelectItem>
            <SelectItem value="cancelled">İptal Et</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        onClick={() => setStatusConfirmOpen(true)}
        disabled={!statusValue || updateStatus.isPending}
      >
        Uygula
      </Button>
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 5: Billing events section'i ekle**

Status Card'dan sonra:

```tsx
{/* Billing Events */}
{billingEvents && billingEvents.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">Olay Geçmişi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Olay</TableHead>
              <TableHead>Detay</TableHead>
              <TableHead>Aktör</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingEvents.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {ev.eventType === 'status_change' ? 'Durum Değişikliği' :
                     ev.eventType === 'plan_upgrade' ? 'Plan Yükseltme' :
                     ev.eventType === 'plan_downgrade_scheduled' ? 'Downgrade Planlandı' :
                     ev.eventType === 'plan_downgrade_executed' ? 'Downgrade Uygulandı' :
                     ev.eventType === 'plan_removed' ? 'Plan Kaldırıldı' :
                     ev.eventType === 'plan_downgrade_cancelled' ? 'Downgrade İptal' :
                     'Admin Müdahale'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </TableCell>
                <TableCell className="text-xs">{ev.actorId}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(ev.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 6: Status confirm dialog ekle**

Mevcut dialog'lardan sonra (dosyanin sonuna, return'un kapanisina yakin):

```tsx
{/* Status confirm dialog */}
<Dialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Abonelik Durumu Değiştir</DialogTitle>
      <DialogDescription>
        {statusValue === 'suspended' && 'Firma askıya alınacak. API erişimi engellenecektir.'}
        {statusValue === 'cancelled' && 'Firma iptal edilecek. API erişimi engellenecektir.'}
        {statusValue === 'active' && 'Firma aktif duruma getirilecek. API erişimi açılacaktır.'}
      </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => setStatusConfirmOpen(false)}>İptal</Button>
      <Button
        variant={statusValue === 'active' ? 'default' : 'destructive'}
        onClick={handleStatusChange}
        disabled={updateStatus.isPending}
      >
        {updateStatus.isPending ? 'Güncelleniyor...' : 'Onayla'}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

- [ ] **Step 7: Build kontrol + Commit**

Run: `npx tsc --noEmit`

```bash
git add src/features/companies/components/plan-tab.tsx
git commit -m "feat: add subscription status management and billing events to plan tab"
```

---

### Task 5: Build Dogrulama

- [ ] **Step 1: tsc + vite build**

```bash
npx tsc --noEmit && npx vite build 2>&1 | tail -5
```

- [ ] **Step 2: Commit log**

```bash
git log --oneline -6
```
