import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useSeedPlaybook } from '../hooks/use-playbook-admin'

interface PlaybookSeedDialogProps {
  companyId: string
  companyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlaybookSeedDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
}: PlaybookSeedDialogProps) {
  const seed = useSeedPlaybook(companyId)

  function handleConfirm() {
    seed.mutate(undefined, {
      onSuccess: () => {
        toast.success('Playbook seed isteği gönderildi')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Seed başarısız')
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Default Playbook Seed</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              <strong>{companyName}</strong> şirketine varsayılan playbook girişleri
              (42 entry × 8 kategori — Türkçe B2B satış kuralları) eklenmeye çalışılacak.
            </span>
            <span className="mt-2 block">
              <strong>İdempotent:</strong> Şirketin zaten <code className="rounded bg-muted px-1 text-xs">system_default</code> kayıtları
              varsa hiçbir şey eklenmez. Doğrulama için backend ekibinden yardım istemeniz gerekebilir.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={seed.isPending}>
            {seed.isPending ? 'Gönderiliyor…' : 'Seed Et'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
