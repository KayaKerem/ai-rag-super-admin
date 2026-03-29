import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { AssignPlanResponse } from '../types'

export function useAssignCompanyPlan(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (planId: string | null): Promise<AssignPlanResponse> => {
      const { data } = await apiClient.put(`/platform/companies/${companyId}/plan`, { planId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
      qc.invalidateQueries({ queryKey: queryKeys.platform.revenue })
    },
  })
}

export function useCancelDowngrade(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/platform/companies/${companyId}/pending-plan`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.detail(companyId) })
      qc.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
