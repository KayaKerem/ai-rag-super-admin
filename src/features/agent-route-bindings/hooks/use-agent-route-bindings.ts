import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { agentRouteBindingListSchema } from '../lib/inbound-schema'
import type {
  AgentRouteBindingListResponse,
  AgentRouteBindingsFilters,
} from '../types'

export function useAgentRouteBindings(filters: AgentRouteBindingsFilters) {
  return useQuery({
    queryKey: queryKeys.admin.agentRouteBindings.list(filters),
    queryFn: async (): Promise<AgentRouteBindingListResponse> => {
      const params: Record<string, string> = {}
      if (filters.agentId) params.agentId = filters.agentId
      if (filters.channel) params.channel = filters.channel
      if (filters.peerKind) params.peerKind = filters.peerKind
      const { data } = await apiClient.get('/platform/admin/agent-route-bindings', { params })
      // Runtime parse — fails loudly if backend drifts (peerId object vs string, etc.)
      return agentRouteBindingListSchema.parse(data)
    },
  })
}
