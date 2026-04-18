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
- Pagination veya "tümünü gör" linki (max 40 satır = ≥%95 firmalar zaten az sayıda olmalı)
- Backend'e yeni endpoint isteme veya `band` parametresine multi-value desteği eklemesini isteme (frontend iki call ile çözüyor)
- Widget'ın notification/toast'a dönüşmesi (sadece dashboard içi statik render)
- "Tüm firmalar güvende" durumunda widget'ın gizlenmesi (her zaman görünür, empty state pozitif onay olarak rol oynar)

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
├─ useQueries([
│    { queryKey: ['platform', 'aggregate', 'exhausted'], ... },
│    { queryKey: ['platform', 'aggregate', 'economy'], ... },
│  ])
└─ return:
   - data: [...exhausted, ...economy]  (her grup backend sırasını korur)
   - isLoading: queries.some(q => q.isLoading)
   - isError: queries.some(q => q.isError)

AtRiskCompaniesTable
├─ const { data, isLoading, isError } = useAtRiskCompanies()
├─ const { data: plans } = usePricingPlans()  ← cache hit beklenir
└─ render:
   isError    → "Yüklenemedi" hata satırı
   isLoading  → 3 satırlık skeleton
   empty data → "Tüm firmalar güvenli bantta ✓" pozitif onay
   default    → Card > Table satırları (Link wrap'lı)
```

### 3.4 Backend Performans

Backend dokümantasyonu (§1 son paragraf): "Spend hesabı tek SQL query'si ile yapılıyor (per-company billing period'u SQL CTE'de hesaplanıp correlated subquery ile spend çekiliyor). N+1 sorunu yok." İki paralel call ⇒ iki SQL query. Acceptable.

## 4. Component API

### 4.1 Tip Tanımı

```typescript
// src/features/dashboard/hooks/use-at-risk-companies.ts içinde tanımlı
export interface AtRiskCompany {
  id: string
  name: string
  planId: string | null
  budgetUsd: number
  currentSpendUsd: number
  spendPct: number
  band: 'economy' | 'exhausted'  // bu hook sadece bu iki bandı döndürür
  budgetDowngradeThresholdPct: number
  subscriptionStatus: string
}

interface AggregateResponse {
  companies: AtRiskCompany[]
  total: number
}
```

### 4.2 Hook İmzası

```typescript
export function useAtRiskCompanies(): {
  data: AtRiskCompany[] | undefined
  isLoading: boolean
  isError: boolean
}
```

- İki paralel useQuery (`useQueries`) ile `?band=exhausted&limit=20` ve `?band=economy&limit=20` çağrılır
- `data`: ikisinin birleşimi, exhausted ÖNCE (her grup içinde backend sıralaması korunur)
- Her iki query başarılıysa `data` dolu; biri başarısızsa `isError: true` (kısmi data göstermek karışıklık yaratır)
- Stale time React Query default'u (yok — her mount/focus'ta refetch); manuel refresh yok

### 4.3 Query Keys

`src/lib/query-keys.ts`:

```typescript
platform: {
  // ... mevcut
  atRisk: (band: 'exhausted' | 'economy') =>
    ['platform', 'aggregate', band] as const,
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
- **Plan**: `pricingPlans?.find(p => p.id === c.planId)?.name ?? '—'`
- **Bütçe**: `formatCurrency(c.budgetUsd)` (`$50.00`)
- **Harcama**: `formatCurrency(c.currentSpendUsd)` (`$48.75`)
- **%**: `${c.spendPct.toFixed(1)}%` (`97.5%`)
- **Band**: shadcn `Badge`:
  - `exhausted` → `variant="destructive"`, lucide `AlertTriangle` icon, label "Exhausted"
  - `economy` → custom `bg-orange-500 text-white hover:bg-orange-500/90` (mevcut tema'da turuncu Badge variant yok), lucide `AlertCircle` icon, label "Economy"

### 5.2 Satır Davranışı

Her satır React Router `Link` içine sarılır:

```tsx
<TableRow asChild className="cursor-pointer hover:bg-muted/50">
  <Link to={`/companies/${c.id}?tab=usage`}>
    {/* TableCell'ler */}
  </Link>
</TableRow>
```

Hedef sayfa: `companies/pages/company-detail-page.tsx` Usage tab'ı. `?tab=usage` query parametresi mevcut tab state'ini override etmeli — eğer henüz desteklemiyorsa **bu spec dışında**, ayrı küçük bir issue olur (companies sayfasında tab parametresi varsa kullan, yoksa default tab açılır; bu kabul edilebilir UX).

### 5.3 Card Wrapper

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-semibold">Bütçesi Tehlikedeki Firmalar</CardTitle>
    {data && data.length > 0 && (
      <p className="text-xs text-muted-foreground">{data.length} firma ≥ %95 bütçe kullanımında</p>
    )}
  </CardHeader>
  <CardContent>
    {/* state-based render */}
  </CardContent>
</Card>
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

Pozitif onay göster (widget'ı gizleme):

```tsx
<div className="flex items-center gap-2 text-sm text-green-500">
  <CheckCircle2 className="h-4 w-4" />
  <span>Tüm firmalar güvenli bantta</span>
</div>
```

**Neden gizleme yerine pozitif onay:** Operatör widget'ın çalıştığını ve şu an gerçekten alarm yokmadığını ayırt etmeli. Boş widget = "veri gelmedi mi?" şüphesi yaratır.

## 7. Erişilebilirlik

- Card'a `aria-label="Bütçesi tehlikedeki firmalar listesi"`
- Empty state ikon'una `aria-hidden="true"`
- Band Badge'lerine ek `aria-label` (sadece icon değil; "Exhausted: bütçe %97 üzeri")
- Satır link'leri klavye odaklanabilir (`<Link>` zaten varsayılan)
- Tab parametresi destekli drill-through bu spec dışı; eklenmiyorsa link yine `/companies/:id`'ya gider, kabul edilebilir

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
| `?tab=usage` query parametresi destekleniyor mu? | Bu spec dışı; companies/pages/company-detail-page.tsx incelendiğinde karar | Desteklenmiyorsa drill-through default tab açar (kabul edilebilir UX) |
| Backend yeni endpoint'i auth filtrelemeli mi? | Mevcut `/platform/*` auth pattern'ını izleyecektir | Ek doğrulama gerekmez |
| 40 satır overflow olursa? | Widget içi natural scroll (Card sabit yükseklik vermez) | Pratikte ≥%95 firma sayısı 40'ı aşması düşük olasılık; aşarsa Sprint 5 issue |
| Plan silinmişse (planId var ama plans listesinde yok)? | Plan adı `—` olarak render | Edge case, sessizce handle edilir |

## 10. Sprint Sonrası Sonraki Adımlar

Bu widget shipped olduktan sonra:

- Memory güncelle: `project_backend_aggregate_gap.md` → "ÇÖZÜLDÜ" notu, `project_sprint2_plan.md` Module 2 → "Sprint 4'te shipped"
- Sprint 4 brainstorm: kalan 9 /docs bölümü (Memory, RAG, Web Search, Templates, Quote Pipeline migration, Channels, Lead/Pipeline, Reporting)
- Sprint 4 brainstorm: Quote Pipeline Settings → /docs migration kararı

---

## 11. Kabul Kriterleri

- [ ] Dashboard'da charts grid altında, RevenueSummary üstünde "Bütçesi Tehlikedeki Firmalar" kartı görünür
- [ ] Kart `band=exhausted` ve `band=economy` için iki paralel call yapar; exhausted satırlar önce, economy satırlar sonra sıralı
- [ ] Plan sütunu `usePricingPlans()` cache'inden firma planının adını gösterir; plan bulunamazsa `—`
- [ ] Band Badge'leri: exhausted = kırmızı (destructive), economy = turuncu, ikon dahil
- [ ] Loading: 3 satırlık skeleton; Error: "Yüklenemedi"; Empty: yeşil "Tüm firmalar güvenli bantta ✓"
- [ ] Satır tıklama `/companies/:id?tab=usage`'a gider (tab parametresi destekli değilse default tab açılır)
- [ ] `npx tsc -b && npx vite build` temiz çalışır
- [ ] Mevcut dashboard layout (KPI grid 3 sütun, charts grid 2 sütun, RevenueSummary tam genişlik) bozulmaz
