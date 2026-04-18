import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface Issue {
  problem: string
  cause: string
  fix: string
  link?: { href: string; label: string }
}

const ISSUES: Issue[] = [
  {
    problem: 'Bütçe limiti aşıldı',
    cause: '`budgetUsd` düşük ayarlı.',
    fix: 'Config\'ten budget artırın veya ay başını bekleyin.',
    link: { href: '#model-downgrade', label: 'Model Downgrade' },
  },
  {
    problem: 'AI yanıtları yavaş',
    cause: 'Premium model + uzun tarihçe.',
    fix: '`multiModelStepEnabled` açın, `historyTokenBudget` düşürün.',
  },
  {
    problem: 'Arama sonucu boş',
    cause: 'Embedding henüz tamamlanmadı.',
    fix: 'Knowledge item status\'u kontrol edin (READY olmalı).',
  },
  {
    problem: 'WhatsApp mesaj gönderilemiyor',
    cause: '24h penceresi kapandı.',
    fix: '`defaultTemplateName` ayarlanmalı.',
  },
  {
    problem: 'Model downgrade olmuyor',
    cause: 'Threshold çok yüksek.',
    fix: '`budgetDowngradeThresholdPct` düşürün (örnek: 70).',
    link: { href: '#model-downgrade', label: 'Model Downgrade' },
  },
  {
    problem: 'Tool çağrısı başarısız, hata logu nerede?',
    cause: 'Worker logları Trigger.dev dashboard\'unda.',
    fix: 'Trigger.dev cloud panelinde son task çalışmasının log\'una bakın. `quote.prepare.v1` task ismiyle filtreleyin.',
    link: { href: '#agent-tool', label: 'Agent Tool Sistemi' },
  },
  {
    problem: 'Quote oluşmadı, hangi adımda takıldı?',
    cause: 'Pipeline 7 adımdan birinde hata aldı.',
    fix: 'Settings → Quote Pipeline sayfasındaki step açıklamalarına bakın; Trigger.dev log\'unda hangi adımda exception atıldığı görünür.',
  },
]

interface LogKey {
  message: string
  meaning: string
}

const LOG_KEYS: LogKey[] = [
  { message: 'Research blocked: insufficient budget', meaning: 'Research tool bütçe yetersiz.' },
  { message: 'Channel model downgraded',              meaning: 'WhatsApp\'ta model düşürüldü.' },
  { message: 'Failed to settle reservation',          meaning: 'Bütçe kapanışı başarısız (kritik).' },
  { message: 'Output guardrail retry failed',         meaning: 'Guardrail sonrası tekrar üretim başarısız.' },
  { message: 'computeLlmCost Model not found',        meaning: 'Maliyet hesaplanamadı, $0 kaydedildi.' },
  { message: 'Trigger.dev quote pipeline failed',     meaning: 'Teklif pipeline hatası.' },
  { message: 'Lead lookup failed',                    meaning: 'Lead bulunamadı (teklif akışı).' },
  { message: 'OpenRouter models fetch failed',        meaning: 'Model listesi çekilemedi, fallback kullanılıyor.' },
]

export function SorunGiderme() {
  return (
    <DocsSectionCard id="sorun-giderme" title="Sorun Giderme" icon="🔧">
      <p className="text-sm text-muted-foreground">
        Sık karşılaşılan sorunlar ve çözüm önerileri. Detay için ilgili bölüme bağlantı.
      </p>

      <div className="space-y-3">
        {ISSUES.map((issue) => (
          <Card key={issue.problem}>
            <CardContent className="space-y-2 py-3 text-sm">
              <div className="font-semibold">❓ {issue.problem}</div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Olası neden:</span> {issue.cause}
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Çözüm:</span> {issue.fix}
              </div>
              {issue.link && (
                <div className="text-xs italic text-muted-foreground">
                  İlgili bölüm:{' '}
                  <a href={issue.link.href} className="underline hover:text-foreground">
                    {issue.link.label}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-base font-semibold">Log İzleme Anahtar Kelimeleri</h3>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Log Mesajı</th>
                <th className="px-3 py-2 text-left">Anlam</th>
              </tr>
            </thead>
            <tbody>
              {LOG_KEYS.map((k) => (
                <tr key={k.message} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{k.message}</td>
                  <td className="px-3 py-2 text-muted-foreground">{k.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
