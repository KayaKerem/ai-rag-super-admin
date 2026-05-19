import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  RecomputePlaybookRequest,
  RecomputePlaybookResponse,
  SeedPlaybookResponse,
} from '../types'

export function useRecomputePlaybookStatus() {
  return useMutation({
    mutationFn: async (body: RecomputePlaybookRequest): Promise<RecomputePlaybookResponse> => {
      const { data } = await apiClient.post('/admin/playbooks/recompute-status', body)
      return data
    },
  })
}

export function useSeedPlaybook(companyId: string) {
  return useMutation({
    mutationFn: async (): Promise<SeedPlaybookResponse> => {
      const { data } = await apiClient.post(`/platform/companies/${companyId}/seed-playbook`)
      return data
    },
  })
}
