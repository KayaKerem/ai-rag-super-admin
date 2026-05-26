import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export interface CapViolationRow {
  capKind: string
  source: string
  count: number
  lastViolationAt: string
}

export interface CapViolationsAggregateResponse {
  rows: CapViolationRow[]
  effectiveModeByCompany: Record<string, 'enforced' | 'warn' | 'dry-run'>
}

export function useCapViolationsAggregate(params: {
  from?: string
  to?: string
  companyId?: string
  capKind?: string
  source?: string
}) {
  return useQuery({
    queryKey: queryKeys.admin.capViolationsAggregate(params),
    queryFn: async () => {
      const qs = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
      const { data } = await apiClient.get<CapViolationsAggregateResponse>(
        `/platform/cap-violations/aggregate?${qs}`
      )
      return data
    },
  })
}
