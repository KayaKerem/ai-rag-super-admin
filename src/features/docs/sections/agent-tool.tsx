import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface Tool {
  name: string
  category: 'search' | 'template' | 'action'
  desc: string
  needsApproval: boolean
  inCustomer: boolean
}

const TOOLS: Tool[] = [
  { name: 'search_knowledge_base',     category: 'search',   desc: 'Bilgi bankasında arama (politikalar, kurallar, ürünler)',                         needsApproval: false, inCustomer: true  },
  { name: 'search_drive_documents',    category: 'search',   desc: 'Yüklenen dokümanlarda arama (PDF, Word, Excel)',                                  needsApproval: false, inCustomer: true  },
  { name: 'list_knowledge_categories', category: 'search',   desc: 'Bilgi bankası kategorilerini listeler',                                            needsApproval: false, inCustomer: true  },
  { name: 'search_playbook',           category: 'search',   desc: 'Satış playbook\'unda arama (SSS, fiyat, objection handling)',                     needsApproval: false, inCustomer: true  },
  { name: 'search_notes',              category: 'search',   desc: 'Kişisel notlarda arama',                                                           needsApproval: false, inCustomer: false },
  { name: 'search_memory',             category: 'search',   desc: 'Kullanıcı hafızasında arama',                                                      needsApproval: false, inCustomer: false },
  { name: 'web_search',                category: 'search',   desc: 'Exa API ile web\'de güncel bilgi arama',                                           needsApproval: false, inCustomer: true  },
  { name: 'research',                  category: 'search',   desc: 'Derin web araştırması (şirket/pazar/konu) — Exa + LLM özetleme',                   needsApproval: false, inCustomer: false },
  { name: 'get_lead_context',          category: 'search',   desc: 'Müşteri bilgisi (CUSTOMER modda hassas alanlar gizlenir)',                         needsApproval: false, inCustomer: true  },
  { name: 'view_pipeline',             category: 'search',   desc: 'Lead pipeline özeti (sayı + değer)',                                               needsApproval: false, inCustomer: false },
  { name: 'view_lead',                 category: 'search',   desc: 'Lead detay bilgisi',                                                               needsApproval: false, inCustomer: false },
  { name: 'view_quote_stats',          category: 'search',   desc: 'Teklif istatistikleri',                                                            needsApproval: false, inCustomer: false },
  { name: 'analyze_sales',             category: 'search',   desc: 'Satış analizi (trend, dönüşüm, ülke)',                                             needsApproval: false, inCustomer: false },
  { name: 'templates',                 category: 'template', desc: 'Şablon arama + önerme + doldurma (çoklu işlem)',                                   needsApproval: true,  inCustomer: false },
  { name: 'notes',                     category: 'action',   desc: 'Not oluşturma + güncelleme + silme (çoklu işlem)',                                 needsApproval: true,  inCustomer: false },
  { name: 'memory',                    category: 'action',   desc: 'Uzun vadeli kullanıcı hafızası kaydetme/sorgulama',                                needsApproval: false, inCustomer: false },
  { name: 'create_quote',              category: 'action',   desc: 'Asenkron teklif hazırlama süreci başlatır',                                        needsApproval: true,  inCustomer: false },
  { name: 'send_quote',                category: 'action',   desc: 'Önceden hazırlanmış teklifi kanala gönderir',                                       needsApproval: true,  inCustomer: false },
  { name: 'schedule_follow_up',        category: 'action',   desc: 'Müşteri için takip tarihi planlar',                                                needsApproval: false, inCustomer: true  },
  { name: 'update_lead_status',        category: 'action',   desc: 'Lead pipeline durumunu günceller',                                                 needsApproval: false, inCustomer: true  },
  { name: 'escalate_to_human',         category: 'action',   desc: 'Konuşmayı insan operatöre aktarır',                                                needsApproval: false, inCustomer: true  },
]

interface FilterStep {
  n: number
  title: string
  desc: string
}

