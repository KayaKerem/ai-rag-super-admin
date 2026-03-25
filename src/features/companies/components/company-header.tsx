import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import { useUpdateCompany, useDeleteCompany } from '../hooks/use-company'
import { toast } from 'sonner'
import type { Company } from '../types'

interface CompanyHeaderProps {
  company: Company
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(company.name)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const updateCompany = useUpdateCompany(company.id)
  const deleteCompany = useDeleteCompany()

  function handleSaveName() {
    if (!editName.trim() || editName.trim() === company.name) {
      setEditing(false)
      return
    }
    updateCompany.mutate(editName.trim(), {
      onSuccess: () => {
        toast.success('Şirket adı güncellendi')
        setEditing(false)
      },
    })
  }

  function handleDelete() {
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast.success('Şirket silindi')
        navigate('/companies')
      },
    })
  }

  return (
    <div className="mb-6 flex items-center gap-4 border-b pb-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-lg font-bold text-primary">
        {getInitials(company.name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="h-8 w-64 text-lg font-bold"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-bold">{company.name}</h1>
          )}
          <span className="rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            ID: {company.id.slice(0, 6)}...
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Oluşturulma: {formatDate(company.createdAt)}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { setEditName(company.name); setEditing(true) }}>
          <Pencil className="mr-1 h-3 w-3" /> Düzenle
        </Button>
        <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-1 h-3 w-3" /> Sil
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={(open) => setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şirketi Sil</DialogTitle>
            <DialogDescription>
              "{company.name}" şirketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCompany.isPending}>
              {deleteCompany.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
