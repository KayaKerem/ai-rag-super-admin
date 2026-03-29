import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { AiConfigSection } from '../components/ai-config-section'
import { ToolPlansSection } from '../components/tool-plans-section'
import { PricingPlansSection } from '../components/pricing-plans-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import type { ConfigBlockKey } from '@/lib/validations'

interface FieldConfig {
  key: string
  label: string
  type?: 'text' | 'number' | 'password' | 'select' | 'boolean'
  options?: string[]
  placeholder?: string
  hint?: string
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
      { key: 's3PerGbMonthUsd', label: 'S3 per GB/Month (USD)', type: 'number', hint: 'S3 depolama birim fiyati. Aylik maliyet = kullanilan GB x bu fiyat' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN per GB Transfer (USD)', type: 'number', hint: 'CDN transfer birim fiyati. Maliyet = transfer edilen GB x bu fiyat' },
      { key: 'triggerPerTaskUsd', label: 'Trigger per Task (USD)', type: 'number', hint: 'Trigger.dev task birim fiyati. Maliyet = calistirilan task x bu fiyat' },
    ],
  },
  // aiConfig is handled by AiConfigSection (with dynamic model dropdown + allowedModels)
  embeddingConfig: {
    title: 'Embedding Config',
    description: 'Varsayılan embedding model ayarları',
    fields: [
      { key: 'model', label: 'Model', type: 'text', placeholder: 'openai/text-embedding-3-small', hint: 'Metin gomme (embedding) modeli. Dokumanlari vektore cevirir' },
      { key: 'apiKey', label: 'API Key', type: 'password', hint: 'Embedding API anahtari' },
      { key: 'dimensions', label: 'Dimensions', type: 'number', hint: 'Embedding vektor boyutu. Model ile uyumlu olmali (or: 1536)' },
    ],
  },
  langfuseConfig: {
    title: 'Langfuse Config',
    description: 'Langfuse observability ve prompt yönetimi ayarları',
    fields: [
      { key: 'enabled', label: 'Tracing Enabled', type: 'boolean', hint: 'Platform genelinde Langfuse tracing acik/kapali' },
      { key: 'publicKey', label: 'Public Key', type: 'text', hint: 'Langfuse proje public key. Platform genelinde tek hesap' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', hint: 'Langfuse proje secret key' },
      { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://cloud.langfuse.com', hint: 'Langfuse sunucu adresi. Cloud icin: https://cloud.langfuse.com' },
      { key: 'environment', label: 'Environment', type: 'text', placeholder: 'production', hint: 'Ortam etiketi (or: production, staging). Langfuse filtreleme icin kullanilir' },
      { key: 'promptManagementEnabled', label: 'Prompt Management', type: 'boolean', hint: 'Aciksa prompt\'lar Langfuse\'dan yonetilir, kod icindeki varsayilan yerine Langfuse\'daki kullanilir' },
      { key: 'promptLabel', label: 'Default Prompt Label', type: 'text', placeholder: 'default', hint: 'Varsayilan prompt label. Firmalar bunu override edebilir' },
      { key: 'promptCacheTtlMs', label: 'Prompt Cache TTL (ms)', type: 'number', hint: 'Prompt cache suresi (ms). Prompt degisikliklerinin yansima suresi' },
    ],
  },
  s3Config: {
    title: 'S3 Config',
    description: 'Varsayılan S3 depolama ayarları',
    fields: [
      { key: 'bucket', label: 'Bucket', type: 'text', hint: 'Varsayilan S3 bucket adi' },
      { key: 'region', label: 'Region', type: 'text', hint: 'AWS bolgesi (or: eu-central-1)' },
      { key: 'endpoint', label: 'Endpoint', type: 'text', hint: 'Ozel S3 uyumlu endpoint (MinIO vb. icin)' },
      { key: 'forcePathStyle', label: 'Force Path Style', type: 'boolean', hint: 'Path-style URL kullanimi. MinIO gibi S3 uyumlu servisler icin gerekli' },
      { key: 'keyPrefix', label: 'Key Prefix', type: 'text', hint: 'Tum dosya yollarina eklenecek onek (or: uploads/)' },
      { key: 'putTtlSec', label: 'PUT TTL (seconds)', type: 'number', hint: 'Dosya yukleme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'getTtlSec', label: 'GET TTL (seconds)', type: 'number', hint: 'Dosya indirme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'deleteTtlSec', label: 'DELETE TTL (seconds)', type: 'number', hint: 'Dosya silme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'configCacheTtlMs', label: 'Config Cache TTL (ms)', type: 'number', hint: 'S3 config cache suresi (ms). Varsayilan: 5dk, maks: 1 saat' },
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', hint: 'Platform varsayilan S3 erisim anahtari' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', hint: 'Platform varsayilan S3 gizli anahtari' },
    ],
  },
  cdnConfig: {
    title: 'CDN Config',
    description: 'Varsayılan CDN ayarları',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean', hint: 'CDN dagitimi acik/kapali' },
      { key: 'domain', label: 'Domain', type: 'text', hint: 'CDN domain adresi (or: cdn.platform.com)' },
      { key: 'keyPairId', label: 'Key Pair ID', type: 'text', hint: 'CloudFront key pair ID' },
      { key: 'privateKey', label: 'Private Key', type: 'password', hint: 'CloudFront imzalama icin private key' },
      { key: 'ttlSec', label: 'TTL (seconds)', type: 'number', hint: 'CDN cache suresi (saniye)' },
    ],
  },
  mailConfig: {
    title: 'Mail Config',
    description: 'Varsayılan email ayarları',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', hint: 'Email servisi API anahtari (or: SendGrid)' },
      { key: 'fromAddress', label: 'From Address', type: 'text', hint: 'Gonderici email adresi' },
      { key: 'fromName', label: 'From Name', type: 'text', hint: 'Gonderici gorunen ad' },
      { key: 'replyTo', label: 'Reply To', type: 'text', hint: 'Yanit adresi (opsiyonel)' },
    ],
  },
  triggerConfig: {
    title: 'Trigger Config',
    description: 'Varsayılan Trigger.dev ayarları',
    fields: [
      { key: 'projectRef', label: 'Project Ref', type: 'text', hint: 'Trigger.dev proje referans ID' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', hint: 'Trigger.dev API anahtari' },
      { key: 'workerEnabled', label: 'Worker Enabled', type: 'boolean', hint: 'Trigger.dev worker\'lari aktif/pasif' },
    ],
  },
  limitsConfig: {
    title: 'Limits Config',
    description: 'Varsayılan kullanım limitleri',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number', hint: 'Firma basina maksimum depolama alani (MB)' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number', hint: 'Tek dosya maksimum boyutu (MB)' },
      { key: 'chunkMaxChars', label: 'Chunk Max Chars', type: 'number', hint: 'Dokuman parcalama: maksimum chunk boyutu (karakter)' },
      { key: 'chunkOverlapChars', label: 'Chunk Overlap Chars', type: 'number', hint: 'Dokuman parcalama: chunk\'lar arasi ortusme (karakter). Baglam kaybi onler' },
      { key: 'embeddingBatchSize', label: 'Embedding Batch Size', type: 'number', hint: 'Embedding isleminde batch boyutu. Yuksek = hizli ama daha fazla bellek' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number', hint: 'Sohbet gecmisi icin ayrilan token butcesi' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number', hint: 'Bu token sayisi asilinca gecmis otomatik ozetlenir' },
      { key: 'searchDefaultLimit', label: 'Search Default Limit', type: 'number', hint: 'Arama sonuclari varsayilan limit' },
      { key: 'batchMaxFiles', label: 'Batch Max Files', type: 'number', hint: 'Toplu yukleme: maksimum dosya sayisi' },
      { key: 'batchMaxTotalSizeMb', label: 'Batch Max Total Size (MB)', type: 'number', hint: 'Toplu yukleme: maksimum toplam boyut (MB)' },
      { key: 'singleFileMaxSizeMb', label: 'Single File Max Size (MB)', type: 'number', hint: 'Toplu yuklemede tek dosya maks boyut (MB)' },
      { key: 'maxTagsPerDocument', label: 'Max Tags / Document', type: 'number', hint: 'Dokuman basina maksimum etiket sayisi' },
      { key: 'maxTagLength', label: 'Max Tag Length', type: 'number', hint: 'Etiket maksimum karakter uzunlugu' },
      { key: 'approvalTimeoutMinutes', label: 'Approval Timeout (dk)', type: 'number', hint: 'Onay bekleyen islem zaman asimi (dakika)' },
      { key: 'queueConcurrencyExtract', label: 'Queue: Extract', type: 'number', hint: 'Es zamanli calisacak metin cikarma worker sayisi' },
      { key: 'queueConcurrencyIngest', label: 'Queue: Ingest', type: 'number', hint: 'Es zamanli calisacak indeksleme worker sayisi' },
      { key: 'queueConcurrencyAutoTag', label: 'Queue: AutoTag', type: 'number', hint: 'Es zamanli calisacak otomatik etiketleme worker sayisi' },
    ],
  },
  crawlerConfig: {
    title: 'Crawler Config',
    description: 'Website crawler ve Cloudflare Browser Rendering ayarları',
    fields: [
      { key: 'cloudflareAccountId', label: 'Cloudflare Account ID', type: 'text', hint: 'Cloudflare Browser Rendering hesap ID' },
      { key: 'cloudflareApiToken', label: 'Cloudflare API Token', type: 'password', hint: 'Cloudflare API token (Browser Rendering erisimi icin)' },
      { key: 'maxGlobalConcurrentCrawls', label: 'Max Global Concurrent Crawls', type: 'number', hint: 'Platform genelinde es zamanli crawler sayisi' },
    ],
  },
  documentProcessingConfig: {
    title: 'Document Processing',
    description: 'Doküman işleme ve Textract ayarları',
    fields: [
      { key: 'textractEndpoint', label: 'Textract Endpoint', type: 'text', hint: 'AWS Textract endpoint adresi' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', hint: 'Basarisiz islem icin maksimum deneme sayisi' },
      { key: 'syncTextractMaxSizeMb', label: 'Sync Textract Max Size (MB)', type: 'number', hint: 'Senkron Textract islemi icin maksimum dosya boyutu (MB). Ustu asenkron islenir' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean', hint: 'Dokuman isleme worker\'lari aktif/pasif' },
    ],
  },
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>('pricingPlans')

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
        {activeSection === 'pricingPlans' ? (
          <PricingPlansSection key="pricingPlans" />
        ) : activeSection === 'aiConfig' ? (
          <AiConfigSection
            key="aiConfig"
            currentValues={defaults?.aiConfig as Record<string, unknown> | undefined}
            models={models ?? []}
            modelOptions={modelOptions}
            onSave={handleSave}
            isSaving={isPending}
          />
        ) : activeSection === 'toolPlans' ? (
          <ToolPlansSection key="toolPlans" />
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
