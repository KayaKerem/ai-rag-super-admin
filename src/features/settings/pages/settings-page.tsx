import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { AiConfigSection } from '../components/ai-config-section'
import { ToolPlansSection } from '../components/tool-plans-section'
import { PricingPlansSection } from '../components/pricing-plans-section'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { WorkingHoursSection } from '../components/working-hours-section'
import { WhatsAppConfigSection } from '../components/whatsapp-config-section'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import type { ConfigBlockKey } from '@/lib/validations'

interface FieldConfig {
  key: string
  label: string
  type?: 'text' | 'number' | 'password' | 'select' | 'boolean' | 'model'
  options?: string[]
  placeholder?: string
  hint?: string
  required?: boolean
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
      { key: 'triggerPerTaskUsd', label: 'Trigger per Task (USD)', type: 'number', hint: 'Trigger.dev task birim fiyati. Maliyet = calistirilan task x bu fiyat' },
    ],
  },
  // aiConfig is handled by AiConfigSection (with dynamic model dropdown + allowedModels)
  embeddingConfig: {
    title: 'Embedding Config',
    description: 'Varsayılan embedding model ayarları',
    fields: [
      { key: 'model', label: 'Model', type: 'select', options: ['openai/text-embedding-3-small', 'openai/text-embedding-3-large', 'openai/text-embedding-ada-002', 'cohere/embed-multilingual-v3.0', 'cohere/embed-english-v3.0'], hint: 'Metin gomme (embedding) modeli. Dokumanlari vektore cevirir', required: true },
      { key: 'apiKey', label: 'API Key', type: 'text', hint: 'Embedding API anahtari', required: true },
      { key: 'dimensions', label: 'Dimensions', type: 'number', hint: 'Embedding vektor boyutu. Model ile uyumlu olmali (or: 1536)' },
    ],
  },
  langfuseConfig: {
    title: 'Langfuse Config',
    description: 'Langfuse observability ve prompt yönetimi ayarları',
    fields: [
      { key: 'enabled', label: 'Tracing Enabled', type: 'boolean', hint: 'Platform genelinde Langfuse tracing acik/kapali' },
      { key: 'publicKey', label: 'Public Key', type: 'text', hint: 'Langfuse proje public key. Platform genelinde tek hesap' },
      { key: 'secretKey', label: 'Secret Key', type: 'text', hint: 'Langfuse proje secret key' },
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
      { key: 'bucket', label: 'Bucket', type: 'text', hint: 'Varsayilan S3 bucket adi', required: true },
      { key: 'region', label: 'Region', type: 'text', hint: 'AWS bolgesi (or: eu-central-1)', required: true },
      { key: 'endpoint', label: 'Endpoint', type: 'text', hint: 'Ozel S3 uyumlu endpoint (MinIO vb. icin)' },
      { key: 'forcePathStyle', label: 'Force Path Style', type: 'boolean', hint: 'Path-style URL kullanimi. MinIO gibi S3 uyumlu servisler icin gerekli' },
      { key: 'keyPrefix', label: 'Key Prefix', type: 'text', hint: 'Tum dosya yollarina eklenecek onek (or: uploads/)' },
      { key: 'putTtlSec', label: 'PUT TTL (seconds)', type: 'number', hint: 'Dosya yukleme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'getTtlSec', label: 'GET TTL (seconds)', type: 'number', hint: 'Dosya indirme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'deleteTtlSec', label: 'DELETE TTL (seconds)', type: 'number', hint: 'Dosya silme icin imzali URL gecerlilik suresi (saniye)' },
      { key: 'configCacheTtlMs', label: 'Config Cache TTL (ms)', type: 'number', hint: 'S3 config cache suresi (ms). Varsayilan: 5dk, maks: 1 saat' },
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', hint: 'Platform varsayilan S3 erisim anahtari' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'text', hint: 'Platform varsayilan S3 gizli anahtari' },
    ],
  },
  mailConfig: {
    title: 'Mail Config',
    description: 'Varsayılan email ayarları',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', hint: 'Email servisi API anahtari (or: SendGrid)', required: true },
      { key: 'fromAddress', label: 'From Address', type: 'text', hint: 'Gonderici email adresi', required: true },
      { key: 'fromName', label: 'From Name', type: 'text', hint: 'Gonderici gorunen ad', required: true },
      { key: 'replyTo', label: 'Reply To', type: 'text', hint: 'Yanit adresi (opsiyonel)' },
    ],
  },
  triggerConfig: {
    title: 'Trigger Config',
    description: 'Varsayılan Trigger.dev ayarları',
    fields: [
      { key: 'projectRef', label: 'Project Ref', type: 'text', hint: 'Trigger.dev proje referans ID', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'text', hint: 'Trigger.dev API anahtari', required: true },
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
      { key: 'crawlMaxPages', label: 'Crawler Maks Sayfa', type: 'number', hint: 'Crawler basina maksimum sayfa limiti' },
      { key: 'crawlMaxSources', label: 'Crawler Maks Kaynak', type: 'number', hint: 'Maksimum crawler kaynak sayisi' },
      { key: 'crawlMinIntervalHours', label: 'Crawler Min Aralık (saat)', type: 'number', hint: 'Crawler\'lar arasi minimum bekleme suresi' },
      { key: 'crawlConcurrency', label: 'Crawler Eşzamanlılık', type: 'number', hint: 'Es zamanli calisabilecek crawler sayisi' },
      { key: 'allowedConnectors', label: 'İzin Verilen Connector\'lar', type: 'text', hint: 'Virgülle ayrilmis connector listesi (or: website_crawler)' },
      { key: 'autoSummarizeEnabled', label: 'Otomatik Özetleme', type: 'boolean', hint: 'Yuklenen dokumanlar otomatik ozetlensin mi' },
      { key: 'maxLeads', label: 'Max Müşteri Adayı', type: 'number', hint: 'Şirket için maksimum müşteri adayı (lead) sayısı. Boş bırakılırsa limitsiz' },
      { key: 'maxPlaybookEntries', label: 'Max Playbook Girişi', type: 'number', hint: 'Şirket için maksimum playbook girişi sayısı. Boş bırakılırsa limitsiz' },
      { key: 'maxChannels', label: 'Max Kanal', type: 'number', hint: 'Şirket için maksimum kanal sayısı. Boş bırakılırsa limitsiz' },
      { key: 'maxQuotes', label: 'Max Teklif', type: 'number', hint: 'Şirket için maksimum teklif sayısı. Boş bırakılırsa limitsiz' },
      { key: 'maxQuotesPerLead', label: 'Max Teklif / Lead', type: 'number', hint: 'Lead başına maksimum teklif sayısı. Boş bırakılırsa limitsiz' },
    ],
  },
  crawlerConfig: {
    title: 'Crawler Config',
    description: 'Website crawler ve Cloudflare Browser Rendering ayarları',
    fields: [
      { key: 'cloudflareAccountId', label: 'Cloudflare Account ID', type: 'text', hint: 'Cloudflare Browser Rendering hesap ID' },
      { key: 'cloudflareApiToken', label: 'Cloudflare API Token', type: 'text', hint: 'Cloudflare API token (Browser Rendering erisimi icin)' },
      { key: 'maxGlobalConcurrentCrawls', label: 'Max Global Concurrent Crawls', type: 'number', hint: 'Platform genelinde es zamanli crawler sayisi' },
    ],
  },
  proactiveConfig: {
    title: 'Proaktif Agentlar',
    description: 'Varsayılan proaktif agent ayarları',
    fields: [
      { key: 'enabled', label: 'Aktif', type: 'boolean', hint: 'Platform genelinde proaktif agentlar varsayılan olarak açık/kapalı' },
      { key: 'freshnessEnabled', label: 'Freshness Agent', type: 'boolean', hint: 'URL değişiklik kontrolü' },
      { key: 'freshnessIntervalHours', label: 'Freshness Aralığı (saat)', type: 'number', hint: 'Kaç saatte bir kontrol (varsayılan: 6)' },
      { key: 'gapEnabled', label: 'Gap Agent', type: 'boolean', hint: 'Bilgi boşluğu analizi' },
      { key: 'gapMinQueryCount', label: 'Gap Min Sorgu', type: 'number', hint: 'Analiz için minimum sorgu sayısı (varsayılan: 10)' },
      { key: 'qualityEnabled', label: 'Quality Agent', type: 'boolean', hint: 'Kalite izleme' },
      { key: 'qualitySampleSize', label: 'Quality Örneklem', type: 'number', hint: 'Örneklem boyutu (varsayılan: 20)' },
      { key: 'monthlyBudgetUsd', label: 'Aylık Bütçe ($)', type: 'number', hint: 'Proaktif agent bütçe limiti (varsayılan: $2.00)' },
      { key: 'notifyEmail', label: 'Email Bildirimi', type: 'boolean', hint: 'Yeni insight bildirimi' },
    ],
  },
  documentProcessingConfig: {
    title: 'Document Processing',
    description: 'Doküman işleme ayarları',
    fields: [
      { key: 'supportedSourceKinds', label: 'Desteklenen Kaynaklar', type: 'text', hint: 'Virgülle ayrılmış kaynak türleri (ör: upload, url, s3)' },
      { key: 'maxAttempts', label: 'Max Attempts', type: 'number', hint: 'Basarisiz islem icin maksimum deneme sayisi' },
      { key: 'workersEnabled', label: 'Workers Enabled', type: 'boolean', hint: 'Dokuman isleme worker\'lari aktif/pasif' },
    ],
  },
  dataRetentionConfig: {
    title: 'Veri Saklama',
    description: 'Veri saklama süresi konfigürasyonu. Aktif edildiğinde süresi geçmiş lead\'ler otomatik olarak kalıcı silinir.',
    fields: [
      { key: 'enabled', label: 'Otomatik Temizlik', type: 'boolean', hint: 'Aktif edildiğinde süresi geçmiş lead\'ler geri döndürülemez şekilde silinir' },
      { key: 'leadRetentionDays', label: 'Lead Saklama Süresi (gün)', type: 'number', hint: 'Son temas tarihinden itibaren gün sayısı (min: 30, max: 3650). Varsayılan: 365' },
    ],
  },
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>('pricingPlans')

  const { data: defaults } = usePlatformDefaults()
  const { mutate: updateDefaults, isPending } = useUpdatePlatformDefaults()
  const { data: models } = usePlatformModels()

  const modelOptions = useMemo(() => (models ?? []).map((m) => m.id), [models])

  const configuredSections = useMemo(() => {
    if (!defaults) return new Set<string>()
    const set = new Set<string>()
    for (const key of Object.keys(sectionMeta)) {
      const block = defaults[key] as Record<string, unknown> | undefined
      if (block && Object.values(block).some((v) => v !== undefined && v !== null && v !== '')) {
        set.add(key)
      }
    }
    // Special sections — check separately
    if (defaults.aiConfig && Object.keys(defaults.aiConfig as object).length > 0) set.add('aiConfig')
    return set
  }, [defaults])

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
        <SettingsNav activeSection={activeSection} onSelect={setActiveSection} configuredSections={configuredSections} />
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
        ) : activeSection === 'whatsAppConfig' ? (
          <WhatsAppConfigSection
            key="whatsAppConfig"
            currentValues={defaults?.whatsAppConfig as Record<string, unknown> | undefined}
            onSave={handleSave}
            isSaving={isPending}
          />
        ) : activeSection === 'workingHoursConfig' ? (
          <WorkingHoursSection
            key="workingHoursConfig"
            currentValues={defaults?.workingHoursConfig as Record<string, unknown> | undefined}
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
            models={models ?? []}
          />
        ) : null}
      </main>
    </div>
  )
}
