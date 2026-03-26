import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import { AllowedModelsEditor } from './allowed-models-editor'
import type { PlatformModel, AllowedModel } from '../types'
import type { ZodTypeAny } from 'zod'

interface AiConfigAccordionProps {
  currentValues: Record<string, unknown> | undefined
  models: PlatformModel[]
  modelOptions: string[]
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function AiConfigAccordion({ currentValues, models, modelOptions, onSave, isSaving }: AiConfigAccordionProps) {
  const schema = configBlockSchemas.aiConfig as ZodTypeAny
  const hasConfig = currentValues && Object.keys(currentValues).length > 0

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

  const modelFields: { key: string; label: string }[] = [
    { key: 'model', label: 'Model' },
    { key: 'compactionModel', label: 'Compaction Model' },
  ]

  const numberFields: { key: string; label: string }[] = [
    { key: 'requestTimeoutMs', label: 'Timeout (ms)' },
    { key: 'budgetUsd', label: 'Budget (USD)' },
    { key: 'budgetDowngradeThresholdPct', label: 'Downgrade Threshold (%)' },
    { key: 'hybridRrfK', label: 'Hybrid RRF K' },
    { key: 'maxOutputTokensRetryCap', label: 'Max Output Tokens Retry Cap' },
    { key: 'vectorSimilarityThreshold', label: 'Vector Similarity Threshold' },
  ]

  return (
    <AccordionItem value="aiConfig" className="rounded-lg border">
      <AccordionTrigger className="rounded-lg bg-card px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>🤖</span>
          <span className="text-sm font-semibold">AI Config</span>
          <Badge variant={hasConfig ? 'default' : 'secondary'} className="text-[10px]">
            {hasConfig ? 'Configured' : 'Defaults'}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            {/* Model selectors */}
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

            {/* API Key */}
            <div>
              <Label className="text-xs text-muted-foreground">OpenRouter API Key</Label>
              <Input
                {...form.register('apiKey')}
                type="text"
                placeholder={isMasked(currentValues?.apiKey) ? String(currentValues?.apiKey) : ''}
                className={`mt-1 ${isMasked(currentValues?.apiKey) ? 'italic text-muted-foreground' : ''}`}
              />
            </div>

            {/* Citation Gate Mode */}
            <div>
              <Label className="text-xs text-muted-foreground">Citation Gate</Label>
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

            {/* Number fields */}
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

          {/* Allowed Models Section */}
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
