import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { DataSourceList, DataSourceType } from '../types'

export function useCompanyDataSources(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.dataSources(companyId),
    queryFn: async () => {
      const { data } = await apiClient.get<DataSourceList>(`/platform/companies/${companyId}/data-sources`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useDataSourceTypes() {
  return useQuery({
    queryKey: queryKeys.platform.dataSourceTypes,
    queryFn: async () => {
      const { data } = await apiClient.get<DataSourceType[]>('/platform/data-source-types')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
