import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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

interface ConfigSectionProps {
  blockKey: ConfigBlockKey
  title: string
  description: string
  fields: FieldConfig[]
  currentValues: Record<string, unknown> | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function ConfigSection({
  blockKey,
  title,
  description,
  fields,
  currentValues,
  onSave,
  isSaving,
}: ConfigSectionProps) {
  const schema = configBlockSchemas[blockKey] as ZodTypeAny

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<Record<string, any>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: (currentValues as Record<string, unknown>) ?? {},
  })

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined && !(typeof v === 'string' && v.includes('****')))
    )
    onSave(blockKey, cleaned)
  }

  function isMasked(value: unknown): boolean {
    return typeof value === 'string' && value.includes('****')
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-2 gap-4">
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
                  type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                  step={field.type === 'number' ? 'any' : undefined}
                  placeholder={masked ? String(currentVal) : (field.placeholder ?? '')}
                  className={`mt-1 ${masked ? 'italic text-muted-foreground' : ''}`}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
