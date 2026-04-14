import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useActivityLog, useVerifyActivityLogIntegrity } from '../hooks/use-activity-log'
import type { ActivityCategory } from '../types'

interface ActivityLogTabProps {
  companyId: string
}

const categoryLabels: Record<ActivityCategory, string> = {
  auth: 'Giris',
  user: 'Kullanici',
  document: 'Dokuman',
  folder: 'Klasor',
  knowledge: 'Bilgi Bankasi',
  conversation: 'Sohbet',
  company: 'Sirket',
  connector: 'Baglanti',
  note: 'Not',
  lead: 'Musteri Adayi',
  playbook: 'Playbook',
  quote: 'Teklif',
  channel: 'Kanal',
}

const categoryColors: Record<ActivityCategory, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  document: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  folder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  knowledge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  conversation: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  company: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  connector: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  note: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  lead: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  playbook: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  quote: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  channel: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
}

const categoryOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Tumu' },
  { value: 'auth', label: 'Giris' },
  { value: 'user', label: 'Kullanici' },
  { value: 'document', label: 'Dokuman' },
  { value: 'folder', label: 'Klasor' },
  { value: 'knowledge', label: 'Bilgi Bankasi' },
  { value: 'conversation', label: 'Sohbet' },
  { value: 'company', label: 'Sirket' },
  { value: 'connector', label: 'Baglanti' },
  { value: 'note', label: 'Not' },
  { value: 'lead', label: 'Musteri Adayi' },
  { value: 'playbook', label: 'Playbook' },
  { value: 'quote', label: 'Teklif' },
  { value: 'channel', label: 'Kanal' },
]

export function ActivityLogTab({ companyId }: ActivityLogTabProps) {
  const [category, setCategory] = useState<string>('all')
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { data, isLoading } = useActivityLog(companyId, {
    ...(category && category !== 'all' && { category }),
    limit,
    offset,
  })

  const verifyIntegrity = useVerifyActivityLogIntegrity(companyId)

  function handleVerify() {
    verifyIntegrity.mutate(undefined, {
      onSuccess: (res) => {
        if (res.valid) {
          toast.success(`Butunluk dogrulandi (${res.totalEntries} kayit)`)
        } else {
          toast.error('Butunluk hatasi tespit edildi!')
        }
      },
      onError: () => toast.error('Dogrulama basarisiz'),
    })
  }

  const total = data?.total ?? 0
  const items = data?.items ?? []
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={(v: string | null) => {
              setCategory(v ?? 'all')
              setOffset(0)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            disabled={verifyIntegrity.isPending}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {verifyIntegrity.isPending ? 'Dogrulaniyor...' : 'Butunluk Kontrolu'}
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {total === 0 ? 'Kayit yok' : `${from}-${to} / ${total}`}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Tarih</TableHead>
            <TableHead className="w-32">Kategori</TableHead>
            <TableHead>Aksiyon</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Aktivite bulunamadi.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={categoryColors[item.category as ActivityCategory] ?? ''}
                  >
                    {categoryLabels[item.category as ActivityCategory] ?? item.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.action}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {total > limit && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Onceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  )
}
