import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Lead, PermanentDeleteResponse } from '../types'

export function useCompanyLeads(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.leads(companyId),
    queryFn: async (): Promise<{ items: Lead[]; total: number }> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/leads`)
      return data
    },
    enabled: !!companyId,
  })
}

export function usePermanentDeleteLead(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (leadId: string): Promise<PermanentDeleteResponse> => {
      const { data } = await apiClient.delete(`/platform/companies/${companyId}/leads/${leadId}/permanent`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.leads(companyId) })
    },
  })
}
