import { useState } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import type { ConfigBlockKey } from '@/lib/validations'

interface FieldConfig {
  key: string
  label: string
  type?: 'text' | 'number' | 'password' | 'select' | 'boolean'
  options?: string[]
  placeholder?: string
}

interface SectionMeta {
  title: string
  description: string
  fields: FieldConfig[]
}

const sectionMeta: Record<string, SectionMeta> = {
  pricingConfig: {
    title: 'Pricing',
    description: 'Maliyet hesaplamasında kullanılan birim fiyatlar',
    fields: [
      { key: 's3PerGbMonthUsd', label: 'S3 per GB/Month (USD)', type: 'number' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN per GB Transfer (USD)', type: 'number' },
      { key: 'triggerPerTaskUsd', label: 'Trigger per Task (USD)', type: 'number' },
    ],
  },
  aiConfig: {
    title: 'AI Config',
    description: 'Varsayılan AI provider ve model ayarları',
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'compactionModel', label: 'Compaction Model', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'apiUrl', label: 'API URL', type: 'text' },
      { key: 'requestTimeoutMs', label: 'Request Timeout (ms)', type: 'number' },
      { key: 'budgetUsd', label: 'Budget (USD)', type: 'number' },
      { key: 'fallbackProvider', label: 'Fallback Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
    ],
  },
  s3Config: {
    title: 'S3 Config',
    description: 'Varsayılan S3 depolama ayarları',
    fields: [
      { key: 'bucket', label: 'Bucket', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'endpoint', label: 'Endpoint', type: 'text' },
      { key: 'keyPrefix', label: 'Key Prefix', type: 'text' },
    ],
  },
  cdnConfig: {
    title: 'CDN Config',
    description: 'Varsayılan CDN ayarları',
    fields: [
      { key: 'domain', label: 'Domain', type: 'text' },
      { key: 'keyPairId', label: 'Key Pair ID', type: 'text' },
      { key: 'privateKey', label: 'Private Key', type: 'password' },
      { key: 'ttlSec', label: 'TTL (seconds)', type: 'number' },
    ],
  },
  mailConfig: {
    title: 'Mail Config',
    description: 'Varsayılan email ayarları',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'fromAddress', label: 'From Address', type: 'text' },
      { key: 'fromName', label: 'From Name', type: 'text' },
      { key: 'replyTo', label: 'Reply To', type: 'text' },
    ],
  },
  embeddingConfig: {
    title: 'Embedding Config',
    description: 'Varsayılan embedding ayarları',
    fields: [
      { key: 'provider', label: 'Provider', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'apiUrl', label: 'API URL', type: 'text' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  langfuseConfig: {
    title: 'Langfuse Config',
    description: 'Varsayılan Langfuse observability ayarları',
    fields: [
      { key: 'publicKey', label: 'Public Key', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'baseUrl', label: 'Base URL', type: 'text' },
    ],
  },
  triggerConfig: {
    title: 'Trigger Config',
    description: 'Varsayılan Trigger.dev ayarları',
    fields: [
      { key: 'projectRef', label: 'Project Ref', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
    ],
  },
  limitsConfig: {
    title: 'Limits Config',
    description: 'Varsayılan kullanım limitleri',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number' },
    ],
  },
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>('pricingConfig')

  const { data: defaults } = usePlatformDefaults()
  const { mutate: updateDefaults, isPending } = useUpdatePlatformDefaults()

  const meta = sectionMeta[activeSection]
  const currentValues = defaults?.[activeSection] as Record<string, unknown> | undefined

  function handleSave(blockKey: ConfigBlockKey, values: Record<string, unknown>) {
    updateDefaults(
      { [blockKey]: values },
      {
        onSuccess: () => {
          toast.success(`${meta.title} ayarları kaydedildi`)
        },
        onError: () => {
          toast.error('Kaydetme başarısız oldu')
        },
      }
    )
  }

  return (
    <div className="flex h-full gap-6 p-6">
      <aside className="w-[220px] shrink-0">
        <h1 className="mb-4 text-base font-semibold">Platform Ayarları</h1>
        <SettingsNav activeSection={activeSection} onSelect={setActiveSection} />
      </aside>

      <main className="flex-1 min-w-0">
        {meta && (
          <ConfigSection
            key={activeSection}
            blockKey={activeSection as ConfigBlockKey}
            title={meta.title}
            description={meta.description}
            fields={meta.fields}
            currentValues={currentValues}
            onSave={handleSave}
            isSaving={isPending}
          />
        )}
      </main>
    </div>
  )
}
