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
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import type { EmailTemplate } from '@/features/companies/types'

const columns: ColumnDef<EmailTemplate>[] = [
  {
    accessorKey: 'name',
    header: 'Şablon Adı',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('slug')}</Badge>,
  },
  {
    accessorKey: 'subject',
    header: 'Konu',
    cell: ({ row }) => {
      const subject = row.getValue('subject') as string
      return <span className="text-muted-foreground">{subject.length > 60 ? subject.slice(0, 60) + '…' : subject}</span>
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Durum',
    cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
        {row.getValue('isActive') ? 'Aktif' : 'Pasif'}
      </Badge>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Son Güncelleme',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('updatedAt'))}</span>,
  },
]

interface EmailTemplateTableProps {
  data: EmailTemplate[]
  isLoading: boolean
  onSelect: (template: EmailTemplate) => void
}

export function EmailTemplateTable({ data, isLoading, onSelect }: EmailTemplateTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

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
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Yükleniyor...</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Şablon bulunamadı.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
