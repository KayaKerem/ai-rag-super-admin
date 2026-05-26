import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export interface VerifyChainResponse {
  valid: boolean
  brokenAt?: number
  totalChecked: number
}

export function useVerifyActivityLogChain(
  companyId: string,
  params: { fromSeq?: number; toSeq?: number } = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.companies.verifyChain(companyId), params] as const,
    queryFn: async () => {
      const qs = new URLSearchParams()
      if (params.fromSeq !== undefined) qs.set('fromSeq', String(params.fromSeq))
      if (params.toSeq !== undefined) qs.set('toSeq', String(params.toSeq))
      const query = qs.toString() ? `?${qs}` : ''
      const { data } = await apiClient.get<VerifyChainResponse>(
        `/platform/companies/${companyId}/activity-log/verify-chain${query}`
      )
      return data
    },
    enabled: options?.enabled ?? false,
  })
}
