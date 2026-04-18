# At-Risk Companies Widget — Dashboard Design

**Tarih:** 2026-04-18
**Durum:** Brainstorm onaylı, implementation öncesi spec
**Backend kaynak:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/superadmin-sprint-response-2026-04-18.md` §1 (`GET /platform/companies/aggregate`)
**Tarihsel arka plan:** Sprint 2 M2 widget'ı backend aggregate endpoint olmadığı için ertelendi (`project_sprint2_plan.md`, `project_backend_aggregate_gap.md`). Backend bu endpoint'i 2026-04-18'de teslim etti; bu spec o engeli çözer.

## 1. Amaç

Platform operatörü dashboard'a girdiğinde **bütçesi tehlikede olan firmaları** firma-firma listesi olarak görsün, gerekirse tek tıkla ilgili firmanın Usage tab'ına gitsin. Şu anda operatör "hangi firma şu an riskli?" sorusunu cevaplamak için tüm firmalar sayfasını taramak zorunda; widget bu kör noktayı kapatır.

## 2. Kapsam

### Bu spec içinde

- Yeni component: `<AtRiskCompaniesTable />` — dashboard'da charts grid ile RevenueSummary arasına yerleşir
- Yeni hook: `useAtRiskCompanies()` — `band=exhausted` ve `band=economy` için iki paralel `useQuery`, exhausted önce sıralı tek dizi döner
- Plan adı çözünürlüğü: mevcut `usePricingPlans()` hook'undan client-side map
- Drill-through: satır tıklaması → `/companies/:id?tab=usage` (React Router `Link`)
- Loading / error / empty state'ler

### Bu spec dışında

- "Standard" bandını dahil etmek (operatör için aksiyonable değil — band tanımı: standard = downgrade tetiklendi ama hâlâ çalışıyor)
- Widget üzerinde band filtresi seçici UI (YAGNI — gerekirse Sprint 5)
- Tam pagination (limit=100 + truncation footer ile yetinilir; gerçek pagination Sprint 5)
- Backend'e yeni endpoint isteme veya `band` parametresine multi-value desteği eklemesini isteme (frontend iki call ile çözüyor)
- Widget'ın notification/toast'a dönüşmesi (sadece dashboard içi statik render)
- "Tüm firmalar güvende" durumunda widget'ın gizlenmesi (her zaman görünür, empty state pozitif onay olarak rol oynar)
- `company-detail-page.tsx` içinde `?tab=` query param desteği (drill-through default tab'a güvenir; default'un "usage" kalması bir kabul kriterine bağlanır)
- `AtRiskCompany` tipinin/hook'un dashboard dışı feature'larda yeniden kullanımı (widget-private; başka bir aggregate consumer çıkarsa kendi tipini tanımlasın)

## 3. Mimari

### 3.1 Bant Seçimi

Backend dokümantasyonundan (`superadmin-sprint-response-2026-04-18.md` §1) bant tanımları:

| Aralık | Band | Aksiyon? |
|--------|------|----------|
| 0% – threshold% | `normal` | yok |
| threshold% – 95% | `standard` | yok (downgrade aktif, çalışıyor) |
| 95% – 97% | `economy` | **evet — yakında biter, upgrade konuş** |
| 97%+ | `exhausted` | **evet — şu an ölü, hemen ara** |
| Plan yok / budget=0 | `unconfigured` | yok (ayrı sorun) |

Widget sadece `economy` ve `exhausted` bantlarını gösterir.

### 3.2 Yerleşim

`dashboard-page.tsx` içindeki sıra (yukarıdan aşağı):

1. Header + period select
2. KPI grid (3 sütun, 6 kart) — *değişmez*
3. Charts grid (2 sütun: CostTrend + CategoryBreakdown) — *değişmez*
4. **`<AtRiskCompaniesTable />` — yeni, tam genişlik**
5. `<RevenueSummary />` — *değişmez, en altta*

**Neden tam genişlik tablo + bu pozisyon:** Operatörün ilk skroll'unda KPI+chart özet, ikinci skroll'unda aksiyon kartı (at-risk), üçüncüde finansal detay (revenue) görmesi mantıksal akış. RevenueSummary'nin altına koymak widget'ı gömüyor; KPI grid'in arasına koymak grid'in 3-sütun simetrisini bozuyor.

### 3.3 Veri Akışı

```
useAtRiskCompanies()
├─ const queries = useQueries({ queries: [
│    { queryKey: queryKeys.platform.atRisk('exhausted'), ... },
│    { queryKey: queryKeys.platform.atRisk('economy'), ... },
│  ]})
│  // queries: [UseQueryResult, UseQueryResult] — DİZİ döner, obje değil
└─ derived return:
   - isLoading: queries.some(q => q.isLoading)
   - isError:   queries.some(q => q.isError)
   - data:      (isLoading || isError) ? undefined
                : [...queries[0].data.companies, ...queries[1].data.companies]
   - totals:    { exhausted: queries[0].data?.total ?? 0,
                  economy:   queries[1].data?.total ?? 0 }
   // data tüm-veya-hiç: kısmi loading sırasında undefined kalır

