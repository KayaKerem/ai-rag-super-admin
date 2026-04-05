import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  TreasuryDashboard,
  TreasurySnapshot,
  TreasuryCustomerUsage,
  PaginatedTransactions,
  TreasuryAlert,
  TreasuryAction,
  TreasuryConfig,
  OpenRouterDetails,
} from '../types'

export function useTreasuryDashboard() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.dashboard,
    queryFn: async (): Promise<TreasuryDashboard> => {
      const { data } = await apiClient.get('/platform/treasury/dashboard')
      return data
    },
  })
}

export function useTreasurySnapshots(days = 30) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.snapshots(days),
    queryFn: async (): Promise<TreasurySnapshot[]> => {
      const { data } = await apiClient.get('/platform/treasury/snapshots', { params: { days } })
      return data
    },
  })
}

export function useTreasuryCustomers() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.customers,
    queryFn: async (): Promise<TreasuryCustomerUsage[]> => {
      const { data } = await apiClient.get('/platform/treasury/customers')
      return data
    },
  })
}

export function useTreasuryTransactions(page = 1, limit = 20, type?: string) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.transactions(page, limit, type),
    queryFn: async (): Promise<PaginatedTransactions> => {
      const { data } = await apiClient.get('/platform/treasury/transactions', {
        params: { page, limit, ...(type && { type }) },
      })
      return data
    },
  })
}

export function useTreasuryAlerts(severity?: string, acknowledged?: string) {
  return useQuery({
    queryKey: queryKeys.platform.treasury.alerts(severity, acknowledged),
    queryFn: async (): Promise<TreasuryAlert[]> => {
      const { data } = await apiClient.get('/platform/treasury/alerts', {
        params: { ...(severity && { severity }), ...(acknowledged && { acknowledged }) },
      })
      return data
    },
  })
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await apiClient.patch(`/platform/treasury/alerts/${alertId}/acknowledge`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'alerts'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useTreasuryActions(status = 'pending') {
  return useQuery({
    queryKey: queryKeys.platform.treasury.actions(status),
    queryFn: async (): Promise<TreasuryAction[]> => {
      const { data } = await apiClient.get('/platform/treasury/actions', { params: { status } })
      return data
    },
  })
}

export function useApproveAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data } = await apiClient.post(`/platform/treasury/actions/${actionId}/approve`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useRejectAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data } = await apiClient.post(`/platform/treasury/actions/${actionId}/reject`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useCreateManualAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { type: string; amountUsdc: number }) => {
      const { data } = await apiClient.post('/platform/treasury/actions/manual', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform', 'treasury', 'actions'] })
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.dashboard })
    },
  })
}

export function useTreasuryConfig() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.config,
    queryFn: async (): Promise<TreasuryConfig> => {
      const { data } = await apiClient.get('/platform/treasury/config')
      return data
    },
  })
}

export function useUpdateTreasuryConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<TreasuryConfig>) => {
      const { data } = await apiClient.patch('/platform/treasury/config', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.treasury.config })
    },
  })
}

export function useOpenRouterDetails() {
  return useQuery({
    queryKey: queryKeys.platform.treasury.openrouter,
    queryFn: async (): Promise<OpenRouterDetails> => {
      const { data } = await apiClient.get('/platform/treasury/openrouter')
      return data
    },
  })
}
