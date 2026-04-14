import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useServiceAccounts } from '../hooks/use-service-accounts'
import { ServiceAccountTable } from '../components/service-account-table'
import { ServiceAccountDialog } from '../components/service-account-dialog'
import type { ServiceAccount } from '@/features/companies/types'

export function ServiceAccountsPage() {
  const { data: accounts, isLoading, isError } = useServiceAccounts()
  const [selected, setSelected] = useState<ServiceAccount | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleEdit(account: ServiceAccount) {
    setSelected(account)
    setDialogOpen(true)
  }

  function handleCreate() {
    setSelected(null)
    setDialogOpen(true)
  }

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Servis Hesaplari</h1>
        <p className="mt-2 text-sm text-destructive">Servis hesaplari yuklenemedi. API baglantisini kontrol edin.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Servis Hesaplari</h1>
          <p className="text-sm text-muted-foreground">
            {accounts?.length ?? 0} servis hesabi
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Servis
        </Button>
      </div>

      <ServiceAccountTable
        data={accounts ?? []}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <ServiceAccountDialog
        account={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
