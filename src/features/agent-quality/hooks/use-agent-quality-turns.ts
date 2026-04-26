import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  AgentQualityMetric,
  AgentQualityTurnsResponse,
} from '../types'
import { TURNS_PAGE_SIZE } from '../types'

export interface UseAgentQualityTurnsArgs {
  companyId: string
  metric: AgentQualityMetric
  date: string
  page: number
}

export function useAgentQualityTurns(args: UseAgentQualityTurnsArgs | null) {
  return useQuery<AgentQualityTurnsResponse>({
    queryKey: queryKeys.admin.agentQuality.turns({
      companyId: args?.companyId ?? '',
      metric: args?.metric ?? 'guardrail',
      date: args?.date ?? '',
      page: args?.page ?? 1,
      pageSize: TURNS_PAGE_SIZE,
    }),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentQualityTurnsResponse>(
        `/platform/admin/agent-quality/${args!.companyId}/turns`,
        {
          params: {
            metric: args!.metric,
            date: args!.date,
            page: args!.page,
            pageSize: TURNS_PAGE_SIZE,
          },
        }
      )
      return data
    },
    staleTime: 60_000,
    enabled: !!args,
  })
}
