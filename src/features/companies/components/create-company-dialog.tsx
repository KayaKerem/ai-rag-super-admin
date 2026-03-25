import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useCreateCompany } from '../hooks/use-companies'
import { toast } from 'sonner'

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const createCompany = useCreateCompany()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createCompany.mutate(name.trim(), {
      onSuccess: () => {
        toast.success('Şirket oluşturuldu')
        setName('')
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
