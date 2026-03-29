import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { PricingPlan, CreatePlanRequest, DeletePlanResponse } from '../types'

export function usePricingPlans(includeInactive = false) {
  return useQuery({
    queryKey: [...queryKeys.platform.plans, includeInactive],
    queryFn: async (): Promise<PricingPlan[]> => {
      const { data } = await apiClient.get(`/platform/plans${includeInactive ? '?includeInactive=true' : ''}`)
      return data
    },
  })
}

export function usePricingPlan(id: string) {
  return useQuery({
    queryKey: queryKeys.platform.planDetail(id),
    queryFn: async (): Promise<PricingPlan> => {
      const { data } = await apiClient.get(`/platform/plans/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreatePlanRequest): Promise<PricingPlan> => {
      const { data } = await apiClient.post('/platform/plans', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
    },
  })
}

export function useUpdatePricingPlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<CreatePlanRequest>): Promise<PricingPlan> => {
      const { data } = await apiClient.patch(`/platform/plans/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
      qc.invalidateQueries({ queryKey: queryKeys.platform.planDetail(id) })
    },
  })
}

export function useDeletePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<DeletePlanResponse> => {
      const { data } = await apiClient.delete(`/platform/plans/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.plans })
    },
  })
}
