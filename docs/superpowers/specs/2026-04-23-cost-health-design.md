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
- Yeni component wrapper'lar: `popover.tsx` (`@base-ui/react/popover` üzerinde ince shadcn-style sarma — mevcut `tooltip.tsx` paterni ile birebir), `calendar.tsx` (`react-day-picker` üzerinde), `command.tsx` (`cmdk` üzerinde)
- Yeni npm dep'ler: `react-day-picker`, `date-fns`, `cmdk` (Radix popover **eklenmez** — `@base-ui/react` zaten Popover ihraç ediyor, primitive kütüphane tekil kalır)
- Sidebar'a görsel separator çizgisi + `Cost Health` ikon item'ı (flat, nested değil — mevcut `w-14` ikon şeridi yapısı korunur)
- Query key: `queryKeys.admin.costHealth(filters)`
- URL state: `?companyId=&preset=&from=&to=` — preset authoritative (`7d|30d|90d|custom`), `from/to` yalnızca `preset=custom` iken yazılır; refresh sonrası korur, paylaşılabilir
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

**`src/lib/query-keys.ts`'e eklenecek namespace:**

```ts
// Mevcut: companies, platform
// Yeni:
admin: {
  all: ['admin'] as const,
  costHealth: (params: {
    companyId: string | null
    fromIso: string | null  // ISO string; Date objesi değil (structural share için)
    toIso: string | null
  }) => ['admin', 'cost-health', params] as const,
},
```

`fromIso`/`toIso` string olarak key'de yer alır — Date objelerini query key'e koymak her render'da yeni referans üretir ve gereksiz refetch tetikler; string'ler primitives olarak structural-share edilir.

### 3.3 Veri Akışı

```
URL (?companyId=X&preset=30d|7d|90d|custom[&from=ISO&to=ISO])
  │
  ▼
CostHealthPage
  │ filters = useUrlFilterState<CostHealthFilters>({
  │   defaults: { companyId: null, preset: '30d', from: null, to: null },
  │   parse / serialize
  │ })
  │
  │ resolvedRange = resolvePreset(filters) — preset'i from/to'ya çevirir
  │
  ▼
useCostHealth(resolvedRange, filters.companyId)
  │ queryKey: queryKeys.admin.costHealth({
  │   companyId: filters.companyId,
  │   fromIso: resolvedRange.from?.toISOString() ?? null,
  │   toIso:   resolvedRange.to?.toISOString()   ?? null,
  │ })
  │ staleTime: 60_000
  │ enabled: always (param'sız çağrıda backend default 30g)
  │ queryFn: axios.get('/platform/admin/cost-health', { params })
  │         params: companyId?, from?, to? (ISO string'ler)
  ▼
{ data, isLoading, isFetching, isError, error }
  │
  ▼ (data varsa)
┌───────────────────────────────────────┐
│ <CostHealthHeadline                   │
│    total={data.totalCostUsd}          │
│    period={start, end}                │
│    filters={...}                      │
│    isFetching={isFetching}            │
│    onFiltersChange={setFilters} />    │
│                                       │
│ <CostHealthStackedBar                 │
│    breakdown={data.breakdown}         │
│    totalCostUsd={data.totalCostUsd} />│
│                                       │
│ <CostHealthBreakdownTables            │
│    byEventType={data.byEventType}     │
│    byModel={data.byModel} />          │
└───────────────────────────────────────┘
```

Filter değişince `setFilters` → URL güncellenir → `useUrlFilterState` yeni değer döner → `useCostHealth` query key değişir → refetch (cache miss). `isFetching === true` iken headline'ın sağ üstünde ince bir spinner/pulse göstergesi — refetch görünür geri bildirim sağlar (stale data flicker etmez, overlay).

`resolvePreset(filters)` logic:
```ts
function resolvePreset(f: CostHealthFilters): { from: Date | null, to: Date | null } {
  if (f.preset === 'custom') return { from: f.from, to: f.to }
  if (f.preset === '7d')    return { from: subDays(new Date(), 7),  to: new Date() }
  if (f.preset === '30d')   return { from: subDays(new Date(), 30), to: new Date() }
  if (f.preset === '90d')   return { from: subDays(new Date(), 90), to: new Date() }
  return { from: null, to: null } // backend default
}
```

