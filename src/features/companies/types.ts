export interface Company {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CompanyUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  companyId: string
  isActive: boolean
  isPlatformAdmin: boolean
  createdAt: string
}

export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  storage: { currentBytes: number; costUsd: number }
  cdn: { transferBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}

export interface CompanyUsage {
  companyId: string
  companyName: string
  months: UsageMonth[]
}

export interface PlatformModel {
  id: string
  label: string
  tier: 'premium' | 'standard' | 'economy'
  pricing: { inputPerMtok: number; outputPerMtok: number }
  isDefaultForTier: boolean
}

export interface AllowedModel {
  id: string
  label?: string
  tier?: 'premium' | 'standard' | 'economy'
  isDefault?: boolean
}

// ─── Tool Governance ────────────────────────────────

export interface RegisteredTool {
  id: string
  label: string
  description: string
  category: string
  requiresApproval: boolean
}

export interface ToolPlan {
  label: string
  description: string
  tools: string[]
}

export interface ToolPlansResponse {
  defaultPlan: string
  plans: Record<string, ToolPlan>
  registeredTools: RegisteredTool[]
}

export interface ResolvedTool {
  id: string
  label: string
  category: string
  requiresApproval: boolean
  enabled: boolean
  source: 'plan' | 'override' | 'not_in_plan'
}

export interface CompanyToolConfig {
  plan: string
  overrides: Record<string, boolean>
  resolvedTools: ResolvedTool[]
}

// ─── Analytics ─────────────────────────────────────

export interface AnalyticsMonth {
  month: string
  conversations: { total: number; activeUsers: number }
  turns: { total: number; avgPerConversation: number }
  feedback: {
    totalRatings: number
    positiveCount: number
    negativeCount: number
    satisfactionRate: number
    topReasons: Array<{ code: string; count: number }>
  }
  quality: {
    avgGroundedness: number
    avgRelevance: number
    lowQualityCount: number
    evaluatedCount: number
  }
  tools: {
    totalCalls: number
    byTool: Array<{ name: string; count: number }>
  }
  search: { noResultCount: number; noResultRate: number }
}

export interface CompanyAnalytics {
  companyId: string
  companyName: string
  months: AnalyticsMonth[]
}
