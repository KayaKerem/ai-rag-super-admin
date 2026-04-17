# Sprint 1 — Maliyet Görünürlüğü & Free Tier (Tasarım)

**Tarih:** 2026-04-17
**Kapsam:** G1 (`research` + `quotePrepare` maliyet kalemleri) + G2 (`free` tier modeller)
**Backend kaynağı:** `docs/frontend-admin/05-analytics.md`, `docs/frontend-admin/06-models.md`

---

## 1. Amaç

Backend Phase 2 maliyet kalemleri (`research_tool`, `quote_prepare`) ve yeni model tier'ı (`free`) son 2 günde dokümante edildi. Süper admin paneli bu alanları henüz göstermiyor. Bu sprint, görünürlük açığını kapatır.

**Kullanıcı için:**
- Şirket detay → Kullanım sekmesinde Research ve Quote Hazırlama maliyetleri görünür.
- Platform dashboard'unda aynı kalemler kategori dağılımı + trend grafiğinde yer alır.
- Allowed Models editöründe ücretsiz tier modelleri seçilebilir.

---

## 2. Ön Koşullar (Mevcut Durum)

### 2.1 Görülen kod

`src/features/companies/types.ts:UsageMonth` — Şirket bazlı usage tipi. `research`, `quotePrepare` alanları yok.

`src/features/dashboard/hooks/use-platform-summary.ts:UsageMonth` (lokal) — Platform summary için ayrı tip. Aynı alanlar yok.

`src/features/companies/components/usage-tab.tsx` — 7 KPI kartı (4+3 grid). Rerank, WebSearch, Proactive, Cache, Storage, Trigger görünür; Research ve QuotePrepare yok.

`src/features/companies/components/usage-chart.tsx` — Stacked BarChart, 6 seri. Research/QuotePrepare yok.

`src/features/dashboard/pages/dashboard-page.tsx` + `category-breakdown.tsx` + `cost-trend-chart.tsx` — Dashboard breakdown'da Research/QuotePrepare yok.

`src/features/companies/components/allowed-models-editor.tsx` — `TIER_ORDER = ['premium', 'standard', 'economy']`, `TIER_LABELS` üç tier. Backend'in döndürdüğü `tier: 'free'` modeller render edilmiyor (group'a dahil olmayan tier filter dışı kalır).

### 2.2 Backend sözleşmesi

**`05-analytics.md` §"Superadmin Dashboard Icin Gosterim Onerileri"** sample JSON:
```json
"research": { "searchCount": 28, "costUsd": 0.56 },
"quotePrepare": { "quoteCount": 15, "costUsd": 0.60 }
```

**Önemli:** Bu alanların backend response'unda **gerçekten** dönüp dönmediği doküman örneğinden net değil. Field opsiyonel kabul edilecek; backend henüz eklemediyse `?? 0` fallback.

**`06-models.md` §"Tier Siniflandirmasi"** dört tier listeler: premium / standard / economy / **free**. Tier eşiği değişimi (standard $0.50→$0.25) frontend'i etkilemez — backend hesaplar, frontend gösterir.

---

## 3. Tasarım

### 3.1 Karar Özeti

| Karar | Değer | Soru no |
|-------|-------|---------|
| KPI yerleşimi | İki başlıklı grup (`AI Maliyetleri` / `Altyapı`) | Q1-D |
| Chart serileri | 8 seri, AI grubu önce + altyapı sonra; renk paleti AI grubu sıcak (mor→pembe→turuncu), altyapı soğuk (yeşil→sarı) | Q2-C |
| Kapsam | Şirket detay + platform dashboard, defensive `?? 0` | Q3-C |
| Free tier | `TIER_LABELS` + `TIER_ORDER` sonuna ekle, normal davranış | Q4-A |
| Yaklaşım | Inline değişiklik + tip merkezde extension; yeni component yok | Yak.1+3 |

### 3.2 KPI Gruplaması (Soru 1 — D)

