import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { useCompanyLeads, usePermanentDeleteLead } from '../hooks/use-leads'

interface LeadsTabProps {
  companyId: string
}

const statusLabels: Record<string, string> = {
  new: 'Yeni',
  contacted: 'İletişime Geçildi',
  qualified: 'Nitelikli',
  proposal: 'Teklif',
  negotiation: 'Müzakere',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status
  if (status === 'won') {
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">{label}</Badge>
  }
  if (status === 'lost') {
    return <Badge variant="destructive">{label}</Badge>
  }
  return <Badge variant="secondary">{label}</Badge>
}

export function LeadsTab({ companyId }: LeadsTabProps) {
  const { data, isLoading, isError } = useCompanyLeads(companyId)
  const permanentDelete = usePermanentDeleteLead(companyId)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  if (isLoading) return <div className="text-sm text-muted-foreground">Lead&apos;ler yükleniyor...</div>
  if (isError) return <div className="text-sm text-destructive">Lead&apos;ler yüklenemedi.</div>

  const leads = data?.items ?? []

  function handlePermanentDelete() {
    if (!deleteTarget) return
    permanentDelete.mutate(deleteTarget.id, {
      onSuccess: (res) => {
        toast.success(`Lead kalıcı olarak siliniyor (Task: ${res.taskId})`)
        setDeleteTarget(null)
      },
      onError: () => toast.error('Lead silinemedi'),
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {leads.length} müşteri adayı
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kaynak</TableHead>
            <TableHead>Son Temas</TableHead>
            <TableHead>Oluşturulma</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Henüz lead yok.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email ?? '-'}</TableCell>
                <TableCell className="text-muted-foreground">{lead.phone ?? '-'}</TableCell>
                <TableCell><StatusBadge status={lead.status} /></TableCell>
                <TableCell className="text-muted-foreground">{lead.source ?? '-'}</TableCell>
                <TableCell className="text-muted-foreground">{lead.lastContactAt ? formatDate(lead.lastContactAt) : '-'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget({ id: lead.id, name: lead.name })}
                    aria-label="Kalıcı sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead&apos;i Kalıcı Sil</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; lead&apos;ini ve tüm ilişkili verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem KVKK/GDPR kapsamında geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>İptal</Button>
            <Button variant="destructive" onClick={handlePermanentDelete} disabled={permanentDelete.isPending}>
              {permanentDelete.isPending ? 'Siliniyor...' : 'Kalıcı Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
