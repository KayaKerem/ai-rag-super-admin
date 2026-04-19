import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ProactiveInsight, ProactiveInsightSummary, ProactiveInsightStatus } from '../types'

interface InsightFilters {
  agentType?: string
  status?: string
  limit?: number
  offset?: number
}

export function useProactiveInsights(companyId: string, filters: InsightFilters = {}) {
  const { agentType, status, limit = 20, offset = 0 } = filters
  return useQuery({
    queryKey: queryKeys.companies.proactiveInsights(companyId, agentType, status),
    queryFn: async (): Promise<{ items: ProactiveInsight[]; total: number }> => {
      const params = new URLSearchParams()
      if (agentType) params.set('agentType', agentType)
      if (status) params.set('status', status)
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const { data } = await apiClient.get(`/platform/companies/${companyId}/insights?${params}`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useProactiveInsightSummary(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.proactiveInsightSummary(companyId),
    queryFn: async (): Promise<ProactiveInsightSummary> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/insights/summary`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useUpdateInsightStatus(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ insightId, status, actionTaken }: { insightId: string; status: Exclude<ProactiveInsightStatus, 'new'>; actionTaken?: string }) => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/insights/${insightId}`, { status, actionTaken })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', companyId, 'proactive-insights'] })
      qc.invalidateQueries({ queryKey: queryKeys.companies.proactiveInsightSummary(companyId) })
    },
  })
}
