import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { AiConfigSection } from '../components/ai-config-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
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
  // aiConfig is handled by AiConfigSection (with dynamic model dropdown + allowedModels)
  embeddingConfig: {
    title: 'Embedding Config',
    description: 'Varsayılan embedding model ayarları',
    fields: [
      { key: 'model', label: 'Model', type: 'text', placeholder: 'openai/text-embedding-3-small' },
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  langfuseConfig: {
    title: 'Langfuse Config',
    description: 'Langfuse observability ve prompt yönetimi ayarları',
    fields: [
      { key: 'enabled', label: 'Tracing Enabled', type: 'boolean' },
      { key: 'publicKey', label: 'Public Key', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://cloud.langfuse.com' },
      { key: 'environment', label: 'Environment', type: 'text', placeholder: 'production' },
      { key: 'promptManagementEnabled', label: 'Prompt Management', type: 'boolean' },
      { key: 'promptLabel', label: 'Default Prompt Label', type: 'text', placeholder: 'default' },
      { key: 'promptCacheTtlMs', label: 'Prompt Cache TTL (ms)', type: 'number' },
    ],
  },
  s3Config: {
    title: 'S3 Config',
    description: 'Varsayılan S3 depolama ayarları',
    fields: [
      { key: 'bucket', label: 'Bucket', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'endpoint', label: 'Endpoint', type: 'text' },
      { key: 'forcePathStyle', label: 'Force Path Style', type: 'boolean' },
      { key: 'keyPrefix', label: 'Key Prefix', type: 'text' },
      { key: 'putTtlSec', label: 'PUT TTL (seconds)', type: 'number' },
      { key: 'getTtlSec', label: 'GET TTL (seconds)', type: 'number' },
      { key: 'deleteTtlSec', label: 'DELETE TTL (seconds)', type: 'number' },
      { key: 'configCacheTtlMs', label: 'Config Cache TTL (ms)', type: 'number' },
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
    ],
  },
  cdnConfig: {
    title: 'CDN Config',
    description: 'Varsayılan CDN ayarları',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean' },
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
  triggerConfig: {
    title: 'Trigger Config',
    description: 'Varsayılan Trigger.dev ayarları',
    fields: [
      { key: 'projectRef', label: 'Project Ref', type: 'text' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'workerEnabled', label: 'Worker Enabled', type: 'boolean' },
    ],
  },
  limitsConfig: {
    title: 'Limits Config',
    description: 'Varsayılan kullanım limitleri',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number' },
      { key: 'chunkMaxChars', label: 'Chunk Max Chars', type: 'number' },
      { key: 'chunkOverlapChars', label: 'Chunk Overlap Chars', type: 'number' },
      { key: 'embeddingBatchSize', label: 'Embedding Batch Size', type: 'number' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number' },
      { key: 'searchDefaultLimit', label: 'Search Default Limit', type: 'number' },
      { key: 'batchMaxFiles', label: 'Batch Max Files', type: 'number' },
      { key: 'batchMaxTotalSizeMb', label: 'Batch Max Total Size (MB)', type: 'number' },
      { key: 'singleFileMaxSizeMb', label: 'Single File Max Size (MB)', type: 'number' },
      { key: 'maxTagsPerDocument', label: 'Max Tags / Document', type: 'number' },
      { key: 'maxTagLength', label: 'Max Tag Length', type: 'number' },
      { key: 'approvalTimeoutMinutes', label: 'Approval Timeout (dk)', type: 'number' },
      { key: 'queueConcurrencyExtract', label: 'Queue: Extract', type: 'number' },
      { key: 'queueConcurrencyIngest', label: 'Queue: Ingest', type: 'number' },
      { key: 'queueConcurrencyAutoTag', label: 'Queue: AutoTag', type: 'number' },
    ],
  },
  documentProcessingConfig: {
    title: 'Document Processing',
    description: 'Doküman işleme ve Textract ayarları',
    fields: [
      { key: 'textractEndpoint', label: 'Textract Endpoint', type: 'text' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number' },
      { key: 'syncTextractMaxSizeMb', label: 'Sync Textract Max Size (MB)', type: 'number' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean' },
    ],
  },
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>('pricingConfig')

  const { data: defaults } = usePlatformDefaults()
  const { mutate: updateDefaults, isPending } = useUpdatePlatformDefaults()
  const { data: models } = usePlatformModels()

  const modelOptions = useMemo(() => (models ?? []).map((m) => m.id), [models])

  const meta = sectionMeta[activeSection]
  const currentValues = defaults?.[activeSection] as Record<string, unknown> | undefined

  function handleSave(blockKey: ConfigBlockKey, values: Record<string, unknown>) {
    const title = activeSection === 'aiConfig' ? 'AI Config' : meta?.title ?? activeSection
    updateDefaults(
      { [blockKey]: values },
      {
        onSuccess: () => {
          toast.success(`${title} ayarları kaydedildi`)
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
        {activeSection === 'aiConfig' ? (
          <AiConfigSection
            key="aiConfig"
            currentValues={defaults?.aiConfig as Record<string, unknown> | undefined}
            models={models ?? []}
            modelOptions={modelOptions}
            onSave={handleSave}
            isSaving={isPending}
          />
        ) : meta ? (
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
        ) : null}
      </main>
    </div>
  )
}
