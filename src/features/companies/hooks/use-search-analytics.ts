import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { SearchAnalytics } from '../types'

export function useSearchAnalytics(companyId: string, windowDays = 30) {
  return useQuery({
    queryKey: queryKeys.companies.searchAnalytics(companyId, windowDays),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchAnalytics>(
        `/platform/companies/${companyId}/search-analytics`,
        { params: { windowDays } }
      )
      return data
    },
    enabled: !!companyId,
  })
}
