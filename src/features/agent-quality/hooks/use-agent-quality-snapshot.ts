import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualitySnapshotResponse } from '../types'

export function useAgentQualitySnapshot(windowDays: number) {
  return useQuery<AgentQualitySnapshotResponse>({
    queryKey: queryKeys.admin.agentQuality.snapshot(windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualitySnapshotResponse>(
        '/platform/admin/agent-quality',
        { params: { windowDays } }
      )
      return data
    },
    staleTime: 60_000,
  })
}
