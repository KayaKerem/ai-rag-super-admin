import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import {
  agentRouteBindingListSchema,
  agentRouteBindingSchema,
} from '../lib/inbound-schema'
import type {
  AgentRouteBinding,
  AgentRouteBindingListResponse,
  AgentRouteBindingsFilters,
  CreateAgentRouteBindingRequest,
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
    staleTime: 30_000,
  })
}

export function useCreateAgentRouteBinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAgentRouteBindingRequest): Promise<AgentRouteBinding> => {
      const { data } = await apiClient.post('/platform/admin/agent-route-bindings', body)
      return agentRouteBindingSchema.parse(data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.agentRouteBindings.all })
    },
  })
}
