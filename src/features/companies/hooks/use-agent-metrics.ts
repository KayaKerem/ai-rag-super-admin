import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentMetrics } from '../types'

export function useAgentMetrics(companyId: string, windowDays: number = 30) {
  return useQuery({
    queryKey: queryKeys.companies.agentMetrics(companyId, windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentMetrics>(
        `/platform/companies/${companyId}/agent-metrics?windowDays=${windowDays}`
      )
      return data
    },
    enabled: !!companyId,
  })
}
