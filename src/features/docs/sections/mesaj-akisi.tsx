import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface PipelineStep {
  n: number
  title: string
  desc: string
}

const STEPS: PipelineStep[] = [
  { n: 1, title: 'Webhook Alımı', desc: 'WhatsApp Cloud API, embed widget veya customer agent webhook\'undan inbound mesaj backend\'e ulaşır.' },
  { n: 2, title: 'Doğrulama', desc: 'İmza/HMAC, rate limit, kanal eşleşmesi kontrol edilir; geçersiz istekler reddedilir.' },
  { n: 3, title: 'Conversation Lookup/Create', desc: '`customerId + channelId` ile mevcut konuşma aranır; yoksa yeni konuşma oluşturulur.' },
  { n: 4, title: 'Memory Yükleme', desc: 'Company memory + conversation memory + customer profile context\'e yüklenir.' },
  { n: 5, title: 'Agent Çalıştırma', desc: 'Sistem promptu + memory + araçlar ile LLM çağrısı yapılır (OpenRouter üzerinden).' },
  { n: 6, title: 'Tool Dispatch', desc: 'Model bir tool çağırırsa worker\'a delegate edilir (quote, search, customer update vb.).' },
  { n: 7, title: 'Yanıt Yazımı', desc: 'Final mesaj conversation\'a kaydedilir + kanala (WhatsApp/widget) gönderilir.' },
]

export function MesajAkisi() {
  return (
    <DocsSectionCard id="mesaj-akisi" title="Mesaj İşlem Akışı" icon="💬">
      <p className="text-sm text-muted-foreground">
        Bir mesaj backend'e ulaştıktan sonra 7 adımlık deterministik bir pipeline çalışır. Her adım hata verirse önceki adımların etkisi geri alınır (örn. agent başarısızsa rezervasyon serbest bırakılır).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    </DocsSectionCard>
  )
}
