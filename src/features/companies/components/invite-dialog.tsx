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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useInviteUser } from '../hooks/use-company-users'

interface InviteDialogProps {
  companyId: string
}

export function InviteDialog({ companyId }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member')
  const inviteUser = useInviteUser(companyId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    inviteUser.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success('Kullanıcı davet edildi')
          setEmail('')
          setRole('member')
          setOpen(false)
        },
        onError: (err: unknown) => {
          const anyErr = err as { response?: { data?: { code?: string } } }
          if (anyErr?.response?.data?.code === 'email_already_registered') {
            toast.error('Bu e-posta adresi zaten kayıtlı')
          } else {
            toast.error('Davet gönderilemedi')
          }
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1 h-4 w-4" /> Davet Et
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı Davet Et</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="invite-email">E-posta</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@sirket.com"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role">Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'owner' | 'admin' | 'member')}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Sahip (Owner)</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Üye (Member)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? 'Gönderiliyor...' : 'Davet Et'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