AtRiskCompaniesTable
├─ const { data, totals, isLoading, isError } = useAtRiskCompanies()
├─ const { data: plans } = usePricingPlans()
│  // NOT: dashboard-page.tsx şu an usePricingPlans çağırmıyor — ilk
│  // mount'ta /platform/plans için fresh fetch tetiklenir, cache hit DEĞİL
└─ render:
   isError    → "Yüklenemedi" hata satırı
   isLoading  → 3 satırlık skeleton
   empty data → CheckCircle2 ikon + "Tüm firmalar güvenli bantta" metni
   default    → Card > Table satırları (onClick + useNavigate);
                truncation footer (totals.exhausted/economy > limit)
```

### 3.4 Backend Performans

Backend dokümantasyonu (§1 son paragraf): "Spend hesabı tek SQL query'si ile yapılıyor (per-company billing period'u SQL CTE'de hesaplanıp correlated subquery ile spend çekiliyor). N+1 sorunu yok." İki paralel call ⇒ iki SQL query. Acceptable.

## 4. Component API

### 4.1 Tip Tanımı

```typescript
// src/features/dashboard/hooks/use-at-risk-companies.ts içinde tanımlı
// Her ikisi de hook-private; widget dışı export YAPILMAZ.

// Wire shape — backend response'unu birebir yansıtır.
interface AggregateApiCompany {
  id: string
  name: string
  planId: string | null
  budgetUsd: number
  currentSpendUsd: number
  spendPct: number
  band: 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'
  budgetDowngradeThresholdPct: number
}

interface AggregateApiResponse {
  companies: AggregateApiCompany[]
  total: number
}

// Post-filter, narrowed shape — widget yalnızca bu iki bandı render eder.
// `subscriptionStatus` widget tarafından kullanılmadığı için tipe alınmaz (YAGNI).
interface AtRiskCompany extends Omit<AggregateApiCompany, 'band'> {
  band: 'economy' | 'exhausted'
}
```

### 4.2 Hook İmzası

```typescript
export function useAtRiskCompanies(): {
  data: AtRiskCompany[] | undefined
  totals: { exhausted: number; economy: number }
  isLoading: boolean
  isError: boolean
}
```

- `useQueries` ile iki paralel call: `?band=exhausted&limit=100` ve `?band=economy&limit=100` (backend max — truncation footgun riskini olabildiğince geç tetikler)
- `useQueries` DİZİ döner; hook bu diziden `data`/`totals`/`isLoading`/`isError` türetir
- `data`: tüm-veya-hiç — `isLoading || isError` iken `undefined`; aksi halde `[...exhausted, ...economy]` (her grup backend sırasını korur)
- `totals`: backend `total` alanından her bant için ayrı tutulur (truncation footer render'ı için)
- Stale time React Query default'u (yok — her mount/focus'ta refetch); manuel refresh yok

### 4.3 Query Keys

`src/lib/query-keys.ts` — mevcut konvansiyon: factory fonksiyon adı = ikinci segment (`['platform', 'summary', months]`, `['platform', 'plans']`).

```typescript
platform: {
  // ... mevcut
  atRisk: (band: 'exhausted' | 'economy') =>
    ['platform', 'atRisk', band] as const,
}
```

### 4.4 Component İmzası

```typescript
export function AtRiskCompaniesTable(): JSX.Element
```

Prop almaz — kendi datasını hook'tan çeker (KpiCard / RevenueSummary pattern'ı ile aynı).

## 5. Tablo Yapısı

### 5.1 Sütunlar

| Firma | Plan | Bütçe | Harcama | % | Band |
|-------|------|-------|---------|---|------|

- **Firma**: `c.name`
- **Plan**: `pricingPlans?.find(p => p.id === c.planId)?.name ?? '—'` (plan silinmişse veya `planId === null` ise `—`)
- **Bütçe**: `formatCurrency(c.budgetUsd)` (`$50.00`)
- **Harcama**: `formatCurrency(c.currentSpendUsd)` (`$48.75`)
- **%**: `${c.spendPct.toFixed(1)}%` (`97.5%`)
- **Band**: özel solid Badge'ler — mevcut `destructive` variant tinted (düşük opaklık) olduğu için `variant="destructive"` kullanılmaz; aksi halde "exhausted" görsel olarak "economy"den daha zayıf görünür. İkisi de solid, exhausted kırmızı en güçlü vurgu:
  - `exhausted` → `<Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90">` + lucide `AlertTriangle` (h-3 w-3, mr-1) + "Exhausted"
  - `economy` → `<Badge className="bg-orange-500 text-white hover:bg-orange-500/90">` + lucide `AlertCircle` (h-3 w-3, mr-1) + "Economy"

