import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { CronCard } from './cron-card'
import { CRON_CATALOG, CATEGORY_LABELS, type CronCategory } from '../data/catalog'

export function CronCatalogTab() {
  const grouped = useMemo(() => {
    const map = new Map<CronCategory, typeof CRON_CATALOG>()
    for (const entry of CRON_CATALOG) {
      const arr = map.get(entry.category) ?? []
      arr.push(entry)
      map.set(entry.category, arr)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-6">
      {/* Sprint D follow-up banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Sprint D follow-up:</span> Cron health
            monitoring (son çalışma timestamp + success/fail status), AI_INTERNAL_SECRET rotation
            wizard, per-route audit log henüz yok.
          </p>
          <p className="text-xs">
            Endpoint'lerin büyük çoğunluğu <strong>Trigger.dev scheduled task</strong>'leri tarafından
            çağrılır; yalnızca repo'da Trigger task'i olmayan 3 endpoint (process-downgrades,
            email-lifecycle, subscription-lifecycle) Coolify'da harici cron gerektirir. Tüm çağrılar
            iki header ister: <code className="text-[10px]">x-ai-internal-key</code> +{' '}
            <code className="text-[10px]">X-Edfu-Agent-Id</code>. Manuel trigger UI{' '}
            <strong>security risk</strong> (secret expose) için eklenmedi.
          </p>
        </div>
      </div>

      {grouped.map(([category, entries]) => (
        <section key={category} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {entries.map((entry) => (
              <CronCard key={entry.route} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
