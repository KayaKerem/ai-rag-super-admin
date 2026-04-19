import { useQuery, useMutation } from '@tanstack/react-query'
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
    queryKey: [
      ...queryKeys.companies.activityLog(companyId),
      params.category ?? '',
      params.action ?? '',
      params.startDate ?? '',
      params.endDate ?? '',
      params.limit ?? 0,
      params.offset ?? 0,
    ],
    queryFn: async (): Promise<ActivityLogResponse> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/activity-log`, { params })
      return data
    },
    enabled: !!companyId,
  })
}

export interface IntegrityResult {
  valid: boolean
  totalEntries: number
}

export function useVerifyActivityLogIntegrity(companyId: string) {
  return useMutation({
    mutationFn: async (): Promise<IntegrityResult> => {
      const { data } = await apiClient.post(`/platform/companies/${companyId}/activity-log/verify-integrity`)
      return data
    },
  })
}
