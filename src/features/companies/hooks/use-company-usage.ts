import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { UsageMonth } from '../types'

export function useCompanyUsageCurrent(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.usageCurrent(companyId),
    queryFn: async (): Promise<UsageMonth> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/usage/current`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useCompanyUsage(companyId: string, months: number = 6) {
  return useQuery({
    queryKey: queryKeys.companies.usage(companyId, months),
    queryFn: async () => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/usage?months=${months}`)
      return data
    },
    enabled: !!companyId,
  })
}
