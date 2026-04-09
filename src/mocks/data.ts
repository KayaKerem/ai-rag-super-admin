// Dummy data for all API endpoints

export const mockCompanies: any[] = [
  { id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', name: 'Firma Alpha', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'active', statusChangedAt: '2026-02-15T10:00:00Z', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-20T14:30:00Z' },
  { id: 'c2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', name: 'Tech Beta', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'active', statusChangedAt: '2026-03-10T09:00:00Z', createdAt: '2026-02-22T09:15:00Z', updatedAt: '2026-03-18T11:20:00Z' },
  { id: 'c3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8', name: 'Green Corp', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'trialing', statusChangedAt: null, createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-25T16:45:00Z' },
  { id: 'c4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9', name: 'Data Dynamics', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'active', statusChangedAt: '2026-01-20T12:00:00Z', createdAt: '2025-11-10T12:00:00Z', updatedAt: '2026-03-22T09:10:00Z' },
  { id: 'c5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', name: 'CloudNine AI', logoUrl: null, planId: 'plan-pro', plan: { id: 'plan-pro', name: 'Pro', slug: 'pro', monthlyPriceTry: 2990, includedUsers: 5, isActive: true }, pendingPlanId: 'plan-starter', pendingPlan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, downgradeScheduledAt: '2026-04-14T00:00:00Z', subscriptionStatus: 'active', statusChangedAt: '2026-02-01T08:00:00Z', createdAt: '2025-12-05T15:30:00Z', updatedAt: '2026-03-24T13:00:00Z' },
  { id: 'c6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1', name: 'Stellar Systems', logoUrl: null, planId: 'plan-starter', plan: { id: 'plan-starter', name: 'Starter', slug: 'starter', monthlyPriceTry: 599, includedUsers: 3, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'suspended', statusChangedAt: '2026-03-25T14:00:00Z', createdAt: '2026-01-28T11:00:00Z', updatedAt: '2026-03-19T10:20:00Z' },
  { id: 'c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2', name: 'Nexus Labs', logoUrl: null, planId: 'plan-enterprise', plan: { id: 'plan-enterprise', name: 'Enterprise', slug: 'enterprise', monthlyPriceTry: null, includedUsers: 50, isActive: true }, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'active', statusChangedAt: '2026-03-01T10:00:00Z', createdAt: '2026-02-14T08:45:00Z', updatedAt: '2026-03-23T17:00:00Z' },
  { id: 'c8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3', name: 'Apex Digital', logoUrl: null, planId: null, plan: null, pendingPlanId: null, pendingPlan: null, downgradeScheduledAt: null, subscriptionStatus: 'cancelled', statusChangedAt: '2026-03-20T16:00:00Z', createdAt: '2026-03-05T14:00:00Z', updatedAt: '2026-03-25T08:30:00Z' },
]

function generateUsageMonth(month: string, scale: number) {
  const aiTokens = Math.floor((800000 + Math.random() * 600000) * scale)
  const aiCost = +(aiTokens * 0.00001).toFixed(2)
  const storageBytes = Math.floor((2 + Math.random() * 8) * 1e9 * scale)
  const storageCost = +((storageBytes / 1e9) * 0.0245).toFixed(2)
  const taskCount = Math.floor((100 + Math.random() * 400) * scale)
  const triggerCost = +(taskCount * 0.0001).toFixed(4)
  return {
    month,
    ai: { totalTokens: aiTokens, turnCount: Math.floor(aiTokens / 15000), costUsd: aiCost },
    storage: { currentBytes: storageBytes, costUsd: storageCost },
    trigger: { taskCount, costUsd: triggerCost },
    totalCostUsd: +(aiCost + storageCost + triggerCost).toFixed(2),
  }
}

const months = ['2026-03', '2026-02', '2026-01', '2025-12', '2025-11', '2025-10', '2025-09', '2025-08', '2025-07', '2025-06', '2025-05', '2025-04']

// Per-company usage data
export const mockCompanyUsage: Record<string, ReturnType<typeof generateUsageMonth>[]> = {}
const scales = [1, 0.6, 0.15, 0.8, 1.2, 0.4, 0.7, 0.25]
mockCompanies.forEach((c, i) => {
  mockCompanyUsage[c.id] = months.map((m) => generateUsageMonth(m, scales[i] ?? 0.5))
})

// Platform summary
export function getPlatformSummary(numMonths: number) {
  const result = months.slice(0, numMonths).map((m) => {
    const allCompanyMonths = mockCompanies.map((c) => {
      const usage = mockCompanyUsage[c.id]
      return usage.find((u) => u.month === m)!
    })
    return {
      month: m,
      companyCount: mockCompanies.length,
      ai: {
        totalTokens: allCompanyMonths.reduce((s, u) => s + u.ai.totalTokens, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.ai.costUsd, 0).toFixed(2),
      },
      storage: {
        totalBytes: allCompanyMonths.reduce((s, u) => s + u.storage.currentBytes, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.storage.costUsd, 0).toFixed(2),
      },
      trigger: {
        taskCount: allCompanyMonths.reduce((s, u) => s + u.trigger.taskCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.trigger.costUsd, 0).toFixed(4),
      },
      totalCostUsd: +allCompanyMonths.reduce((s, u) => s + u.totalCostUsd, 0).toFixed(2),
      satisfactionRate: +(0.78 + Math.random() * 0.12).toFixed(2),
      totalActiveUsers: 52,
    }
  })
  return { months: result }
}

// Users per company
export const mockUsers: Record<string, any[]> = {
  [mockCompanies[0].id]: [
    { id: 'u1', email: 'ali@firma-alpha.com', name: 'Ali Veli', role: 'owner', companyId: mockCompanies[0].id, isActive: true, isPlatformAdmin: false, createdAt: '2026-01-15T10:00:00Z' },
    { id: 'u2', email: 'ayse@firma-alpha.com', name: 'Ayşe Yılmaz', role: 'admin', companyId: mockCompanies[0].id, isActive: true, isPlatformAdmin: false, createdAt: '2026-01-20T09:00:00Z' },
    { id: 'u3', email: 'mehmet@firma-alpha.com', name: 'Mehmet Kaya', role: 'member', companyId: mockCompanies[0].id, isActive: true, isPlatformAdmin: false, createdAt: '2026-02-03T11:00:00Z' },
    { id: 'u4', email: 'zeynep@firma-alpha.com', name: 'Zeynep Demir', role: 'member', companyId: mockCompanies[0].id, isActive: true, isPlatformAdmin: false, createdAt: '2026-02-15T14:00:00Z' },
    { id: 'u5', email: 'can@firma-alpha.com', name: 'Can Öztürk', role: 'member', companyId: mockCompanies[0].id, isActive: true, isPlatformAdmin: false, createdAt: '2026-03-01T08:30:00Z' },
  ],
}
// Generate users for other companies
mockCompanies.slice(1).forEach((c) => {
  const count = 2 + Math.floor(Math.random() * 5)
  const names = ['Emre Acar', 'Selin Yıldız', 'Burak Çelik', 'Deniz Arslan', 'Ece Korkmaz', 'Oğuz Şahin', 'Nisa Polat']
  mockUsers[c.id] = Array.from({ length: count }, (_, i) => ({
    id: `u-${c.id.slice(0, 4)}-${i}`,
    email: `${names[i].split(' ')[0].toLowerCase()}@${c.name.toLowerCase().replace(/\s+/g, '-')}.com`,
    name: names[i],
    role: i === 0 ? 'owner' : i === 1 ? 'admin' : 'member',
    companyId: c.id,
    isActive: true,
    isPlatformAdmin: false,
    createdAt: '2026-02-01T10:00:00Z',
  }))
})

// Available OpenRouter models (mock — production returns 300+ from OpenRouter API, 1h cache)
export const mockPlatformModels = [
  // Premium (inputPerMtok >= $2.00)
  { id: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', tier: 'premium', pricing: { inputPerMtok: 3.0, outputPerMtok: 15.0 } },
  { id: 'anthropic/claude-opus-4.6', label: 'Claude Opus 4.6', tier: 'premium', pricing: { inputPerMtok: 5.0, outputPerMtok: 25.0 } },
  { id: 'openai/gpt-4.1', label: 'GPT 4.1', tier: 'premium', pricing: { inputPerMtok: 2.0, outputPerMtok: 8.0 } },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'premium', pricing: { inputPerMtok: 2.5, outputPerMtok: 15.0 } },
  { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick', tier: 'premium', pricing: { inputPerMtok: 2.0, outputPerMtok: 6.0 } },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', tier: 'premium', pricing: { inputPerMtok: 3.0, outputPerMtok: 8.0 } },
  // Standard ($0.50 <= inputPerMtok < $2.00)
  { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: 'standard', pricing: { inputPerMtok: 1.0, outputPerMtok: 5.0 } },
  { id: 'openai/gpt-4.1-mini', label: 'GPT 4.1 Mini', tier: 'standard', pricing: { inputPerMtok: 0.5, outputPerMtok: 1.6 } },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'standard', pricing: { inputPerMtok: 0.5, outputPerMtok: 2.5 } },
  { id: 'mistralai/mistral-large', label: 'Mistral Large', tier: 'standard', pricing: { inputPerMtok: 0.8, outputPerMtok: 2.4 } },
  { id: 'cohere/command-r-plus', label: 'Command R+', tier: 'standard', pricing: { inputPerMtok: 0.5, outputPerMtok: 1.5 } },
  // Economy (inputPerMtok < $0.50)
  { id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini', tier: 'economy', pricing: { inputPerMtok: 0.15, outputPerMtok: 0.6 } },
  { id: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash', tier: 'economy', pricing: { inputPerMtok: 0.1, outputPerMtok: 0.4 } },
  { id: 'mistralai/mistral-small', label: 'Mistral Small', tier: 'economy', pricing: { inputPerMtok: 0.2, outputPerMtok: 0.6 } },
  { id: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout', tier: 'economy', pricing: { inputPerMtok: 0.15, outputPerMtok: 0.4 } },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', tier: 'economy', pricing: { inputPerMtok: 0.07, outputPerMtok: 0.28 } },
  { id: 'qwen/qwen3-235b-a22b', label: 'Qwen 3 235B', tier: 'economy', pricing: { inputPerMtok: 0.12, outputPerMtok: 0.5 } },
]

// Tool governance
export const mockRegisteredTools = [
  { id: 'search_knowledge_base', label: 'Bilgi Bankası Arama', description: 'Bilgi tabanında arama yapar', category: 'search', requiresApproval: false },
  { id: 'search_drive_documents', label: 'Doküman Arama', description: 'Yüklenen dokümanlarda arama yapar', category: 'search', requiresApproval: false },
  { id: 'list_knowledge_categories', label: 'Kategori Listele', description: 'Bilgi bankası kategorilerini listeler', category: 'search', requiresApproval: false },
  { id: 'search_templates', label: 'Şablon Arama', description: 'Şablon kütüphanesinde arama yapar', category: 'template', requiresApproval: false },
  { id: 'retrieve_template', label: 'Şablon Öner', description: 'Göreve uygun şablon önerir', category: 'template', requiresApproval: false },
  { id: 'fill_template', label: 'Şablon Doldur', description: 'Şablonu doldurarak belge üretir', category: 'template', requiresApproval: true },
  { id: 'create_note', label: 'Not Oluştur', description: 'Kişisel not oluşturur', category: 'notes', requiresApproval: false },
  { id: 'search_notes', label: 'Not Ara', description: 'Kişisel notlarda arama yapar', category: 'notes', requiresApproval: false },
  { id: 'update_note', label: 'Not Güncelle', description: 'Mevcut notu günceller', category: 'notes', requiresApproval: false },
  { id: 'delete_note', label: 'Not Sil', description: 'Notu siler', category: 'notes', requiresApproval: false },
]

export const mockToolPlans: any = {
  defaultPlan: 'free',
  plans: {
    free: {
      label: 'Ücretsiz',
      description: 'Temel arama özellikleri',
      tools: ['search_knowledge_base', 'list_knowledge_categories'],
    },
    pro: {
      label: 'Profesyonel',
      description: 'Tüm arama ve şablon özellikleri',
      tools: ['search_knowledge_base', 'list_knowledge_categories', 'search_drive_documents', 'search_templates', 'retrieve_template', 'create_note', 'search_notes', 'update_note', 'delete_note'],
    },
    enterprise: {
      label: 'Kurumsal',
      description: 'Tüm özellikler',
      tools: ['*'],
    },
  },
}

// Company tool configs
export const mockCompanyToolConfigs: Record<string, { plan: string; overrides: Record<string, boolean> }> = {}

function resolveTools(plan: string, overrides: Record<string, boolean>) {
  const planDef = mockToolPlans.plans[plan]
  if (!planDef) return []
  const isWildcard = planDef.tools.includes('*')
  return mockRegisteredTools.map((tool) => {
    const inPlan = isWildcard || planDef.tools.includes(tool.id)
    const hasOverride = tool.id in overrides
    let enabled: boolean
    let source: string
    if (hasOverride) {
      enabled = overrides[tool.id]
      source = 'override'
    } else if (inPlan) {
      enabled = true
      source = 'plan'
    } else {
      enabled = false
      source = 'not_in_plan'
    }
    return { id: tool.id, label: tool.label, category: tool.category, requiresApproval: tool.requiresApproval, enabled, source }
  })
}

export function getCompanyToolConfig(companyId: string) {
  const cfg = mockCompanyToolConfigs[companyId] ?? { plan: mockToolPlans.defaultPlan, overrides: {} }
  return { plan: cfg.plan, overrides: cfg.overrides, resolvedTools: resolveTools(cfg.plan, cfg.overrides) }
}

// Analytics per company
function generateAnalyticsMonth(month: string, scale: number) {
  const convos = Math.floor((50 + Math.random() * 150) * scale)
  const activeUsers = Math.floor((2 + Math.random() * 8) * scale) || 1
  const turns = Math.floor(convos * (3 + Math.random() * 5))
  const totalRatings = Math.floor(turns * 0.15)
  const positiveCount = Math.floor(totalRatings * (0.75 + Math.random() * 0.15))
  const negativeCount = totalRatings - positiveCount
  const toolCalls = Math.floor(turns * 0.35)
  const noResultCount = Math.floor(turns * (0.02 + Math.random() * 0.04))
  return {
    month,
    conversations: { total: convos, activeUsers },
    turns: { total: turns, avgPerConversation: +(turns / convos).toFixed(1) },
    feedback: {
      totalRatings,
      positiveCount,
      negativeCount,
      satisfactionRate: totalRatings > 0 ? +(positiveCount / totalRatings).toFixed(2) : 0,
      topReasons: [
        { code: 'incomplete', count: Math.floor(negativeCount * 0.4) },
        { code: 'hallucination', count: Math.floor(negativeCount * 0.25) },
        { code: 'wrong_source', count: Math.floor(negativeCount * 0.2) },
        { code: 'irrelevant', count: Math.floor(negativeCount * 0.15) },
      ],
    },
    quality: {
      avgGroundedness: +(0.8 + Math.random() * 0.15).toFixed(2),
      avgRelevance: +(0.82 + Math.random() * 0.14).toFixed(2),
      lowQualityCount: Math.floor(turns * (0.01 + Math.random() * 0.03)),
      evaluatedCount: turns,
    },
    tools: {
      totalCalls: toolCalls,
      byTool: [
        { name: 'search_knowledge_base', count: Math.floor(toolCalls * 0.5) },
        { name: 'search_drive_documents', count: Math.floor(toolCalls * 0.25) },
        { name: 'list_knowledge_categories', count: Math.floor(toolCalls * 0.1) },
        { name: 'search_templates', count: Math.floor(toolCalls * 0.08) },
        { name: 'fill_template', count: Math.floor(toolCalls * 0.07) },
      ],
    },
    search: { noResultCount, noResultRate: +(noResultCount / turns).toFixed(3) },
  }
}

export const mockCompanyAnalytics: Record<string, ReturnType<typeof generateAnalyticsMonth>[]> = {}
mockCompanies.forEach((c, i) => {
  mockCompanyAnalytics[c.id] = months.map((m) => generateAnalyticsMonth(m, scales[i] ?? 0.5))
})

// Agent metrics per company
function generateAgentMetrics(_companyId: string, scale: number) {
  const total = Math.floor((80 + Math.random() * 120) * scale)
  const assistantTurnsTotal = Math.floor(total * (4 + Math.random() * 3))
  const outputsAnalyzed = assistantTurnsTotal
  const outputsWithAnyCitation = Math.floor(outputsAnalyzed * (0.75 + Math.random() * 0.15))
  const outputsWithDocumentCitation = Math.floor(outputsWithAnyCitation * 0.45)
  const outputsWithKnowledgeCitation = Math.floor(outputsWithAnyCitation * 0.8)
  const rate = +(outputsWithAnyCitation / outputsAnalyzed).toFixed(4)
  const approved = Math.floor((20 + Math.random() * 40) * scale)
  const rejected = Math.floor((1 + Math.random() * 5) * scale)
  const pending = Math.floor(Math.random() * 4 * scale)
  const approvalRate = approved + rejected > 0 ? +((approved / (approved + rejected)).toFixed(4)) : 1
  const fbTotal = Math.floor((60 + Math.random() * 100) * scale)
  const fbPositive = Math.floor(fbTotal * (0.75 + Math.random() * 0.15))
  const qualityScore = +(fbTotal > 0 ? (fbPositive / fbTotal) * 100 : 0).toFixed(2)

  const alerts: Array<{ code: string; severity: 'warning' | 'critical'; message: string; value: number }> = []
  if (rate < 0.6) {
    alerts.push({ code: 'low_citation_coverage', severity: 'warning', message: 'Citation coverage is below 60%', value: rate })
  }
  if (qualityScore < 70) {
    alerts.push({ code: 'low_feedback_quality_score', severity: 'warning', message: 'Quality score is below 70/100', value: qualityScore })
  }
  if (pending >= 10) {
    alerts.push({ code: 'pending_approval_backlog', severity: 'critical', message: '10+ pending approvals', value: pending })
  }

  return {
    windowDays: 30,
    conversations: { total, assistantTurnsTotal },
    citationCoverage: {
      outputsAnalyzed,
      outputsWithAnyCitation,
      outputsWithDocumentCitation,
      outputsWithKnowledgeCitation,
      rate,
      warningReasonCounts: {},
      blockingReasonCounts: {},
    },
    humanWorkflow: { pendingActions: pending, approvedActions: approved, rejectedActions: rejected, approvalRate },
    feedback: { total: fbTotal, positive: fbPositive, negative: fbTotal - fbPositive, qualityScore },
    alerts,
  }
}

export const mockAgentMetrics: Record<string, ReturnType<typeof generateAgentMetrics>> = {}
mockCompanies.forEach((c, i) => {
  mockAgentMetrics[c.id] = generateAgentMetrics(c.id, scales[i] ?? 0.5)
})
// Force one company to have alerts for testing
mockAgentMetrics[mockCompanies[4].id] = {
  ...mockAgentMetrics[mockCompanies[4].id],
  citationCoverage: { ...mockAgentMetrics[mockCompanies[4].id].citationCoverage, rate: 0.45 },
  humanWorkflow: { ...mockAgentMetrics[mockCompanies[4].id].humanWorkflow, pendingActions: 12 },
  alerts: [
    { code: 'low_citation_coverage', severity: 'warning', message: 'Citation coverage is below 60%', value: 0.45 },
    { code: 'pending_approval_backlog', severity: 'critical', message: '10+ pending approvals', value: 12 },
  ],
}

// Data source types
export const mockDataSourceTypes = [
  { type: 'website_crawler', label: 'Website Crawler', description: 'Web sitenizi tarayarak bilgi tabanına ekler' },
]

// Data sources (platform-wide)
export const mockDataSources = [
  { id: 'ds-1', companyId: mockCompanies[0].id, companyName: mockCompanies[0].name, type: 'website_crawler', name: 'Firma Alpha Websitesi', config: { url: 'https://firma-alpha.com' }, status: 'active', errorMessage: null, itemCount: 147, lastSyncAt: '2026-03-27T08:00:00Z', nextSyncAt: '2026-03-28T08:00:00Z', createdAt: '2026-03-20T10:00:00Z' },
  { id: 'ds-2', companyId: mockCompanies[0].id, companyName: mockCompanies[0].name, type: 'website_crawler', name: 'Firma Alpha Blog', config: { url: 'https://blog.firma-alpha.com' }, status: 'active', errorMessage: null, itemCount: 42, lastSyncAt: '2026-03-27T06:00:00Z', nextSyncAt: '2026-03-28T06:00:00Z', createdAt: '2026-03-22T14:00:00Z' },
  { id: 'ds-3', companyId: mockCompanies[1].id, companyName: mockCompanies[1].name, type: 'website_crawler', name: 'Tech Beta Docs', config: { url: 'https://docs.tech-beta.com' }, status: 'syncing', errorMessage: null, itemCount: 89, lastSyncAt: '2026-03-27T10:00:00Z', nextSyncAt: null, createdAt: '2026-03-18T09:00:00Z' },
  { id: 'ds-4', companyId: mockCompanies[4].id, companyName: mockCompanies[4].name, type: 'website_crawler', name: 'CloudNine Help Center', config: { url: 'https://help.cloudnine.ai' }, status: 'error', errorMessage: 'DNS resolution failed for help.cloudnine.ai', itemCount: 0, lastSyncAt: null, nextSyncAt: null, createdAt: '2026-03-25T11:00:00Z' },
]

// Config per company (some configured, some defaults)
export const mockCompanyConfigs: Record<string, any> = {
  [mockCompanies[0].id]: {
    aiConfig: {
      model: 'anthropic/claude-sonnet-4.6',
      compactionModel: 'anthropic/claude-haiku-4-5-20251001',
      apiKey: 'sk-or-a****wxyz',
      language: 'tr',
      summaryModel: 'openai/gpt-4o-mini',
      budgetUsd: 100,
      budgetDowngradeThresholdPct: 80,
    },
    s3Config: {
      bucket: 'firma-alpha-docs',
      region: 'eu-central-1',
    },
    mailConfig: {
      apiKey: 'SG.****abcd',
      fromAddress: 'noreply@firma-alpha.com',
      fromName: 'Firma Alpha',
    },
    langfuseConfig: {
      enabled: true,
      promptLabel: 'firma-alpha',
    },
    limitsConfig: {
      maxStorageMb: 10240,
      maxFileSizeMb: 50,
      crawlMaxPages: 200,
      crawlMaxSources: 10,
      crawlMinIntervalHours: 24,
      crawlConcurrency: 2,
      allowedConnectors: 'website_crawler',
      autoSummarizeEnabled: true,
    },
  },
  [mockCompanies[1].id]: {
    aiConfig: {
      model: 'openai/gpt-4o',
      apiKey: 'sk-or-o****mnop',
      budgetUsd: 50,
    },
  },
}

// Platform defaults
export const mockPlatformDefaults: any = {
  aiConfig: {
    model: 'anthropic/claude-sonnet-4.6',
    compactionModel: 'anthropic/claude-haiku-4-5-20251001',
    titleModel: 'openai/gpt-4o-mini',
    apiKey: 'sk-or-p****efgh',
    language: 'tr',
    summaryModel: 'openai/gpt-4o-mini',
    requestTimeoutMs: 30000,
    budgetUsd: 200,
    budgetDowngradeThresholdPct: 80,
    citationGateMode: 'warn',
    hybridRrfK: 60,
    maxOutputTokensRetryCap: 4096,
    vectorSimilarityThreshold: 0.5,
    qualityEvalEnabled: true,
    qualityEvalModel: 'openai/gpt-4o-mini',
  },
  s3Config: {
    bucket: 'platform-default-bucket',
    region: 'eu-central-1',
    putTtlSec: 3600,
    getTtlSec: 3600,
    deleteTtlSec: 300,
    configCacheTtlMs: 300000,
    accessKeyId: 'AKIA****WXYZ',
    secretAccessKey: 'sk-s3-****abcd',
  },
  mailConfig: {
    apiKey: 'SG.****default',
    fromAddress: 'noreply@platform.com',
    fromName: 'Platform',
  },
  embeddingConfig: {
    model: 'openai/text-embedding-3-small',
    apiKey: 'sk-or-e****ijkl',
    dimensions: 1536,
  },
  langfuseConfig: {
    enabled: false,
    publicKey: 'pk-lf-****abcd',
    secretKey: 'sk-lf-****efgh',
    baseUrl: 'https://cloud.langfuse.com',
    environment: 'production',
    promptManagementEnabled: true,
    promptLabel: 'default',
    promptCacheTtlMs: 300000,
  },
  triggerConfig: {
    projectRef: 'proj_default',
    secretKey: 'tr-****abcd',
    workerEnabled: true,
  },
  limitsConfig: {
    maxStorageMb: 5120,
    maxFileSizeMb: 25,
    supportedFormats: ['pdf', 'docx', 'txt', 'md', 'csv', 'xlsx'],
    chunkMaxChars: 1500,
    chunkOverlapChars: 200,
    embeddingBatchSize: 100,
    historyTokenBudget: 100000,
    compactionTriggerTokens: 80000,
    searchDefaultLimit: 10,
    batchMaxFiles: 50,
    batchMaxTotalSizeMb: 500,
    singleFileMaxSizeMb: 25,
    maxTagsPerDocument: 20,
    maxTagLength: 50,
    approvalTimeoutMinutes: 1440,
    queueConcurrencyExtract: 5,
    queueConcurrencyIngest: 3,
    queueConcurrencyAutoTag: 2,
    crawlMaxPages: 100,
    crawlMaxSources: 5,
    crawlMinIntervalHours: 12,
    crawlConcurrency: 2,
    allowedConnectors: 'website_crawler',
    autoSummarizeEnabled: false,
  },
  crawlerConfig: {
    cloudflareAccountId: 'cf-****abcd',
    cloudflareApiToken: 'cf-tok-****efgh',
    maxGlobalConcurrentCrawls: 3,
  },
  documentProcessingConfig: {
    supportedSourceKinds: ['upload', 'url', 's3'],
    maxAttempts: 3,
    workersEnabled: true,
  },
  pricingConfig: {
    s3PerGbMonthUsd: 0.0245,
    triggerPerTaskUsd: 0.0001,
  },
}

// Pricing plans
export const mockPricingPlans: any[] = [
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

// Revenue analytics
export const mockRevenue = {
  mrrTry: 15640.00,
  mrrUsd: 481.23,
  exchangeRate: 32.50,
  exchangeRateSource: 'tcmb' as const,
  totalActiveCompanies: 6,
  totalCompanies: 8,
  totalActiveUsers: 52,
  byPlan: [
    { planId: 'plan-pro', planName: 'Pro', planSlug: 'pro', companyCount: 3, userCount: 38, planMrrTry: 8970.00, extraUserMrrTry: 1127.00, totalMrrTry: 10097.00 },
    { planId: 'plan-starter', planName: 'Starter', planSlug: 'starter', companyCount: 4, userCount: 14, planMrrTry: 2396.00, extraUserMrrTry: 1089.00, totalMrrTry: 3485.00 },
    { planId: 'plan-enterprise', planName: 'Enterprise', planSlug: 'enterprise', companyCount: 1, userCount: 12, planMrrTry: 0, extraUserMrrTry: 0, totalMrrTry: 0 },
  ],
  totalAiCostUsd: 134.75,
  marginTry: 11261.56,
}

// Email templates
export const mockEmailTemplates: any[] = [
  {
    id: 'et-1', slug: 'welcome', name: 'Hoş Geldiniz',
    subject: '{{companyName}} - Hoş Geldiniz!',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>{{companyName}} ailesine hoş geldiniz!</p><p><a href="{{loginUrl}}">Giriş yapın</a></p><p>Deneme süreniz {{trialEndDate}} tarihinde sona erecektir. Planınız: {{planName}}</p>',
    availableVariables: ['userName', 'companyName', 'loginUrl', 'trialEndDate', 'planName'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'et-2', slug: 'trial_ending', name: 'Deneme Süresi Bitiyor',
    subject: '{{companyName}} - Deneme süreniz {{daysRemaining}} gün sonra bitiyor',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} deneme sürenizin bitmesine {{daysRemaining}} gün kaldı.</p><p>Deneme bitiş: {{trialEndDate}}</p><p><a href="{{upgradeUrl}}">Planınızı yükseltin</a></p>',
    availableVariables: ['companyName', 'adminName', 'daysRemaining', 'trialEndDate', 'upgradeUrl'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-3', slug: 'trial_ended', name: 'Deneme Süresi Doldu',
    subject: '{{companyName}} - Deneme süreniz sona erdi',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} deneme süreniz sona erdi.</p><p><a href="{{upgradeUrl}}">Plan seçin</a></p>',
    availableVariables: ['companyName', 'adminName', 'upgradeUrl'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-4', slug: 'plan_upgraded', name: 'Plan Yükseltildi',
    subject: '{{companyName}} - Planınız yükseltildi!',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{oldPlanName}} → {{newPlanName}} olarak yükseltildi.</p>{{#if prorateTry}}<p>Kıst hesap: {{prorateTry}} TL</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'oldPlanName', 'newPlanName', 'prorateTry'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-5', slug: 'plan_downgrade_scheduled', name: 'Plan Düşürme Planlandı',
    subject: '{{companyName}} - Plan değişikliği planlandı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{currentPlanName}} → {{newPlanName}} olarak {{effectiveDate}} tarihinde değişecektir.</p>',
    availableVariables: ['companyName', 'adminName', 'currentPlanName', 'newPlanName', 'effectiveDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-6', slug: 'downgrade_executed', name: 'Plan Düşürme Uygulandı',
    subject: '{{companyName}} - Plan değişikliği uygulandı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{oldPlanName}} → {{newPlanName}} olarak değiştirildi.</p>{{#if changedFeatures}}<p>Değişen özellikler: {{changedFeatures}}</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'oldPlanName', 'newPlanName', 'changedFeatures'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-7', slug: 'quota_warning', name: 'Kota Uyarısı',
    subject: '{{companyName}} - AI bütçenizin %{{usagePercent}} kullanıldı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} AI bütçenizin %{{usagePercent}} oranında kullanıldı.</p><p>Kota sıfırlama: {{resetDate}}</p>',
    availableVariables: ['companyName', 'adminName', 'usagePercent', 'resetDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-8', slug: 'quota_exhausted', name: 'Kota Doldu',
    subject: '{{companyName}} - AI bütçeniz tükendi',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} AI bütçeniz tamamen kullanıldı.</p><p>Kota sıfırlama: {{resetDate}}</p>',
    availableVariables: ['companyName', 'adminName', 'resetDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-9', slug: 'user_invite', name: 'Kullanıcı Daveti',
    subject: '{{companyName}} - Davet edildiniz!',
    bodyHtml: '<h2>Merhaba!</h2><p>{{inviterName}} sizi {{companyName}} ekibine {{role}} olarak davet etti.</p><p><a href="{{acceptUrl}}">Daveti kabul edin</a></p><p>Bu davet {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['companyName', 'inviterName', 'role', 'acceptUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'et-10', slug: 'password_reset', name: 'Şifre Sıfırlama',
    subject: 'Şifre sıfırlama talebi',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın.</p><p><a href="{{resetUrl}}">Şifremi sıfırla</a></p><p>Bu bağlantı {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['userName', 'resetUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-11', slug: 'email_verification', name: 'Email Doğrulama',
    subject: 'Email adresinizi doğrulayın',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>Email adresinizi doğrulamak için:</p><p><a href="{{verificationUrl}}">Email adresimi doğrula</a></p><p>Bu bağlantı {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['userName', 'verificationUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-12', slug: 'payment_succeeded', name: 'Ödeme Başarılı',
    subject: '{{companyName}} - Ödemeniz alındı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için {{amount}} {{currency}} tutarında ödemeniz başarıyla alındı.</p>{{#if invoiceUrl}}<p><a href="{{invoiceUrl}}">Faturayı görüntüle</a></p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'amount', 'currency', 'invoiceUrl'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-13', slug: 'payment_failed', name: 'Ödeme Başarısız',
    subject: '{{companyName}} - Ödemeniz başarısız oldu',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için ödemeniz başarısız oldu.</p><p><a href="{{retryUrl}}">Ödeme bilgilerini güncelleyin</a></p>{{#if nextAttemptDate}}<p>Sonraki deneme: {{nextAttemptDate}}</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'retryUrl', 'nextAttemptDate'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-14', slug: 'invoice_sent', name: 'Fatura Gönderildi',
    subject: '{{companyName}} - Fatura #{{invoiceNumber}}',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için {{amount}} {{currency}} tutarında faturanız hazırlandı.</p><p><a href="{{downloadUrl}}">Faturayı indir</a></p>',
    availableVariables: ['companyName', 'adminName', 'invoiceNumber', 'amount', 'currency', 'downloadUrl'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-15', slug: 'user_joined', name: 'Yeni Üye Katıldı',
    subject: '{{companyName}} - Yeni üye: {{newUserName}}',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{newUserName}} ({{newUserEmail}}) {{companyName}} ekibine {{newUserRole}} olarak katıldı.</p>',
    availableVariables: ['companyName', 'adminName', 'newUserName', 'newUserEmail', 'newUserRole'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]

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
  mockBillingEvents[c.id] = events.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Search analytics generator
export function generateSearchAnalytics(windowDays: number) {
  const scale = windowDays / 30
  const totalQueries = Math.round(600 * scale)
  const emptyQueries = Math.round(15 * scale)
  const emptyRate = +(emptyQueries / totalQueries).toFixed(4)

  const topQueries = [
    { queryText: 'is sozlesmesi feshi', count: 48, emptyRate: 0.02 },
    { queryText: 'kidem tazminati hesaplama', count: 42, emptyRate: 0.0 },
    { queryText: 'yillik izin haklari', count: 37, emptyRate: 0.03 },
    { queryText: 'SGK bildirgeleri', count: 33, emptyRate: 0.06 },
    { queryText: 'vergi muafiyeti kosullari', count: 29, emptyRate: 0.1 },
    { queryText: 'ihbar suresi hesaplama', count: 25, emptyRate: 0.0 },
    { queryText: 'fazla mesai ucreti', count: 22, emptyRate: 0.05 },
    { queryText: 'ise iade davasi', count: 19, emptyRate: 0.08 },
    { queryText: 'is kazasi bildirimi', count: 16, emptyRate: 0.12 },
    { queryText: 'toplu is sozlesmesi', count: 14, emptyRate: 0.07 },
  ].map((q) => ({ ...q, count: Math.round(q.count * scale) }))

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const unansweredQueries = [
    { queryText: 'uzaktan calisma yonetmeligi 2026', count: 8, lastAsked: new Date(now - 1 * dayMs).toISOString() },
    { queryText: 'esnek calisma saatleri kanun', count: 5, lastAsked: new Date(now - 3 * dayMs).toISOString() },
    { queryText: 'yapay zeka is hukuku', count: 4, lastAsked: new Date(now - 2 * dayMs).toISOString() },
    { queryText: 'kripto varlik vergilendirme', count: 3, lastAsked: new Date(now - 5 * dayMs).toISOString() },
    { queryText: 'yesil enerji tesvik mevzuati', count: 2, lastAsked: new Date(now - 7 * dayMs).toISOString() },
  ].map((q) => ({ ...q, count: Math.round(q.count * scale) || 1 }))

  const byTool: Record<string, { total: number; empty: number; avgResponseTimeMs: number }> = {
    search_knowledge_base: { total: Math.round(380 * scale), empty: Math.round(8 * scale), avgResponseTimeMs: 280 },
    search_drive_documents: { total: Math.round(150 * scale), empty: Math.round(5 * scale), avgResponseTimeMs: 420 },
    search_notes: { total: Math.round(70 * scale), empty: Math.round(2 * scale), avgResponseTimeMs: 190 },
  }

  const feedbackCorrelation = {
    queriesWithNegativeFeedback: 23,
    topNegativeQueries: [
      { queryText: 'is kazasi bildirimi', negativeCount: 6, totalCount: 16 },
      { queryText: 'vergi muafiyeti kosullari', negativeCount: 5, totalCount: 29 },
      { queryText: 'SGK bildirgeleri', negativeCount: 4, totalCount: 33 },
      { queryText: 'ise iade davasi', negativeCount: 4, totalCount: 19 },
      { queryText: 'fazla mesai ucreti', negativeCount: 3, totalCount: 22 },
    ],
  }

  const dailyTrend: Array<{ date: string; total: number; empty: number }> = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs).toISOString().slice(0, 10)
    const total = 15 + Math.floor(Math.random() * 12)
    const empty = Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0
    dailyTrend.push({ date, total, empty })
  }

  return {
    windowDays,
    totalQueries,
    emptyQueries,
    emptyRate,
    avgResultCount: 4.2,
    avgResponseTimeMs: 340,
    topQueries,
    unansweredQueries,
    byTool,
    feedbackCorrelation,
    dailyTrend,
  }
}

// Activity log per company
const activityActions: Record<string, string[]> = {
  auth: ['auth.login', 'auth.logout', 'auth.register', 'auth.email_verified', 'auth.invite_accepted', 'auth.password_reset', 'auth.logout_all'],
  user: ['user.profile_updated', 'user.password_changed'],
  document: ['document.uploaded', 'document.renamed', 'document.deleted', 'document.permanently_deleted', 'document.restored', 'document.moved', 'document.starred', 'document.content_updated', 'document.tags_updated'],
  folder: ['folder.created', 'folder.renamed', 'folder.deleted', 'folder.permanently_deleted', 'folder.restored', 'folder.moved'],
  knowledge: ['knowledge.created', 'knowledge.created_batch', 'knowledge.deleted', 'knowledge.tags_updated'],
  conversation: ['conversation.created', 'conversation.updated', 'conversation.deleted', 'conversation.message_sent', 'conversation.tool_approved', 'conversation.tool_rejected'],
  company: ['company.updated', 'company.invite_sent', 'company.invite_revoked', 'company.user_role_changed', 'company.user_deactivated'],
  connector: ['connector.created', 'connector.updated', 'connector.deleted', 'connector.sync_started'],
  note: ['note.created', 'note.updated', 'note.deleted'],
}
const activityCategories = Object.keys(activityActions)

function generateActivityLog(companyId: string) {
  const users = mockUsers[companyId] ?? []
  const userIds = users.map((u: any) => u.id)
  const count = 80 + Math.floor(Math.random() * 21)
  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  return Array.from({ length: count }, (_, i) => {
    const category = activityCategories[i % activityCategories.length]
    const actions = activityActions[category]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const userId = userIds.length > 0 ? userIds[Math.floor(Math.random() * userIds.length)] : null
    const createdAt = new Date(now - Math.floor(Math.random() * thirtyDaysMs)).toISOString()
    return {
      id: `al-${companyId.slice(0, 4)}-${i}`,
      companyId,
      userId,
      action,
      category,
      resourceId: ['auth', 'user', 'company'].includes(category) ? null : `res-${Math.floor(Math.random() * 999)}`,
      resourceType: ['auth', 'user', 'company'].includes(category) ? null : category,
      metadata: null,
      createdAt,
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const mockActivityLog: Record<string, any[]> = {}
mockCompanies.forEach((c: any) => {
  mockActivityLog[c.id] = generateActivityLog(c.id)
})
