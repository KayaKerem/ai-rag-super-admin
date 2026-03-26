import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ToolPlansResponse } from '../types'

export function useToolPlans() {
  return useQuery({
    queryKey: queryKeys.platform.toolPlans,
    queryFn: async () => {
      const { data } = await apiClient.get<ToolPlansResponse>('/platform/tool-plans')
      return data
    },
  })
}

export function useUpdateToolPlans() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { defaultPlan: string; plans: ToolPlansResponse['plans'] }) => {
      const { data } = await apiClient.put('/platform/tool-plans', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.toolPlans })
    },
  })
}
