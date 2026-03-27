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
    const newCompany = {
      id: 'c-new-' + Date.now(),
      name: body.name,
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
]
