import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { WorkingHoursForm } from '@/components/working-hours-form'
import type { WorkingHoursConfig } from '@/components/working-hours-form'
import type { ConfigBlockKey } from '@/lib/validations'

interface WorkingHoursAccordionProps {
  currentValues: WorkingHoursConfig | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function WorkingHoursAccordion({ currentValues, onSave, isSaving }: WorkingHoursAccordionProps) {
  const hasConfig = currentValues && Object.keys(currentValues).length > 0

  return (
    <AccordionItem value="workingHoursConfig" className="rounded-lg border">
      <AccordionTrigger className="rounded-lg bg-card px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>🕐</span>
          <span className="text-sm font-semibold">Çalışma Saatleri</span>
          <Badge variant={hasConfig ? 'default' : 'secondary'} className="text-[10px]">
            {hasConfig ? 'Configured' : 'Defaults'}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <WorkingHoursForm currentValues={currentValues} onSave={onSave} isSaving={isSaving} />
      </AccordionContent>
    </AccordionItem>
  )
}
