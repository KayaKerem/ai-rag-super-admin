import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STEPS = [
  { n: 1, title: 'Bütçe Rezervasyonu', desc: 'Firma AI bütçesinden $0.10 rezerve edilir; yetersizse task durdurulur.' },
  { n: 2, title: 'Hazırlama', desc: 'AI agent KB + playbook arar, multi-step tool calling ile içerik üretir.' },
  { n: 3, title: 'Oluşturma', desc: 'Quote entity oluşturulur (advisory lock ile referans numarası).' },
  { n: 4, title: 'Doküman', desc: 'Şablon varsa DOCX dokümanı üretilir.' },
  { n: 5, title: 'Değerlendirme', desc: "Firmanın trust level'ına göre onay gerekliliği belirlenir (TrustLevelService)." },
  { n: 6, title: 'Konuşma Yazımı', desc: 'Sonuç ASSISTANT turn olarak konuşmaya yazılır + QUOTE_PREPARED in-app bildirimi gönderilir.' },
  { n: 7, title: 'Bütçe Kapanışı', desc: 'Gerçek LLM maliyetiyle bütçe rezervasyonu kapatılır.' },
]

export function QuotePipelineSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Quote Pipeline</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Teklif hazırlama süreci <code className="rounded bg-muted px-1 py-0.5 text-xs">quote.prepare.v1</code> Trigger.dev task'ı ile asenkron çalışır. 7 adım sırasıyla ilerler; herhangi bir adım hata verirse bütçe rezervasyonu serbest bırakılır ve task retry'a alınır.
        </p>
      </div>

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

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="text-sm font-semibold text-amber-400">⚠ Yapılandırma Notları</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Max 3 retry, 180 saniye timeout</li>
            <li>Internal endpoint'ler <code className="rounded bg-muted px-1 py-0.5 text-xs">AI_INTERNAL_SECRET</code> env ile korunur</li>
            <li>CUSTOMER konuşmalarında <code className="rounded bg-muted px-1 py-0.5 text-xs">research</code> tool çalıştırılmaz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
