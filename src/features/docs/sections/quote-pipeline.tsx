import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface PipelineStep {
  n: number
  title: string
  desc: string
}

const STEPS: PipelineStep[] = [
  { n: 1, title: 'Budget Reserve',         desc: 'Firma bütçesinden $0.10 rezervasyon yapılır. Yetersizse task durur.' },
  { n: 2, title: 'Prepare',                desc: 'AI agent ile teklif hazırlama: KB + playbook arama, multi-step tool calling.' },
  { n: 3, title: 'Create',                 desc: 'Teklif entity\'si oluşturulur (advisory lock ile referans numarası atanır).' },
  { n: 4, title: 'Generate Doc',           desc: 'Şablon varsa DOCX dokümanı üretilir.' },
  { n: 5, title: 'Evaluate',               desc: 'Trust level\'a göre onay değerlendirmesi (otomatik gönderim veya PENDING_APPROVAL).' },
  { n: 6, title: 'Conversation Writeback', desc: 'Sonuç konuşmaya ASSISTANT turn olarak yazılır + QUOTE_PREPARED bildirimi gönderilir.' },
  { n: 7, title: 'Budget Settle',          desc: 'Gerçek LLM maliyeti ile bütçe kapanışı yapılır (rezervasyon ile fark düzeltilir).' },
]

interface TrustRow {
  level: string
  behavior: string
}

const TRUST_LEVELS: TrustRow[] = [
  { level: 'FULL_CONTROL',            behavior: 'Her teklif PENDING_APPROVAL — admin onaylamalı' },
  { level: 'AUTO_MESSAGE',            behavior: 'Her teklif PENDING_APPROVAL' },
  { level: 'AUTO_ALL_QUOTE_APPROVAL', behavior: 'autoApproveQuoteThreshold altındaki teklifler otomatik gönderilir' },
  { level: 'FULLY_AUTOMATIC',         behavior: 'Tüm teklifler otomatik gönderilir' },
]

interface StatusRow {
  status: string
  meaning: string
  rowClass: string
}

const STATUSES: StatusRow[] = [
  { status: 'pending',    meaning: 'Task tetiklendi, queue\'ya alınmadı', rowClass: '' },
  { status: 'queued',     meaning: 'Trigger.dev queue\'sunda',            rowClass: 'bg-blue-500/5' },
  { status: 'processing', meaning: 'Pipeline adımları çalışıyor',         rowClass: 'bg-violet-500/5' },
  { status: 'completed',  meaning: 'Tüm adımlar başarılı, teklif hazır',  rowClass: 'bg-emerald-500/5' },
  { status: 'failed',     meaning: 'Bir adım 3 retry sonrası başarısız',  rowClass: 'bg-red-500/5' },
]

export function QuotePipeline() {
  return (
    <DocsSectionCard id="quote-pipeline" title="Quote Pipeline" icon="📄">
      <p className="text-sm text-muted-foreground">
        Teklif hazırlama <code className="rounded bg-muted px-1 py-0.5 text-xs">quote.prepare.v1</code> Trigger.dev task'i ile asenkron 7 adımda çalışır. Max 3 retry, 180 saniye timeout. Superadmin teklif içeriğine erişmez — yalnızca limit, tool plan ve trust level yapılandırması yapar.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {STEPS.map((step) => (
          <Card key={step.n}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-400">
                  {step.n}
                </span>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Trust Level → Onay Akışı</div>
          <table className="w-full text-sm">
            <tbody>
              {TRUST_LEVELS.map((t) => (
                <tr key={t.level} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{t.level}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Durum Geçişi</div>
          <table className="w-full text-sm">
            <tbody>
              {STATUSES.map((s) => (
                <tr key={s.status} className={`border-b last:border-b-0 ${s.rowClass}`}>
                  <td className="px-3 py-2 font-mono text-xs">{s.status}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">🔐 Internal Endpoint Güvenliği</div>
          <div className="mt-2">
            Task içindeki internal endpoint çağrıları <code className="rounded bg-muted px-1 py-0.5 text-xs">AI_INTERNAL_SECRET</code> env değişkeni ile korunur. Bu secret hem backend hem Trigger.dev worker'da <strong>aynı</strong> olmalı — aksi halde task start'ta 403 döner.
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">📝 Teklif Limitleri</div>
          <div className="mt-2">
            Firma bazlı teklif limitleri <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.maxQuotes</code> (toplam) ve <code className="rounded bg-muted px-1 py-0.5 text-xs">limitsConfig.maxQuotesPerLead</code> alanlarıyla kontrol edilir. Limit aşıldıysa yeni teklif <code className="rounded bg-muted px-1 py-0.5 text-xs">409 Conflict</code> döner. Alan açıklaması için <a href="#firma-config" className="underline hover:text-foreground">Firma Config Referansı</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
