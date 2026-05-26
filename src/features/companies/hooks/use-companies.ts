import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export function useCompanies(params: { limit?: number; offset?: number } = {}) {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0
  return useQuery({
    queryKey: [...queryKeys.companies.all, { limit, offset }] as const,
    queryFn: async (): Promise<Company[]> => {
      const { data } = await apiClient.get<Company[]>(
        `/platform/companies?limit=${limit}&offset=${offset}`
      )
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; planId?: string }): Promise<Company> => {
      const { data } = await apiClient.post('/platform/companies', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
