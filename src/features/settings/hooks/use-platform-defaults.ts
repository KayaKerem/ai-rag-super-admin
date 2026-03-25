import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function usePlatformDefaults() {
  return useQuery({
    queryKey: queryKeys.platform.defaults,
    queryFn: async () => {
      const { data } = await apiClient.get('/platform/config/defaults')
      return data
    },
  })
}

export function useUpdatePlatformDefaults() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      const { data } = await apiClient.put('/platform/config/defaults', config)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.defaults })
    },
  })
}
