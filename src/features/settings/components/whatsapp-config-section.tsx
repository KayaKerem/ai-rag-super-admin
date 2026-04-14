import { WhatsAppConfigForm } from '@/components/whatsapp-config-form'
import type { ConfigBlockKey } from '@/lib/validations'

interface WhatsAppConfigSectionProps {
  currentValues: Record<string, unknown> | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function WhatsAppConfigSection({ currentValues, onSave, isSaving }: WhatsAppConfigSectionProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">WhatsApp</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        WhatsApp kanal davranisi konfigurasyonu. 24 saat penceresi disinda template mesaj gonderimi ve typing indicator ayarlari.
      </p>
      <WhatsAppConfigForm currentValues={currentValues} onSave={onSave} isSaving={isSaving} />
    </div>
  )
}
