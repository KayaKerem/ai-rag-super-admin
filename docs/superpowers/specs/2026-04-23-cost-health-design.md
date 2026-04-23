# Cost Health Page — Admin Design

**Tarih:** 2026-04-23
**Durum:** Brainstorm onaylı, implementation öncesi spec
**Backend kaynak:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/17-cost-health.md` (`GET /platform/admin/cost-health`)
**Tarihsel arka plan:** Sprint 7'nin ilk hedefi route-level lazy split idi (bundle 1.41 MB). Bu spec o hedefin başlangıç noktasıdır: yeni route'u lazy olarak ekler, mevcut route'lar dokunulmaz. Diğer admin-only sayfalar (activity-log, search-analytics, proactive-insights) ileride aynı `/admin/*` prefix ve lazy patern üzerine gelecek.

## 1. Amaç

Platform operatörü AI maliyet kayıt kalitesini (provider fatura vs token tahmini vs hiç kayıt edilememiş vs migration-öncesi NULL) tek sayfada görebilsin, OpenRouter dashboard'u ile bizim dashboard arasındaki farkın kökenini anlayabilsin. Hedef metrikler: `provider ≥ 90%`, `missing = 0%`. Operatör hangi event type'ta veya hangi modelde estimate oranının yüksek olduğunu ilk bakışta göreni.

## 2. Kapsam

### Bu spec içinde

- Yeni route: `/admin/cost-health`, **lazy-loaded** (`React.lazy` + `<Suspense>`)
- Yeni sayfa: `CostHealthPage`, üç ana blok (headline + stacked bar + iki tablo)
- Yeni hook: `useCostHealth(filters)` — TanStack Query + axios
- Yeni types: `CostHealthResponse`, `CostBucket`, `CostByEventType`, `CostByModel`, `CostHealthFilters`
- Yeni util: `getProviderBand(pct)` — renk eşikleri
- Yeni reusable primitives:
  - `useUrlFilterState<T>` hook (`src/lib/hooks/`)
  - `CompanyCombobox` component (`src/components/filters/`)
  - `DateRangePicker` component (`src/components/filters/`)
- Yeni shadcn component'leri: `popover`, `calendar`, `command` (`src/components/ui/`)
- Yeni npm dep'ler: `react-day-picker`, `date-fns`, `@radix-ui/react-popover`, `cmdk`
- Sidebar'a görsel separator çizgisi + `Cost Health` ikon item'ı (flat, nested değil — mevcut `w-14` ikon şeridi yapısı korunur)
- Query key: `queryKeys.admin.costHealth(filters)`
- URL state: `?companyId=&from=&to=` — refresh sonrası korur, paylaşılabilir
- Loading / error / empty state'ler
- Manuel smoke test + TypeScript + lint geçişi (repo'da otomatik test altyapısı yok, mevcut spec konvansiyonunu izler — bkz. §6)

### Bu spec dışında

- Diğer mevcut route'ları lazy'ye çevirmek (`/companies`, `/settings` vb. — sonraki follow-up, Sprint 7 notlarına eklenir)
- `budget-band.ts`'i jenerikleştirmek (cost-health threshold'u farklı semantic, ayrı util tutulur)
- Aylık export / CSV indirme
- Model/event-type satırına tıkla → alt sayfa (drill-down) — doküman istemiyor, YAGNI
- Real-time polling / auto-refresh (doküman "kullanıcı filtre değiştirince revalidate" diyor, default 60s staleTime yeterli)
- Trend chart (haftalık/günlük breakdown) — doküman spot-check snapshot istiyor, zaman serisi yok
- "Export OpenRouter raw invoice" karşılaştırma — sadece özet
- Sidebar'ın nested collapse yapısına dönüştürülmesi (separator + flat item yeterli, sonraki admin sayfalar eklendikçe tekrar değerlendirilir)
- URL state'i localStorage'a da mirror'lamak (URL tek source of truth)

## 3. Mimari

### 3.1 Route + Lazy Loading

`src/App.tsx` değişikliği:

```tsx
import { lazy, Suspense } from 'react'
// ... diğer static importlar değişmez
const CostHealthPage = lazy(() =>
  import('@/features/cost-health/pages/cost-health-page').then(m => ({
    default: m.CostHealthPage
  }))
)

// routes içinde:
<Route
  path="/admin/cost-health"
  element={
    <Suspense fallback={<RouteLoadingFallback />}>
      <CostHealthPage />
    </Suspense>
  }
/>
```

`RouteLoadingFallback` — basit centered spinner + "Yükleniyor..." metni; `src/components/layout/route-loading-fallback.tsx` olarak eklenir (ileride diğer lazy route'lar da kullanır).

**Neden sadece bu route lazy:** Mevcut route'ları bu PR'da split etmek kapsam şişirmesi — her route'un test'i + smoke kontrol gerekir. Bu PR yeni patern'i kurar, takip eden sprint'te diğer route'lar tek tek lazy'ye çevrilir.

### 3.2 Klasör Yapısı

```
src/
  features/
    cost-health/                           (yeni)
      types.ts
      hooks/
        use-cost-health.ts
      lib/
        cost-health-threshold.ts
      components/
        cost-health-headline.tsx
        cost-health-stacked-bar.tsx
        cost-health-breakdown-tables.tsx
      pages/
        cost-health-page.tsx
  components/
    filters/                               (yeni)
      company-combobox.tsx
      date-range-picker.tsx
    ui/
      popover.tsx                          (yeni, shadcn)
      calendar.tsx                         (yeni, shadcn)
      command.tsx                          (yeni, shadcn)
    layout/
      sidebar.tsx                          (değişir)
      route-loading-fallback.tsx           (yeni)
  lib/
    hooks/                                 (yeni klasör)
      use-url-filter-state.ts
    query-keys.ts                          (değişir)
  App.tsx                                  (değişir)
```

`src/lib/hooks/` şu an yok — yeni klasör. Diğer hook'lar feature-lokal (`src/features/*/hooks/`) olarak yaşıyor; `useUrlFilterState` cross-feature bir yardımcı olduğu için `src/lib/hooks/`'a konur.

### 3.3 Veri Akışı

```
URL (?companyId=X&from=ISO&to=ISO)
  │
  ▼
