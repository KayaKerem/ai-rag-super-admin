import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import type { PlatformModel, AllowedModel } from '@/features/companies/types'
import type { ZodTypeAny } from 'zod'

interface AiConfigSectionProps {
  currentValues: Record<string, unknown> | undefined
  models: PlatformModel[]
  modelOptions: string[]
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function AiConfigSection({ currentValues, models, modelOptions, onSave, isSaving }: AiConfigSectionProps) {
  const schema = configBlockSchemas.aiConfig as ZodTypeAny

  const [allowedModels, setAllowedModels] = useState<AllowedModel[]>(
    () => (currentValues?.allowedModels as AllowedModel[] | undefined) ?? []
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<Record<string, any>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: (currentValues as Record<string, unknown>) ?? {},
  })

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    )
    if (allowedModels.length > 0) {
      cleaned.allowedModels = allowedModels
    }
    onSave('aiConfig', cleaned)
  }

  function isMasked(value: unknown): boolean {
    return typeof value === 'string' && value.includes('****')
  }

  const modelFields = [
    { key: 'model', label: 'Model' },
    { key: 'compactionModel', label: 'Compaction Model' },
  ]

  const numberFields = [
    { key: 'requestTimeoutMs', label: 'Request Timeout (ms)' },
    { key: 'budgetUsd', label: 'Budget (USD)' },
    { key: 'budgetDowngradeThresholdPct', label: 'Downgrade Threshold (%)' },
    { key: 'hybridRrfK', label: 'Hybrid RRF K' },
    { key: 'maxOutputTokensRetryCap', label: 'Max Output Tokens Retry Cap' },
    { key: 'vectorSimilarityThreshold', label: 'Vector Similarity Threshold' },
  ]

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">AI Config</h2>
        <p className="mt-1 text-sm text-muted-foreground">Varsayılan OpenRouter model ve AI ayarları</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          {modelFields.map((field) => {
            const watchedValue = form.watch(field.key) as string | undefined
            return (
              <div key={field.key}>
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                <Select
                  value={watchedValue ?? ''}
                  onValueChange={(v: string | null) => form.setValue(field.key, v ?? '')}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Model seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}

          <div>
            <Label className="text-xs text-muted-foreground">OpenRouter API Key</Label>
            <Input
              {...form.register('apiKey')}
              type="password"
              placeholder={isMasked(currentValues?.apiKey) ? String(currentValues?.apiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.apiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Citation Gate Mode</Label>
            <Select
              value={(form.watch('citationGateMode') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('citationGateMode', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['off', 'warn', 'block'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {numberFields.map((field) => (
            <div key={field.key}>
              <Label className="text-xs text-muted-foreground">{field.label}</Label>
              <Input
                {...form.register(field.key)}
                type="number"
                step="any"
                className="mt-1"
              />
            </div>
          ))}
        </div>

        {models.length > 0 && (
          <>
            <Separator className="my-4" />
            <AllowedModelsEditor
              models={models}
              value={allowedModels}
              onChange={setAllowedModels}
            />
          </>
        )}

        <div className="mt-6 flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
