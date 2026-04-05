import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import type { ZodTypeAny } from 'zod'

interface FieldConfig {
  key: string
  label: string
  hint?: string
  type?: 'text' | 'number' | 'password' | 'select' | 'boolean'
  options?: string[]
  placeholder?: string
  required?: boolean
}

interface ConfigAccordionProps {
  blockKey: ConfigBlockKey
  label: string
  icon: string
  fields: FieldConfig[]
  currentValues: Record<string, unknown> | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function ConfigAccordion({ blockKey, label, icon, fields, currentValues, onSave, isSaving }: ConfigAccordionProps) {
  const schema = configBlockSchemas[blockKey] as ZodTypeAny
  const hasConfig = currentValues && Object.keys(currentValues).length > 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<Record<string, any>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: (currentValues as Record<string, unknown>) ?? {},
  })

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => {
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
    )
    onSave(blockKey, cleaned)
  }

  function isMasked(value: unknown): boolean {
    return typeof value === 'string' && value.includes('****')
  }

  return (
    <AccordionItem value={blockKey} className="rounded-lg border">
      <AccordionTrigger className="rounded-lg bg-card px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant={hasConfig ? 'default' : 'secondary'} className="text-[10px]">
            {hasConfig ? 'Configured' : 'Defaults'}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => {
              const currentVal = currentValues?.[field.key]
              const masked = isMasked(currentVal)

              if (field.type === 'boolean') {
                const watchedValue = form.watch(field.key) as boolean | undefined
                return (
                  <div key={field.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <FieldLabel label={field.label} hint={field.hint} required={field.required} />
                    <Switch
                      checked={watchedValue ?? false}
                      onCheckedChange={(v: boolean) => form.setValue(field.key, v)}
                    />
                  </div>
                )
              }

              if (field.type === 'select' && field.options) {
                const watchedValue = form.watch(field.key) as string | undefined
                return (
                  <div key={field.key}>
                    <FieldLabel label={field.label} hint={field.hint} required={field.required} />
                    <Select
                      value={watchedValue ?? ''}
                      onValueChange={(v: string | null) => form.setValue(field.key, v ?? '')}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder={masked ? String(currentVal) : 'Seçin'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }

              return (
                <div key={field.key}>
                  <FieldLabel label={field.label} hint={field.hint} required={field.required} />
                  <Input
                    {...form.register(field.key)}
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    placeholder={masked ? String(currentVal) : (field.placeholder ?? '')}
                    className={`mt-1 ${masked ? 'italic text-muted-foreground' : ''}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end border-t pt-3">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </AccordionContent>
    </AccordionItem>
  )
}