Cache stabilitesi: `resolvePreset` her render'da yeniden `new Date()` üretir, bu ms-hassasiyetinde query key'i değiştirir. Gereksiz refetch'i önlemek için `resolvePreset` çağrısı `useMemo(() => resolvePreset(filters), [filters.preset, filters.from, filters.to])` ile sarılır — preset veya custom from/to değişmediği sürece aynı referans döner, query key stabil kalır.

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
  defaults: { companyId: null, preset: '30d', from: null, to: null },
  parse: (p) => {
    const preset = (p.get('preset') ?? '30d') as CostHealthFilters['preset']
    return {
      companyId: p.get('companyId') ?? null,
      preset: ['7d','30d','90d','custom'].includes(preset) ? preset : '30d',
      from: preset === 'custom' && p.get('from') ? new Date(p.get('from')!) : null,
      to:   preset === 'custom' && p.get('to')   ? new Date(p.get('to')!)   : null,
    }
  },
  serialize: (v) => ({
    companyId: v.companyId ?? undefined,
    preset: v.preset === '30d' ? undefined : v.preset, // default '30d' URL'de yazılmaz
    from: v.preset === 'custom' ? v.from?.toISOString() : undefined,
    to:   v.preset === 'custom' ? v.to?.toISOString()   : undefined,
  }),
})
```

Preset authoritative: `?preset=7d` → from/to URL'e yazılmaz, component render'da `resolvePreset` ile hesaplar. `?preset=custom&from=ISO&to=ISO` → from/to yazılır. Default (`preset=30d`) → URL tamamen temiz (`?` bile olmaz). Bu yaklaşım clock-drift heuristic'ini eler; button highlight'ı sadece `filters.preset` değerine bakar.

### 3.5 Renk Eşikleri

`src/features/cost-health/lib/cost-health-threshold.ts`:

```ts
export type ProviderBand = 'healthy' | 'watch' | 'action'

// Sınır davranışı: >= inclusive. 90.0 → healthy, 89.9 → watch, 70.0 → watch, 69.9 → action.
// Backend doc "70–90% → sari" aralığı inclusive-low / exclusive-high olarak yorumlandı.
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

Props: `{ total, periodStart, periodEnd, filters, onFiltersChange, isFetching }`.

Layout (flex between):
- Sol: `<h1 className="text-3xl font-bold">${formatCurrency(total)}</h1>` + altında `<p className="text-muted-foreground text-sm">{formatPeriod(periodStart, periodEnd)}</p>`
- Sağ: `<div className="flex gap-2 items-center">{isFetching && <Spinner size="sm" />}<CompanyCombobox /><DateRangePicker /></div>`

`isFetching` göstergesi: filter değişiminde backend'den yeni veri gelirken sağ üstte küçük bir spinner (Lucide `Loader2` + `animate-spin`). Stale data overlay değil, inline göstergedir — bu sayede kullanıcı preset'e tıkladığında "bir şey oldu" geri bildirimi alır, mevcut bar/tablolar flicker etmeden yeni veriyle değişir.

`formatPeriod(start, end)` — `"24 Mart 2026 → 23 Nisan 2026 (30 gün)"`:
- Tarih Türkçe: `Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })`
- Gün uzunluğu: `Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)` — backend `periodEnd` exclusive olduğu için **+1 YOK**. Örn: start=2026-03-24, end=2026-04-23 → tam 30 gün.

### 4.2 `CompanyCombobox`

Props: `{ value: string | null, onChange: (id: string | null) => void }`.

Implementation: shadcn `Popover` + `Command` pattern. `value === null` → button label "Tüm Şirketler". Liste başında "Tüm Şirketler" (clear) seçeneği, sonra `useCompanies()`'dan gelen şirketler. Combobox arama input'u `cmdk`'nin built-in filter'ını kullanır (şirket adı + id eşleşir).

Hook: mevcut `useCompanies()` (repo'da var, `src/features/companies/hooks/`'da — Explore raporunda gördük) çağrılır; `enabled: true` (sayfa açılınca liste yüklenir).

