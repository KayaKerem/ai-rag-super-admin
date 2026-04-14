import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { useRevealPassword, useDeleteServiceAccount } from '../hooks/use-service-accounts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ServiceAccount } from '@/features/companies/types'

const authMethodLabels: Record<string, string> = {
  email_password: 'Email/Password',
  google: 'Google',
  github: 'GitHub',
  sso: 'SSO',
  api_key_only: 'API Key Only',
}

interface ServiceAccountTableProps {
  data: ServiceAccount[]
  isLoading: boolean
  onEdit: (account: ServiceAccount) => void
}

export function ServiceAccountTable({ data, isLoading, onEdit }: ServiceAccountTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceAccount | null>(null)
  const deleteAccount = useDeleteServiceAccount()

  function RevealButton({ accountId }: { accountId: string }) {
    const reveal = useRevealPassword(accountId)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={(e) => {
          e.stopPropagation()
          reveal.mutate(undefined, {
            onSuccess: (data) => {
              setRevealingId(accountId)
              setRevealedPassword(data.decryptedPassword ?? null)
            },
            onError: () => toast.error('Sifre gosterilemedi'),
          })
        }}
        disabled={reveal.isPending}
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
    )
  }

  const columns: ColumnDef<ServiceAccount>[] = [
    {
      accessorKey: 'serviceName',
      header: 'Servis',
      cell: ({ row }) => <span className="font-medium">{row.getValue('serviceName')}</span>,
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => {
        const url = row.getValue('url') as string | null
        if (!url) return <span className="text-muted-foreground">-</span>
        return (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null
        return <span className="text-muted-foreground">{email ?? '-'}</span>
      },
    },
    {
      accessorKey: 'authMethod',
      header: 'Auth',
      cell: ({ row }) => {
        const method = row.getValue('authMethod') as string | null
        if (!method) return <span className="text-muted-foreground">-</span>
        return <Badge variant="outline">{authMethodLabels[method] ?? method}</Badge>
      },
    },
    {
      accessorKey: 'encryptedPassword',
      header: 'Sifre',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">****</span>
          <RevealButton accountId={row.original.id} />
        </div>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Guncelleme',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{formatDate(row.getValue('updatedAt'))}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row.original)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(row.original)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  function handleDelete() {
    if (!deleteTarget) return
    deleteAccount.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.serviceName} silindi`)
        setDeleteTarget(null)
      },
      onError: () => toast.error('Silme basarisiz'),
    })
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Ara..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Yukleniyor...</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Servis hesabi bulunamadi.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => onEdit(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reveal Password Dialog */}
      <Dialog open={revealingId !== null} onOpenChange={(open) => { if (!open) { setRevealingId(null); setRevealedPassword(null) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sifre</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <code className="flex-1 text-sm break-all">{revealedPassword ?? '-'}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 shrink-0"
              onClick={() => {
                if (revealedPassword) {
                  navigator.clipboard.writeText(revealedPassword)
                  toast.success('Kopyalandi')
                }
              }}
            >
              Kopyala
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setRevealingId(null); setRevealedPassword(null) }}>
            <EyeOff className="mr-1.5 h-3.5 w-3.5" /> Gizle
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Servis Hesabini Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteTarget?.serviceName}</strong> hesabini kalici olarak silmek istediginize emin misiniz?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Iptal</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteAccount.isPending}>
              {deleteAccount.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
