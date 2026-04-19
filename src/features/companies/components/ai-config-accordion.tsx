import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModelSelect } from '@/components/ui/model-select'
import { Switch } from '@/components/ui/switch'
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

export function AiConfigAccordion({ currentValues, models, modelOptions: _modelOptions, onSave, isSaving }: AiConfigAccordionProps) {
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

  useEffect(() => {
    setAllowedModels((currentValues?.allowedModels as AllowedModel[] | undefined) ?? [])
  }, [currentValues])

  useEffect(() => {
    if (currentValues) {
      form.reset(currentValues as Record<string, unknown>)
    }
  }, [currentValues, form])

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => {
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
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
                  <FieldLabel label={field.label} hint={field.hint} required={field.required} />
                  <ModelSelect
                    models={models}
                    value={watchedValue ?? ''}
                    onChange={(v) => form.setValue(field.key, v)}
                  />
                </div>
              )
            })}

            {/* API Key */}
            <div>
              <FieldLabel label="OpenRouter API Key" hint="OpenRouter API anahtari. Tum AI istekleri bu key uzerinden yonlendirilir" required />
              <Input
                {...form.register('apiKey')}
                type="text"
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

            {/* Citation Gate Mode */}
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

            {/* Number fields */}
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

          {/* Reranking Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reranking</p>
          </div>

          <div>
            <FieldLabel label="Rerank API Key" hint="Cohere API key. Ayarlanmazsa rerank atlanır" />
            <Input
              {...form.register('rerankApiKey')}
              type="text"
              placeholder={isMasked(currentValues?.rerankApiKey) ? String(currentValues?.rerankApiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.rerankApiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          <div>
            <FieldLabel label="Rerank Model" hint="$0.0025/sorgu. rerank-v3.5 (varsayılan), v4.0-fast, v4.0-pro" />
            <Select
              value={(form.watch('rerankModel') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('rerankModel', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['rerank-v3.5', 'rerank-v4.0-fast', 'rerank-v4.0-pro'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Web Search Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Web Search</p>
          </div>

          <div>
            <FieldLabel label="Exa API Key" hint="Exa web search API key. Ayarlanmazsa web_search tool kullanılamaz" />
            <Input
              {...form.register('exaApiKey')}
              type="text"
              placeholder={isMasked(currentValues?.exaApiKey) ? String(currentValues?.exaApiKey) : ''}
              className={`mt-1 ${isMasked(currentValues?.exaApiKey) ? 'italic text-muted-foreground' : ''}`}
            />
          </div>

          <div>
            <FieldLabel label="Web Search Tier" hint="basic: $0.010, deep: $0.015, deep_reasoning: $0.018 /arama" />
            <Select
              value={(form.watch('webSearchTier') as string) ?? ''}
              onValueChange={(v: string | null) => form.setValue('webSearchTier', v ?? '')}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {['basic', 'deep', 'deep_reasoning'].map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Section */}
          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gelişmiş</p>
          </div>

          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <FieldLabel label="Multi-Model Step" hint="Tool step'lerinde ucuz model kullan (maliyet optimizasyonu)" />
            <Switch
              checked={(form.watch('multiModelStepEnabled') as boolean) ?? false}
              onCheckedChange={(v: boolean) => form.setValue('multiModelStepEnabled', v)}
            />
          </div>
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
