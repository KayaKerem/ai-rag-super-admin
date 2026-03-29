import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { RevenueData } from '@/features/companies/types'

export function useRevenue() {
  return useQuery({
    queryKey: queryKeys.platform.revenue,
    queryFn: async (): Promise<RevenueData> => {
      const { data } = await apiClient.get('/platform/revenue')
      return data
    },
  })
}