CostHealthPage
  │ filters = useUrlFilterState<CostHealthFilters>({
  │   defaults: { companyId: null, from: null, to: null },
  │   parse / serialize ISO date ↔ Date
  │ })
  │
  ▼
useCostHealth(filters)
  │ queryKey: queryKeys.admin.costHealth(filters)
  │ staleTime: 60_000
  │ enabled: always (filter null ise backend default kullanır)
  │ queryFn: axios.get('/platform/admin/cost-health', { params })
  │         params: companyId?, from?.toISOString(), to?.toISOString()
  ▼
{ data, isLoading, isError, error }
  │
  ▼ (data varsa)
┌───────────────────────────────────────┐
│ <CostHealthHeadline                   │
│    total={data.totalCostUsd}          │
│    period={start, end}                │
│    filters={...}                      │
│    onFiltersChange={setFilters} />    │
│                                       │
│ <CostHealthStackedBar                 │
│    breakdown={data.breakdown} />      │
│                                       │
│ <CostHealthBreakdownTables            │
│    byEventType={data.byEventType}     │
│    byModel={data.byModel} />          │
└───────────────────────────────────────┘
```

Filter değişince `setFilters` → URL güncellenir → `useUrlFilterState` yeni değer döner → `useCostHealth` query key değişir → refetch (cache miss).

### 3.4 `useUrlFilterState<T>` Tasarımı

Generic hook imzası:

```ts
export interface UseUrlFilterStateOptions<T> {
  defaults: T
  parse: (params: URLSearchParams) => T
  serialize: (value: T) => Record<string, string | undefined>
}

