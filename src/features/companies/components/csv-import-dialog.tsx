import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { useBulkImportUsers } from '../hooks/use-company-users'

interface CsvImportDialogProps {
  companyId: string
}

export function CsvImportDialog({ companyId }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImportUsers(companyId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    bulkImport.mutate(file, {
      onSuccess: () => {
        toast.success('Kullanıcılar içe aktarıldı')
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setOpen(false)
      },
      onError: () => {
        toast.error('İçe aktarma başarısız')
      },
    })
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <FileUp className="mr-1 h-4 w-4" /> CSV Import
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV ile Toplu Kullanıcı Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="csv-file">CSV Dosyası</Label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              CSV formatı: email, name, role (max 500 satır)
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={!file || bulkImport.isPending}>
              {bulkImport.isPending ? 'Yükleniyor...' : 'İçe Aktar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
