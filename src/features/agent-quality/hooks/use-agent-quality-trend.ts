import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualityTrendResponse } from '../types'

export function useAgentQualityTrend(
  companyId: string | null,
  windowDays: number
) {
  return useQuery<AgentQualityTrendResponse>({
    queryKey: queryKeys.admin.agentQuality.trend(companyId ?? '', windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityTrendResponse>(
        `/platform/admin/agent-quality/${companyId}/trend`,
        { params: { windowDays } }
      )
      return data
    },
    staleTime: 5 * 60_000,
    enabled: !!companyId,
  })
}
