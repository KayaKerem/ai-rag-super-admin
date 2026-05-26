import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AgentQualitySnapshotResponse } from '../types'

export function useAgentQualitySnapshot(windowDays: number, agentId?: string) {
  return useQuery<AgentQualitySnapshotResponse>({
    queryKey: queryKeys.admin.agentQuality.snapshot(windowDays, agentId),
    queryFn: async () => {
      const params: Record<string, string | number> = { windowDays }
      if (agentId) params.agentId = agentId
      const { data } = await apiClient.get<AgentQualitySnapshotResponse>(
        '/platform/admin/agent-quality',
        { params }
      )
      return data
    },
    staleTime: 60_000,
  })
}