export function useUrlFilterState<T>(
  opts: UseUrlFilterStateOptions<T>
): [T, (updater: Partial<T> | ((prev: T) => T)) => void]
```

- `parse` — URL'den T'ye (eksik/boş param'ları default'a çevir)
- `serialize` — T'den `{ key: value|undefined }`'e; `undefined` olan key'ler URL'den silinir (default'a eşit olanlar da silinir ki URL temiz kalsın)
- Returns `[currentValue, setValue]`, setValue partial merge yapar, sonrasında `searchParams`'ı `setSearchParams` ile günceller
- `replace: true` kullan — filter değişiklikleri history stack'e girmesin

Cost Health için özel kullanım:

```ts
const [filters, setFilters] = useUrlFilterState<CostHealthFilters>({
  defaults: { companyId: null, from: null, to: null },
  parse: (p) => ({
    companyId: p.get('companyId') ?? null,
    from: p.get('from') ? new Date(p.get('from')!) : null,
    to: p.get('to') ? new Date(p.get('to')!) : null,
  }),
  serialize: (v) => ({
    companyId: v.companyId ?? undefined,
    from: v.from?.toISOString(),
    to: v.to?.toISOString(),
  }),
})
```

### 3.5 Renk Eşikleri

`src/features/cost-health/lib/cost-health-threshold.ts`:

```ts
export type ProviderBand = 'healthy' | 'watch' | 'action'

export function getProviderBand(providerPct: number): ProviderBand {
  if (providerPct >= 90) return 'healthy'
  if (providerPct >= 70) return 'watch'
  return 'action'
}

export const PROVIDER_BAND_CLASSES: Record<ProviderBand, string> = {
  healthy: 'text-green-700 bg-green-50 border-green-200',
  watch:   'text-yellow-700 bg-yellow-50 border-yellow-200',
  action:  'text-red-700 bg-red-50 border-red-200',
}
```

`estimatePct` için ayrı util:

```ts
export type EstimateBand = 'healthy' | 'watch' | 'action'