const FILTER_STEPS: FilterStep[] = [
  { n: 1, title: 'Plan Filtreleme',           desc: 'Plan\'daki `allowedTools` listesi uygulanır. `["*"]` = tüm tool\'lar (enterprise).' },
  { n: 2, title: 'Şirket Override',           desc: 'Firma bazlı override: `{ "fill_template": true, "web_search": false }`. Plan\'dan bağımsız ekleme/çıkarma.' },
  { n: 3, title: 'Konuşma Tipi Filtreleme',   desc: 'CUSTOMER konuşma → `CUSTOMER_EXCLUDED_TOOLS` çıkarılır. INTERNAL konuşma → değişiklik yok.' },
  { n: 4, title: 'Lead Bağımlılık Filtreleme', desc: 'Konuşmada lead yoksa → `LEAD_DEPENDENT_TOOLS` çıkarılır (get_lead_context, schedule_follow_up, update_lead_status, escalate_to_human).' },
]

interface ConvCompare {
  feature: string
  internal: string
  customer: string
}

const CONV_COMPARISON: ConvCompare[] = [
  { feature: 'Erişim',           internal: 'Firma paneli (çalışanlar)',          customer: 'WhatsApp, web chat (müşteriler)' },
  { feature: 'Tool\'lar',        internal: 'Tüm 21 tool',                         customer: '~9 tool (gizli olanlar çıkarılır)' },
  { feature: 'Veri görünürlüğü', internal: 'INTERNAL_ONLY + CUSTOMER_SAFE',       customer: 'Yalnızca CUSTOMER_SAFE' },
  { feature: 'Sistem promptu',   internal: 'Genel talimatlar',                    customer: '+ Müşteri yüzlü kurallar + satış stratejisi' },
  { feature: 'Guardrail',        internal: 'Temel kontroller',                    customer: '+ İç veri sızıntısı tespiti (maliyet, marj vb.)' },
  { feature: 'Trust Level',      internal: 'Devre dışı (onay yok)',               customer: 'Aktif (trust level\'a göre onay)' },
  { feature: 'Arama',            internal: 'Tüm içerikler',                       customer: 'Yalnızca `visibilityScope = CUSTOMER_SAFE`' },
]

const CATEGORY_BADGE: Record<Tool['category'], string> = {
  search:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  template: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  action:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export function AgentTool() {
  return (
    <DocsSectionCard id="agent-tool" title="Agent Tool Sistemi" icon="🛠️">
      <p className="text-sm text-muted-foreground">
        Agent her LLM çağrısı sırasında bu tool'lara erişir. Kullanım frekansı ve maliyeti firma bazında izlenir. Toplam {TOOLS.length} tool, 3 kategoride: <strong>search</strong> ({TOOLS.filter(t => t.category === 'search').length}), <strong>template</strong> ({TOOLS.filter(t => t.category === 'template').length}), <strong>action</strong> ({TOOLS.filter(t => t.category === 'action').length}).
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Tool Adı</th>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">Ne Yapar</th>
                <th className="px-3 py-2 text-center">Onay</th>
                <th className="px-3 py-2 text-center">CUSTOMER</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-xs">{t.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[t.category]}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{t.desc}</td>
                  <td className="px-3 py-2 text-center">{t.needsApproval ? '✅' : '—'}</td>
                  <td className="px-3 py-2 text-center">{t.inCustomer ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 mt-6 text-base font-semibold">Tool Filtreleme Akışı</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          LLM'e gönderilmeden önce tool seti 4 adımlı bir filtreden geçer.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FILTER_STEPS.map((step) => (
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
      </div>

      <div>
        <h3 className="mb-3 mt-6 text-base font-semibold">CUSTOMER vs INTERNAL Konuşma</h3>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Özellik</th>
                  <th className="px-3 py-2 text-left">INTERNAL</th>
                  <th className="px-3 py-2 text-left">CUSTOMER</th>
                </tr>
              </thead>
              <tbody>
                {CONV_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{row.feature}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.internal}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.customer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DocsSectionCard>
  )
}
