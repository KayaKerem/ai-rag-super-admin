import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { UpdateCompanyStatusResponse, BillingEvent } from '../types'

export function useUpdateCompanyStatus(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status: 'active' | 'suspended' | 'cancelled'): Promise<UpdateCompanyStatusResponse> => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/status`, { status })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
      qc.invalidateQueries({ queryKey: queryKeys.companies.billingEvents(companyId) })
    },
  })
}

export function useCompanyBillingEvents(companyId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.companies.billingEvents(companyId),
    queryFn: async (): Promise<BillingEvent[]> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/billing-events?limit=${limit}`)
      return data
    },
    enabled: !!companyId,
  })
}