### 5.2 Satır Davranışı

shadcn `TableRow` (`src/components/ui/table.tsx:55`) plain `<tr>` — `asChild` desteği YOK. `<a>` etiketi `<tr>` içinde geçerli HTML değil. Bu yüzden satır navigasyonu `useNavigate()` + `onClick` + klavye desteği ile yapılır:

```tsx
const navigate = useNavigate()
const goToCompany = (id: string) => navigate(`/companies/${id}`)

<TableRow
  className="cursor-pointer"
  role="link"
  tabIndex={0}
  onClick={() => goToCompany(c.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goToCompany(c.id)
    }
  }}
  aria-label={`${c.name} — Usage detayına git`}
>
  {/* TableCell'ler */}
</TableRow>
```

Hedef sayfa: `companies/pages/company-detail-page.tsx`. Mevcut state: `<Tabs defaultValue="usage">` (line 30) — Usage zaten default tab. URL'e `?tab=usage` koymak ölü parametre olur (sayfa `useSearchParams` okumuyor; grep "tab=" → 0 match), o yüzden link'e eklenmez. Default'un "usage" kalması §11'de kabul kriterine bağlanır.

**Trade-off:** Middle-click veya "Open in new tab" kaybedilir (anchor değil). Bu widget için kritik değil — operatör drill-through'u current-tab'da kullanır.

### 5.3 Card Wrapper

`RevenueSummary`'nin (`src/features/dashboard/components/revenue-summary.tsx:14`) konvansiyonuna uygun olarak `CardTitle` `text-base`:

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Bütçesi Tehlikedeki Firmalar</CardTitle>
    {data && data.length > 0 && (
      <p className="text-xs text-muted-foreground">{data.length} firma ≥ %95 bütçe kullanımında</p>
    )}
  </CardHeader>
  <CardContent>
    {/* state-based render */}
  </CardContent>
</Card>
```

### 5.4 Truncation Footer

`limit=100` çok yüksek; gerçek kapasite aşımı düşük olasılık ama imkansız değil. Aşıldığında sessiz kalmak yerine açık göster:

```tsx
{data && (totals.exhausted > data.filter(c => c.band === 'exhausted').length ||
          totals.economy   > data.filter(c => c.band === 'economy').length) && (
  <p className="mt-2 text-xs text-muted-foreground">
    İlk 100 firma gösteriliyor (toplam: {totals.exhausted} exhausted, {totals.economy} economy)
  </p>
)}
```

## 6. State'ler

### 6.1 Loading

3 satırlık skeleton (sadece tablo gövdesi, header görünür):

```tsx
<div className="space-y-2">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
  ))}
</div>
```

Plan adları yüklenirken (ana data hazır ama `usePricingPlans` hâlâ loading): plan sütunu `—` gösterir, geri kalan satır render olur.

### 6.2 Error

Her iki query'den biri başarısız ise:

```tsx
<div className="text-sm text-destructive">Yüklenemedi</div>
```

Retry butonu yok — React Query background refetch'e güvenir; kullanıcı sayfa yenileyebilir.

### 6.3 Empty (her iki bant boş)

Pozitif onay göster (widget'ı gizleme). `✓` işareti ayrı bir lucide ikonu (`CheckCircle2`) — string içinde literal karakter YOK:

```tsx
<div className="flex items-center gap-2 text-sm text-green-500">
  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
  <span>Tüm firmalar güvenli bantta</span>
