import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { PlatformModel } from '../types'

export function usePlatformModels() {
  return useQuery({
    queryKey: queryKeys.platform.models,
    queryFn: async () => {
      const { data } = await apiClient.get<PlatformModel[]>('/platform/models')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
