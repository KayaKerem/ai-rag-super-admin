import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  AgentQualityAlertsFilters,
  AgentQualityAlertsResponse,
} from '../types'

export function useAgentQualityAlerts(filters: AgentQualityAlertsFilters) {
  return useQuery<AgentQualityAlertsResponse>({
    queryKey: queryKeys.admin.agentQualityAlerts.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        status: filters.status,
        page: filters.page,
        pageSize: filters.pageSize,
      }
      if (filters.companyId) params.companyId = filters.companyId
      if (filters.metric) params.metric = filters.metric
      const { data } = await apiClient.get<AgentQualityAlertsResponse>(
        '/platform/admin/agent-quality/alerts',
        { params }
      )
      return data
    },
    staleTime: 30_000,
  })
}
