import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export type UpdateCompanyPayload = Partial<Pick<Company, 'name' | 'customerAgentTrustLevel' | 'autoApproveQuoteThreshold' | 'approvalTimeoutMinutes' | 'approvalTimeoutAction' | 'customerOperationsBudgetUsd'>>

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async (): Promise<Company> => {
      const { data } = await apiClient.get(`/platform/companies/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateCompanyPayload) => {
      const { data } = await apiClient.patch(`/platform/companies/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platform/companies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
