import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

interface UsageMonth {
  month: string
  companyCount: number
  ai: { totalTokens: number; costUsd: number }
  rerank: { searchCount: number; costUsd: number }
  webSearch: { searchCount: number; costUsd: number }
  proactive: { runCount: number; costUsd: number }
  research: { callCount: number; costUsd: number }
  quotePrepare: { callCount: number; costUsd: number }
  storage: { totalBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
  satisfactionRate?: number
  totalActiveUsers?: number
}

interface PlatformSummary {
  months: UsageMonth[]
}

export function usePlatformSummary(months: number = 6) {
  return useQuery({
    queryKey: queryKeys.platform.summary(months),
    queryFn: async (): Promise<PlatformSummary> => {
      const { data } = await apiClient.get(`/platform/usage/summary?months=${months}`)
      return data
    },
  })
}
