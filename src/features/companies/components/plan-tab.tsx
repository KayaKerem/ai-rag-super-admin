import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { usePricingPlans } from '../hooks/use-pricing-plans'
import { useAssignCompanyPlan, useCancelDowngrade } from '../hooks/use-company-plan'
import { formatCurrencyTry, formatDate } from '@/lib/utils'
import type { Company } from '../types'

interface PlanTabProps {
  companyId: string
  company: Company
}

export function PlanTab({ companyId, company }: PlanTabProps) {
  const { data: plans } = usePricingPlans()
  const assignPlan = useAssignCompanyPlan(companyId)
  const cancelDowngrade = useCancelDowngrade(companyId)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  function handleAssign() {
    if (!selectedPlanId) return
    assignPlan.mutate(selectedPlanId, {
      onSuccess: (res) => {
        setConfirmOpen(false)
        setSelectedPlanId('')
        if (res.action === 'upgraded') {
          const msg = res.prorate?.prorateTry
            ? `Plan yükseltildi. Pro-rata: ${formatCurrencyTry(res.prorate.prorateTry)}`
            : 'Plan yükseltildi'
          toast.success(msg)
        } else if (res.action === 'downgrade_scheduled') {
          toast.info(`Downgrade planlandı: ${res.effectiveDate ? formatDate(res.effectiveDate) : 'sonraki dönem'}`)
        } else if (res.action === 'no_change') {
          toast.info('Aynı plan zaten atanmış')
        }
      },
      onError: () => toast.error('Plan atama başarısız'),
    })
  }

  function handleRemovePlan() {
    assignPlan.mutate(null, {
      onSuccess: () => {
        setRemoveOpen(false)
        toast.success('Plan kaldırıldı')
      },
      onError: () => toast.error('Plan kaldırma başarısız'),
    })
  }

  function handleCancelDowngrade() {
    cancelDowngrade.mutate(undefined, {
      onSuccess: () => toast.success('Downgrade iptal edildi'),
      onError: () => toast.error('İptal başarısız'),
    })
  }

  return (
    <div className="space-y-4">
      {/* Pending downgrade warning */}
      {company.pendingPlan && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Bekleyen Downgrade</p>
              <p className="text-xs text-muted-foreground">
                {company.pendingPlan.name} planına geçiş: {company.downgradeScheduledAt ? formatDate(company.downgradeScheduledAt) : 'sonraki dönem'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancelDowngrade} disabled={cancelDowngrade.isPending}>
            İptal Et
          </Button>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aktif Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {company.plan ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{company.plan.name}</span>
                <Badge variant="secondary">{company.plan.slug}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Fiyat: </span>
                  <span className="font-medium">
                    {company.plan.monthlyPriceTry !== null ? formatCurrencyTry(company.plan.monthlyPriceTry) + '/ay' : 'Kurumsal'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dahil Kullanıcı: </span>
                  <span className="font-medium">{company.plan.includedUsers}</span>
                </div>
                <div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRemoveOpen(true)}>
                    Planı Kaldır
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Bu şirkete plan atanmamış. Saf config modunda çalışıyor.</p>
          )}
        </CardContent>
      </Card>

      {/* Change plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Yeni plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(plans ?? []).filter((p) => p.id !== company.planId).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.monthlyPriceTry !== null ? `— ${formatCurrencyTry(p.monthlyPriceTry)}/ay` : '— Kurumsal'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setConfirmOpen(true)} disabled={!selectedPlanId || assignPlan.isPending}>
              Uygula
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Değişikliği Onayla</DialogTitle>
            <DialogDescription>
              Seçilen plan atanacak. Yükseltme anında, düşürme bir sonraki dönemde gerçekleşir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>İptal</Button>
            <Button onClick={handleAssign} disabled={assignPlan.isPending}>
              {assignPlan.isPending ? 'Atanıyor...' : 'Onayla'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove plan dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planı Kaldır</DialogTitle>
            <DialogDescription>
              Şirket plansız hale gelecek ve saf config moduna dönecek. Tool erişimi toolPlanConfig üzerinden yönetilir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleRemovePlan} disabled={assignPlan.isPending}>
              {assignPlan.isPending ? 'Kaldırılıyor...' : 'Kaldır'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
