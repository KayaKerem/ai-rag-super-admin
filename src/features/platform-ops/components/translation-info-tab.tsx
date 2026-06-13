import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { TRANSLATION_INFO } from '../data/catalog'

export function TranslationInfoTab() {
  return (
    <div className="space-y-4">
      {/* Sprint B follow-up banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Sprint B follow-up:</span> Per-tenant
            cost band, per-language coverage %, force-prune endpoint, per-tenant rate-limit
            override, glossary CRUD UI henüz yok.
          </p>
          <p className="text-xs">Şu an default config env-managed; aşağıdaki değerler referans.</p>
        </div>
      </div>

      {/* Cost example */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cost Example (DeepSeek V4 Flash)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Model:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.model}</code>
          </p>
          <p>
            <span className="text-muted-foreground">Timeout:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.timeoutMs / 1000}s</code> +{' '}
            {TRANSLATION_INFO.retry} &nbsp;{' '}
            <span className="text-muted-foreground">Input cap:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.maxInputChars.toLocaleString()} kr</code>
          </p>
          <p>
            <span className="text-muted-foreground">Input:</span> $
            {TRANSLATION_INFO.costPerMtokInput.toFixed(2)}/Mtok &nbsp;{' '}
            <span className="text-muted-foreground">Output:</span> $
            {TRANSLATION_INFO.costPerMtokOutput.toFixed(2)}/Mtok
          </p>
          <p>
            <span className="text-muted-foreground">Tipik turn (200→200 token TR↔AR):</span>{' '}
            ~${TRANSLATION_INFO.perTurnCostExample.toFixed(5)}
          </p>
          <p>
            <span className="text-muted-foreground">100 turn/gün × 30:</span>{' '}
            ~${TRANSLATION_INFO.monthlyExampleTenant.toFixed(2)}/ay/tenant
          </p>
        </CardContent>
      </Card>

      {/* Rate limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rate Limits (env-managed)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Per-company RPM:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.rateLimit.rpmPerCompany}</code>{' '}
            <span className="text-xs text-muted-foreground">(TRANSLATION_RPM_PER_COMPANY)</span>
          </p>
          <p>
            <span className="text-muted-foreground">Per-company tokens/saat:</span>{' '}
            <code className="text-xs">
              {TRANSLATION_INFO.rateLimit.tokensPerHour.toLocaleString()}
            </code>{' '}
            <span className="text-xs text-muted-foreground">(TRANSLATION_TOKENS_PER_HOUR)</span>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            Aşılırsa graceful degrade — operator orijinali görür ({`{ kind: 'skipped', reason: 'rate_limited' }`}).
          </p>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Desteklenen Diller (AppLanguage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRANSLATION_INFO.languages.map((lang) => (
              <Badge key={lang} variant="secondary" className="text-xs uppercase">
                {lang}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hydration statuses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">hydrationStatus Discriminator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {TRANSLATION_INFO.hydrationStatuses.map((s) => (
            <div key={s.value} className="flex items-start gap-3">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {s.label}
              </Badge>
              <span className="text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Glossary + PII */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Glossary + PII Redaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Glossary entries:</span>{' '}
            <code className="text-xs">{TRANSLATION_INFO.glossaryLocation}</code>
          </p>
          <p className="text-muted-foreground">Her LLM çağrısı öncesi maskelenen desenler:</p>
          <div className="space-y-1.5">
            {TRANSLATION_INFO.redactionMasks.map((r) => (
              <div key={r.pattern} className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {r.pattern}
                </Badge>
                <code className="text-xs text-muted-foreground">{r.mask}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {TRANSLATION_INFO.notRedacted.join(' ve ')} <strong>masklanmaz</strong> — verbatim korunur
            (span-claim, içindeki rakamların yanlışlıkla maskelenmesini önler).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
