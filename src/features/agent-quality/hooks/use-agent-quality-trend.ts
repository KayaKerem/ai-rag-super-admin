import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualityTrendResponse } from '../types'

export function useAgentQualityTrend(
  companyId: string | null,
  windowDays: number,
  agentId?: string
) {
  return useQuery<AgentQualityTrendResponse>({
    queryKey: queryKeys.admin.agentQuality.trend(companyId ?? '', windowDays, agentId),
    queryFn: async () => {
      const params: Record<string, string | number> = { windowDays }
      if (agentId) params.agentId = agentId
      const { data } = await apiClient.get<AgentQualityTrendResponse>(
        `/platform/admin/agent-quality/${companyId}/trend`,
        { params }
      )
      return data
    },
    staleTime: 5 * 60_000,
    enabled: !!companyId,
  })
}
