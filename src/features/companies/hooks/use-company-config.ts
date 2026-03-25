import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function useCompanyConfig(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.config(companyId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/config`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useUpdateCompanyConfig(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      const { data } = await apiClient.put(`/platform/companies/${companyId}/config`, config)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.config(companyId) })
    },
  })
}
