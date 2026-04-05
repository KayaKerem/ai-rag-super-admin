import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModelSelect } from '@/components/ui/model-select'
import { Switch } from '@/components/ui/switch'
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

export function AiConfigSection({ currentValues, models, modelOptions: _modelOptions, onSave, isSaving }: AiConfigSectionProps) {
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

  const modelFields: { key: string; label: string; hint: string; required?: boolean }[] = [
    { key: 'model', label: 'Model', hint: 'Ana AI modeli. OpenRouter model ID formatinda', required: true },
    { key: 'compactionModel', label: 'Compaction Model', hint: 'Uzun sohbet gecmisini ozetlemek icin kullanilan model' },
    { key: 'titleModel', label: 'Title Model', hint: 'Sohbet basligi otomatik uretimi icin kullanilan hafif model' },
    { key: 'summaryModel', label: 'Özet Modeli', hint: 'Dokuman ozetleme modeli (default: openai/gpt-4o-mini)' },
  ]

  const numberFields: { key: string; label: string; hint: string; required?: boolean }[] = [
    { key: 'requestTimeoutMs', label: 'Timeout (ms)', hint: 'AI istegi icin maksimum bekleme suresi (milisaniye)' },
    { key: 'budgetUsd', label: 'Budget (USD)', hint: 'Aylik AI harcama limiti ($). Asilirsa model downgrade edilir', required: true },
    { key: 'budgetDowngradeThresholdPct', label: 'Downgrade Threshold (%)', hint: 'Butcenin bu yuzdesine ulasilinca daha ucuz modele gecilir (varsayilan: %80)' },
    { key: 'hybridRrfK', label: 'Hybrid RRF K', hint: 'Hibrit arama icin RRF parametresi. Yuksek deger = daha dengeli siralama' },
    { key: 'maxOutputTokensRetryCap', label: 'Max Output Tokens Retry Cap', hint: 'Token limiti asildiginda retry yapilacak maksimum token sayisi' },
    { key: 'vectorSimilarityThreshold', label: 'Vector Similarity Threshold', hint: 'Vektor benzerlik esigi (0-1). Dusuk = daha siki eslestirme' },
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
                <FieldLabel label={field.label} hint={field.hint} required={field.required} />
                <ModelSelect
                  models={models}
                  value={watchedValue ?? ''}
                  onChange={(v) => form.setValue(field.key, v)}
                />
              </div>
            )
          })}

          <div>
            <FieldLabel label="OpenRouter API Key" hint="OpenRouter API anahtari. Tum AI istekleri bu key uzerinden yonlendirilir" required />
            <Input
              {...form.register('apiKey')}
              type="password"
              placeholder={isMasked(currentValues?.apiKey) ? String(currentValues?.apiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.apiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          {/* Language */}
          <div>
            <FieldLabel label="Dil" hint="AI yanitlari ve otomatik ozetler bu dilde uretilir" />
            <Select
              value={(form.watch('language') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('language', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['tr', 'en'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel label="Citation Gate" hint="Kaynak gosterimi kontrolu. off: kapali, warn: uyar, block: kaynak yoksa cevap verme" />
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
              <FieldLabel label={field.label} hint={field.hint} required={field.required} />
              <Input
                {...form.register(field.key)}
                type="number"
                step="any"
                className="mt-1"
              />
            </div>
          ))}

          {/* Quality Eval */}
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <FieldLabel label="Quality Eval" hint="Otomatik kalite degerlendirme. Her AI cevabi sonrasi groundedness ve relevance olculur" />
            <Switch
              checked={(form.watch('qualityEvalEnabled') as boolean) ?? false}
              onCheckedChange={(v: boolean) => form.setValue('qualityEvalEnabled', v)}
            />
          </div>

          <div>
            <FieldLabel label="Quality Eval Model" hint="Degerlendirme icin kullanilan model. Ucuz model onerilir" />
            <ModelSelect
              models={models}
              value={(form.watch('qualityEvalModel') as string) ?? ''}
              onChange={(v) => form.setValue('qualityEvalModel', v)}
            />
          </div>
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
