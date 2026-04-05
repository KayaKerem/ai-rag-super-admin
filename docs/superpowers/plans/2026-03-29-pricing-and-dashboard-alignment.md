# Pricing Plans & Dashboard Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pricing plans CRUD, firma plan atama, gelir analitiagi ve dashboard KPI'lari dokumantasyona hizalamak.

**Architecture:** Mevcut React 19 + TanStack Query + MSW yapisi korunuyor. Yeni tipler, mock data, MSW handler'lar, hook'lar, UI bilesenleri ekleniyor. Mevcut Company tipi plan iliskileri ile genisletiliyor, dashboard KPI'lari gelir odakli olarak yeniden tasarlaniyor.

**Tech Stack:** React 19, TypeScript, TanStack Query, TanStack Table, MSW 2, Zod, shadcn/ui, Tailwind CSS, Recharts

---

### Task 1: Types — PricingPlan, Revenue, Company genisletme

**Files:**
- Modify: `src/features/companies/types.ts`
- Modify: `src/lib/utils.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Company tipine plan alanlarini ekle**

`src/features/companies/types.ts` — mevcut `Company` interface'ini genislet:

```typescript
export interface CompanyPlanSummary {
  id: string
  name: string
  slug: string
  monthlyPriceTry: number | null
  includedUsers: number
  isActive: boolean
}

