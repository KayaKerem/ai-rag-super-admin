import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useVerifyActivityLogChain } from '../hooks/use-activity-log-chain'

interface VerifyChainDialogProps {
  companyId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function VerifyChainDialog({ companyId, open, onOpenChange }: VerifyChainDialogProps) {
  const [fromSeqRaw, setFromSeqRaw] = useState('')
  const [toSeqRaw, setToSeqRaw] = useState('')
  const [enabled, setEnabled] = useState(false)

  const fromSeq = fromSeqRaw !== '' ? Number(fromSeqRaw) : undefined
  const toSeq = toSeqRaw !== '' ? Number(toSeqRaw) : undefined

  const query = useVerifyActivityLogChain(companyId, { fromSeq, toSeq }, { enabled })

  function handleVerify() {
    if (!enabled) {
      setEnabled(true)
    } else {
      void query.refetch()
    }
  }

  const data = query.data

  // Fire success toast once per fresh fetch result (covers both first-click and re-verify)
  useEffect(() => {
    if (data?.valid === true) {
      toast.success(`Zincir bütün — ${data.totalChecked} kayıt doğrulandı`)
    }
  }, [data?.valid, data?.totalChecked])

  function handleClose(v: boolean) {
    if (!v) {
      setEnabled(false)
      setFromSeqRaw('')
      setToSeqRaw('')
    }
    onOpenChange(v)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zincir Doğrula</AlertDialogTitle>
          <AlertDialogDescription>
            Activity log hash zincirini tamper-evident doğrulama için aralık seçin (isteğe bağlı).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="fromSeq" className="mb-1 block text-sm">
              Başlangıç Seq
            </Label>
            <Input
              id="fromSeq"
              type="number"
              placeholder="ör. 1"
              value={fromSeqRaw}
              onChange={(e) => {
                setFromSeqRaw(e.target.value)
                setEnabled(false)
              }}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="toSeq" className="mb-1 block text-sm">
              Bitiş Seq
            </Label>
            <Input
              id="toSeq"
              type="number"
              placeholder="ör. 200"
              value={toSeqRaw}
              onChange={(e) => {
                setToSeqRaw(e.target.value)
                setEnabled(false)
              }}
            />
          </div>
        </div>

        {query.isFetching && (
          <p className="text-sm text-muted-foreground">Doğrulanıyor…</p>
        )}

        {enabled && data && !query.isFetching && data.valid && (
          <Card className="border-green-500">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Zincir bütün</p>
                <p className="text-sm text-muted-foreground">
                  {data.totalChecked} kayıt başarıyla doğrulandı.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {enabled && data && !query.isFetching && !data.valid && (
          <Card className="border-yellow-500">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">Zincir bozuk</p>
                <p className="text-sm text-muted-foreground">
                  Manuel doğrulama: kayıt #{data.brokenAt} bozuk. Backend ekibine bildir.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Kapat</AlertDialogCancel>
          <Button
            onClick={handleVerify}
            disabled={query.isFetching}
          >
            {query.isFetching ? 'Doğrulanıyor…' : 'Doğrula'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
