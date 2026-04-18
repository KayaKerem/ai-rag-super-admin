import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface BandRow {
  name: string
  threshold: string
  behavior: string
  rowClass: string
}

const BANDS: BandRow[] = [
  { name: 'Normal',             threshold: '< %80',     behavior: 'Tam kalite model (örn. Claude Sonnet 4.6)', rowClass: '' },
  { name: 'Standard Downgrade', threshold: '%80 – %95', behavior: 'Orta kalite model',                          rowClass: 'bg-yellow-500/5' },
  { name: 'Economy Downgrade',  threshold: '%95 – %97', behavior: 'Düşük maliyetli model',                      rowClass: 'bg-orange-500/5' },
  { name: 'Exhausted',          threshold: '≥ %97',     behavior: 'Yanıt vermez, "bütçe doldu" mesajı',         rowClass: 'bg-red-500/5' },
]

export function ModelDowngrade() {
  return (
    <DocsSectionCard id="model-downgrade" title="Model Seçimi & Downgrade" icon="⚖️">
      <p className="text-sm text-muted-foreground">
        Firma bütçesi aşıldıkça model otomatik olarak daha ucuz tier'a düşürülür. Aşağıdaki dört bant backend tarafından firma bazında uygulanır.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Bant</th>
                <th className="px-3 py-2 text-left">Eşik (varsayılan)</th>
                <th className="px-3 py-2 text-left">Davranış</th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.name} className={`border-b last:border-b-0 ${b.rowClass}`}>
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.threshold}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">⚠ Plan-Bazlı Threshold</div>
          <div className="mt-2">
            Yukarıdaki yüzdeler varsayılandır. <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code> alanı <strong>yalnızca Normal → Standard geçişini</strong> kontrol eder (1–100 arası, default 80). %95 (Economy) ve %97 (Exhausted) eşikleri sabittir, plan-bazında değişmez. Backend §5.3 + §12 ile teyit edildi. Plan alanının tanımı ve billing bağlamı için <a href="#fiyatlandirma-gelir" className="underline hover:text-foreground">Fiyatlandırma & Gelir</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">🔗 Bütçe Status Card</div>
          <div className="mt-2">
            Bir firmanın gerçek bant durumunu görmek için: <strong>Companies → firma seç → Usage tab → en üstteki Bütçe Durumu kartı</strong>. Kart, firmanın planına göre band hesaplar (yukarıdaki kuralları uygulayarak).
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
