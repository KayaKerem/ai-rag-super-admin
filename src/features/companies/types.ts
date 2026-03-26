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
