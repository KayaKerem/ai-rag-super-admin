import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useCreateCompany } from '../hooks/use-companies'
import { usePricingPlans } from '../hooks/use-pricing-plans'
import { toast } from 'sonner'

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [planId, setPlanId] = useState<string>('')
  const createCompany = useCreateCompany()
  const { data: plans } = usePricingPlans()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createCompany.mutate({ name: name.trim(), planId: planId || undefined }, {
      onSuccess: () => {
        toast.success('Şirket oluşturuldu')
        setName('')
        setPlanId('')
        setOpen(false)
      },
      onError: () => {
        toast.error('Şirket oluşturulamadı')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1 h-4 w-4" /> Yeni Şirket
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Şirket Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Şirket Adı</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firma adı" autoFocus />
          </div>
          <div>
            <Label>Plan (Opsiyonel)</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Plan seçin" />
              </SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.monthlyPriceTry !== null ? `— ${p.monthlyPriceTry} ₺/ay` : '— Kurumsal'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={createCompany.isPending}>
              {createCompany.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
