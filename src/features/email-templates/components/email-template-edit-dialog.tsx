import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUpdateEmailTemplate } from '../hooks/use-email-templates'
import { EmailPreview } from './email-preview'
import type { EmailTemplate } from '@/features/companies/types'

interface EmailTemplateEditDialogProps {
  template: EmailTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailTemplateEditDialog({ template, open, onOpenChange }: EmailTemplateEditDialogProps) {
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [isActive, setIsActive] = useState(true)
  const updateTemplate = useUpdateEmailTemplate(template?.slug ?? '')

  useEffect(() => {
    if (template) {
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
      setIsActive(template.isActive)
    }
  }, [template])

  function handleSave() {
    if (!template) return
    updateTemplate.mutate(
      { subject, bodyHtml, isActive },
      {
        onSuccess: () => {
          toast.success('Şablon güncellendi')
          onOpenChange(false)
        },
        onError: () => toast.error('Güncelleme başarısız'),
      }
    )
  }

  function handleCopyVariable(variable: string) {
    navigator.clipboard.writeText(`{{${variable}}}`)
    toast.success(`{{${variable}}} kopyalandı`)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <Badge variant="outline">{template.slug}</Badge>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <Label>Konu</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={500} />
          </div>

          {/* Body HTML */}
          <div>
            <Label>Body HTML</Label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ minHeight: 300 }}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Label>Aktif</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Available variables */}
          <div>
            <Label className="mb-2 block">Kullanılabilir Değişkenler</Label>
            <div className="flex flex-wrap gap-1.5">
              {template.availableVariables.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCopyVariable(v)}
                >
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Değişkene tıklayarak kopyalayın</p>
          </div>

          {/* Preview */}
          <EmailPreview slug={template.slug} availableVariables={template.availableVariables} />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