// Düşük estimate = sağlıklı. Eşikler ters.
export function getEstimateBand(estimatePct: number): EstimateBand {
  if (estimatePct <= 10) return 'healthy'
  if (estimatePct <= 30) return 'watch'
  return 'action'
}
```

Mevcut `src/features/companies/lib/budget-band.ts` dokunulmaz — budget (spend vs cap %) ile cost-health quality (provider vs estimate %) farklı semantic'lere sahip. Ortak base util aramayız, YAGNI.

## 4. Component Detayları

### 4.1 `CostHealthHeadline`

Props: `{ total, periodStart, periodEnd, filters, onFiltersChange, companies, companiesLoading }`.

Layout (flex between):
- Sol: `<h1 className="text-3xl font-bold">${formatCurrency(total)}</h1>` + altında `<p className="text-muted-foreground text-sm">{formatPeriod(periodStart, periodEnd)}</p>`
- Sağ: `<div className="flex gap-2"><CompanyCombobox /><DateRangePicker /></div>`

`formatPeriod(start, end)` — `"24 Mart 2026 → 23 Nisan 2026 (30 gün)"` (Türkçe tarih, ay adı, uzunluk hesabı).

### 4.2 `CompanyCombobox`

Props: `{ value: string | null, onChange: (id: string | null) => void }`.

Implementation: shadcn `Popover` + `Command` pattern. `value === null` → button label "Tüm Şirketler". Liste başında "Tüm Şirketler" (clear) seçeneği, sonra `useCompanies()`'dan gelen şirketler. Combobox arama input'u `cmdk`'nin built-in filter'ını kullanır (şirket adı + id eşleşir).

Hook: mevcut `useCompanies()` (repo'da var, `src/features/companies/hooks/`'da — Explore raporunda gördük) çağrılır; `enabled: true` (sayfa açılınca liste yüklenir).

### 4.3 `DateRangePicker`

Props: `{ value: { from: Date|null, to: Date|null }, onChange: (range) => void }`.

Layout: inline button group + Popover.
- 4 preset button: "7 gün", "30 gün", "90 gün", "Özel"
- Aktif preset highlight (button variant `default`, diğerleri `outline`)
- "Özel" tıklanınca Popover açılır, `react-day-picker` range mode Calendar gelir
- Preset tıklanınca: `from = subDays(new Date(), N)`, `to = new Date()`, Popover kapat
- Preset seçildiğinde URL'de `from/to` ISO yazılır (ayrı bir `preset=` param tutmayız — preset zaten `now - N days`'ten türeyebilir; yeniden açılışta from/to'dan preset'i tespit ederiz)

Preset tespit logic (UI highlight için):
```ts
function detectPreset(from: Date|null, to: Date|null): '7d'|'30d'|'90d'|'custom'|null {
  if (!from || !to) return null // hiçbir preset aktif değil, default "30d" göster
  const days = Math.round((to.getTime() - from.getTime()) / 86400000)
  const recent = Math.abs(to.getTime() - Date.now()) < 86400000 // son 1 gün içinde bitiş
  if (!recent) return 'custom'
  if (days === 7) return '7d'
  if (days === 30) return '30d'
  if (days === 90) return '90d'
  return 'custom'
}
```

### 4.4 `CostHealthStackedBar`

Props: `{ breakdown: { provider, estimate, missing, legacy } }`.

Render: Başlıkta "Maliyet Kalite Dağılımı", altında tek yatay bar (height 32px, rounded corners), 4 segment `div` yan yana, her biri `style={{ width: ${pct}% }}`:
- `provider` — `bg-green-500`
- `estimate` — `bg-yellow-500`
- `missing` — `bg-red-500`
- `legacy` — `bg-gray-400`

Her segment `<Tooltip>` ile sarılır:
```
provider: $11.00 (500 event, %89.1)
```

Segment içinde `pct >= 6` ise ortalanmış beyaz label (`%XX.X`), değilse label gizli (çok dar alanda okunmaz).

Bar altında legend row: 4 renkli kare + `"provider %89.1"` vs. — kullanıcı hover etmeden de bucket'ı okuyabilsin.

Edge case: `totalCostUsd === 0` → bar yerine empty state (§5.3).

### 4.5 `CostHealthBreakdownTables`

Props: `{ byEventType: CostByEventType[], byModel: CostByModel[] }`.

Layout: `grid md:grid-cols-2 gap-6`.

Sol: "Event Type'a Göre" başlıklı Card, shadcn `Table`, kolonlar: `Event | Toplam $ | Estimate %`.

Sağ: "Model'e Göre" başlıklı Card, aynı yapı, kolonlar: `Model | Toplam $ | Estimate %`.

Her satır `formatCurrency(totalCostUsd)` + `${estimatePct.toFixed(1)}%`. `Estimate %` hücresi `<Badge>` içinde, renk `getEstimateBand(estimatePct)` + `PROVIDER_BAND_CLASSES` map'inden alınır (estimate map ayrı tutulur).

Client-side sorting: backend zaten `totalCostUsd` desc döner. Kolon header tıklaması ile re-sort (opsiyonel — MVP'de off, YAGNI).

Empty state: liste boşsa Card içinde "Bu dönemde kayıt yok" metni.

### 4.6 Sidebar değişikliği

`src/components/layout/sidebar.tsx` mevcut yapısı: `w-14` (56px) dar ikon şeridi, `Tooltip + TooltipTrigger render={<NavLink>}` paterni, her ikon hover'da label tooltip'i gösteriyor. Metin label görsel olarak sığmaz — bu yüzden "PLATFORM" yazılı başlık yerine **yatay görsel separator** kullanılır.

Değişiklik: `navItems` dizisinin sonuna — mevcut 6 item'ın altına — önce küçük bir `<div className="h-px w-8 bg-border my-1" aria-hidden="true" />` separator, sonra yeni `platformItems` dizisi. İki dizi aynı `<Tooltip>` render paternini paylaşır; sadece görsel olarak bir çizgi ile ayrılırlar.

```tsx
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Şirketler' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/email-templates', icon: Mail, label: 'Email Şablonları' },
  { to: '/service-accounts', icon: KeyRound, label: 'Servis Hesapları' },
  { to: '/docs', icon: BookOpen, label: 'Dokümantasyon' },
]

const platformItems = [
  { to: '/admin/cost-health', icon: Activity, label: 'Cost Health' },
]
```

Render:

```tsx
<nav className="flex flex-1 flex-col items-center gap-2">
  {navItems.map(renderNavItem)}
  <div className="h-px w-8 bg-border my-1" aria-hidden="true" />
  {platformItems.map(renderNavItem)}