### 4.3 `DateRangePicker`

Props: `{ preset: '7d'|'30d'|'90d'|'custom', customRange: { from: Date|null, to: Date|null }, onChange: (next: { preset, from?, to? }) => void }`.

Layout: inline button group + Popover.
- 4 preset button: "7 gün", "30 gün", "90 gün", "Özel"
- Aktif preset highlight — direkt `filters.preset === '...'` karşılaştırması ile (heuristic yok, clock-drift sorunu ortadan kalkar)
- Preset ("7d"/"30d"/"90d") tıklanınca: `onChange({ preset: '7d', from: null, to: null })` — from/to temizlenir, URL sadece `?preset=7d` olur
- "Özel" tıklanınca: Popover açılır, `react-day-picker` range mode Calendar (dual-month default) gelir
- Calendar'da range seçimi bitince: `onChange({ preset: 'custom', from, to })` — URL `?preset=custom&from=ISO&to=ISO` olur
- Custom range min/max validation: `react-day-picker` range modu zaten forward-only (from ≤ to) garanti eder — spec içi ekstra validation gerekmez

### 4.4 `CostHealthStackedBar`

Props: `{ breakdown: { provider, estimate, missing, legacy }, totalCostUsd: number }`.

Render: Başlıkta "Maliyet Kalite Dağılımı", altında tek yatay bar (height 32px, rounded corners), 4 segment `div` yan yana.

Segment genişlikleri **normalize edilir** (§5.6): `sum = provider.pct + estimate.pct + missing.pct + legacy.pct; width = (bucket.pct / sum) * 100`. Böylece toplam tam 100% — yuvarlama hataları bar'da görünmez.

Renkler:
- `provider` — `bg-green-500`
- `estimate` — `bg-yellow-500`
- `missing` — `bg-red-500`
- `legacy` — `bg-gray-400`

Her segment `<Tooltip>` ile sarılır, **orijinal** (backend) pct değeri gösterilir (normalize değil):
```
provider: $11.00 (500 event, %89.1)
```

Segment içinde `pct >= 6` ise ortalanmış beyaz label (`%XX.X`), değilse label gizli (çok dar alanda okunmaz).

Bar altında legend row: 4 renkli kare + `"provider %89.1"` vs. — kullanıcı hover etmeden de bucket'ı okuyabilsin.

