import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface ArchComponent {
  icon: string
  name: string
  desc: string
  host: string
}

const COMPONENTS: ArchComponent[] = [
  { icon: '🖥️', name: 'Frontend (Admin Panel + Embed Widget)', desc: 'React + Vite + Tailwind. Süperadmin paneli ve müşteri web chat embed widget\'ı.', host: 'Vercel / Netlify' },
  { icon: '⚙️', name: 'Backend API', desc: 'NestJS + TypeORM. Tüm REST endpoint\'leri, auth, RBAC, business logic.', host: 'Hetzner / Railway' },
  { icon: '🔧', name: 'Worker', desc: 'Trigger.dev v3 background job\'ları. Quote pipeline, embedding üretimi, async görevler.', host: 'Trigger.dev cloud' },
  { icon: '🗄️', name: 'Veritabanı', desc: 'Postgres + pgvector. Relational data + vector embedding store (RAG için).', host: 'Self-hosted / managed Postgres' },
  { icon: '🤖', name: 'LLM Sağlayıcı', desc: 'OpenRouter aracılığıyla Anthropic, OpenAI, Google modelleri.', host: 'OpenRouter API' },
  { icon: '💬', name: 'Mesajlaşma Kanalları', desc: 'WhatsApp Business API, web embed widget, customer agent webhook\'ları.', host: 'WhatsApp Cloud API + custom' },
]

export function GenelMimari() {
  return (
    <DocsSectionCard id="genel-mimari" title="Genel Mimari" icon="🏗️">
      <p className="text-sm text-muted-foreground">
        Sistem 6 ana bileşenden oluşur. Backend mesajları kabul eder, Worker ağır işleri arka planda çalıştırır, LLM'e OpenRouter üzerinden gidilir, sonuçlar Postgres + pgvector'da saklanır.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {COMPONENTS.map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <span className="mr-2" aria-hidden>{c.icon}</span>
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div>{c.desc}</div>
              <div className="text-xs italic">Host: {c.host}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">Mesaj Akışı (yüksek seviye)</div>
          <div className="mt-2">
            Mesaj geldi → Backend doğrular → Worker tetiklenir → LLM çağrılır → Yanıt yazılır → Kanala iletilir
          </div>
          <div className="mt-2 text-xs italic">
            Detaylı 7 adımlı akış için <a href="#mesaj-akisi" className="underline hover:text-foreground">Mesaj İşlem Akışı</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
