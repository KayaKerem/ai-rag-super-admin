import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CompanyUser } from '../types'

export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.users(companyId),
    queryFn: async (): Promise<CompanyUser[]> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/users`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useInviteUser(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; role: 'owner' | 'admin' | 'member' }) => {
      const { data } = await apiClient.post(`/platform/companies/${companyId}/users/invite`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useUpdateUserRole(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/users/${userId}`, { role })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useDeactivateUser(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/platform/companies/${companyId}/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useBulkImportUsers(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post(`/platform/companies/${companyId}/users/bulk-import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}
