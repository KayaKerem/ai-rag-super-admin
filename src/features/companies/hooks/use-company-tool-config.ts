import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CompanyToolConfig } from '../types'

export function useCompanyToolConfig(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.toolConfig(companyId),
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyToolConfig>(`/platform/companies/${companyId}/tool-config`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useUpdateCompanyToolConfig(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { plan: string; overrides?: Record<string, boolean> }) => {
      const { data } = await apiClient.put(`/platform/companies/${companyId}/tool-config`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.companies.toolConfig(companyId) })
    },
  })
}
