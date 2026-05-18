import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import { SystemModelsGrid } from '@/features/companies/components/system-models-grid'
import { FallbackChainEditor } from '@/features/companies/components/fallback-chain-editor'
import { SYSTEM_MODEL_ROLES, type SystemModelRole, type SystemModels } from '@/features/companies/types'
import type { PlatformModel, AllowedModel } from '@/features/companies/types'
import type { ZodTypeAny } from 'zod'

const TEMP_WEIGHT_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'activity', label: 'Aktivite', hint: 'Son 7 gün aktivite ağırlığı (default: 30)' },
  { key: 'progression', label: 'Pipeline İlerleme', hint: 'Pipeline ilerleme ağırlığı (default: 20)' },
  { key: 'quote', label: 'Teklif', hint: 'Teklif engagement ağırlığı (default: 25)' },
  { key: 'engagement', label: 'Mesaj Uzunluğu', hint: 'Mesaj uzunluğu ağırlığı (default: 15)' },
  { key: 'recency', label: 'Yakınlık', hint: 'Son iletişim zamanı ağırlığı (default: 10)' },
]

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

  useEffect(() => {
    if (currentValues) {
      form.reset(currentValues as Record<string, unknown>)
    }
  }, [currentValues, form])

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([key, v]) => {
        if (key === 'systemModels') return false
        if (key === 'fallbackChain') return false
        if (key === 'temperatureWeights') return false
        if (v === '' || v === undefined || v === null) return false
        if (typeof v === 'string' && v.includes('****')) return false
        if (typeof v === 'number' && isNaN(v)) return false
        return true
      })
    )
    if (allowedModels.length > 0) {
      cleaned.allowedModels = allowedModels
    }
    if (form.formState.dirtyFields.systemModels) {
      const raw = (values.systemModels ?? {}) as Record<string, string | null | undefined>
      const systemModels: Record<string, string | null> = {}
      for (const key of SYSTEM_MODEL_ROLES) {
        const v = raw[key]
        systemModels[key] = v === '' || v == null ? null : v
      }
      cleaned.systemModels = systemModels
    }
    if (form.formState.dirtyFields.fallbackChain) {
      cleaned.fallbackChain = (values.fallbackChain as string[] | undefined) ?? []
    }
    if (form.formState.dirtyFields.temperatureWeights) {
      const raw = (values.temperatureWeights ?? {}) as Record<string, unknown>
      const weights: Record<string, number> = {}
      for (const { key } of TEMP_WEIGHT_FIELDS) {
        const n = Number(raw[key])
        if (!isNaN(n)) weights[key] = n
      }
      cleaned.temperatureWeights = weights
    }
    onSave('aiConfig', cleaned)
  }

  function isMasked(value: unknown): boolean {
    return typeof value === 'string' && value.includes('****')
  }

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

          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fallback Zinciri</p>
          </div>

          <FallbackChainEditor
            models={models}
            value={((form.watch('fallbackChain') as string[] | undefined) ?? [])}
            onChange={(chain) => form.setValue('fallbackChain', chain, { shouldDirty: true })}
          />

          <div className="col-span-2">
            <Separator className="my-3" />
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sıcaklık Ağırlıkları</p>
          </div>

          {TEMP_WEIGHT_FIELDS.map((field) => (
            <div key={field.key}>
              <FieldLabel label={field.label} hint={field.hint} />
              <Input
                {...form.register(`temperatureWeights.${field.key}`)}
                type="number"
                step="any"
                className="mt-1"
              />
            </div>
          ))}

          <SystemModelsGrid
            models={models}
            value={(form.watch('systemModels') ?? {}) as SystemModels}
            onChange={(role: SystemModelRole, modelId: string) =>
              form.setValue(`systemModels.${role}` as `systemModels.${SystemModelRole}`, modelId === '' ? null : modelId, { shouldDirty: true })
            }
          />
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
