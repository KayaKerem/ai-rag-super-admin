import { useCompanies } from '../hooks/use-companies'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { CompanyTable, type CompanyWithUsage } from '../components/company-table'
import { CreateCompanyDialog } from '../components/create-company-dialog'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { Button } from '@/components/ui/button'

const LIMIT = 50

const URL_STATE_OPTS = {
  defaults: { page: 0 },
  parse: (p: URLSearchParams) => ({ page: Number(p.get('page')) || 0 }),
  serialize: (v: { page: number }): Record<string, string | undefined> => ({
    page: v.page > 0 ? String(v.page) : undefined,
  }),
}

export function CompaniesPage() {
  const [filters, setFilters] = useUrlFilterState(URL_STATE_OPTS)
  const { data: companies, isLoading: companiesLoading } = useCompanies({
    limit: LIMIT,
    offset: filters.page * LIMIT,
  })

  const usageQueries = useQueries({
    queries: (companies ?? []).map((c) => ({
      queryKey: queryKeys.companies.usageCurrent(c.id),
      queryFn: async () => {
        const { data } = await apiClient.get(`/platform/companies/${c.id}/usage/current`)
        return { companyId: c.id, ...data }
      },
      enabled: !!companies,
    })),
  })

  const tableData: CompanyWithUsage[] = (companies ?? []).map((c) => {
    const usage = usageQueries.find((q) => q.data?.companyId === c.id)?.data
    return {
      ...c,
      aiCost: usage?.ai?.costUsd ?? 0,
      storageCost: usage?.storage?.costUsd ?? 0,
      triggerCost: usage?.trigger?.costUsd ?? 0,
      totalCost: usage?.totalCostUsd ?? 0,
    }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Şirketler</h1>
          <p className="text-sm text-muted-foreground">{companies?.length ?? 0} şirket</p>
        </div>
        <CreateCompanyDialog />
      </div>
      <CompanyTable data={tableData} isLoading={companiesLoading} />
      <div className="flex items-center justify-end gap-2 mt-4 text-sm">
        <Button
          variant="outline"
          size="sm"
          disabled={filters.page === 0}
          onClick={() => setFilters({ page: filters.page - 1 })}
        >
          ← Önceki
        </Button>
        <span className="text-muted-foreground">Sayfa {filters.page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={(companies?.length ?? 0) < LIMIT}
          onClick={() => setFilters({ page: filters.page + 1 })}
        >
          Sonraki →
        </Button>
      </div>
    </div>
  )
}
