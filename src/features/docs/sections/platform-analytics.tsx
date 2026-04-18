import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface EndpointRow {
  method: string
  path: string
  query: string
  purpose: string
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/platform/companies/:id/usage',         query: '?months=1-12 (default 1)',       purpose: 'Firma aylık maliyet breakdown' },
  { method: 'GET', path: '/platform/companies/:id/usage/current', query: '—',                              purpose: 'Bu ay özet' },
  { method: 'GET', path: '/platform/usage/summary',               query: '?months=1-12 (default 1)',       purpose: 'Platform toplam maliyet' },
  { method: 'GET', path: '/platform/companies/:id/analytics',     query: '?months=1-12 (default 1)',       purpose: 'Kalite / feedback / tool kullanım' },
  { method: 'GET', path: '/platform/companies/:id/agent-metrics', query: '?windowDays=1-365 (default 30)', purpose: 'Citation / human workflow / alert' },
]

interface CostCategoryRow {
  category: string
  eventType: string
  responseKey: string
  formula: string
}

const COST_CATEGORIES: CostCategoryRow[] = [
  { category: 'ai',           eventType: 'ai_turn',             responseKey: 'ai',           formula: 'providerMetadata.openrouter.cost → computeLlmCost() fallback' },
  { category: 'ai',           eventType: 'ai_turn_cache_hit',   responseKey: 'cacheHits',    formula: '$0.00 (sıfır — cache hit)' },
  { category: 'ai',           eventType: 'web_search',          responseKey: 'webSearch',    formula: '$0.007 + $0.001 × resultCount' },
  { category: 'ai',           eventType: 'ai_rerank',           responseKey: 'rerank',       formula: '$0.0025 / sorgu (~500 token altı)' },
  { category: 'ai',           eventType: 'research_tool',       responseKey: 'research',     formula: 'Exa API + LLM token (~$0.015-0.025 / araştırma)' },
  { category: 'ai',           eventType: 'quote_prepare',       responseKey: 'quotePrepare', formula: 'LLM token (multi-step, ~$0.02-0.08 / teklif)' },
  { category: 'ai',           eventType: 'memory_auto_extract', responseKey: 'ai',           formula: 'Economy model token' },
  { category: 'ai',           eventType: 'proactive_freshness', responseKey: 'proactive',    formula: 'Economy model token (~$0.002-0.005 / çalışma)' },
  { category: 'ai',           eventType: 'proactive_gap',       responseKey: 'proactive',    formula: 'Economy model token' },
  { category: 'ai',           eventType: 'proactive_quality',   responseKey: 'proactive',    formula: 'Economy model token' },
  { category: 'storage',      eventType: '—',                   responseKey: 'storage',      formula: '(bytes / 1e9) × s3PerGbMonthUsd' },
  { category: 'cdn (legacy)', eventType: '—',                   responseKey: 'cdn',          formula: '0 (destek kaldırıldı)' },
  { category: 'trigger',      eventType: '—',                   responseKey: 'trigger',      formula: 'quantity × triggerPerTaskUsd' },
]

interface QualityRow {
  metric: string
  calc: string
  direction: string
}

const QUALITY_METRICS: QualityRow[] = [
  { metric: 'satisfactionRate', calc: 'positiveCount / totalRatings',                      direction: '↑ iyi (0-1)' },
  { metric: 'avgGroundedness',  calc: 'Turn citation dayanıklılık ortalaması',            direction: '↑ iyi (0-1)' },
  { metric: 'avgRelevance',     calc: 'Turn soru-cevap alakalılık ortalaması',            direction: '↑ iyi (0-1)' },
  { metric: 'lowQualityCount',  calc: 'groundedness < 0.5 VEYA relevance < 0.5 turn sayısı', direction: '↓ iyi' },
  { metric: 'noResultRate',     calc: 'Arama sonuç bulamayan oran',                        direction: '↓ iyi (0-1)' },
]

interface AlertRow {
  code: string
  severity: string
  trigger: string
  rowClass: string
}