Edge case: `totalCostUsd <= 0` → bar tamamen gizli, parent sayfa empty state göstersin (§5.3).

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
  preset: '7d' | '30d' | '90d' | 'custom'
  from: Date | null  // yalnızca preset === 'custom' iken dolu
  to: Date | null    // yalnızca preset === 'custom' iken dolu
}
```

### 5.2 Loading state

`isLoading` → sayfa tam skeleton:
- Headline alanı: iki rectangle (başlık + alt metin)
- Stacked bar: tek full-width rectangle
- Tables: 2 grid hücresi, her biri 3 satır rectangle

Skeleton: mevcut `at-risk-companies-table.tsx`'deki patern (`animate-pulse` div'ler).

### 5.3 Empty / zero state

Tek tetikleyici: `data.totalCostUsd <= 0`. Bu durumda bucket `pct` değerleri backend tarafında `0` olarak döner ya da hesaplamadan NaN olabilir — empty-state'i `totalCostUsd` üzerinden karar vererek NaN'ı tamamen bypass ederiz (style'a NaN yazma riski yok).

- Headline: `$0.00` büyük font; altında "Seçilen dönemde AI harcaması yok." info banner
- Stacked bar: gizli (bucket array'ine hiç dokunulmaz)
- Tables: gizli (veya Card içinde "Kayıt yok" metni)

### 5.4 Error state

`isError` → sayfa içinde centered `<Card>` with `AlertTriangle` icon + "Veri yüklenemedi" + `<Button onClick={refetch}>Tekrar Dene</Button>`. `error.message` developer için `<pre>` içinde küçük font ile altta (prod'da kullanıcı için anlaşılır değil ama destek isteği sırasında kopyalanabilir).

**403 davranışı (düzeltildi):** `src/lib/api-client.ts:35` yalnızca 401'i yakalar (token refresh için); **403 için redirect yoktur**. Non-superadmin bir kullanıcı `/admin/cost-health` route'una giderse:
- Axios interceptor 403'ü olduğu gibi geçirir
- `useCostHealth` → `isError: true`, `error.response.status === 403`
- Error card render olur, `error.response?.data?.code === 'platform_admin_required'` ise başlık "Bu sayfaya erişim yetkiniz yok" + Dashboard'a dönüş linki; aksi halde generic "Veri yüklenemedi"

Client-side guard eklemeyiz (bu PR'da). Pratikte super-admin paneline giriş yapan her kullanıcı `isPlatformAdmin=true` sahibidir — 403 yalnızca edge case (token'a dokunulmuş, rol revoke edilmiş oturum içi). Follow-up'ta `<PlatformAdminGuard>` eklenebilir.

### 5.5 `byModel[].modelName` garantisi

Backend doküman (line 53): "NULL modelName'ler listeye girmez". Yani backend bu filtrelemeyi yapıyor — frontend defensive fallback (`?? 'Bilinmeyen'`) eklemez. Type `modelName: string` (nullable değil) olarak kalır. Beklenmedik null gelirse TypeScript zaten hatayı runtime'da göstermez (any'ye düşmez) ama UI boş string render eder — destek-fark edilebilir bir semptom olduğu için saklamaktansa görünür olması iyi.

### 5.6 `pct` toplam 100 ± round error

Backend 4 bucket pct toplamı "~100" garantiliyor. UI bar render'ında segment genişlikleri **normalize edilir**: `const sum = provider.pct + estimate.pct + missing.pct + legacy.pct; const w = (bucket.pct / sum) * 100`. Böylece toplam tam 100% olur, boş kısım veya taşma görsel kusuru çıkmaz. Tooltip'te **orijinal** pct (backend değeri) gösterilir — normalize edilmiş değer sadece segment genişliği içindir.

### 5.7 Zaman dilimi (timezone)

Backend ISO UTC döner (`periodStart`, `periodEnd`). Frontend:
- `formatPeriod()` Türkçe yerel format ile render eder (`Intl.DateTimeFormat('tr-TR')`)
- Preset tıklanınca: `from = subDays(new Date(), N)` (yerel zaman), `.toISOString()` ile UTC'ye çevrilip backend'e gider
- Custom Calendar'da kullanıcı yerel günü seçer; `from` 00:00, `to` 23:59 yerel zamanda normalize edilir (`date-fns` `startOfDay`/`endOfDay`), sonra UTC ISO'ya çevrilir — backend `to` exclusive olduğu için `endOfDay` ≈ `next startOfDay - 1ms`, pratikte aynı sonuç
- Kullanıcı günlük sınır farkını görmez; backend kayıtları UTC timestamp'ine göre filtreler ama operatör günlük dilim fark etmeyecek kadar kaba (haftalık/aylık) aralıklarla bakar

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
11. `vite build` çıktısında yeni dep'ler (`react-day-picker`, `date-fns`, `cmdk`) main bundle'a **eklenmez**, `cost-health-*.js` lazy chunk'ında görünür (Radix popover eklenmez, `@base-ui/react` zaten kurulu)
12. Superadmin olmayan kullanıcı 403 → mevcut axios interceptor redirect davranışı korunur (bu sayfa özel handler eklemez)
13. Manuel smoke test (§6.2) tüm adımları geçer

## 8. Follow-up Kalemleri (bu spec dışı, memory'e işlenecek)

- Diğer route'ları lazy loading'e geçir (Sprint 7'nin geri kalan lazy-split hedefi)
- Nested sidebar collapse yapısı — admin sayfa sayısı 3+ olunca tekrar değerlendir
- `<PlatformAdminGuard>` route-seviyesinde client-side check (şu an 403 sadece error card gösteriyor, redirect yok)
- CSV export, drill-down detay sayfaları
- `budget-band.ts` ile `cost-health-threshold.ts` ortak base util — 3. eşik util'i çıkarsa değerlendir
- Test altyapısı kurulumu (vitest + testing-library + jsdom) — ayrı iş kalemi, `useUrlFilterState` ve `cost-health-threshold` test adayları
