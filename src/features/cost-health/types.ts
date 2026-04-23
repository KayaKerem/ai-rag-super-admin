export type CostSource = 'provider' | 'estimate' | 'missing' | 'legacy'
export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface CostBucket {
  costUsd: number
  eventCount: number
  pct: number
}

export interface CostByEventType {
  eventType: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostByModel {
  modelName: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostHealthResponse {
  periodStart: string
  periodEnd: string
  totalCostUsd: number
  breakdown: Record<CostSource, CostBucket>
  byEventType: CostByEventType[]
  byModel: CostByModel[]
}

export interface CostHealthFilters {
  companyId: string | null
  preset: DatePreset
  from: Date | null
  to: Date | null
}

export interface ResolvedCostHealthRange {
  from: Date | null
  to: Date | null
}
