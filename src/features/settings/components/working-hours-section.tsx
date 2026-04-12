import { WorkingHoursForm } from '@/components/working-hours-form'
import type { ConfigBlockKey } from '@/lib/validations'

interface WorkingHoursSectionProps {
  currentValues: Record<string, unknown> | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function WorkingHoursSection({ currentValues, onSave, isSaving }: WorkingHoursSectionProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Çalışma Saatleri</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        WhatsApp ve diğer kanal mesajları için çalışma saatleri. Mesai dışında otomatik yanıt gönderilir.
        WhatsApp entegrasyonu aktif olan firmalar için AI agent yalnızca çalışma saatleri içinde yanıt verir.
      </p>
      <WorkingHoursForm currentValues={currentValues} onSave={onSave} isSaving={isSaving} />
    </div>
  )
}