export interface Company {
  id: string
  name: string
  logoUrl: string | null
  planId: string | null
  plan: CompanyPlanSummary | null
  pendingPlanId: string | null
  pendingPlan: CompanyPlanSummary | null
  downgradeScheduledAt: string | null
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: PricingPlan ve request tiplerini ekle**

Ayni dosyanin sonuna:

```typescript
// ─── Pricing Plans ────────────────────────────────

export interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPriceTry: number | null
  includedUsers: number
  extraUserPriceTry: number | null
  budgetUsd: number
  budgetDowngradeThresholdPct: number
  maxStorageGb: number
  maxFileSizeMb: number
  allowedModels: Array<{ id: string; label: string }>
  allowedTools: string[]
  allowedConnectors: string[]
  crawlMaxPages: number
  crawlMaxSources: number
  isActive: boolean
  sortOrder: number
  companyCount: number
  createdAt: string
  updatedAt: string
}

export interface CreatePlanRequest {
  name: string
  slug: string
  description?: string
  monthlyPriceTry?: number | null
  includedUsers?: number
  extraUserPriceTry?: number | null
  budgetUsd?: number
  budgetDowngradeThresholdPct?: number
  maxStorageGb?: number
  maxFileSizeMb?: number
  allowedModels?: Array<{ id: string; label: string }>
  allowedTools?: string[]
  allowedConnectors?: string[]
  crawlMaxPages?: number
  crawlMaxSources?: number
  isActive?: boolean
  sortOrder?: number
}

export interface AssignPlanResponse {
  companyId: string
  planId: string | null
  planName: string | null
  pendingPlanId?: string | null
  pendingPlanName?: string | null
  action: 'upgraded' | 'downgrade_scheduled' | 'no_change' | 'removed'
  effective?: 'immediate' | 'next_cycle'
  effectiveDate?: string
  prorate?: { prorateTry: number | null }
}

export interface DeletePlanResponse {
  deactivated: boolean
  affectedCompanies: number
  warning?: string
}

// ─── Revenue ──────────────────────────────────────

export interface RevenueByPlan {
  planId: string
  planName: string
  planSlug: string
  companyCount: number
  userCount: number
  planMrrTry: number
  extraUserMrrTry: number
  totalMrrTry: number
}

export interface RevenueData {
  mrrTry: number
  mrrUsd: number
  exchangeRate: number
  exchangeRateSource: 'tcmb' | 'fallback'
  totalActiveCompanies: number
  totalCompanies: number
  totalActiveUsers: number
  byPlan: RevenueByPlan[]
  totalAiCostUsd: number
  marginTry: number
}
```

- [ ] **Step 3: formatCurrencyTry utility'si ekle**

`src/lib/utils.ts` — mevcut fonksiyonlarin altina:

```typescript
export function formatCurrencyTry(amount: number): string {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
```

- [ ] **Step 4: Query keys ekle**

`src/lib/query-keys.ts` — `platform` objesine ekle:

```typescript
plans: ['platform', 'plans'] as const,
planDetail: (id: string) => ['platform', 'plans', id] as const,
revenue: ['platform', 'revenue'] as const,
```

`companies` objesine ekle:

```typescript
plan: (id: string) => ['companies', id, 'plan'] as const,
```

- [ ] **Step 5: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30`

Company tipindeki eksik alanlarda hata bekleniyor (mockCompanies guncellenmedi henuz). Bu beklenen bir durum — Task 2'de duzeltilecek.

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/types.ts src/lib/utils.ts src/lib/query-keys.ts
git commit -m "feat: add pricing plan & revenue types, TRY formatter, query keys"
```

---

### Task 2: Mock Data — Plans, Revenue, Company plan alanları

**Files:**
- Modify: `src/mocks/data.ts`

- [ ] **Step 1: mockPricingPlans dizisini ekle**

`src/mocks/data.ts` — dosyanin sonuna (mockPlatformDefaults'tan sonra):

```typescript
// Pricing plans
export const mockPricingPlans = [
  {
    id: 'plan-starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Başlangıç paketi',
    monthlyPriceTry: 599.00,
    includedUsers: 3,
    extraUserPriceTry: 99.00,
    budgetUsd: 10,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 5,
    maxFileSizeMb: 25,
    allowedModels: [{ id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini' }],
    allowedTools: ['search_knowledge_base', 'list_knowledge_categories'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 50,
    crawlMaxSources: 2,
    isActive: true,
    sortOrder: 0,
    companyCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Profesyonel özellikler',
    monthlyPriceTry: 2990.00,
    includedUsers: 5,
    extraUserPriceTry: 49.00,
    budgetUsd: 25,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 20,
    maxFileSizeMb: 50,
    allowedModels: [
      { id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini' },
      { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { id: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
    ],
    allowedTools: ['search_knowledge_base', 'list_knowledge_categories', 'search_drive_documents', 'search_templates', 'retrieve_template'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 100,
    crawlMaxSources: 5,
    isActive: true,
    sortOrder: 1,
    companyCount: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Kurumsal — iletişime geçin',
    monthlyPriceTry: null,
    includedUsers: 50,
    extraUserPriceTry: null,
    budgetUsd: 200,
    budgetDowngradeThresholdPct: 80,
    maxStorageGb: 100,
    maxFileSizeMb: 100,
    allowedModels: [],
    allowedTools: ['*'],
    allowedConnectors: ['website_crawler'],
    crawlMaxPages: 1000,
    crawlMaxSources: 20,
    isActive: true,
    sortOrder: 2,
    companyCount: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
]
```

- [ ] **Step 2: mockRevenue ekle**

```typescript
// Revenue analytics
export const mockRevenue = {
  mrrTry: 15640.00,
  mrrUsd: 481.23,
  exchangeRate: 32.50,
  exchangeRateSource: 'tcmb' as const,
  totalActiveCompanies: 6,
  totalCompanies: mockCompanies.length,
  totalActiveUsers: 52,
  byPlan: [
    { planId: 'plan-pro', planName: 'Pro', planSlug: 'pro', companyCount: 3, userCount: 38, planMrrTry: 8970.00, extraUserMrrTry: 1127.00, totalMrrTry: 10097.00 },
    { planId: 'plan-starter', planName: 'Starter', planSlug: 'starter', companyCount: 4, userCount: 14, planMrrTry: 2396.00, extraUserMrrTry: 1089.00, totalMrrTry: 3485.00 },
    { planId: 'plan-enterprise', planName: 'Enterprise', planSlug: 'enterprise', companyCount: 1, userCount: 12, planMrrTry: 0, extraUserMrrTry: 0, totalMrrTry: 0 },
  ],
  totalAiCostUsd: 134.75,
  marginTry: 11261.56,
}
```

- [ ] **Step 3: mockCompanies'e plan alanlarini ekle**

Mevcut obje literallerinin her satırına plan alanları ekle. Örnek:

```typescript
export const mockCompanies: any[] = [
  { id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', name: 'Firma Alpha', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-20T14:30:00Z' },
  { id: 'c2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', name: 'Tech Beta', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-02-22T09:15:00Z', updatedAt: '2026-03-18T11:20:00Z' },
  { id: 'c3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8', name: 'Green Corp', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-25T16:45:00Z' },
  { id: 'c4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9', name: 'Data Dynamics', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2025-11-10T12:00:00Z', updatedAt: '2026-03-22T09:10:00Z' },
  { id: 'c5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', name: 'CloudNine AI', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: 'plan-starter', pendingPlan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, downgradeScheduledAt: '2026-04-14T00:00:00Z', createdAt: '2025-12-05T15:30:00Z', updatedAt: '2026-03-24T13:00:00Z' },
  { id: 'c6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1', name: 'Stellar Systems', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-01-28T11:00:00Z', updatedAt: '2026-03-19T10:20:00Z' },
  { id: 'c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2', name: 'Nexus Labs', logoUrl: null, planId: 'plan-enterprise', plan: { id: 'plan-enterprise', name: 'Enterprise', slug: 'enterprise', monthlyPriceTry: null, includedUsers: 50, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-02-14T08:45:00Z', updatedAt: '2026-03-23T17:00:00Z' },
  { id: 'c8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3', name: 'Apex Digital', logoUrl: null, planId: null, plan: null, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, createdAt: '2026-03-05T14:00:00Z', updatedAt: '2026-03-25T08:30:00Z' },
]
```

- [ ] **Step 4: getPlatformSummary'ye satisfactionRate ve totalActiveUsers ekle**

`getPlatformSummary` fonksiyonunda her ay icin:

```typescript
// Mevcut return objesine ekle:
satisfactionRate: +(0.78 + Math.random() * 0.12).toFixed(2),
totalActiveUsers: 52,
```

- [ ] **Step 5: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -40`

Type error'lar bekleniyor (company handler'lar henuz guncellenmedi). Commit oncesi sadece data.ts'in syntax'ini dogrula.

- [ ] **Step 6: Commit**

```bash
git add src/mocks/data.ts
git commit -m "feat: add pricing plans & revenue mock data, extend company with plan fields"
```

---

### Task 3: MSW Handlers — Pricing Plan CRUD, Plan Atama, Revenue

**Files:**
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: data.ts import'larini guncelle**

`src/mocks/handlers.ts` — import satırına ekle:

```typescript
import {
  // ... mevcut importlar
  mockPricingPlans,
  mockRevenue,
} from './data'
```

- [ ] **Step 2: Mevcut company handler'larini plan alanlarini dondurecek sekilde guncelle**

`GET /platform/companies` handler'i zaten `mockCompanies` array'ini donduruyor. mockCompanies artik plan alanlarini icerdiginden handler'da degisiklik gerekmez.

`POST /platform/companies` handler'inda `planId` body parametresi destegi ekle:

```typescript
http.post(`${BASE}/platform/companies`, async ({ request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const plan = body.planId ? mockPricingPlans.find((p) => p.id === body.planId) : null
  const newCompany = {
    id: 'c-new-' + Date.now(),
    name: body.name,
    logoUrl: null,
    planId: plan?.id ?? null,
    plan: plan ? { id: plan.id, name: plan.name, slug: plan.slug, monthlyPriceTry: plan.monthlyPriceTry, includedUsers: plan.includedUsers, isActive: plan.isActive } : null,
    pendingPlanId: null,
    pendingPlan: null,
    downgradeScheduledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockCompanies.push(newCompany)
  return HttpResponse.json(newCompany, { status: 201 })
}),
```

- [ ] **Step 3: Plan CRUD handler'lari ekle**

handlers dizisinin sonuna (kapanış `]`'den önce):

```typescript
// ─── Pricing Plans ───────────────────────────────
http.get(`${BASE}/platform/plans`, async ({ request }) => {
  await delay(200)
  const url = new URL(request.url)
  const includeInactive = url.searchParams.get('includeInactive') === 'true'
  const plans = includeInactive ? mockPricingPlans : mockPricingPlans.filter((p) => p.isActive)
  return HttpResponse.json(plans)
}),

http.post(`${BASE}/platform/plans`, async ({ request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const existing = mockPricingPlans.find((p) => p.slug === body.slug)
  if (existing) return HttpResponse.json({ code: 'slug_already_exists' }, { status: 400 })
  const newPlan = {
    id: 'plan-' + Date.now(),
    name: body.name,
    slug: body.slug,
    description: body.description ?? null,
    monthlyPriceTry: body.monthlyPriceTry ?? null,
    includedUsers: body.includedUsers ?? 1,
    extraUserPriceTry: body.extraUserPriceTry ?? null,
    budgetUsd: body.budgetUsd ?? 10,
    budgetDowngradeThresholdPct: body.budgetDowngradeThresholdPct ?? 80,
    maxStorageGb: body.maxStorageGb ?? 5,
    maxFileSizeMb: body.maxFileSizeMb ?? 25,
    allowedModels: body.allowedModels ?? [],
    allowedTools: body.allowedTools ?? [],
    allowedConnectors: body.allowedConnectors ?? [],
    crawlMaxPages: body.crawlMaxPages ?? 50,
    crawlMaxSources: body.crawlMaxSources ?? 2,
    isActive: body.isActive ?? true,
    sortOrder: body.sortOrder ?? mockPricingPlans.length,
    companyCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockPricingPlans.push(newPlan)
  return HttpResponse.json(newPlan, { status: 201 })
}),

http.get(`${BASE}/platform/plans/:id`, async ({ params }) => {
  await delay(150)
  const plan = mockPricingPlans.find((p) => p.id === params.id)
  if (!plan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
  return HttpResponse.json(plan)
}),

http.patch(`${BASE}/platform/plans/:id`, async ({ params, request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const plan = mockPricingPlans.find((p) => p.id === params.id)
  if (!plan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
  if (body.slug !== undefined) return HttpResponse.json({ code: 'slug_is_immutable' }, { status: 422 })
  Object.assign(plan, body, { updatedAt: new Date().toISOString() })
  return HttpResponse.json(plan)
}),

http.delete(`${BASE}/platform/plans/:id`, async ({ params }) => {
  await delay(200)
  const plan = mockPricingPlans.find((p) => p.id === params.id)
  if (!plan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
  plan.isActive = false
  const affected = mockCompanies.filter((c: any) => c.planId === plan.id).length
  return HttpResponse.json({ deactivated: true, affectedCompanies: affected, warning: affected > 0 ? `${affected} companies are still on this plan. They will continue to use its limits until reassigned.` : undefined })
}),

// ─── Company Plan Assignment ─────────────────────
http.put(`${BASE}/platform/companies/:id/plan`, async ({ params, request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const company = mockCompanies.find((c: any) => c.id === params.id)
  if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })

  // Remove plan
  if (body.planId === null) {
    company.planId = null
    company.plan = null
    company.pendingPlanId = null
    company.pendingPlan = null
    company.downgradeScheduledAt = null
    return HttpResponse.json({ companyId: company.id, planId: null, planName: null, action: 'removed' })
  }

  const newPlan = mockPricingPlans.find((p) => p.id === body.planId)
  if (!newPlan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
  if (!newPlan.isActive) return HttpResponse.json({ code: 'plan_is_inactive' }, { status: 400 })

  const currentPrice = company.plan?.monthlyPriceTry ?? 0
  const newPrice = newPlan.monthlyPriceTry ?? Infinity

  if (newPrice > currentPrice) {
    // Upgrade — immediate
    company.planId = newPlan.id
    company.plan = { id: newPlan.id, name: newPlan.name, slug: newPlan.slug, monthlyPriceTry: newPlan.monthlyPriceTry, includedUsers: newPlan.includedUsers, isActive: newPlan.isActive }
    company.pendingPlanId = null
    company.pendingPlan = null
    company.downgradeScheduledAt = null
    return HttpResponse.json({
      companyId: company.id, planId: newPlan.id, planName: newPlan.name,
      action: 'upgraded', effective: 'immediate',
      prorate: { prorateTry: +(((newPrice - currentPrice) / 30) * 15).toFixed(2) },
    })
  } else if (newPrice < currentPrice) {
    // Downgrade — scheduled
    const effectiveDate = new Date()
    effectiveDate.setDate(effectiveDate.getDate() + 30)
    company.pendingPlanId = newPlan.id
    company.pendingPlan = { id: newPlan.id, name: newPlan.name, slug: newPlan.slug, monthlyPriceTry: newPlan.monthlyPriceTry, includedUsers: newPlan.includedUsers, isActive: newPlan.isActive }
    company.downgradeScheduledAt = effectiveDate.toISOString()
    return HttpResponse.json({
      companyId: company.id, planId: company.planId, planName: company.plan?.name,
      pendingPlanId: newPlan.id, pendingPlanName: newPlan.name,
      action: 'downgrade_scheduled', effective: 'next_cycle', effectiveDate: effectiveDate.toISOString(),
    })
  }
  return HttpResponse.json({ companyId: company.id, planId: company.planId, planName: company.plan?.name, action: 'no_change' })
}),

http.delete(`${BASE}/platform/companies/:id/pending-plan`, async ({ params }) => {
  await delay(200)
  const company = mockCompanies.find((c: any) => c.id === params.id)
  if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
  if (!company.pendingPlanId) return HttpResponse.json({ code: 'no_pending_downgrade' }, { status: 400 })
  company.pendingPlanId = null
  company.pendingPlan = null
  company.downgradeScheduledAt = null
  return HttpResponse.json({ companyId: company.id, pendingPlanId: null, action: 'downgrade_cancelled' })
}),

// ─── Revenue ─────────────────────────────────────
http.get(`${BASE}/platform/revenue`, async () => {
  await delay(200)
  return HttpResponse.json(mockRevenue)
}),
```

- [ ] **Step 4: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -40`

- [ ] **Step 5: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "feat: add MSW handlers for pricing plans CRUD, plan assignment, and revenue"
```

---

### Task 4: Hooks — Pricing Plans, Company Plan, Revenue

**Files:**
- Create: `src/features/companies/hooks/use-pricing-plans.ts`
- Create: `src/features/companies/hooks/use-company-plan.ts`
- Create: `src/features/dashboard/hooks/use-revenue.ts`
- Modify: `src/features/companies/hooks/use-companies.ts`
- Modify: `src/features/dashboard/hooks/use-platform-summary.ts`

- [ ] **Step 1: use-pricing-plans.ts olustur**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { PricingPlan, CreatePlanRequest, DeletePlanResponse } from '../types'

export function usePricingPlans(includeInactive = false) {
  return useQuery({
    queryKey: [...queryKeys.platform.plans, includeInactive],
    queryFn: async (): Promise<PricingPlan[]> => {
      const { data } = await apiClient.get(`/platform/plans${includeInactive ? '?includeInactive=true' : ''}`)
      return data
    },
  })
}

export function usePricingPlan(id: string) {
  return useQuery({
    queryKey: queryKeys.platform.planDetail(id),
    queryFn: async (): Promise<PricingPlan> => {
      const { data } = await apiClient.get(`/platform/plans/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreatePlanRequest): Promise<PricingPlan> => {
      const { data } = await apiClient.post('/platform/plans', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
    },
  })
}

export function useUpdatePricingPlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<CreatePlanRequest>): Promise<PricingPlan> => {
      const { data } = await apiClient.patch(`/platform/plans/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
      qc.invalidateQueries({ queryKey: queryKeys.platform.planDetail(id) })
    },
  })
}

export function useDeletePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<DeletePlanResponse> => {
      const { data } = await apiClient.delete(`/platform/plans/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
    },
  })
}
```

- [ ] **Step 2: use-company-plan.ts olustur**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AssignPlanResponse } from '../types'

export function useAssignCompanyPlan(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (planId: string | null): Promise<AssignPlanResponse> => {
      const { data } = await apiClient.put(`/platform/companies/${companyId}/plan`, { planId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
      qc.invalidateQueries({ queryKey: queryKeys.platform.revenue })
    },
  })
}

export function useCancelDowngrade(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/platform/companies/${companyId}/pending-plan`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
```

- [ ] **Step 3: use-revenue.ts olustur**

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { RevenueData } from '@/features/companies/types'

export function useRevenue() {
  return useQuery({
    queryKey: queryKeys.platform.revenue,
    queryFn: async (): Promise<RevenueData> => {
      const { data } = await apiClient.get('/platform/revenue')
      return data
    },
  })
}
```

- [ ] **Step 4: use-companies.ts — createCompany'yi planId destekli yap**

`src/features/companies/hooks/use-companies.ts` — `useCreateCompany` mutation fonksiyonunu degistir:

```typescript
export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; planId?: string }): Promise<Company> => {
      const { data } = await apiClient.post('/platform/companies', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
```

- [ ] **Step 5: use-platform-summary.ts — satisfactionRate, totalActiveUsers ekle**

UsageMonth interface'ine ekle:

```typescript
satisfactionRate?: number
totalActiveUsers?: number
```

- [ ] **Step 6: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -40`

- [ ] **Step 7: Commit**

```bash
git add src/features/companies/hooks/use-pricing-plans.ts src/features/companies/hooks/use-company-plan.ts src/features/dashboard/hooks/use-revenue.ts src/features/companies/hooks/use-companies.ts src/features/dashboard/hooks/use-platform-summary.ts
git commit -m "feat: add pricing plan, company plan assignment, and revenue hooks"
```

---

### Task 5: Dashboard KPI Redesign + Revenue Summary

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`
- Create: `src/features/dashboard/components/revenue-summary.tsx`

- [ ] **Step 1: revenue-summary.tsx olustur**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatCurrencyTry } from '@/lib/utils'
import type { RevenueData } from '@/features/companies/types'

interface RevenueSummaryProps {
  data: RevenueData
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gelir Özeti</CardTitle>
        <p className="text-xs text-muted-foreground">
          1 USD = {data.exchangeRate} TRY ({data.exchangeRateSource === 'tcmb' ? 'TCMB' : 'Fallback'})
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">MRR (TRY)</div>
            <div className="text-lg font-bold">{formatCurrencyTry(data.mrrTry)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">MRR (USD)</div>
            <div className="text-lg font-bold">{formatCurrency(data.mrrUsd)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground">Brüt Kâr (TRY)</div>
            <div className="text-lg font-bold text-green-400">{formatCurrencyTry(data.marginTry)}</div>
          </div>
        </div>

        {data.byPlan.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Firma</TableHead>
                <TableHead className="text-right">Kullanıcı</TableHead>
                <TableHead className="text-right">Baz MRR</TableHead>
                <TableHead className="text-right">Ek Kul. MRR</TableHead>
                <TableHead className="text-right">Toplam MRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byPlan.map((bp) => (
                <TableRow key={bp.planId}>
                  <TableCell className="font-medium">{bp.planName}</TableCell>
                  <TableCell className="text-right">{bp.companyCount}</TableCell>
                  <TableCell className="text-right">{bp.userCount}</TableCell>
                  <TableCell className="text-right">{formatCurrencyTry(bp.planMrrTry)}</TableCell>
                  <TableCell className="text-right">{formatCurrencyTry(bp.extraUserMrrTry)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrencyTry(bp.totalMrrTry)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: dashboard-page.tsx'i yeniden yaz**

`src/features/dashboard/pages/dashboard-page.tsx` — tamamen degistir:

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlatformSummary } from '../hooks/use-platform-summary'
import { useRevenue } from '../hooks/use-revenue'
import { KpiCard } from '../components/kpi-card'
import { CostTrendChart } from '../components/cost-trend-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { RevenueSummary } from '../components/revenue-summary'
import { formatCurrency, formatCurrencyTry } from '@/lib/utils'

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function DashboardPage() {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = usePlatformSummary(months)
  const { data: revenue } = useRevenue()

  const current = data?.months[0]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform genel bakış</p>
        </div>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : current ? (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <KpiCard label="Toplam Şirket" value={String(revenue?.totalCompanies ?? current.companyCount)} />
            <KpiCard label="Bu Ayın Maliyeti" value={formatCurrency(current.totalCostUsd)} />
            <KpiCard label="Aktif Kullanıcılar" value={String(revenue?.totalActiveUsers ?? 0)} />
            <KpiCard
              label="Memnuniyet Oranı"
              value={current.satisfactionRate ? `%${Math.round(current.satisfactionRate * 100)}` : '—'}
            />
            <KpiCard
              label="MRR"
              value={revenue ? formatCurrencyTry(revenue.mrrTry) : '—'}
              subtitle={revenue ? formatCurrency(revenue.mrrUsd) : undefined}
            />
            <KpiCard
              label="Brüt Kâr"
              value={revenue ? formatCurrencyTry(revenue.marginTry) : '—'}
              subtitleColor="text-green-400"
              subtitle={revenue ? `AI maliyeti: ${formatCurrency(revenue.totalAiCostUsd)}` : undefined}
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              cdn={current.cdn.costUsd}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>

          {revenue && <RevenueSummary data={revenue} />}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/components/revenue-summary.tsx src/features/dashboard/pages/dashboard-page.tsx
git commit -m "feat: redesign dashboard KPIs with MRR, satisfaction, revenue summary"
```

---

### Task 6: Company Table — Plan kolonu, sadeleştirme

**Files:**
- Modify: `src/features/companies/components/company-table.tsx`

- [ ] **Step 1: Tablo kolonlarini sadece Plan, Olusturulma, Toplam olarak yeniden tanimla**

`src/features/companies/components/company-table.tsx` — `columns` dizisini tamamen degistir:

```typescript
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
// ... mevcut importlar

const columns: ColumnDef<CompanyWithUsage>[] = [
  {
    accessorKey: 'name',
    header: 'Şirket Adı',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-bold text-primary">
            {getInitials(name)}
          </div>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    id: 'plan',
    header: 'Plan',
    cell: ({ row }) => {
      const company = row.original as any
      if (!company.plan) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">{company.plan.name}</Badge>
          {company.pendingPlanId && (
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Oluşturulma',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('createdAt'))}</span>,
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="font-semibold" onClick={() => column.toggleSorting()}>
        Bu Ay Maliyet <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.getValue('totalCost') ?? 0)}</span>,
  },
]
```

Ayrica `ArrowUpDown` import'u korunmali, `Badge` ve `AlertTriangle` import'lari eklenmeli.

- [ ] **Step 2: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/company-table.tsx
git commit -m "feat: simplify company table with plan column, remove sub-cost columns"
```

---

### Task 7: Company Header — Plan badge

**Files:**
- Modify: `src/features/companies/components/company-header.tsx`

- [ ] **Step 1: Plan badge'i ekle**

`src/features/companies/components/company-header.tsx` — import'lara `Badge` ekle:

```typescript
import { Badge } from '@/components/ui/badge'
```

Sirket adi ve ID badge'inin bulundugu satira (h1 ile span arasina) plan badge'i ekle:

```tsx
{company.plan && (
  <Badge variant="secondary">{company.plan.name}</Badge>
)}
{company.pendingPlan && (
  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
    {company.pendingPlan.name}&apos;a geçiyor
  </Badge>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/companies/components/company-header.tsx
git commit -m "feat: show plan badge and pending downgrade in company header"
```

---

### Task 8: CreateCompanyDialog — Plan seçimi

**Files:**
- Modify: `src/features/companies/components/create-company-dialog.tsx`

- [ ] **Step 1: Plan select ekle**

`src/features/companies/components/create-company-dialog.tsx` — import'lara ekle:

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePricingPlans } from '../hooks/use-pricing-plans'
```

State'e `planId` ekle:

```typescript
const [planId, setPlanId] = useState<string>('')
const { data: plans } = usePricingPlans()
```

handleSubmit'te `createCompany.mutate({ name: name.trim(), planId: planId || undefined }, ...)` olarak guncelle.

Dialog close'da `setPlanId('')` ekle.

Form'a name input'tan sonra:

```tsx
<div>
  <Label>Plan (Opsiyonel)</Label>
  <Select value={planId} onValueChange={setPlanId}>
    <SelectTrigger>
      <SelectValue placeholder="Plan seçin" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">Plansız</SelectItem>
      {(plans ?? []).map((p) => (
        <SelectItem key={p.id} value={p.id}>
          {p.name} {p.monthlyPriceTry !== null ? `— ${p.monthlyPriceTry} ₺/ay` : '— Kurumsal'}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 2: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/components/create-company-dialog.tsx
git commit -m "feat: add optional plan selection to create company dialog"
```

---

### Task 9: Plan Tab — Firma plan yönetimi

**Files:**
- Create: `src/features/companies/components/plan-tab.tsx`
- Modify: `src/features/companies/pages/company-detail-page.tsx`

- [ ] **Step 1: plan-tab.tsx olustur**

```tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { usePricingPlans } from '../hooks/use-pricing-plans'
import { useAssignCompanyPlan, useCancelDowngrade } from '../hooks/use-company-plan'
import { formatCurrencyTry, formatDate } from '@/lib/utils'
import type { Company } from '../types'

interface PlanTabProps {
  companyId: string
  company: Company
}

export function PlanTab({ companyId, company }: PlanTabProps) {
  const { data: plans } = usePricingPlans()
  const assignPlan = useAssignCompanyPlan(companyId)
  const cancelDowngrade = useCancelDowngrade(companyId)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  function handleAssign() {
    if (!selectedPlanId) return
    assignPlan.mutate(selectedPlanId, {
      onSuccess: (res) => {
        setConfirmOpen(false)
        setSelectedPlanId('')
        if (res.action === 'upgraded') {
          const msg = res.prorate?.prorateTry
            ? `Plan yükseltildi. Pro-rata: ${formatCurrencyTry(res.prorate.prorateTry)}`
            : 'Plan yükseltildi'
          toast.success(msg)
        } else if (res.action === 'downgrade_scheduled') {
          toast.info(`Downgrade planlandı: ${res.effectiveDate ? formatDate(res.effectiveDate) : 'sonraki dönem'}`)
        } else if (res.action === 'no_change') {
          toast.info('Aynı plan zaten atanmış')
        }
      },
      onError: () => toast.error('Plan atama başarısız'),
    })
  }

  function handleRemovePlan() {
    assignPlan.mutate(null, {
      onSuccess: () => {
        setRemoveOpen(false)
        toast.success('Plan kaldırıldı')
      },
      onError: () => toast.error('Plan kaldırma başarısız'),
    })
  }

  function handleCancelDowngrade() {
    cancelDowngrade.mutate(undefined, {
      onSuccess: () => toast.success('Downgrade iptal edildi'),
      onError: () => toast.error('İptal başarısız'),
    })
  }

  return (
    <div className="space-y-4">
      {/* Pending downgrade warning */}
      {company.pendingPlan && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Bekleyen Downgrade</p>
              <p className="text-xs text-muted-foreground">
                {company.pendingPlan.name} planına geçiş: {company.downgradeScheduledAt ? formatDate(company.downgradeScheduledAt) : 'sonraki dönem'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancelDowngrade} disabled={cancelDowngrade.isPending}>
            İptal Et
          </Button>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aktif Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {company.plan ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{company.plan.name}</span>
                <Badge variant="secondary">{company.plan.slug}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Fiyat: </span>
                  <span className="font-medium">
                    {company.plan.monthlyPriceTry !== null ? formatCurrencyTry(company.plan.monthlyPriceTry) + '/ay' : 'Kurumsal'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dahil Kullanıcı: </span>
                  <span className="font-medium">{company.plan.includedUsers}</span>
                </div>
                <div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoveOpen(true)}>
                    Planı Kaldır
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Bu şirkete plan atanmamış. Saf config modunda çalışıyor.</p>
          )}
        </CardContent>
      </Card>

      {/* Change plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Yeni plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(plans ?? []).filter((p) => p.id !== company.planId).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.monthlyPriceTry !== null ? `— ${formatCurrencyTry(p.monthlyPriceTry)}/ay` : '— Kurumsal'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setConfirmOpen(true)} disabled={!selectedPlanId || assignPlan.isPending}>
              Uygula
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Değişikliği Onayla</DialogTitle>
            <DialogDescription>
              Seçilen plan atanacak. Yükseltme anında, düşürme bir sonraki dönemde gerçekleşir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>İptal</Button>
            <Button onClick={handleAssign} disabled={assignPlan.isPending}>
              {assignPlan.isPending ? 'Atanıyor...' : 'Onayla'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove plan dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planı Kaldır</DialogTitle>
            <DialogDescription>
              Şirket plansız hale gelecek ve saf config moduna dönecek. Tool erişimi toolPlanConfig üzerinden yönetilir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleRemovePlan} disabled={assignPlan.isPending}>
              {assignPlan.isPending ? 'Kaldırılıyor...' : 'Kaldır'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: company-detail-page.tsx'e Plan tab'i ekle**

Import:
```typescript
import { PlanTab } from '../components/plan-tab'
```

TabsList icine (usage'dan sonra, analytics'den once):
```tsx
<TabsTrigger value="plan">Plan</TabsTrigger>
```

TabsContent icine:
```tsx
<TabsContent value="plan" className="mt-4">
  <PlanTab companyId={id!} company={company} />
</TabsContent>
```

- [ ] **Step 3: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/plan-tab.tsx src/features/companies/pages/company-detail-page.tsx
git commit -m "feat: add plan management tab to company detail page"
```

---

### Task 10: Settings — Fiyatlandırma Planları Bölümü

**Files:**
- Create: `src/features/settings/components/pricing-plans-section.tsx`
- Modify: `src/features/settings/components/settings-nav.tsx`
- Modify: `src/features/settings/pages/settings-page.tsx`

- [ ] **Step 1: pricing-plans-section.tsx olustur**

```tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { usePricingPlans, useCreatePricingPlan, useUpdatePricingPlan, useDeletePricingPlan } from '@/features/companies/hooks/use-pricing-plans'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import { useToolPlans } from '@/features/companies/hooks/use-tool-plans'
import { useDataSourceTypes } from '@/features/companies/hooks/use-data-sources'
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import { formatCurrencyTry } from '@/lib/utils'
import type { PricingPlan, CreatePlanRequest } from '@/features/companies/types'

interface PlanFormData {
  name: string
  slug: string
  description: string
  monthlyPriceTry: string
  includedUsers: string
  extraUserPriceTry: string
  budgetUsd: string
  budgetDowngradeThresholdPct: string
  maxStorageGb: string
  maxFileSizeMb: string
  crawlMaxPages: string
  crawlMaxSources: string
  allowedModels: Array<{ id: string; label: string }>
  allowedTools: string[]
  allowedConnectors: string[]
  isActive: boolean
  sortOrder: string
}

const emptyForm: PlanFormData = {
  name: '', slug: '', description: '',
  monthlyPriceTry: '', includedUsers: '1', extraUserPriceTry: '',
  budgetUsd: '10', budgetDowngradeThresholdPct: '80',
  maxStorageGb: '5', maxFileSizeMb: '25',
  crawlMaxPages: '50', crawlMaxSources: '2',
  allowedModels: [], allowedTools: [], allowedConnectors: [],
  isActive: true, sortOrder: '0',
}

function planToForm(p: PricingPlan): PlanFormData {
  return {
    name: p.name, slug: p.slug, description: p.description ?? '',
    monthlyPriceTry: p.monthlyPriceTry !== null ? String(p.monthlyPriceTry) : '',
    includedUsers: String(p.includedUsers),
    extraUserPriceTry: p.extraUserPriceTry !== null ? String(p.extraUserPriceTry) : '',
    budgetUsd: String(p.budgetUsd),
    budgetDowngradeThresholdPct: String(p.budgetDowngradeThresholdPct),
    maxStorageGb: String(p.maxStorageGb), maxFileSizeMb: String(p.maxFileSizeMb),
    crawlMaxPages: String(p.crawlMaxPages), crawlMaxSources: String(p.crawlMaxSources),
    allowedModels: p.allowedModels, allowedTools: p.allowedTools, allowedConnectors: p.allowedConnectors,
    isActive: p.isActive, sortOrder: String(p.sortOrder),
  }
}

function formToRequest(f: PlanFormData): CreatePlanRequest {
  return {
    name: f.name, slug: f.slug,
    description: f.description || undefined,
    monthlyPriceTry: f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null,
    includedUsers: Number(f.includedUsers) || 1,
    extraUserPriceTry: f.extraUserPriceTry ? Number(f.extraUserPriceTry) : null,
    budgetUsd: Number(f.budgetUsd) || 10,
    budgetDowngradeThresholdPct: Number(f.budgetDowngradeThresholdPct) || 80,
    maxStorageGb: Number(f.maxStorageGb) || 5, maxFileSizeMb: Number(f.maxFileSizeMb) || 25,
    crawlMaxPages: Number(f.crawlMaxPages) || 50, crawlMaxSources: Number(f.crawlMaxSources) || 2,
    allowedModels: f.allowedModels, allowedTools: f.allowedTools, allowedConnectors: f.allowedConnectors,
    isActive: f.isActive, sortOrder: Number(f.sortOrder) || 0,
  }
}

export function PricingPlansSection() {
  const { data: plans, isLoading } = usePricingPlans(true)
  const { data: models } = usePlatformModels()
  const { data: toolPlansData } = useToolPlans()
  const { data: connectorTypes } = useDataSourceTypes()
  const createPlan = useCreatePricingPlan()
  const deletePlan = useDeletePricingPlan()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [form, setForm] = useState<PlanFormData>(emptyForm)

  const registeredTools = toolPlansData?.registeredTools ?? []

  function openCreate() {
    setEditingPlan(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(plan: PricingPlan) {
    setEditingPlan(plan)
    setForm(planToForm(plan))
    setDialogOpen(true)
  }

  function handleToolToggle(toolId: string, checked: boolean) {
    setForm((prev) => {
      const isWildcard = prev.allowedTools.includes('*')
      if (toolId === '*') {
        return { ...prev, allowedTools: checked ? ['*'] : [] }
      }
      if (isWildcard && !checked) return prev
      const next = checked
        ? [...prev.allowedTools.filter((t) => t !== '*'), toolId]
        : prev.allowedTools.filter((t) => t !== toolId)
      return { ...prev, allowedTools: next }
    })
  }

  function handleConnectorToggle(type: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      allowedConnectors: checked
        ? [...prev.allowedConnectors, type]
        : prev.allowedConnectors.filter((c) => c !== type),
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fiyatlandırma Planları</h2>
          <p className="text-sm text-muted-foreground">Plan oluştur, düzenle ve firmalara ata</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Yeni Plan
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Fiyat</TableHead>
                <TableHead className="text-right">Dahil Kul.</TableHead>
                <TableHead className="text-right">Depolama</TableHead>
                <TableHead className="text-right">Firma</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plans ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.slug}</Badge></TableCell>
                  <TableCell className="text-right">
                    {p.monthlyPriceTry !== null ? formatCurrencyTry(p.monthlyPriceTry) : 'Kurumsal'}
                  </TableCell>
                  <TableCell className="text-right">{p.includedUsers}</TableCell>
                  <TableCell className="text-right">{p.maxStorageGb} GB</TableCell>
                  <TableCell className="text-right">{p.companyCount}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPlan={editingPlan}
        form={form}
        setForm={setForm}
        models={models ?? []}
        registeredTools={registeredTools}
        connectorTypes={connectorTypes ?? []}
        onToolToggle={handleToolToggle}
        onConnectorToggle={handleConnectorToggle}
        onCreate={createPlan}
        onDelete={deletePlan}
      />
    </div>
  )
}

// ─── Plan Dialog ────────────────────────────────

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan: PricingPlan | null
  form: PlanFormData
  setForm: React.Dispatch<React.SetStateAction<PlanFormData>>
  models: any[]
  registeredTools: any[]
  connectorTypes: any[]
  onToolToggle: (toolId: string, checked: boolean) => void
  onConnectorToggle: (type: string, checked: boolean) => void
  onCreate: any
  onDelete: any
}

function PlanDialog({
  open, onOpenChange, editingPlan, form, setForm,
  models, registeredTools, connectorTypes,
  onToolToggle, onConnectorToggle, onCreate, onDelete,
}: PlanDialogProps) {
  const updatePlan = useUpdatePricingPlan(editingPlan?.id ?? '')
  const isEdit = !!editingPlan

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = formToRequest(form)
    if (isEdit) {
      const { slug: _, ...updateBody } = body
      updatePlan.mutate(updateBody, {
        onSuccess: () => { toast.success('Plan güncellendi'); onOpenChange(false) },
        onError: () => toast.error('Güncelleme başarısız'),
      })
    } else {
      onCreate.mutate(body, {
        onSuccess: () => { toast.success('Plan oluşturuldu'); onOpenChange(false) },
        onError: () => toast.error('Oluşturma başarısız'),
      })
    }
  }

  function handleDeactivate() {
    if (!editingPlan) return
    onDelete.mutate(editingPlan.id, {
      onSuccess: (res: any) => {
        const msg = res.warning ? `Plan deaktif edildi. ${res.warning}` : 'Plan deaktif edildi'
        toast.success(msg)
        onOpenChange(false)
      },
      onError: () => toast.error('Deaktif etme başarısız'),
    })
  }

  function setField(key: keyof PlanFormData, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isWildcard = form.allowedTools.includes('*')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Temel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>İsim *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} required /></div>
              <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} disabled={isEdit} required pattern="^[a-z0-9-]{2,50}$" /></div>
            </div>
            <div><Label>Açıklama</Label><Input value={form.description} onChange={(e) => setField('description', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Aylık Fiyat (TRY)</Label><Input type="number" value={form.monthlyPriceTry} onChange={(e) => setField('monthlyPriceTry', e.target.value)} placeholder="Boş = Kurumsal" /></div>
              <div><Label>Dahil Kullanıcı</Label><Input type="number" value={form.includedUsers} onChange={(e) => setField('includedUsers', e.target.value)} /></div>
              <div><Label>Ek Kul. Fiyat (TRY)</Label><Input type="number" value={form.extraUserPriceTry} onChange={(e) => setField('extraUserPriceTry', e.target.value)} placeholder="Boş = yok" /></div>
            </div>
          </div>

          {/* Limitler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Limitler</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>AI Bütçe (USD)</Label><Input type="number" value={form.budgetUsd} onChange={(e) => setField('budgetUsd', e.target.value)} /></div>
              <div><Label>Bütçe Uyarı %</Label><Input type="number" value={form.budgetDowngradeThresholdPct} onChange={(e) => setField('budgetDowngradeThresholdPct', e.target.value)} /></div>
              <div><Label>Maks Depolama (GB)</Label><Input type="number" value={form.maxStorageGb} onChange={(e) => setField('maxStorageGb', e.target.value)} /></div>
              <div><Label>Maks Dosya (MB)</Label><Input type="number" value={form.maxFileSizeMb} onChange={(e) => setField('maxFileSizeMb', e.target.value)} /></div>
              <div><Label>Crawler Maks Sayfa</Label><Input type="number" value={form.crawlMaxPages} onChange={(e) => setField('crawlMaxPages', e.target.value)} /></div>
              <div><Label>Crawler Maks Kaynak</Label><Input type="number" value={form.crawlMaxSources} onChange={(e) => setField('crawlMaxSources', e.target.value)} /></div>
            </div>
          </div>

          {/* Tool'lar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Tool&apos;lar</h3>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isWildcard} onCheckedChange={(c) => onToolToggle('*', c)} />
              <span>Tüm tool&apos;lara izin ver (wildcard)</span>
            </label>
            {!isWildcard && (
              <div className="grid grid-cols-2 gap-2">
                {registeredTools.map((t: any) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={form.allowedTools.includes(t.id)}
                      onCheckedChange={(c) => onToolToggle(t.id, c)}
                    />
                    <span>{t.label}</span>
                    {t.requiresApproval && <Badge variant="outline" className="text-[10px]">Onay</Badge>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Modeller */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Modeller</h3>
            <AllowedModelsEditor
              models={models}
              value={form.allowedModels.map((m) => ({ ...m, isDefault: false }))}
              onChange={(v) => setField('allowedModels', v.map(({ id, label }) => ({ id, label })))}
            />
          </div>

          {/* Connector'lar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Connector&apos;lar</h3>
            <div className="grid grid-cols-2 gap-2">
              {(connectorTypes ?? []).map((ct: any) => (
                <label key={ct.type} className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.allowedConnectors.includes(ct.type)}
                    onCheckedChange={(c) => onConnectorToggle(ct.type, c)}
                  />
                  <span>{ct.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sıralama & Durum */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sıralama</Label><Input type="number" value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} /></div>
            <div className="flex items-end gap-2">
              <Label>Aktif</Label>
              <Switch checked={form.isActive} onCheckedChange={(c) => setField('isActive', c)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            {isEdit && editingPlan?.isActive && (
              <Button type="button" variant="outline" className="text-destructive" onClick={handleDeactivate} disabled={onDelete.isPending}>
                Deaktif Et
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
              <Button type="submit" disabled={onCreate.isPending || updatePlan.isPending}>
                {isEdit ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: settings-nav.tsx — pricingPlans item ekle**

`src/features/settings/components/settings-nav.tsx` — NAV_ITEMS dizisinin basina ekle (pricingConfig'den once):

```typescript
{ key: 'pricingPlans', label: 'Fiyatlandırma', icon: '💎' },
```

- [ ] **Step 3: settings-page.tsx — pricingPlans section render**

Import ekle:
```typescript
import { PricingPlansSection } from '../components/pricing-plans-section'
```

Render logic'e (main icindeki ilk condition):
```tsx
{activeSection === 'pricingPlans' ? (
  <PricingPlansSection key="pricingPlans" />
) : activeSection === 'aiConfig' ? (
  // ... mevcut
```

`useState` default degerini `'pricingPlans'` yap:
```typescript
const [activeSection, setActiveSection] = useState<string>('pricingPlans')
```

- [ ] **Step 4: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -40`

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/pricing-plans-section.tsx src/features/settings/components/settings-nav.tsx src/features/settings/pages/settings-page.tsx
git commit -m "feat: add pricing plans CRUD section to platform settings"
```

---

### Task 11: Build Doğrulama & Final Kontrol

**Files:** None (sadece kontrol)

- [ ] **Step 1: TypeScript build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`

Hata varsa duzelt.

- [ ] **Step 2: Dev server calistir**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx vite build 2>&1 | tail -20`

Build basarili olmali.

- [ ] **Step 3: Tum degisiklikleri teyit et**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && git log --oneline -10
```

10 commit bekle:
1. Types, TRY formatter, query keys
2. Mock data (plans, revenue, company plan fields)
3. MSW handlers (plan CRUD, assignment, revenue)
4. Hooks (pricing plans, company plan, revenue)
5. Dashboard KPI redesign + revenue summary
6. Company table (plan column, simplified)
7. Company header (plan badge)
8. Create company dialog (plan select)
9. Plan tab (company detail)
10. Settings pricing plans section

- [ ] **Step 4: Final commit (build dogrulama)**

Eger build hatalari duzeltildiyse:
```bash
git add -A
git commit -m "fix: resolve build errors from pricing plans alignment"
```