**`AI Maliyetleri` grubu** (7 kart):
- AI (toplam token + maliyet)
- Rerank (sorgu sayısı)
- Web Search (arama sayısı)
- **Research (yeni)** — `${formatCurrency(current.research?.costUsd ?? 0)}` + `${formatNumber(current.research?.searchCount ?? 0)} arastırma` (subtitle rengi cyan-400)
- **Quote Hazırlama (yeni)** — `${formatCurrency(current.quotePrepare?.costUsd ?? 0)}` + `${formatNumber(current.quotePrepare?.quoteCount ?? 0)} teklif` (subtitle rengi indigo-400)
- Proaktif (insight sayısı)
- Cache Tasarruf (hit rate)

**`Altyapı` grubu** (2 kart):
- Storage
- Trigger

Render kuralı:
- İki başlık: `<h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">AI Maliyetleri</h3>` ve `<h3 ...>Altyapı</h3>`.
- AI grubu: `grid grid-cols-4 gap-3` — 7 kart, son satırda 3 kart (4+3 düzen).
- Altyapı grubu: `grid grid-cols-2 gap-3` — 2 kart yan yana.
- Gruplar arası `space-y-4` ile dikey ayrım.

### 3.3 UsageChart Sıralaması (Soru 2 — C)

Stack sırası (alttan üste):
1. AI (mor `#6d28d9`)
2. Rerank (pembe `#ec4899`)
3. Research (cyan `#06b6d4`) — **yeni**
4. Quote Hazırlama (indigo `#6366f1`) — **yeni**
5. Web Search (turkuaz `#14b8a6`)
6. Proactive (turuncu `#f97316`)
7. Storage (yeşil `#22c55e`)
8. Trigger (sarı `#f59e0b`, top radius)

`chartData` mapping objesinde alan ekleme:
```ts
Research: d.research?.costUsd ?? 0,
'Quote Hazırlama': d.quotePrepare?.costUsd ?? 0,
```

### 3.4 Dashboard (Soru 3 — C)

**`use-platform-summary.ts`** lokal `UsageMonth` tipini extend:
```ts
research?: { searchCount: number; costUsd: number }
quotePrepare?: { quoteCount: number; costUsd: number }
```

**`category-breakdown.tsx`** props:
- `research: number` ve `quotePrepare: number` props'larını ekle.
- `BARS` dizisine 2 yeni bar (cyan + indigo).
- `dashboard-page.tsx`'de `<CategoryBreakdown research={current.research?.costUsd ?? 0} quotePrepare={current.quotePrepare?.costUsd ?? 0} ... />`.

**`cost-trend-chart.tsx`** — UsageChart ile aynı mantık (chart serileri ekle, sıralama).

### 3.5 Free Tier (Soru 4 — A)

`allowed-models-editor.tsx`:
```ts
const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  standard: 'Standard',
  economy: 'Economy',
  free: 'Ücretsiz',
}

const TIER_ORDER = ['premium', 'standard', 'economy', 'free']
```

Tier render mevcut grouped logic ile otomatik halloluyor (`grouped.filter(g => g.items.length > 0)` → free modelin yoksa görünmez).

### 3.6 Tip Değişiklikleri

**`src/features/companies/types.ts:UsageMonth`** — opsiyonel alanlar:
```ts
research?: { searchCount: number; costUsd: number }
quotePrepare?: { quoteCount: number; costUsd: number }
```

**`src/features/dashboard/hooks/use-platform-summary.ts:UsageMonth`** (lokal) — aynı opsiyonel alanlar.

> İki tip ayrı tutulur — şirket bazlı response'ta ek alanlar var (`turnCount`, `currentBytes`), platform summary'de ek alanlar (`companyCount`, `totalBytes`). Tek tipte birleştirme YAGNI.

---

## 4. Değişen Dosyalar (8 adet)

