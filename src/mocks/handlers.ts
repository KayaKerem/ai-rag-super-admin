import { http, HttpResponse, delay } from 'msw'
import {
  mockCompanies,
  mockCompanyUsage,
  mockCompanyAnalytics,
  mockCompanyConfigs,
  mockUsers,
  mockPlatformDefaults,
  mockPlatformModels,
  mockToolPlans,
  mockRegisteredTools,
  mockCompanyToolConfigs,
  getCompanyToolConfig,
  getPlatformSummary,
  mockDataSourceTypes,
  mockDataSources,
  mockAgentMetrics,
  mockPricingPlans,
  mockRevenue,
  mockEmailTemplates,
  mockBillingEvents,
} from './data'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const handlers = [
  // ─── Auth ───────────────────────────────────────────
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as any
    if (body.email && body.password) {
      return HttpResponse.json({
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'admin-001',
          companyId: 'c-platform',
          role: 'owner' as const,
          isActive: true,
          email: body.email,
          name: 'Platform Admin',
          isPlatformAdmin: true,
        },
      })
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    await delay(200)
    const body = (await request.json()) as any
    if (body.refreshToken) {
      return HttpResponse.json({
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: {
          id: 'admin-001',
          companyId: 'c-platform',
          role: 'owner' as const,
          isActive: true,
          email: 'admin@firma.com',
          name: 'Platform Admin',
          isPlatformAdmin: true,
        },
      })
    }
    return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 })
  }),

  http.post(`${BASE}/auth/logout`, async () => {
    await delay(100)
    return HttpResponse.json({ success: true })
  }),

  http.post(`${BASE}/auth/logout-all`, async () => {
    await delay(100)
    return HttpResponse.json({ success: true })
  }),

  // ─── Companies CRUD ─────────────────────────────────
  http.get(`${BASE}/platform/companies`, async () => {
    await delay(200)
    return HttpResponse.json(mockCompanies)
  }),

  http.post(`${BASE}/platform/companies`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const plan = body.planId ? mockPricingPlans.find((p: any) => p.id === body.planId) : null
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

  http.get(`${BASE}/platform/companies/:id`, async ({ params }) => {
    await delay(150)
    const company = mockCompanies.find((c) => c.id === params.id)
    if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    return HttpResponse.json(company)
  }),

  http.patch(`${BASE}/platform/companies/:id`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as any
    const company = mockCompanies.find((c) => c.id === params.id)
    if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    if (body.name) company.name = body.name
    company.updatedAt = new Date().toISOString()
    return HttpResponse.json(company)
  }),

  http.delete(`${BASE}/platform/companies/:id`, async ({ params }) => {
    await delay(200)
    const idx = mockCompanies.findIndex((c) => c.id === params.id)
    if (idx === -1) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    mockCompanies.splice(idx, 1)
    return HttpResponse.json({ success: true })
  }),

  // ─── Company Config ─────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/config`, async ({ params }) => {
    await delay(150)
    const config = mockCompanyConfigs[params.id as string] ?? {}
    return HttpResponse.json(config)
  }),

  http.put(`${BASE}/platform/companies/:id/config`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const id = params.id as string
    if (!mockCompanyConfigs[id]) mockCompanyConfigs[id] = {}
    Object.assign(mockCompanyConfigs[id], body)
    return HttpResponse.json(mockCompanyConfigs[id])
  }),

  // ─── Company Users ──────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/users`, async ({ params }) => {
    await delay(150)
    const users = mockUsers[params.id as string] ?? []
    return HttpResponse.json(users)
  }),

  http.post(`${BASE}/platform/companies/:id/users`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const id = params.id as string
    if (!mockUsers[id]) mockUsers[id] = []
    const existing = mockUsers[id].find((u: any) => u.email === body.email)
    if (existing) return HttpResponse.json({ code: 'email_already_registered' }, { status: 409 })
    const newUser = {
      id: 'u-created-' + Date.now(),
      email: body.email,
      name: body.name,
      role: body.role,
      companyId: id,
      isActive: true,
      isPlatformAdmin: false,
      createdAt: new Date().toISOString(),
    }
    mockUsers[id].push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  http.post(`${BASE}/platform/companies/:id/users/invite`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const id = params.id as string
    if (!mockUsers[id]) mockUsers[id] = []
    const existing = mockUsers[id].find((u: any) => u.email === body.email)
    if (existing) return HttpResponse.json({ code: 'email_already_registered' }, { status: 409 })
    const newUser = {
      id: 'u-new-' + Date.now(),
      email: body.email,
      name: body.email.split('@')[0],
      role: body.role,
      companyId: id,
      isActive: true,
      isPlatformAdmin: false,
      createdAt: new Date().toISOString(),
    }
    mockUsers[id].push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  http.patch(`${BASE}/platform/companies/:id/users/:userId`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as any
    const users = mockUsers[params.id as string] ?? []
    const user = users.find((u: any) => u.id === params.userId)
    if (!user) return HttpResponse.json({ code: 'user_not_found' }, { status: 404 })
    if (body.role) user.role = body.role
    return HttpResponse.json(user)
  }),

  http.delete(`${BASE}/platform/companies/:id/users/:userId`, async ({ params }) => {
    await delay(200)
    const users = mockUsers[params.id as string] ?? []
    const idx = users.findIndex((u: any) => u.id === params.userId)
    if (idx === -1) return HttpResponse.json({ code: 'user_not_found' }, { status: 404 })
    users.splice(idx, 1)
    return HttpResponse.json({ success: true })
  }),

  http.post(`${BASE}/platform/companies/:id/users/bulk-import`, async ({ params }) => {
    await delay(500)
    const id = params.id as string
    if (!mockUsers[id]) mockUsers[id] = []
    // Simulate importing 3 users
    const imported = [
      { email: 'import1@test.com', name: 'Import User 1', role: 'member' },
      { email: 'import2@test.com', name: 'Import User 2', role: 'member' },
      { email: 'import3@test.com', name: 'Import User 3', role: 'admin' },
    ].map((u, i) => ({
      id: 'u-imp-' + Date.now() + i,
      ...u,
      companyId: id,
      isActive: true,
      isPlatformAdmin: false,
      createdAt: new Date().toISOString(),
    }))
    mockUsers[id].push(...imported)
    return HttpResponse.json({ imported: imported.length, errors: 0 })
  }),

  // ─── Usage ──────────────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/usage`, async ({ params, request }) => {
    await delay(200)
    const url = new URL(request.url)
    const numMonths = parseInt(url.searchParams.get('months') ?? '1')
    const id = params.id as string
    const allMonths = mockCompanyUsage[id] ?? []
    const company = mockCompanies.find((c) => c.id === id)
    return HttpResponse.json({
      companyId: id,
      companyName: company?.name ?? 'Unknown',
      months: allMonths.slice(0, numMonths),
    })
  }),

  http.get(`${BASE}/platform/companies/:id/usage/current`, async ({ params }) => {
    await delay(100)
    const id = params.id as string
    const allMonths = mockCompanyUsage[id] ?? []
    return HttpResponse.json(allMonths[0] ?? {})
  }),

  http.get(`${BASE}/platform/usage/summary`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const numMonths = parseInt(url.searchParams.get('months') ?? '1')
    return HttpResponse.json(getPlatformSummary(numMonths))
  }),

  // ─── Tool Plans ────────────────────────────────────
  http.get(`${BASE}/platform/tool-plans`, async () => {
    await delay(150)
    return HttpResponse.json({ ...mockToolPlans, registeredTools: mockRegisteredTools })
  }),

  http.put(`${BASE}/platform/tool-plans`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as any
    if (body.plans) mockToolPlans.plans = body.plans
    if (body.defaultPlan) mockToolPlans.defaultPlan = body.defaultPlan
    return HttpResponse.json({ ...mockToolPlans, registeredTools: mockRegisteredTools })
  }),

  // ─── Company Tool Config ──────────────────────────
  http.get(`${BASE}/platform/companies/:id/tool-config`, async ({ params }) => {
    await delay(150)
    const id = params.id as string
    return HttpResponse.json(getCompanyToolConfig(id))
  }),

  http.put(`${BASE}/platform/companies/:id/tool-config`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const id = params.id as string
    mockCompanyToolConfigs[id] = { plan: body.plan, overrides: body.overrides ?? {} }
    return HttpResponse.json(getCompanyToolConfig(id))
  }),

  // ─── Analytics ────────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/analytics`, async ({ params, request }) => {
    await delay(200)
    const url = new URL(request.url)
    const numMonths = parseInt(url.searchParams.get('months') ?? '1')
    const id = params.id as string
    const allMonths = mockCompanyAnalytics[id] ?? []
    const company = mockCompanies.find((c) => c.id === id)
    return HttpResponse.json({
      companyId: id,
      companyName: company?.name ?? 'Unknown',
      months: allMonths.slice(0, numMonths),
    })
  }),

  // ─── Agent Metrics ────────────────────────────────
  http.get(`${BASE}/platform/companies/:id/agent-metrics`, async ({ params, request }) => {
    await delay(200)
    const id = params.id as string
    const url = new URL(request.url)
    const windowDays = parseInt(url.searchParams.get('windowDays') ?? '30')
    const metrics = mockAgentMetrics[id]
    if (!metrics) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    return HttpResponse.json({ ...metrics, windowDays })
  }),

  // ─── Data Sources ─────────────────────────────────
  http.get(`${BASE}/platform/data-source-types`, async () => {
    await delay(150)
    return HttpResponse.json(mockDataSourceTypes)
  }),

  http.get(`${BASE}/platform/data-sources`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const companyId = url.searchParams.get('companyId')
    let filtered = mockDataSources
    if (type) filtered = filtered.filter((d) => d.type === type)
    if (status) filtered = filtered.filter((d) => d.status === status)
    if (companyId) filtered = filtered.filter((d) => d.companyId === companyId)
    return HttpResponse.json({ items: filtered, total: filtered.length })
  }),

  http.get(`${BASE}/platform/companies/:id/data-sources`, async ({ params }) => {
    await delay(150)
    const id = params.id as string
    const filtered = mockDataSources.filter((d) => d.companyId === id)
    return HttpResponse.json({ items: filtered, total: filtered.length })
  }),

  // ─── Platform Models ───────────────────────────────
  http.get(`${BASE}/platform/models`, async () => {
    await delay(150)
    return HttpResponse.json(mockPlatformModels)
  }),

  // ─── Platform Defaults ──────────────────────────────
  http.get(`${BASE}/platform/config/defaults`, async () => {
    await delay(150)
    return HttpResponse.json(mockPlatformDefaults)
  }),

  http.put(`${BASE}/platform/config/defaults`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as any
    Object.assign(mockPlatformDefaults, body)
    return HttpResponse.json(mockPlatformDefaults)
  }),

  // ─── Pricing Plans ───────────────────────────────
  http.get(`${BASE}/platform/plans`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    const plans = includeInactive ? mockPricingPlans : mockPricingPlans.filter((p: any) => p.isActive)
    return HttpResponse.json(plans)
  }),

  http.post(`${BASE}/platform/plans`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const existing = mockPricingPlans.find((p: any) => p.slug === body.slug)
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
    const plan = mockPricingPlans.find((p: any) => p.id === params.id)
    if (!plan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
    return HttpResponse.json(plan)
  }),

  http.patch(`${BASE}/platform/plans/:id`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const plan = mockPricingPlans.find((p: any) => p.id === params.id)
    if (!plan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
    if (body.slug !== undefined) return HttpResponse.json({ code: 'slug_is_immutable' }, { status: 422 })
    Object.assign(plan, body, { updatedAt: new Date().toISOString() })
    return HttpResponse.json(plan)
  }),

  http.delete(`${BASE}/platform/plans/:id`, async ({ params }) => {
    await delay(200)
    const plan = mockPricingPlans.find((p: any) => p.id === params.id)
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

    if (body.planId === null) {
      company.planId = null
      company.plan = null
      company.pendingPlanId = null
      company.pendingPlan = null
      company.downgradeScheduledAt = null
      return HttpResponse.json({ companyId: company.id, planId: null, planName: null, action: 'removed' })
    }

    const newPlan = mockPricingPlans.find((p: any) => p.id === body.planId)
    if (!newPlan) return HttpResponse.json({ code: 'plan_not_found' }, { status: 404 })
    if (!newPlan.isActive) return HttpResponse.json({ code: 'plan_is_inactive' }, { status: 400 })

    const currentPrice = company.plan?.monthlyPriceTry ?? 0
    const newPrice = newPlan.monthlyPriceTry ?? Infinity

    if (newPrice > currentPrice) {
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

  // ─── Email Templates ─────────────────────────────
  http.get(`${BASE}/platform/email-templates`, async () => {
    await delay(200)
    const sorted = [...mockEmailTemplates].sort((a, b) => a.slug.localeCompare(b.slug))
    return HttpResponse.json(sorted)
  }),

  http.get(`${BASE}/platform/email-templates/:slug`, async ({ params }) => {
    await delay(150)
    const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
    if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
    return HttpResponse.json(template)
  }),

  http.patch(`${BASE}/platform/email-templates/:slug`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
    if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
    if (body.subject !== undefined) template.subject = body.subject
    if (body.bodyHtml !== undefined) template.bodyHtml = body.bodyHtml
    if (body.isActive !== undefined) template.isActive = body.isActive
    template.updatedAt = new Date().toISOString()
    return HttpResponse.json(template)
  }),

  http.post(`${BASE}/platform/email-templates/:slug/preview`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as any
    const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
    if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
    const vars = body.variables ?? {}
    let subject = template.subject as string
    let html = template.bodyHtml as string
    for (const [key, value] of Object.entries(vars)) {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      subject = subject.replace(re, value as string)
      html = html.replace(re, value as string)
    }
    html = html.replace(/\{\{#(?:if|unless)\s+\w+\}\}/g, '').replace(/\{\{\/(?:if|unless)\}\}/g, '')
    subject = subject.replace(/\{\{[^}]+\}\}/g, '')
    html = html.replace(/\{\{[^}]+\}\}/g, '')
    return HttpResponse.json({ subject, html })
  }),

  // ─── Company Status & Billing Events ─────────────
  http.patch(`${BASE}/platform/companies/:id/status`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as any
    const company = mockCompanies.find((c: any) => c.id === params.id)
    if (!company) return HttpResponse.json({ code: 'company_not_found' }, { status: 404 })
    const validStatuses = ['active', 'suspended', 'cancelled']
    if (!validStatuses.includes(body.status)) return HttpResponse.json({ message: 'Invalid status' }, { status: 400 })
    const oldStatus = company.subscriptionStatus
    company.subscriptionStatus = body.status
    company.statusChangedAt = new Date().toISOString()
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
]
