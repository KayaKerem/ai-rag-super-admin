import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials, formatDate } from '@/lib/utils'
import { useCompanyUsers, useUpdateUserRole, useDeactivateUser } from '../hooks/use-company-users'
import { InviteDialog } from './invite-dialog'
import { CsvImportDialog } from './csv-import-dialog'
import type { CompanyUser } from '../types'

interface UsersTabProps {
  companyId: string
}

const roleLabels: Record<CompanyUser['role'], string> = {
  owner: 'Sahip',
  admin: 'Admin',
  member: 'Üye',
}

function RoleBadge({ role }: { role: CompanyUser['role'] }) {
  if (role === 'owner') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
        {roleLabels[role]}
      </Badge>
    )
  }
  if (role === 'admin') {
    return (
      <Badge className="bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">
        {roleLabels[role]}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      {roleLabels[role]}
    </Badge>
  )
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {getInitials(name)}
    </div>
  )
}

interface UserActionsProps {
  user: CompanyUser
  companyId: string
}

function UserActions({ user, companyId }: UserActionsProps) {
  const updateRole = useUpdateUserRole(companyId)
  const deactivate = useDeactivateUser(companyId)

  function handleRoleChange(role: CompanyUser['role']) {
    updateRole.mutate(
      { userId: user.id, role },
      {
        onSuccess: () => toast.success('Rol güncellendi'),
        onError: () => toast.error('Rol güncellenemedi'),
      }
    )
  }

  function handleDeactivate() {
    deactivate.mutate(user.id, {
      onSuccess: () => toast.success('Kullanıcı deaktif edildi'),
      onError: () => toast.error('Kullanıcı deaktif edilemedi'),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="h-7 w-7" aria-label="Kullanıcı işlemleri" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Rol Değiştir</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={user.role === 'owner'}
              onSelect={() => handleRoleChange('owner')}
            >
              Sahip (Owner)
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={user.role === 'admin'}
              onSelect={() => handleRoleChange('admin')}
            >
              Admin
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={user.role === 'member'}
              onSelect={() => handleRoleChange('member')}
            >
              Üye (Member)
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleDeactivate}>
          Deaktif Et
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UsersTab({ companyId }: UsersTabProps) {
  const { data: users, isLoading, isError } = useCompanyUsers(companyId)

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Kullanıcılar yükleniyor...</div>
  }

  if (isError) {
    return <div className="text-sm text-destructive">Kullanıcılar yüklenemedi.</div>
  }

  const userList = users ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {userList.length} kullanıcı
        </p>
        <div className="flex items-center gap-2">
          <CsvImportDialog companyId={companyId} />
          <InviteDialog companyId={companyId} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Katılım Tarihi</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Henüz kullanıcı yok.
              </TableCell>
            </TableRow>
          ) : (
            userList.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={user.name} />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <UserActions user={user} companyId={companyId} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
