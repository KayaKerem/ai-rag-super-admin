import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CostHealthResponse, ResolvedCostHealthRange } from '../types'

export interface UseCostHealthArgs {
  companyId: string | null
  range: ResolvedCostHealthRange
}

export function useCostHealth({ companyId, range }: UseCostHealthArgs) {
  const fromIso = range.from?.toISOString() ?? null
  const toIso = range.to?.toISOString() ?? null

  return useQuery<CostHealthResponse>({
    queryKey: queryKeys.admin.costHealth({ companyId, fromIso, toIso }),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (companyId) params.companyId = companyId
      if (fromIso) params.from = fromIso
      if (toIso) params.to = toIso
      const { data } = await apiClient.get<CostHealthResponse>(
        '/platform/admin/cost-health',
        { params }
      )
      return data
    },
    staleTime: 60_000,
  })
}
