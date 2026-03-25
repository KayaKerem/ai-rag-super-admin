import { Accordion } from '@/components/ui/accordion'
import { useCompanyConfig, useUpdateCompanyConfig } from '../hooks/use-company-config'
import { ConfigAccordion } from './config-accordion'
import { toast } from 'sonner'
import type { ConfigBlockKey } from '@/lib/validations'
import { Info } from 'lucide-react'

interface ConfigTabProps {
  companyId: string
}

const configBlocks: {
  key: ConfigBlockKey
  label: string
  icon: string
  fields: { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[]; placeholder?: string }[]
}[] = [
  {
    key: 'aiConfig',
    label: 'AI Config',
    icon: '🤖',
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
      { key: 'model', label: 'Model' },
      { key: 'compactionModel', label: 'Compaction Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'requestTimeoutMs', label: 'Timeout (ms)', type: 'number' },
      { key: 'budgetUsd', label: 'Budget (USD)', type: 'number' },
      { key: 'fallbackProvider', label: 'Fallback Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
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
      { key: 'keyPrefix', label: 'Key Prefix' },
    ],
  },
  {
    key: 'cdnConfig',
    label: 'CDN Config',
    icon: '🌐',
    fields: [
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
    key: 'embeddingConfig',
    label: 'Embedding Config',
    icon: '🧬',
    fields: [
      { key: 'provider', label: 'Provider' },
      { key: 'model', label: 'Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  {
    key: 'langfuseConfig',
    label: 'Langfuse Config',
    icon: '📊',
    fields: [
      { key: 'publicKey', label: 'Public Key' },
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'baseUrl', label: 'Base URL' },
    ],
  },
  {
    key: 'triggerConfig',
    label: 'Trigger Config',
    icon: '⚡',
    fields: [
      { key: 'projectRef', label: 'Project Ref' },
      { key: 'secretKey', label: 'Secret Key' },
    ],
  },
  {
    key: 'limitsConfig',
    label: 'Limits Config',
    icon: '🚧',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number' },
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
