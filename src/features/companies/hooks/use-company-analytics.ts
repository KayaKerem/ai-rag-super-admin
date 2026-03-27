import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CompanyAnalytics } from '../types'

export function useCompanyAnalytics(companyId: string, months: number = 3) {
  return useQuery({
    queryKey: queryKeys.companies.analytics(companyId, months),
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyAnalytics>(`/platform/companies/${companyId}/analytics?months=${months}`)
      return data
    },
    enabled: !!companyId,
  })
}
