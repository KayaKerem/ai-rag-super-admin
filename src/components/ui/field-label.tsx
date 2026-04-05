import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface FieldLabelProps {
  label: string
  hint?: string
  required?: boolean
}

export function FieldLabel({ label, hint, required }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {hint && (
        <TooltipProvider delay={150}>
          <Tooltip>
            <TooltipTrigger type="button" tabIndex={-1} className="inline-flex text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Info className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
