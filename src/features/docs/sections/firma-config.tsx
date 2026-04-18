import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface FieldRow {
  field: string
  type: string
  defaultVal: string
  desc: string
}

const AI_FIELDS: FieldRow[] = [
  { field: 'model',                       type: 'string',         defaultVal: '—',           desc: 'OpenRouter model ID (örn. anthropic/claude-sonnet-4.6)' },
  { field: 'allowedModels',               type: 'array',          defaultVal: '[]',          desc: 'İzin verilen modeller — boş ise yalnızca `model` kullanılır' },
  { field: 'apiKey',                      type: 'string',         defaultVal: '—',           desc: 'OpenRouter API key (GET\'te maskeli)' },
  { field: 'budgetUsd',                   type: 'number',         defaultVal: '—',           desc: 'Aylık bütçe limiti (USD)' },
  { field: 'budgetDowngradeThresholdPct', type: 'number (1-100)', defaultVal: '80',          desc: 'Normal → Standard downgrade eşiği' },
  { field: 'language',                    type: 'tr | en',        defaultVal: 'tr',          desc: 'Firma dili — AI yanıtları + otomatik özetler' },
  { field: 'rerankApiKey / rerankModel',  type: 'string',         defaultVal: 'rerank-v3.5', desc: 'Cohere reranking (masked key)' },
  { field: 'exaApiKey / webSearchTier',   type: 'basic | deep',   defaultVal: 'basic',       desc: 'Exa web search (masked key)' },
  { field: 'citationGateMode',            type: 'off|warn|block', defaultVal: '—',           desc: 'Kaynaksız yanıt davranışı' },
  { field: 'qualityEvalEnabled',          type: 'boolean',        defaultVal: 'true',        desc: 'Otomatik kalite değerlendirme' },
]

const EMBEDDING_FIELDS: FieldRow[] = [
  { field: 'model',      type: 'string', defaultVal: '—',    desc: 'Embedding modeli (örn. openai/text-embedding-3-small)' },
  { field: 'apiKey',     type: 'string', defaultVal: '—',    desc: 'Embedding API key (GET\'te maskeli)' },
  { field: 'dimensions', type: 'number', defaultVal: '1536', desc: 'Vektör boyutu' },
]

const LIMITS_FIELDS: FieldRow[] = [
  { field: 'maxStorageMb',       type: 'number', defaultVal: '—', desc: 'Toplam depolama limiti (MB)' },
  { field: 'maxFileSizeMb',      type: 'number', defaultVal: '—', desc: 'Tek dosya max boyut (MB)' },
  { field: 'chunkMaxChars',      type: 'number', defaultVal: '—', desc: 'Doküman chunking max karakter' },
  { field: 'chunkOverlapChars',  type: 'number', defaultVal: '—', desc: 'Chunk\'lar arası overlap' },
  { field: 'historyTokenBudget', type: 'number', defaultVal: '—', desc: 'Konuşma geçmişi token bütçesi' },
  { field: 'maxLeads',           type: 'number', defaultVal: '—', desc: 'Maks müşteri adayı (null = limitsiz)' },
  { field: 'maxQuotes',          type: 'number', defaultVal: '—', desc: 'Maks teklif sayısı (null = limitsiz)' },
  { field: 'maxQuotesPerLead',   type: 'number', defaultVal: '—', desc: 'Lead başına maks teklif (null = limitsiz)' },
  { field: 'crawlMaxPages',      type: 'number', defaultVal: '—', desc: 'Crawler başına max sayfa' },
  { field: 'crawlMaxSources',    type: 'number', defaultVal: '—', desc: 'Max crawler kaynağı' },
]

interface BlockTableProps {
  title: string
  endpoint: string
  fields: FieldRow[]
}

function BlockTable({ title, endpoint, fields }: BlockTableProps) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <div className="border-b bg-muted/30 px-3 py-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="mt-0.5 font-mono text-xs">{endpoint}</div>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Alan</th>
              <th className="px-3 py-2 text-left">Tip</th>
              <th className="px-3 py-2 text-left">Default</th>
              <th className="px-3 py-2 text-left">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.field} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs">{f.field}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.defaultVal}</td>
                <td className="px-3 py-2 text-muted-foreground">{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export function FirmaConfig() {
  return (
    <DocsSectionCard id="firma-config" title="Firma Config Referansı" icon="⚙️">
      <p className="text-sm text-muted-foreground">
        Firma config'i <code className="rounded bg-muted px-1 py-0.5 text-xs">GET/PUT /platform/companies/:id/config</code> üzerinden yönetilir. PUT partial merge — yalnızca gönderilen alanlar güncellenir. Hassas alanlar (API key'ler, secret'lar) GET response'ta maskeli döner (<code className="rounded bg-muted px-1 py-0.5 text-xs">sk-a****wxyz</code>); maskeli değeri geri göndermeyin — sadece değiştirmek istediğiniz alanları PUT edin.
      </p>

      <BlockTable title="aiConfig"        endpoint="PUT /platform/companies/:id/config — body.aiConfig"        fields={AI_FIELDS} />
      <BlockTable title="embeddingConfig" endpoint="PUT /platform/companies/:id/config — body.embeddingConfig" fields={EMBEDDING_FIELDS} />
      <BlockTable title="limitsConfig"    endpoint="PUT /platform/companies/:id/config — body.limitsConfig"    fields={LIMITS_FIELDS} />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">⚠ Plan Override Davranışı</div>
          <div className="mt-2">
            Firma bir plana atanmışsa, plan alanları config'teki aynı adlı alanları (<code className="rounded bg-muted px-1 py-0.5 text-xs">budgetUsd</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">allowedModels</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">maxStorageGb</code> vb.) efektif olarak override eder. Plan atanmamışsa config değerleri saf olarak kullanılır. Detay için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-blue-400">ℹ Config Miras Zinciri</div>
          <div className="mt-2">
            Bir alan firma config'inde yoksa platform defaults'tan miras alınır (<code className="rounded bg-muted px-1 py-0.5 text-xs">GET /platform/config/defaults</code>). Deep merge nested object'ler için uygulanır; <strong>istisna:</strong> <code className="rounded bg-muted px-1 py-0.5 text-xs">toolConfig</code> ve <code className="rounded bg-muted px-1 py-0.5 text-xs">toolPlanConfig</code> full replace — bu endpoint'ten gönderilemez, dedicated endpoint kullanın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