</nav>
```

`renderNavItem` — mevcut `navItems.map` içindeki Tooltip+NavLink JSX'i helper'a çıkar (DRY, tek yerde render logic). Mevcut sidebar davranışı bozulmaz — tooltip, active state, icon tümü aynı.

İkon seçimi: `Activity` (lucide-react), "health check" metaforu. `TrendingDown` yanıltıcı (istenen şey trend değil, kalite). Tooltip metni: `"Cost Health"` (ingilizce, mevcut diğer tooltip'ler Türkçe ama bu terim backend doküman başlığı ile birebir — operatör eşleştirmesi için ingilizce tutulur).

## 5. Veri, State, Edge Cases

### 5.1 Types

```ts
// src/features/cost-health/types.ts

export type CostSource = 'provider' | 'estimate' | 'missing' | 'legacy'

export interface CostBucket {
  costUsd: number
  eventCount: number
  pct: number
}

export interface CostByEventType {
  eventType: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostByModel {
  modelName: string
  totalCostUsd: number
  estimatePct: number
}

export interface CostHealthResponse {
  periodStart: string // ISO
  periodEnd: string   // ISO
  totalCostUsd: number
  breakdown: Record<CostSource, CostBucket>
  byEventType: CostByEventType[]
  byModel: CostByModel[]
}

export interface CostHealthFilters {
  companyId: string | null
  from: Date | null
  to: Date | null
}
```

### 5.2 Loading state

`isLoading` → sayfa tam skeleton:
- Headline alanı: iki rectangle (başlık + alt metin)
- Stacked bar: tek full-width rectangle
- Tables: 2 grid hücresi, her biri 3 satır rectangle

Skeleton: mevcut `at-risk-companies-table.tsx`'deki patern (`animate-pulse` div'ler).

### 5.3 Empty / zero state

`totalCostUsd === 0` ve tüm bucket'lar 0:
- Headline: `$0.00` büyük font; altında "Seçilen dönemde AI harcaması yok." info banner
- Stacked bar: gizli
- Tables: gizli (veya Card içinde "Kayıt yok")

### 5.4 Error state

`isError` → sayfa içinde centered `<Card>` with `AlertTriangle` icon + "Veri yüklenemedi" + `<Button onClick={refetch}>Tekrar Dene</Button>`. `error.message` developer için `<pre>` içinde küçük font ile altta (prod'da kullanıcı için anlaşılır değil ama destek isteği sırasında kopyalanabilir).

Backend 403 (`platform_admin_required`) durumu: global axios interceptor zaten redirect yapar veya `useAuth` guard üst seviyede tutar — bu sayfa özel handler eklemez.

### 5.5 `byModel` içinde `modelName=null` veya boş

Backend doküman diyor: `NULL modelName'ler listeye girmez`. Defensive kontrol: `row.modelName ?? 'Bilinmeyen'` — UI çökmemesi için, ama bu path beklenen değil.

### 5.6 `pct` toplam 100 ± round error

Backend 4 bucket pct toplamı "~100" garantiliyor. UI bar render'ında `overflow-hidden` + `flex` ile 100'ü aşarsa otomatik kesilir, altında kalırsa boş kısım kalır (gri bg gösterir). Görsel farkedilmez; tooltip gerçek pct'yi gösterir.

## 6. Test Stratejisi

Mevcut konvansiyon: repoda otomatik test altyapısı yok (`vitest` / `testing-library` / `jsdom` kurulu değil, `package.json`'da `test` script'i yok; MSW dev-server mocking için var). Sprint 1-6 boyunca `KpiCard`, `RevenueSummary`, `CostTrendChart`, `CategoryBreakdown`, `AtRiskCompaniesTable`, `BudgetStatusCard` gibi component'ler ve `use-platform-summary`, `use-revenue`, `use-at-risk-companies` gibi hook'lar **test'siz** shipped — önceki spec'ler (`2026-04-18-at-risk-companies-widget-design.md` §8) bu konvansiyonu açıkça ifade ediyor. Bu spec aynı konvansiyonu izler.

### 6.1 Doğrulama

- **TypeScript:** `tsc -b` temiz (build script zaten çalıştırıyor)
- **Lint:** `eslint` temiz
- **Build:** `vite build` başarılı + `cost-health-*.js` ayrı lazy chunk olarak görünür
- **Bundle report:** main bundle boyutunda gözle görülür artış olmamalı (< 3 kB gzipped — sadece sidebar separator + lazy import string)

### 6.2 Manuel smoke test

- Dev server'da `/admin/cost-health` route'u açılır, backend verisi render edilir
- Sidebar'da mevcut 6 item altında ayraç çizgisi + `Cost Health` ikon item'ı görünür, tooltip metni "Cost Health"
- Filtre etkileşimleri:
  - CompanyCombobox'ta şirket ara + seç → URL `?companyId=X` olur + query refetch + headline aynı sayfa yenilenir
  - "7 gün" preset → URL `?from=ISO&to=ISO` olur, button highlight aktif
  - "30 gün" preset → URL güncellenir
  - "Özel" → Popover açılır, Calendar range seçimi → URL güncellenir
  - Sayfa refresh → filtreler URL'den okunur, korunur
- Empty state: backend `totalCostUsd = 0` dönerse banner görünür, bar ve tablolar gizli
- Error state: backend 500 veya network hatası → error card + "Tekrar Dene" button
- 403 senaryosu: non-superadmin token ile route'a git → mevcut axios interceptor redirect
- Stacked bar tooltip'leri: her segment'e hover → `{bucket}: $X.XX (N event, %P)` formatında detay
- Tabloda Estimate % badge rengi: 5% → yeşil, 20% → sarı, 50% → kırmızı

### 6.3 Future test infra (spec dışı)

Test altyapısı eklemek ayrı bir iş kalemi. Follow-up §8'de listelenir. Bu spec onu kapsamaz.

## 7. Kabul Kriterleri

1. `/admin/cost-health` route açılır, backend verisi render edilir (filter'sız 30g default)
2. Sidebar'da mevcut 6 item altında görsel separator çizgisi + `Cost Health` ikon item'ı (tooltip "Cost Health") görünür
3. `provider pct ≥ 90%` → stacked bar'da yeşil segment dominant + "healthy" badge
4. Company filter'da şirket seçince URL `?companyId=X` olur, sayfa refresh sonrası filter korunur
5. Date preset "7 gün" tıklanınca URL `?from=ISO&to=ISO` olur, aktif button highlight'lı kalır
6. Date preset "Özel" tıklanınca Calendar Popover açılır, range seçimi URL'e yansır
7. `totalCostUsd = 0` mock'unda empty state banner render edilir, bar gizlenir
8. `byEventType` ve `byModel` tablolarında `Estimate %` badge rengi eşik doğrultusunda (`≤ 10%` yeşil, `10-30%` sarı, `> 30%` kırmızı)
9. `npm run build` başarılı (tsc + vite build temiz), çıktıda `cost-health-*.js` ayrı lazy chunk olarak görünür
10. Lint temiz (`eslint`)
11. Main bundle boyutunda anlamlı artış yok (< 3 kB gzipped); yeni dep'ler (`react-day-picker`, `date-fns`, `@radix-ui/react-popover`, `cmdk`) lazy chunk'a düşer
12. Superadmin olmayan kullanıcı 403 → mevcut axios interceptor redirect davranışı korunur (bu sayfa özel handler eklemez)
13. Manuel smoke test (§6.2) tüm adımları geçer

## 8. Follow-up Kalemleri (bu spec dışı, memory'e işlenecek)

- Diğer route'ları lazy loading'e geçir (Sprint 7'nin geri kalan lazy-split hedefi)
- Nested sidebar collapse yapısı — admin sayfa sayısı 3+ olunca tekrar değerlendir
- Custom date range min/max validation (from > to engelleme; bu PR'da manuel kontrol yok, Calendar range modu zaten forward-only)
- `?preset=7d|30d|90d` URL kısa gösterimi (kullanıcı tercih ederse) — şu an from/to ISO yazıyoruz
- CSV export, drill-down detay sayfaları
- `budget-band.ts` ile `cost-health-threshold.ts` ortak base util — 3. eşik util'i çıkarsa değerlendir
- Test altyapısı kurulumu (vitest + testing-library + jsdom) — ayrı iş kalemi, `useUrlFilterState` ve `cost-health-threshold` test adayları
