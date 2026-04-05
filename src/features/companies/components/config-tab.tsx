import { useMemo } from 'react'
import { Accordion } from '@/components/ui/accordion'
import { useCompanyConfig, useUpdateCompanyConfig } from '../hooks/use-company-config'
import { usePlatformModels } from '../hooks/use-platform-models'
import { ConfigAccordion } from './config-accordion'
import { AiConfigAccordion } from './ai-config-accordion'
import { toast } from 'sonner'
import type { ConfigBlockKey } from '@/lib/validations'
import { Info } from 'lucide-react'

interface ConfigTabProps {
  companyId: string
}

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'select' | 'boolean' | 'model'
  options?: string[]
  placeholder?: string
  hint?: string
  required?: boolean
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
      { key: 'model', label: 'Model', type: 'model', hint: 'Metin gomme (embedding) modeli. Dokumanlari vektore cevirir', required: true },
      { key: 'apiKey', label: 'API Key', hint: 'Embedding API anahtari', required: true },
      { key: 'dimensions', label: 'Dimensions', type: 'number', hint: 'Embedding vektor boyutu. Model ile uyumlu olmali (or: 1536)' },
    ],
  },
  {
    key: 'langfuseConfig',
    label: 'Langfuse Config',
    icon: '📊',
    fields: [
      { key: 'enabled', label: 'Tracing Enabled', type: 'boolean', hint: 'Bu firma icin Langfuse tracing acik/kapali' },
      { key: 'publicKey', label: 'Public Key', hint: 'Langfuse proje public key' },
      { key: 'secretKey', label: 'Secret Key', hint: 'Langfuse proje secret key' },
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://cloud.langfuse.com', hint: 'Langfuse sunucu adresi. Cloud icin: https://cloud.langfuse.com' },
      { key: 'environment', label: 'Environment', placeholder: 'production', hint: 'Ortam etiketi (or: production, staging). Langfuse filtreleme icin kullanilir' },
      { key: 'promptManagementEnabled', label: 'Prompt Management', type: 'boolean', hint: 'Aciksa prompt\'lar Langfuse\'dan yonetilir, kod icindeki varsayilan yerine Langfuse\'daki kullanilir' },
      { key: 'promptLabel', label: 'Prompt Label', placeholder: 'default', hint: 'Bu firma icin kullanilacak prompt label. Langfuse\'da eslesen prompt seti kullanilir' },
      { key: 'promptCacheTtlMs', label: 'Prompt Cache TTL (ms)', type: 'number', hint: 'Prompt cache suresi (ms). Prompt degisikliklerinin yansima suresi' },
    ],
  },
  {
    key: 's3Config',
    label: 'S3 Config',
    icon: '📦',
    fields: [
      { key: 'bucket', label: 'Bucket', hint: 'S3 bucket adi. Dokumanlarin depolandigi alan', required: true },
      { key: 'region', label: 'Region', hint: 'AWS bolgesi (or: eu-central-1)', required: true },
      { key: 'endpoint', label: 'Endpoint', hint: 'Ozel S3 uyumlu endpoint (MinIO vb. icin)' },
      { key: 'forcePathStyle', label: 'Force Path Style', type: 'boolean', hint: 'Path-style URL kullanimi. MinIO gibi S3 uyumlu servisler icin gerekli' },
      { key: 'keyPrefix', label: 'Key Prefix', hint: 'Tum dosya yollarina eklenecek onek (or: uploads/)' },
      { key: 'putTtlSec', label: 'PUT TTL (sn)', type: 'number', hint: 'Dosya yukleme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'getTtlSec', label: 'GET TTL (sn)', type: 'number', hint: 'Dosya indirme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'deleteTtlSec', label: 'DELETE TTL (sn)', type: 'number', hint: 'Dosya silme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'configCacheTtlMs', label: 'Config Cache TTL (ms)', type: 'number', hint: 'S3 config cache suresi (ms). Varsayilan: 5dk, maks: 1 saat' },
      { key: 'accessKeyId', label: 'Access Key ID', hint: 'Firmanin kendi S3 erisim anahtari (opsiyonel)' },
      { key: 'secretAccessKey', label: 'Secret Access Key', hint: 'Firmanin kendi S3 gizli anahtari (opsiyonel)' },
    ],
  },
  {
    key: 'cdnConfig',
    label: 'CDN Config',
    icon: '🌐',
    fields: [
      { key: 'enabled', label: 'CDN Enabled', type: 'boolean', hint: 'CDN dagitimi acik/kapali' },
      { key: 'domain', label: 'Domain', hint: 'CDN domain adresi (or: cdn.firma.com)' },
      { key: 'keyPairId', label: 'Key Pair ID', hint: 'CloudFront key pair ID' },
      { key: 'privateKey', label: 'Private Key', hint: 'CloudFront imzalama icin private key' },
      { key: 'ttlSec', label: 'TTL (sn)', type: 'number', hint: 'CDN cache suresi (saniye)' },
    ],
  },
  {
    key: 'mailConfig',
    label: 'Mail Config',
    icon: '✉️',
    fields: [
      { key: 'apiKey', label: 'API Key', hint: 'Email servisi API anahtari (or: SendGrid)', required: true },
      { key: 'fromAddress', label: 'From Address', hint: 'Gonderici email adresi', required: true },
      { key: 'fromName', label: 'From Name', hint: 'Gonderici gorunen ad', required: true },
      { key: 'replyTo', label: 'Reply To', hint: 'Yanit adresi (opsiyonel)' },
    ],
  },
  {
    key: 'triggerConfig',
    label: 'Trigger Config',
    icon: '⚡',
    fields: [
      { key: 'projectRef', label: 'Project Ref', hint: 'Trigger.dev proje referans ID', required: true },
      { key: 'secretKey', label: 'Secret Key', hint: 'Trigger.dev API anahtari', required: true },
      { key: 'workerEnabled', label: 'Worker Enabled', type: 'boolean', hint: 'Trigger.dev worker\'lari aktif/pasif' },
    ],
  },
  {
    key: 'limitsConfig',
    label: 'Limits Config',
    icon: '🚧',
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
      { key: 'crawlMaxPages', label: 'Crawler Maks Sayfa', type: 'number', hint: 'Crawler basina maksimum sayfa limiti' },
      { key: 'crawlMaxSources', label: 'Crawler Maks Kaynak', type: 'number', hint: 'Maksimum crawler kaynak sayisi' },
      { key: 'crawlMinIntervalHours', label: 'Crawler Min Aralık (saat)', type: 'number', hint: 'Crawler\'lar arasi minimum bekleme suresi' },
      { key: 'crawlConcurrency', label: 'Crawler Eşzamanlılık', type: 'number', hint: 'Es zamanli calisabilecek crawler sayisi' },
      { key: 'allowedConnectors', label: 'İzin Verilen Connector\'lar', hint: 'Virgülle ayrilmis connector listesi (or: website_crawler)' },
      { key: 'autoSummarizeEnabled', label: 'Otomatik Özetleme', type: 'boolean', hint: 'Yuklenen dokumanlar otomatik ozetlensin mi' },
    ],
  },
  {
    key: 'documentProcessingConfig',
    label: 'Document Processing',
    icon: '📄',
    fields: [
      { key: 'textractEndpoint', label: 'Textract Endpoint', hint: 'AWS Textract endpoint adresi' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', hint: 'Basarisiz islem icin maksimum deneme sayisi' },
      { key: 'syncTextractMaxSizeMb', label: 'Sync Textract Max Size (MB)', type: 'number', hint: 'Senkron Textract islemi icin maksimum dosya boyutu (MB). Ustu asenkron islenir' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean', hint: 'Dokuman isleme worker\'lari aktif/pasif' },
    ],
  },
  {
    key: 'crawlerConfig',
    label: 'Crawler Config',
    icon: '🕷️',
    fields: [
      { key: 'cloudflareAccountId', label: 'Cloudflare Account ID', hint: 'Cloudflare Browser Rendering hesap ID' },
      { key: 'cloudflareApiToken', label: 'Cloudflare API Token', hint: 'Cloudflare API token (Browser Rendering erisimi icin)' },
      { key: 'maxGlobalConcurrentCrawls', label: 'Max Global Concurrent Crawls', type: 'number', hint: 'Platform genelinde es zamanli crawler sayisi' },
    ],
  },
  {
    key: 'pricingConfig',
    label: 'Pricing Config',
    icon: '💰',
    fields: [
      { key: 's3PerGbMonthUsd', label: 'S3 ($/GB/ay)', type: 'number', hint: 'S3 depolama birim fiyati. Aylik maliyet = kullanilan GB x bu fiyat' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN ($/GB)', type: 'number', hint: 'CDN transfer birim fiyati. Maliyet = transfer edilen GB x bu fiyat' },
      { key: 'triggerPerTaskUsd', label: 'Trigger ($/task)', type: 'number', hint: 'Trigger.dev task birim fiyati. Maliyet = calistirilan task x bu fiyat' },
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
            models={models ?? []}
          />
        ))}
      </Accordion>
    </div>
  )
}
