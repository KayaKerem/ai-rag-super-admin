import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ActivityLogResponse } from '../types'

interface ActivityLogParams {
  category?: string
  action?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export function useActivityLog(companyId: string, params: ActivityLogParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.companies.activityLog(companyId), params],
    queryFn: async (): Promise<ActivityLogResponse> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/activity-log`, { params })
      return data
    },
    enabled: !!companyId,
  })
}
