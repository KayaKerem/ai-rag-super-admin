import { useMemo } from 'react'
import { Accordion } from '@/components/ui/accordion'
import { useCompanyConfig, useUpdateCompanyConfig } from '../hooks/use-company-config'
import { usePlatformModels } from '../hooks/use-platform-models'
import { ConfigAccordion } from './config-accordion'
import { AiConfigAccordion } from './ai-config-accordion'
import { ToolConfigAccordion } from './tool-config-accordion'
import { toast } from 'sonner'
import type { ConfigBlockKey } from '@/lib/validations'
import { Info } from 'lucide-react'

interface ConfigTabProps {
  companyId: string
}

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  placeholder?: string
}

interface BlockDef {
  key: ConfigBlockKey
  label: string
  icon: string
  fields: FieldDef[]
}

const configBlocks: BlockDef[] = [
  {
    key: 'embeddingConfig',
    label: 'Embedding Config',
    icon: '🧬',
    fields: [
      { key: 'model', label: 'Model', placeholder: 'openai/text-embedding-3-small' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  {
    key: 'langfuseConfig',
    label: 'Langfuse Config',
    icon: '📊',
    fields: [
      { key: 'enabled', label: 'Tracing Enabled', type: 'boolean' },
      { key: 'publicKey', label: 'Public Key' },
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://cloud.langfuse.com' },
      { key: 'environment', label: 'Environment', placeholder: 'production' },
      { key: 'promptManagementEnabled', label: 'Prompt Management', type: 'boolean' },
      { key: 'promptLabel', label: 'Prompt Label', placeholder: 'default' },
      { key: 'promptCacheTtlMs', label: 'Prompt Cache TTL (ms)', type: 'number' },
    ],
  },
  {
    key: 's3Config',
    label: 'S3 Config',
    icon: '📦',
    fields: [
      { key: 'bucket', label: 'Bucket' },
      { key: 'region', label: 'Region' },
      { key: 'endpoint', label: 'Endpoint' },
      { key: 'forcePathStyle', label: 'Force Path Style', type: 'boolean' },
      { key: 'keyPrefix', label: 'Key Prefix' },
      { key: 'putTtlSec', label: 'PUT TTL (sn)', type: 'number' },
      { key: 'getTtlSec', label: 'GET TTL (sn)', type: 'number' },
      { key: 'deleteTtlSec', label: 'DELETE TTL (sn)', type: 'number' },
      { key: 'configCacheTtlMs', label: 'Config Cache TTL (ms)', type: 'number' },
      { key: 'accessKeyId', label: 'Access Key ID' },
      { key: 'secretAccessKey', label: 'Secret Access Key' },
    ],
  },
  {
    key: 'cdnConfig',
    label: 'CDN Config',
    icon: '🌐',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean' },
      { key: 'domain', label: 'Domain' },
      { key: 'keyPairId', label: 'Key Pair ID' },
      { key: 'privateKey', label: 'Private Key' },
      { key: 'ttlSec', label: 'TTL (sn)', type: 'number' },
    ],
  },
  {
    key: 'mailConfig',
    label: 'Mail Config',
    icon: '✉️',
    fields: [
      { key: 'apiKey', label: 'API Key' },
      { key: 'fromAddress', label: 'From Address' },
      { key: 'fromName', label: 'From Name' },
      { key: 'replyTo', label: 'Reply To' },
    ],
  },
  {
    key: 'triggerConfig',
    label: 'Trigger Config',
    icon: '⚡',
    fields: [
      { key: 'projectRef', label: 'Project Ref' },
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'workerEnabled', label: 'Worker Enabled', type: 'boolean' },
    ],
  },
  {
    key: 'limitsConfig',
    label: 'Limits Config',
    icon: '🚧',
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
  {
    key: 'documentProcessingConfig',
    label: 'Document Processing',
    icon: '📄',
    fields: [
      { key: 'textractEndpoint', label: 'Textract Endpoint' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number' },
      { key: 'syncTextractMaxSizeMb', label: 'Sync Textract Max Size (MB)', type: 'number' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean' },
    ],
  },
  {
    key: 'pricingConfig',
    label: 'Pricing Config',
    icon: '💰',
    fields: [
      { key: 's3PerGbMonthUsd', label: 'S3 ($/GB/ay)', type: 'number' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN ($/GB)', type: 'number' },
      { key: 'triggerPerTaskUsd', label: 'Trigger ($/task)', type: 'number' },
    ],
  },
]

export function ConfigTab({ companyId }: ConfigTabProps) {
  const { data: config, isLoading } = useCompanyConfig(companyId)
  const updateConfig = useUpdateCompanyConfig(companyId)
  const { data: models } = usePlatformModels()

  const modelOptions = useMemo(() => (models ?? []).map((m) => m.id), [models])

  function handleSave(blockKey: ConfigBlockKey, values: Record<string, unknown>) {
    updateConfig.mutate(
      { [blockKey]: values },
      {
        onSuccess: () => toast.success(`${blockKey} güncellendi`),
        onError: () => toast.error('Kaydetme başarısız'),
      }
    )
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-card p-3">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Boş bırakılan alanlar platform defaults&apos;tan miras alınır. Sadece değiştirmek istediğiniz alanları doldurun.
        </span>
      </div>

      <Accordion className="space-y-2">
        <AiConfigAccordion
          currentValues={config?.aiConfig}
          models={models ?? []}
          modelOptions={modelOptions}
          onSave={handleSave}
          isSaving={updateConfig.isPending}
        />

        <ToolConfigAccordion companyId={companyId} />

        {configBlocks.map((block) => (
          <ConfigAccordion
            key={block.key}
            blockKey={block.key}
            label={block.label}
            icon={block.icon}
            fields={block.fields}
            currentValues={config?.[block.key]}
            onSave={handleSave}
            isSaving={updateConfig.isPending}
          />
        ))}
      </Accordion>
    </div>
  )
}
