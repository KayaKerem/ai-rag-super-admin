// Dummy data for all API endpoints

export const mockCompanies = [
  { id: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6', name: 'Firma Alpha', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-20T14:30:00Z' },
  { id: 'c2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7', name: 'Tech Beta', createdAt: '2026-02-22T09:15:00Z', updatedAt: '2026-03-18T11:20:00Z' },
  { id: 'c3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8', name: 'Green Corp', createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-25T16:45:00Z' },
  { id: 'c4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9', name: 'Data Dynamics', createdAt: '2025-11-10T12:00:00Z', updatedAt: '2026-03-22T09:10:00Z' },
  { id: 'c5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', name: 'CloudNine AI', createdAt: '2025-12-05T15:30:00Z', updatedAt: '2026-03-24T13:00:00Z' },
  { id: 'c6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1', name: 'Stellar Systems', createdAt: '2026-01-28T11:00:00Z', updatedAt: '2026-03-19T10:20:00Z' },
  { id: 'c7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2', name: 'Nexus Labs', createdAt: '2026-02-14T08:45:00Z', updatedAt: '2026-03-23T17:00:00Z' },
  { id: 'c8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3', name: 'Apex Digital', createdAt: '2026-03-05T14:00:00Z', updatedAt: '2026-03-25T08:30:00Z' },
]

function generateUsageMonth(month: string, scale: number) {
  const aiTokens = Math.floor((800000 + Math.random() * 600000) * scale)
  const aiCost = +(aiTokens * 0.00001).toFixed(2)
  const storageBytes = Math.floor((2 + Math.random() * 8) * 1e9 * scale)
  const storageCost = +((storageBytes / 1e9) * 0.0245).toFixed(2)
  const cdnBytes = Math.floor((5 + Math.random() * 30) * 1e9 * scale)
  const cdnCost = +((cdnBytes / 1e9) * 0.085).toFixed(2)
  const taskCount = Math.floor((100 + Math.random() * 400) * scale)
  const triggerCost = +(taskCount * 0.0001).toFixed(4)
  return {
    month,
    ai: { totalTokens: aiTokens, turnCount: Math.floor(aiTokens / 15000), costUsd: aiCost },
    storage: { currentBytes: storageBytes, costUsd: storageCost },
    cdn: { transferBytes: cdnBytes, costUsd: cdnCost },
    trigger: { taskCount, costUsd: triggerCost },
    totalCostUsd: +(aiCost + storageCost + cdnCost + triggerCost).toFixed(2),
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
      cdn: {
        transferBytes: allCompanyMonths.reduce((s, u) => s + u.cdn.transferBytes, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.cdn.costUsd, 0).toFixed(2),
      },
      trigger: {
        taskCount: allCompanyMonths.reduce((s, u) => s + u.trigger.taskCount, 0),
        costUsd: +allCompanyMonths.reduce((s, u) => s + u.trigger.costUsd, 0).toFixed(4),
      },
      totalCostUsd: +allCompanyMonths.reduce((s, u) => s + u.totalCostUsd, 0).toFixed(2),
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

// Available OpenRouter models
export const mockPlatformModels = [
  { id: 'anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', tier: 'premium', pricing: { inputPerMtok: 3.0, outputPerMtok: 15.0 }, isDefaultForTier: true },
  { id: 'anthropic/claude-opus-4.6', label: 'Claude Opus 4.6', tier: 'premium', pricing: { inputPerMtok: 5.0, outputPerMtok: 25.0 }, isDefaultForTier: false },
  { id: 'openai/gpt-4.1', label: 'GPT 4.1', tier: 'premium', pricing: { inputPerMtok: 2.0, outputPerMtok: 8.0 }, isDefaultForTier: false },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'premium', pricing: { inputPerMtok: 1.25, outputPerMtok: 10.0 }, isDefaultForTier: false },
  { id: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: 'standard', pricing: { inputPerMtok: 1.0, outputPerMtok: 5.0 }, isDefaultForTier: true },
  { id: 'openai/gpt-4.1-mini', label: 'GPT 4.1 Mini', tier: 'standard', pricing: { inputPerMtok: 0.4, outputPerMtok: 1.6 }, isDefaultForTier: false },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'standard', pricing: { inputPerMtok: 0.3, outputPerMtok: 2.5 }, isDefaultForTier: false },
  { id: 'openai/gpt-4o-mini', label: 'GPT 4o Mini', tier: 'economy', pricing: { inputPerMtok: 0.15, outputPerMtok: 0.6 }, isDefaultForTier: true },
]

// Tool governance
export const mockRegisteredTools = [
  { id: 'search_knowledge_base', label: 'Bilgi Bankası Arama', description: 'Bilgi tabanında arama yapar', category: 'search', requiresApproval: false },
  { id: 'search_drive_documents', label: 'Doküman Arama', description: 'Yüklenen dokümanlarda arama yapar', category: 'search', requiresApproval: false },
  { id: 'list_knowledge_categories', label: 'Kategori Listele', description: 'Bilgi bankası kategorilerini listeler', category: 'search', requiresApproval: false },
  { id: 'search_templates', label: 'Şablon Arama', description: 'Şablon kütüphanesinde arama yapar', category: 'template', requiresApproval: false },
  { id: 'retrieve_template', label: 'Şablon Öner', description: 'Göreve uygun şablon önerir', category: 'template', requiresApproval: false },
  { id: 'fill_template', label: 'Şablon Doldur', description: 'Şablonu doldurarak belge üretir', category: 'template', requiresApproval: true },
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
      tools: ['search_knowledge_base', 'list_knowledge_categories', 'search_drive_documents', 'search_templates', 'retrieve_template'],
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

// Config per company (some configured, some defaults)
export const mockCompanyConfigs: Record<string, any> = {
  [mockCompanies[0].id]: {
    aiConfig: {
      model: 'anthropic/claude-sonnet-4.6',
      compactionModel: 'anthropic/claude-haiku-4-5-20251001',
      apiKey: 'sk-or-a****wxyz',
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
    requestTimeoutMs: 30000,
    budgetUsd: 200,
    budgetDowngradeThresholdPct: 80,
    citationGateMode: 'warn',
    hybridRrfK: 60,
    maxOutputTokensRetryCap: 4096,
    vectorSimilarityThreshold: 0.5,
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
  cdnConfig: {
    enabled: true,
    domain: 'cdn.platform.com',
    keyPairId: 'KPID****1234',
    privateKey: 'pk-****5678',
    ttlSec: 3600,
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
  },
  documentProcessingConfig: {
    textractEndpoint: 'https://textract.eu-central-1.amazonaws.com',
    supportedSourceKinds: ['upload', 'url', 's3'],
    maxAttempts: 3,
    syncTextractMaxSizeMb: 5,
    workersEnabled: true,
  },
  pricingConfig: {
    s3PerGbMonthUsd: 0.0245,
    cdnPerGbTransferUsd: 0.085,
    triggerPerTaskUsd: 0.0001,
  },
}
