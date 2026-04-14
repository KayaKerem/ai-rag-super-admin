import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ServiceAccount, CreateServiceAccountRequest, UpdateServiceAccountRequest } from '@/features/companies/types'

export function useServiceAccounts() {
  return useQuery({
    queryKey: queryKeys.platform.serviceAccounts,
    queryFn: async (): Promise<ServiceAccount[]> => {
      const { data } = await apiClient.get('/platform/service-accounts')
      return data
    },
  })
}

export function useRevealPassword(id: string) {
  return useMutation({
    mutationFn: async (): Promise<ServiceAccount> => {
      const { data } = await apiClient.get(`/platform/service-accounts/${id}/reveal`)
      return data
    },
  })
}

export function useCreateServiceAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateServiceAccountRequest): Promise<ServiceAccount> => {
      const { data } = await apiClient.post('/platform/service-accounts', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.serviceAccounts })
    },
  })
}

export function useUpdateServiceAccount(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateServiceAccountRequest): Promise<ServiceAccount> => {
      const { data } = await apiClient.patch(`/platform/service-accounts/${id}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.serviceAccounts })
    },
  })
}

export function useDeleteServiceAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/platform/service-accounts/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.serviceAccounts })
    },
  })
}
