import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

interface AgentQualityAlertCountResponse {
  open: number
}

export function useAgentQualityAlertCount() {
  return useQuery<AgentQualityAlertCountResponse>({
    queryKey: queryKeys.admin.agentQualityAlerts.count(),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityAlertCountResponse>(
        '/platform/admin/agent-quality/alerts/count'
      )
      return data
    },
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false, // sessiz fail — eski sayı korunur
  })
}
