import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { Company } from '../types'

interface CompanyWithUsage extends Company {
  aiCost?: number
  cdnCost?: number
  storageCost?: number
  triggerCost?: number
  totalCost?: number
}

const columns: ColumnDef<CompanyWithUsage>[] = [
  {
    accessorKey: 'name',
    header: 'Şirket Adı',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-bold text-primary">
            {getInitials(name)}
          </div>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Oluşturulma',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('createdAt'))}</span>,
  },
  {
    accessorKey: 'aiCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-violet-400" onClick={() => column.toggleSorting()}>
        AI <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-violet-400">{formatCurrency(row.getValue('aiCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'cdnCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-blue-400" onClick={() => column.toggleSorting()}>
        CDN <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-blue-400">{formatCurrency(row.getValue('cdnCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'storageCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-green-400" onClick={() => column.toggleSorting()}>
        Storage <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-green-400">{formatCurrency(row.getValue('storageCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'triggerCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-yellow-400" onClick={() => column.toggleSorting()}>
        Trigger <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-yellow-400">{formatCurrency(row.getValue('triggerCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="font-semibold" onClick={() => column.toggleSorting()}>
        Toplam <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.getValue('totalCost') ?? 0)}</span>,
  },
]

interface CompanyTableProps {
  data: CompanyWithUsage[]
  isLoading: boolean
}

export function CompanyTable({ data, isLoading }: CompanyTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
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
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Şirket bulunamadı.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/companies/${row.original.id}`)}
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

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          / {data.length} şirket
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            &#8249;
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            &#8250;
          </Button>
        </div>
      </div>
    </div>
  )
}

export type { CompanyWithUsage }
