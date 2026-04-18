import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

// Wire shape — backend response'unu birebir yansıtır.
interface AggregateApiCompany {
  id: string
  name: string
  planId: string | null
  budgetUsd: number
  currentSpendUsd: number
  spendPct: number
  band: 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'
  budgetDowngradeThresholdPct: number
}

interface AggregateApiResponse {
  companies: AggregateApiCompany[]
  total: number
}

// Post-filter, narrowed shape — widget yalnızca bu iki bandı render eder.
// `subscriptionStatus` widget tarafından kullanılmadığı için tipe alınmaz.
export interface AtRiskCompany extends Omit<AggregateApiCompany, 'band'> {
  band: 'economy' | 'exhausted'
}

const LIMIT = 100

async function fetchAggregate(band: 'exhausted' | 'economy'): Promise<AggregateApiResponse> {
  const { data } = await apiClient.get<AggregateApiResponse>(
    `/platform/companies/aggregate?band=${band}&limit=${LIMIT}`,
  )
  return data
}

export function useAtRiskCompanies() {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.platform.atRisk('exhausted'),
        queryFn: () => fetchAggregate('exhausted'),
      },
      {
        queryKey: queryKeys.platform.atRisk('economy'),
        queryFn: () => fetchAggregate('economy'),
      },
    ],
  })

  const [exhaustedQuery, economyQuery] = queries
  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)

  const data: AtRiskCompany[] | undefined =
    isLoading || isError
      ? undefined
      : [
          ...((exhaustedQuery.data?.companies ?? []) as AtRiskCompany[]),
          ...((economyQuery.data?.companies ?? []) as AtRiskCompany[]),
        ]

  const totals = {
    exhausted: exhaustedQuery.data?.total ?? 0,
    economy: economyQuery.data?.total ?? 0,
  }

  return { data, totals, isLoading, isError }
}
