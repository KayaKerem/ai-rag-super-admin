import { useCompanies } from '../hooks/use-companies'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { CompanyTable, type CompanyWithUsage } from '../components/company-table'
import { CreateCompanyDialog } from '../components/create-company-dialog'

export function CompaniesPage() {
  const { data: companies, isLoading: companiesLoading } = useCompanies()

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
    </div>
  )
}
