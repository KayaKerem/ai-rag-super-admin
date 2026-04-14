import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateServiceAccount, useUpdateServiceAccount } from '../hooks/use-service-accounts'
import type { ServiceAccount, AuthMethod } from '@/features/companies/types'

const authMethods: { value: AuthMethod; label: string }[] = [
  { value: 'email_password', label: 'Email / Password' },
  { value: 'google', label: 'Google' },
  { value: 'github', label: 'GitHub' },
  { value: 'sso', label: 'SSO' },
  { value: 'api_key_only', label: 'API Key Only' },
]

interface ServiceAccountDialogProps {
  account: ServiceAccount | null // null = create mode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceAccountDialog({ account, open, onOpenChange }: ServiceAccountDialogProps) {
  const isEdit = account !== null

  const [serviceName, setServiceName] = useState('')
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email_password')
  const [notes, setNotes] = useState('')

  const createAccount = useCreateServiceAccount()
  const updateAccount = useUpdateServiceAccount(account?.id ?? '')

  useEffect(() => {
    if (account) {
      setServiceName(account.serviceName)
      setUrl(account.url ?? '')
      setEmail(account.email ?? '')
      setPassword('')
      setAuthMethod((account.authMethod as AuthMethod) ?? 'email_password')
      setNotes(account.notes ?? '')
    } else {
      setServiceName('')
      setUrl('')
      setEmail('')
      setPassword('')
      setAuthMethod('email_password')
      setNotes('')
    }
  }, [account, open])

  function handleSave() {
    if (!serviceName.trim()) {
      toast.error('Servis adi zorunludur')
      return
    }

    if (isEdit) {
      const body: Record<string, unknown> = {
        serviceName,
        url: url || null,
        email: email || null,
        authMethod,
        notes: notes || null,
      }
      if (password) body.password = password
      updateAccount.mutate(body, {
        onSuccess: () => {
          toast.success('Servis hesabi guncellendi')
          onOpenChange(false)
        },
        onError: () => toast.error('Guncelleme basarisiz'),
      })
    } else {
      createAccount.mutate(
        {
          serviceName,
          url: url || undefined,
          email: email || undefined,
          password: password || undefined,
          authMethod,
          notes: notes || undefined,
        },
        {
          onSuccess: () => {
            toast.success('Servis hesabi olusturuldu')
            onOpenChange(false)
          },
          onError: () => toast.error('Olusturma basarisiz'),
        }
      )
    }
  }

  const isPending = createAccount.isPending || updateAccount.isPending
  const passwordOptional = authMethod === 'google' || authMethod === 'github'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Servis Hesabini Duzenle' : 'Yeni Servis Hesabi'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Servis Adi *</Label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="OpenRouter" maxLength={200} />
          </div>

          <div>
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://openrouter.ai/settings/keys" maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email / Kullanici Adi</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@edfu.ai" maxLength={300} />
            </div>
            <div>
              <Label>Auth Method</Label>
              <Select value={authMethod} onValueChange={(v) => setAuthMethod(v as AuthMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {authMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{passwordOptional ? 'Sifre (opsiyonel)' : 'Sifre'}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Degistirmek icin yeni sifre girin' : 'Sifre'}
              maxLength={500}
            />
            {isEdit && <p className="mt-1 text-[10px] text-muted-foreground">Bos birakilirsa mevcut sifre korunur</p>}
          </div>

          <div>
            <Label>Notlar</Label>
            <textarea
              className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Serbest not (max 2000 karakter)"
              maxLength={2000}
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Iptal</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : isEdit ? 'Guncelle' : 'Olustur'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