| # | Dosya | Değişiklik tipi |
|---|-------|-----------------|
| 1 | `src/features/companies/types.ts` | `UsageMonth` 2 opsiyonel alan eklendi |
| 2 | `src/features/companies/components/usage-tab.tsx` | KPI gruplaması (2 başlık), 2 yeni kart |
| 3 | `src/features/companies/components/usage-chart.tsx` | 2 seri eklendi, sıralama AI grubu önce |
| 4 | `src/features/dashboard/hooks/use-platform-summary.ts` | Lokal `UsageMonth` 2 opsiyonel alan |
| 5 | `src/features/dashboard/components/category-breakdown.tsx` | 2 props + 2 bar |
| 6 | `src/features/dashboard/components/cost-trend-chart.tsx` | 2 seri eklendi |
| 7 | `src/features/dashboard/pages/dashboard-page.tsx` | `<CategoryBreakdown />` 2 yeni props geçildi |
| 8 | `src/features/companies/components/allowed-models-editor.tsx` | TIER_LABELS + TIER_ORDER `free` eklendi |

---

## 5. Hata Yönetimi

- Yeni alanlar **opsiyonel**. Eksikse `?? 0` ile sıfır gösterilir. Crash yok.
- Backend henüz alanları döndürmediği sürece KPI'lar $0 ve "0 araştırma" / "0 teklif" gösterir — kullanıcı için açıklayıcı (boş veri ≠ bug).
- Free tier'da hiç model yoksa grup hiç render edilmez (mevcut filter logic).
- TypeScript: opsiyonel alanlar `?.` ile erişiliyor; `tsc -b` build'i sorunsuz geçmeli.

---

## 6. Doğrulama (Test)

Frontend'de unit test yok (mevcut konvansiyon). Doğrulama yöntemi:

1. **`npm run typecheck` / `tsc -b`** — tip hatası olmamalı.
2. **`npm run dev`** + browser:
   - `/companies/:id` → Kullanım tab'ı: 2 başlık görünüyor mu, yeni kartlar render mi, chart 8 seri mi?
   - `/` (Dashboard): kategori breakdown'da Research + Quote Hazırlama bar'ı var mı, trend chart 8 seri mi?
   - `/companies/:id` → Yapılandırma → AI → Allowed Models: free tier modelleri ayrı grup olarak görünüyor mu?
3. **Backend henüz alanları döndürmüyorsa:** $0/0 değerler gösterilmeli, console error yok.

---

## 7. Kapsamda Olmayan (YAGNI)

- Backend endpoint değişiklikleri (defensive frontend yeterli).
- Yeni reusable component (CostKpiGroup vb.) — 7 dosya küçük diff, abstraction prematüre.
- Free tier modeller için "deneysel" badge / uyarı.
- Bütçe downgrade görünürlüğü (Sprint 2'de).
- Quote pipeline 7-step görselleştirme (Sprint 2/3'te).
- System Architecture sayfası (Sprint 3'te).

---

## 8. Riskler & Belirsizlikler

| Risk | Etki | Azaltma |
|------|------|---------|
| Backend `research`/`quotePrepare` field'larını döndürmüyor olabilir | Düşük | Defensive fallback `?? 0`, kullanıcıya $0 görünür |
| Backend response field adı sample JSON'dan farklı olabilir (örn. `quote_prepare` vs `quotePrepare`) | Orta | İmplementasyondan önce swagger'dan API response'u doğrula; tutarsızsa bu spec'i güncelle |
| Free tier'da 50+ deneysel model dönerse UI uzun olabilir | Düşük | Mevcut search filter zaten var; max-h-320px scroll var |
| Chart 8 seri darası mobile'da sıkışabilir | Düşük | Mevcut Recharts ResponsiveContainer var; legend wrap'lenir |

---

## 9. Sonraki Adım

1. Bu spec onaylanır.
2. `superpowers:writing-plans` skill'i invoke edilir.
3. Implementation plan'i (TDD veya direkt edit) yazılır.
4. Plan'a göre subagent veya direkt implementasyon.
