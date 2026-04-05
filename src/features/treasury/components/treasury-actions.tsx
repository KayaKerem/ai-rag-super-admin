import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import {
  useTreasuryActions,
  useApproveAction,
  useRejectAction,
  useCreateManualAction,
} from '../hooks/use-treasury'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ActionType, ActionStatus } from '../types'

const actionTypeLabels: Record<ActionType, string> = {
  stake_aave: 'Aave Stake',
  unstake_aave: 'Aave Unstake',
  stake_benqi: 'BENQI Stake',
  unstake_benqi: 'BENQI Unstake',
}

const statusConfig: Record<ActionStatus, { label: string; className: string }> = {
  pending: { label: 'Bekleyen', className: 'bg-amber-500/20 text-amber-400' },
  approved: { label: 'Onaylandi', className: 'bg-green-500/20 text-green-400' },
  executed: { label: 'Yurutuldu', className: 'bg-blue-500/20 text-blue-400' },
  rejected: { label: 'Reddedildi', className: 'bg-red-500/20 text-red-400' },
  failed: { label: 'Basarisiz', className: 'bg-red-500/20 text-red-400' },
  expired: { label: 'Suresi Doldu', className: 'bg-gray-500/20 text-gray-400' },
}

const statusFilterOptions = [
  { value: 'pending', label: 'Bekleyen' },
  { value: 'approved', label: 'Onaylanmis' },
  { value: 'rejected', label: 'Reddedilmis' },
  { value: 'all', label: 'Tumu' },
]

export function TreasuryActions() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [manualType, setManualType] = useState<string>('stake_aave')
  const [manualAmount, setManualAmount] = useState('')

  const { data: actions, isLoading } = useTreasuryActions(
    statusFilter === 'all' ? '' : statusFilter
  )
  const approveMutation = useApproveAction()
  const rejectMutation = useRejectAction()
  const createMutation = useCreateManualAction()

  function handleCreate() {
    const amount = Number(manualAmount)
    if (!amount || amount <= 0) {
      toast.error('Gecerli bir miktar giriniz')
      return
    }
    createMutation.mutate(
      { type: manualType, amountUsdc: amount },
      {
        onSuccess: () => {
          toast.success('Manuel aksiyon olusturuldu')
          setManualAmount('')
        },
        onError: () => toast.error('Aksiyon olusturulamadi'),
      }
    )
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  return (
    <div className="space-y-6">
      {/* Status filter */}
      <div className="flex gap-1">
        {statusFilterOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Action list */}
      {!actions?.length ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Aksiyon bulunamadi.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const st = statusConfig[action.status]
            return (
              <Card key={action.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {actionTypeLabels[action.type] ?? action.type}
                        </Badge>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            st.className
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(action.amountUsdc)} USDC
                      </p>
                      <p className="text-xs text-muted-foreground">{action.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(action.createdAt)}
                      </p>
                      {action.status === 'executed' && action.txHash && (
                        <p className="font-mono text-xs text-muted-foreground">
                          TX: {action.txHash.slice(0, 10)}...
                        </p>
                      )}
                      {action.status === 'failed' && action.errorMessage && (
                        <p className="text-xs text-red-400">{action.errorMessage}</p>
                      )}
                    </div>
                    {action.status === 'pending' && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          disabled={approveMutation.isPending}
                          onClick={() =>
                            approveMutation.mutate(action.id, {
                              onSuccess: () => toast.success('Aksiyon onaylandi'),
                              onError: () => toast.error('Onaylama basarisiz'),
                            })
                          }
                        >
                          Onayla
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={rejectMutation.isPending}
                          onClick={() =>
                            rejectMutation.mutate(action.id, {
                              onSuccess: () => toast.success('Aksiyon reddedildi'),
                              onError: () => toast.error('Reddetme basarisiz'),
                            })
                          }
                        >
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Manual Action Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Manuel Aksiyon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <FieldLabel label="Tip" />
              <Select value={manualType} onValueChange={(v) => setManualType(v ?? 'stake_aave')}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel label="Miktar (USD)" />
              <Input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="0.00"
                className="w-36"
              />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Olustur
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