</div>
```

**Neden gizleme yerine pozitif onay:** Operatör widget'ın çalıştığını ve şu an gerçekten alarm yokmadığını ayırt etmeli. Boş widget = "veri gelmedi mi?" şüphesi yaratır.

## 7. Erişilebilirlik

- Card'a `aria-label="Bütçesi tehlikedeki firmalar listesi"`
- Empty state ikon'una `aria-hidden="true"`
- Band Badge'lerine ek `aria-label` (sadece icon değil; "Exhausted: bütçe %97 üzeri")
- Satır navigasyonu klavye desteği: `tabIndex={0}` + `role="link"` + `onKeyDown` (Enter ve Space) + descriptive `aria-label` (§5.2)

## 8. Test

Mevcut konvansiyon: dashboard component'lerinin (`KpiCard`, `RevenueSummary`, `CostTrendChart`, `CategoryBreakdown`) hiçbiri unit test'li değil. Mevcut hook'lar (`use-platform-summary`, `use-revenue`) test'siz. Bu spec aynı konvansiyonu izler.

**Doğrulama yöntemi:**

- `npx tsc -b` — tip güvenliği
- `npx vite build` — production bundle
- Dev server'da manuel doğrulama:
  1. Loading state (network throttling ile gözlemle)
  2. Populated state (gerçek veri ile veya React Query mock ile)
  3. Empty state (her iki bant boşken — büyük ihtimal default durum, doğal olarak gözlemlenir)
  4. Error state (network kesip refresh)
  5. Drill-through (satır tıkla → companies/:id'ya gittiğini doğrula)

## 9. Açık Sorular / Risk

| Konu | Karar | Risk |
|------|-------|------|
| Drill-through tab seçimi | `?tab=usage` koymak yerine link `/companies/:id`'ya gider; default tab `usage` kabul kriterine bağlanır (§11) | Birisi `defaultValue`'yu değiştirirse drill-through farklı tab açar — kabul kriteri yakalar |
| Backend yeni endpoint auth | Mevcut `/platform/*` auth pattern'ını izler | Ek doğrulama gerekmez |
| 100 satır aşılırsa | Truncation footer (§5.4) "ilk 100 gösteriliyor (toplam: X)" notu render eder | Operatör eksik veriyi fark eder; gerçek pagination Sprint 5 |
| Plan silinmişse (planId var ama plans listesinde yok) | Plan adı `—` olarak render | Edge case, sessizce handle edilir |
| `usePricingPlans` ilk dashboard mount'unda cache miss | Tek ek `/platform/plans` call (küçük response, ihmal edilebilir) | Kabul edilebilir |

## 10. Sprint Sonrası Sonraki Adımlar

Bu widget shipped olduktan sonra:

- Memory güncelle: `project_backend_aggregate_gap.md` → "ÇÖZÜLDÜ" notu, `project_sprint2_plan.md` Module 2 → "Sprint 4'te shipped"
- Sprint 4 brainstorm: kalan 9 /docs bölümü (Memory, RAG, Web Search, Templates, Quote Pipeline migration, Channels, Lead/Pipeline, Reporting)
- Sprint 4 brainstorm: Quote Pipeline Settings → /docs migration kararı

---

## 11. Kabul Kriterleri

- [ ] Dashboard'da charts grid altında, RevenueSummary üstünde "Bütçesi Tehlikedeki Firmalar" kartı görünür
- [ ] Kart `band=exhausted` ve `band=economy` için iki paralel call yapar (`limit=100` her biri); exhausted satırlar önce, economy satırlar sonra sıralı
- [ ] Plan sütunu `usePricingPlans()` ile firma planının adını gösterir; plan bulunamazsa veya `planId === null` ise `—`
- [ ] Band Badge'leri solid renkli ve ikon dahil: exhausted = `bg-destructive text-destructive-foreground` + `AlertTriangle`, economy = `bg-orange-500 text-white` + `AlertCircle`
- [ ] Loading: 3 satırlık skeleton; Error: "Yüklenemedi"; Empty: `CheckCircle2` ikon + "Tüm firmalar güvenli bantta" metni (literal `✓` karakter yok)
- [ ] Satır tıklama VEYA Enter/Space tuşu `/companies/:id`'ya gider (URL'de `?tab=` parametresi YOK); satırlar `tabIndex={0}` + `role="link"` + descriptive `aria-label`
- [ ] `company-detail-page.tsx` Tabs `defaultValue` "usage" olarak kalır (drill-through'un beklenen tab'a inmesi buna bağlı)
- [ ] Truncation footer: `totals.exhausted` veya `totals.economy` görünen satır sayısını aşarsa "İlk 100 firma gösteriliyor (toplam: X exhausted, Y economy)" notu render olur
- [ ] `useAtRiskCompanies` `data` alanı `isLoading || isError` iken `undefined`; aksi halde birleşik dizi
- [ ] `AtRiskCompany` ve `AggregateApiCompany` tipleri hook dosyası içinde, dışarı export edilmez
- [ ] Query key konvansiyonu: `['platform', 'atRisk', band]` (factory adı = ikinci segment)
- [ ] CardTitle `text-base` (RevenueSummary ile tutarlı)
- [ ] `npx tsc -b && npx vite build` temiz çalışır
- [ ] Mevcut dashboard layout (KPI grid 3 sütun, charts grid 2 sütun, RevenueSummary tam genişlik) bozulmaz