const ALERTS: AlertRow[] = [
  { code: 'low_citation_coverage',      severity: 'warning',  trigger: 'Citation rate < %60',      rowClass: 'bg-amber-500/5' },
  { code: 'low_feedback_quality_score', severity: 'warning',  trigger: 'Quality score < 70 / 100', rowClass: 'bg-amber-500/5' },
  { code: 'pending_approval_backlog',   severity: 'critical', trigger: '≥ 10 bekleyen onay',       rowClass: 'bg-red-500/5' },
]

export function PlatformAnalytics() {
  return (
    <DocsSectionCard id="platform-analytics" title="Platform Analytics" icon="📊">
      <p className="text-sm text-muted-foreground">
        Üç metrik ailesi: <strong>Usage</strong> (maliyet breakdown), <strong>Analytics</strong> (kalite / feedback / tool kullanım), <strong>Agent Metrics</strong> (citation coverage / human workflow / alert). Gelir analitiği (MRR, byPlan, marginTry) <code className="rounded bg-muted px-1 py-0.5 text-xs">/platform/revenue</code> endpoint'i — ayrı bölüm için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a>'e bakın.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Endpoint'ler</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Query</th>
                <th className="px-3 py-2 text-left">Amaç</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-violet-400">{e.method}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.path}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{e.query}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Maliyet Kategorileri — usage response ↔ usage_events</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">eventType (DB)</th>
                <th className="px-3 py-2 text-left">Response Key (API)</th>
                <th className="px-3 py-2 text-left">Formül</th>
              </tr>
            </thead>
            <tbody>
              {COST_CATEGORIES.map((c, i) => (
                <tr key={`${c.eventType}-${i}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{c.category}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.eventType}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.responseKey}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t bg-muted/10 px-3 py-2 text-xs italic text-muted-foreground">
            Event vs key farkı: <code className="rounded bg-muted px-1 py-0.5">eventType</code> snake_case (DB satırı); response aggregation key camelCase (API). Örn. <code className="rounded bg-muted px-1 py-0.5">research_tool</code> → <code className="rounded bg-muted px-1 py-0.5">research.searchCount</code>.
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-blue-400">💨 ai_turn_cache_hit — Response Cache (Phase 1)</div>
          <div className="mt-2">
            LLM çağrılmaz — önceki benzer sorgunun cevabı serve edilir. Event $0 maliyetle yazılır. Dashboard'da <code className="rounded bg-muted px-1 py-0.5 text-xs">cacheHits.hitRate</code> (0-1) ve <code className="rounded bg-muted px-1 py-0.5 text-xs">cacheHits.estimatedSavingsUsd</code> gösterilir — tahmin: <code className="rounded bg-muted px-1 py-0.5 text-xs">SUM(tokenEstimate) × avg_token_cost</code>.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Kalite Metrikleri — /analytics Response</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Metrik</th>
                <th className="px-3 py-2 text-left">Hesap</th>
                <th className="px-3 py-2 text-left">Yön</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_METRICS.map((q) => (
                <tr key={q.metric} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{q.metric}</td>
                  <td className="px-3 py-2 text-muted-foreground">{q.calc}</td>
                  <td className="px-3 py-2 text-xs">{q.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <div className="border-b bg-muted/30 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">Agent Metrics — alerts[].code</div>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kod</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Tetik</th>
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a) => (
                <tr key={a.code} className={`border-b last:border-b-0 ${a.rowClass}`}>
                  <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.severity}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">💰 Gelir Analitiği Ayrı Bölüm</div>
          <div className="mt-2">
            MRR (<code className="rounded bg-muted px-1 py-0.5 text-xs">mrrTry</code> / <code className="rounded bg-muted px-1 py-0.5 text-xs">mrrUsd</code>), plan bazlı dağılım (<code className="rounded bg-muted px-1 py-0.5 text-xs">byPlan</code>), kâr marjı (<code className="rounded bg-muted px-1 py-0.5 text-xs">marginTry</code>) ve TCMB kuru <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /platform/revenue</code> endpoint'inden gelir. Formül ve alan açıklaması için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
