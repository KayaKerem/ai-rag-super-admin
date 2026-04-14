import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import type { ConfigBlockKey } from '@/lib/validations'

export interface WhatsAppConfig {
  defaultTemplateName?: string
  defaultTemplateLanguage?: string
  typingIndicatorEnabled?: boolean
  welcomeMessages?: {
    enabled?: boolean
    newLead?: string
    returningLead?: string
  }
}

const templateLanguages = [
  { value: 'tr', label: 'Turkce' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Francais' },
  { value: 'ar', label: 'العربية' },
]

interface WhatsAppConfigFormProps {
  currentValues: WhatsAppConfig | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function WhatsAppConfigForm({ currentValues, onSave, isSaving }: WhatsAppConfigFormProps) {
  const [templateName, setTemplateName] = useState(currentValues?.defaultTemplateName ?? '')
  const [templateLang, setTemplateLang] = useState(currentValues?.defaultTemplateLanguage ?? 'tr')
  const [typingIndicator, setTypingIndicator] = useState(currentValues?.typingIndicatorEnabled ?? false)
  const [welcomeEnabled, setWelcomeEnabled] = useState(currentValues?.welcomeMessages?.enabled ?? true)
  const [newLeadMsg, setNewLeadMsg] = useState(currentValues?.welcomeMessages?.newLead ?? '')
  const [returningLeadMsg, setReturningLeadMsg] = useState(currentValues?.welcomeMessages?.returningLead ?? '')

  useEffect(() => {
    setTemplateName(currentValues?.defaultTemplateName ?? '')
    setTemplateLang(currentValues?.defaultTemplateLanguage ?? 'tr')
    setTypingIndicator(currentValues?.typingIndicatorEnabled ?? false)
    setWelcomeEnabled(currentValues?.welcomeMessages?.enabled ?? true)
    setNewLeadMsg(currentValues?.welcomeMessages?.newLead ?? '')
    setReturningLeadMsg(currentValues?.welcomeMessages?.returningLead ?? '')
  }, [currentValues])

  function handleSave() {
    onSave('whatsAppConfig', {
      defaultTemplateName: templateName || null,
      defaultTemplateLanguage: templateLang,
      typingIndicatorEnabled: typingIndicator,
      welcomeMessages: {
        enabled: welcomeEnabled,
        newLead: newLeadMsg || null,
        returningLead: returningLeadMsg || null,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Template Settings */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template Ayarlari</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Template Adi</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="hello_world"
            />
            <p className="text-[10px] text-muted-foreground">
              Meta Business Manager&apos;da onaylanmis template adi
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Template Dili</Label>
            <Select value={templateLang} onValueChange={(v) => v && setTemplateLang(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateLanguages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!templateName && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              Template adi bos — 24h penceresi disinda mesaj gonderilemez
            </span>
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <Label className="text-sm">Typing Indicator</Label>
          <p className="text-[10px] text-muted-foreground">Mesaj islenirken &quot;yaziyor...&quot; gosterilsin mi</p>
        </div>
        <Switch checked={typingIndicator} onCheckedChange={setTypingIndicator} />
      </div>

      {/* Welcome Messages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Karsilama Mesajlari</Label>
          <Switch checked={welcomeEnabled} onCheckedChange={setWelcomeEnabled} />
        </div>

        <div className={!welcomeEnabled ? 'opacity-50 pointer-events-none' : ''}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Yeni Lead Mesaji</Label>
              <textarea
                className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={newLeadMsg}
                onChange={(e) => setNewLeadMsg(e.target.value)}
                placeholder="Merhaba! {{companyName}} olarak size nasil yardimci olabiliriz?"
              />
              <p className="text-[10px] text-muted-foreground">
                {'{{companyName}}'} placeholder desteklenir
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Donen Lead Mesaji</Label>
              <textarea
                className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                value={returningLeadMsg}
                onChange={(e) => setReturningLeadMsg(e.target.value)}
                placeholder="Tekrar hosgeldiniz! Size nasil yardimci olabiliriz?"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-3">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
