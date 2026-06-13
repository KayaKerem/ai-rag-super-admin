import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface Tool {
  name: string
  category: 'search' | 'template' | 'action' | 'crm'
  desc: string
  needsApproval: boolean
  inCustomer: boolean
}

// Kaynak: backend TOOL_METADATA (src/agent/tools/tool-metadata.ts) — 27 canonical tool.
// needsApproval = APPROVAL_REQUIRED_TOOL_NAMES; inCustomer = CUSTOMER_EXCLUDED_TOOLS dışında.
// Ek olarak 2 dispatch tool var (dispatch_to_quote_agent, dispatch_to_search_agent) —
// plan/whitelist'te yer almaz, aiConfig.dispatchToolsEnabled ile yönetilir.
const TOOLS: Tool[] = [
  { name: 'search_sources',            category: 'search',   desc: 'Unified content search — bilgi bankası + yüklenen dosyalar + notlarda tek çağrıda arama', needsApproval: false, inCustomer: true  },
  { name: 'list_knowledge_categories', category: 'search',   desc: 'Bilgi bankası kategorilerini listeler',                                            needsApproval: false, inCustomer: true  },
  { name: 'search_playbook',           category: 'search',   desc: 'Satış playbook\'unda arama (SSS, fiyat, objection handling)',                     needsApproval: false, inCustomer: true  },
  { name: 'web_search',                category: 'search',   desc: 'Exa API ile web\'de güncel bilgi arama',                                           needsApproval: false, inCustomer: true  },
  { name: 'research',                  category: 'search',   desc: 'Derin web araştırması (şirket/pazar/konu) — Exa + LLM özetleme',                   needsApproval: false, inCustomer: false },
  { name: 'get_lead_context',          category: 'search',   desc: 'Müşteri bilgisi (CUSTOMER modda hassas alanlar gizlenir)',                         needsApproval: false, inCustomer: true  },
  { name: 'view_pipeline',             category: 'search',   desc: 'Lead pipeline özeti (sayı + değer)',                                               needsApproval: false, inCustomer: false },
  { name: 'view_lead',                 category: 'search',   desc: 'Lead detay bilgisi',                                                               needsApproval: false, inCustomer: false },
  { name: 'view_quote_stats',          category: 'search',   desc: 'Teklif istatistikleri',                                                            needsApproval: false, inCustomer: false },
  { name: 'analyze_sales',             category: 'search',   desc: 'Satış analizi (trend, dönüşüm, ülke)',                                             needsApproval: false, inCustomer: false },
  { name: 'search_conversations',      category: 'search',   desc: 'Müşteri konuşmalarında anahtar kelime arama (Mod 13)',                             needsApproval: false, inCustomer: false },
  { name: 'search_inbox',              category: 'search',   desc: 'Tüm inbox\'ta arama — müşteri + şirket cevapları + içe aktarılan e-posta (PR #259)', needsApproval: false, inCustomer: false },
  { name: 'top_customer_questions',    category: 'search',   desc: 'Dönemsel müşteri sorularını tema bazlı kümeler (Mod 13)',                          needsApproval: false, inCustomer: false },
  { name: 'channel_stats',             category: 'search',   desc: 'Kanal istatistikleri — volume / yanıt süresi / takeover / çözüm oranı (Mod 13)',   needsApproval: false, inCustomer: false },
  { name: 'lead_funnel',               category: 'search',   desc: 'Lead conversion + drop-off noktaları (Mod 13)',                                    needsApproval: false, inCustomer: false },
  { name: 'answer_gap_analysis',       category: 'search',   desc: 'AI\'ın cevaplayamadığı soruları yüzeye çıkarır (Mod 13)',                          needsApproval: false, inCustomer: false },
  { name: 'templates',                 category: 'template', desc: 'Şablon arama + önerme + doldurma (gruplu kimlik — action parametresiyle yönlendirilir)', needsApproval: true,  inCustomer: false },
  { name: 'notes',                     category: 'action',   desc: 'Not oluşturma + arama + güncelleme + silme (gruplu kimlik)',                       needsApproval: true,  inCustomer: false },
  { name: 'memory',                    category: 'action',   desc: 'Uzun vadeli kullanıcı hafızası kaydetme/sorgulama (gruplu kimlik)',                needsApproval: false, inCustomer: false },
  { name: 'create_quote',              category: 'action',   desc: 'Asenkron teklif hazırlama süreci başlatır',                                        needsApproval: true,  inCustomer: false },
  { name: 'send_quote',                category: 'action',   desc: 'Önceden hazırlanmış teklifi kanala gönderir',                                       needsApproval: true,  inCustomer: false },
  { name: 'schedule_follow_up',        category: 'action',   desc: 'Müşteri için takip tarihi planlar',                                                needsApproval: false, inCustomer: true  },
  { name: 'update_lead_status',        category: 'action',   desc: 'Lead pipeline durumunu günceller',                                                 needsApproval: false, inCustomer: true  },
  { name: 'escalate_to_human',         category: 'action',   desc: 'Konuşmayı insan operatöre aktarır',                                                needsApproval: false, inCustomer: true  },
  { name: 'upsertCustomer',            category: 'crm',      desc: 'Konuşmadan öğrenilen müşteri şirket bilgisini Customer CRM kaydına yazar/eşler',   needsApproval: false, inCustomer: true  },
  { name: 'updateCustomer',            category: 'crm',      desc: 'Mevcut Customer kaydına yeni öğrenilen bilgileri ekler',                           needsApproval: false, inCustomer: true  },
  { name: 'enrichLead',                category: 'crm',      desc: 'Müşteri kişi bilgisini (ad, email, telefon, adres, unvan) Lead\'e yazar — write-if-null koruması', needsApproval: false, inCustomer: true  },
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
  { n: 4, title: 'Lead Bağımlılık Filtreleme', desc: 'Konuşmada lead yoksa → `LEAD_DEPENDENT_TOOLS` çıkarılır (get_lead_context, schedule_follow_up, update_lead_status, escalate_to_human, enrichLead).' },
]

interface ConvCompare {
  feature: string
  internal: string
  customer: string
}

const CONV_COMPARISON: ConvCompare[] = [
  { feature: 'Erişim',           internal: 'Firma paneli (çalışanlar)',          customer: 'WhatsApp, web chat (müşteriler)' },
  { feature: 'Tool\'lar',        internal: 'Tüm 27 tool (+2 dispatch)',           customer: '11 tool (gizli olanlar çıkarılır)' },
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
  crm:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export function AgentTool() {
  return (
    <DocsSectionCard id="agent-tool" title="Agent Tool Sistemi" icon="🛠️">
      <p className="text-sm text-muted-foreground">
        Agent her LLM çağrısı sırasında bu tool'lara erişir. Kullanım frekansı ve maliyeti firma bazında izlenir. Toplam {TOOLS.length} tool, 4 kategoride: <strong>search</strong> ({TOOLS.filter(t => t.category === 'search').length}), <strong>template</strong> ({TOOLS.filter(t => t.category === 'template').length}), <strong>action</strong> ({TOOLS.filter(t => t.category === 'action').length}), <strong>crm</strong> ({TOOLS.filter(t => t.category === 'crm').length}). Ayrıca 2 dispatch tool (<code className="rounded bg-muted px-1 py-0.5 text-xs">dispatch_to_quote_agent</code>, <code className="rounded bg-muted px-1 py-0.5 text-xs">dispatch_to_search_agent</code>) aiConfig.dispatchToolsEnabled ile yönetilir.
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
