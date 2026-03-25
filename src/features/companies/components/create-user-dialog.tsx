import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateUser } from '../hooks/use-company-users'

interface CreateUserDialogProps {
  companyId: string
}

export function CreateUserDialog({ companyId }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('admin')
  const createUser = useCreateUser(companyId)

  function resetForm() {
    setEmail('')
    setName('')
    setPassword('')
    setRole('admin')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !name.trim() || !password.trim()) return
    createUser.mutate(
      { email: email.trim(), name: name.trim(), password: password.trim(), role },
      {
        onSuccess: () => {
          toast.success('Kullanıcı oluşturuldu')
          resetForm()
          setOpen(false)
        },
        onError: (err: unknown) => {
          const anyErr = err as { response?: { data?: { code?: string } } }
          if (anyErr?.response?.data?.code === 'email_already_registered') {
            toast.error('Bu e-posta adresi zaten kayıtlı')
          } else {
            toast.error('Kullanıcı oluşturulamadı')
          }
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="mr-1 h-4 w-4" /> Kullanıcı Oluştur
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="create-name">Ad Soyad</Label>
              <Input
                id="create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ali Veli"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">E-posta</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@firma.com"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="create-password">Şifre</Label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Geçici şifre"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-role">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'owner' | 'admin' | 'member')}>
                <SelectTrigger id="create-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Sahip (Owner)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Üye (Member)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
