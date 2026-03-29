import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: async (): Promise<Company[]> => {
      const { data } = await apiClient.get('/platform/companies')
      return data
    },
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
