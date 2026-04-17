# Sprint 2 — Budget Downgrade Visibility & Quote Pipeline Diagram

**Tarih:** 2026-04-18
**Durum:** Design (in review)
**Spec öncesi:** Sprint 1 (`docs/superpowers/specs/2026-04-17-sprint1-cost-visibility-and-free-tier-design.md`) tamamlandı.

---

## 1. Amaç

Backend `06-models.md` dokümanındaki **otomatik bütçe-bazlı model downgrade** davranışını süper admin için görünür kılmak ve `12-quotes.md`'deki **7-adımlı quote pipeline** mimarisini Settings altında belgelemek.

İki bağımsız modül:

- **Module 1 — Budget Status Card:** Firma Usage tab'ında o ayki bütçe kullanımını ve mevcut downgrade bandını gösterir.
- **Module 3 — Quote Pipeline (Settings):** Statik 7-adım diyagramı; süper admin'in quote pipeline mimarisini öğrenmesini sağlar.

> **Module 2 (Dashboard at-risk firmalar widget'i) erteleme gerekçesi:** Backend `GET /platform/companies` per-company bütçe % aggregate döndürmüyor. N+1 fetch'i (50 firma = 50 paralel HTTP) Dashboard yükleme deneyimini bozardı. Backend aggregate endpoint hazır olduğunda ayrı sprint olarak eklenecek.

---

## 2. Backend Kontratı (Doğrulanmış)

### 2.1 Bütçe verisi kaynakları

| Alan | Kaynak | Tip |
|------|--------|-----|
| Plan bütçesi (cap) | `company.plan.budgetUsd` | `number` (USD/ay) |
| Aylık harcama | `useCompanyUsage()` → `current.totalCostUsd` | `number` (USD) |
| Downgrade eşikleri | **Hardcoded backend'de** — `06-models.md` | `%80, %95, %97` |

`company.plan.budgetUsd` mevcut `PricingPlan` tipinde (`src/features/companies/types.ts:223`) zaten tanımlı. Yeni tip gerekmiyor.

### 2.2 Bant tablosu (06-models.md `## Butce Bazli Model Downgrade`)

| Pct kullanım | Bant | Backend davranışı |
|--------------|------|-------------------|
| `< 80%` | `normal` | Firma seçimi kullanılır |
| `80% ≤ x < 95%` | `standard` | Premium → Standard tier'a düşürülür |
| `95% ≤ x < 97%` | `economy` | Standard/Premium → Economy tier'a düşürülür |
| `≥ 97%` | `exhausted` | AI cevap vermeyi durdurur (`budget_exhausted`) |

> Streaming kanal kullanıcıya `budget_downgrade` SSE event'i gönderir; channel (WhatsApp) için downgrade bilgisi turn metadata'sına yazılır. **Süper admin frontend bu event'leri dinlemez** — sadece son ayın aggregate harcaması ile bandı hesaplar.

### 2.3 Edge case'ler

- `company.plan === null` veya `company.plan.budgetUsd === 0` → Plan atanmamış. Kart "izleme aktif değil" mesajı gösterir.
- `current` data yüklenmemiş → mevcut Usage tab loading skeleton kullanılır.
- `current.totalCostUsd > budgetUsd` (>%100 olası) → bant `exhausted`, pct UI'da `≥97%` olarak clamp edilir (gerçek değer tooltip'te).

---

## 3. Module 1 — Budget Status Card

### 3.1 Yerleşim

`src/features/companies/components/usage-tab.tsx` — Sprint 1'de eklenen **`<h3>AI</h3>` başlığının ÜSTÜNE**, full-width tek kart.

```
┌─────────────────────────────────────────────────────────┐
│  Aylık AI Bütçesi              [Standard'a Düşürüldü]   │
│  $7.85 / $10.00         ███████████████░░░░░  78.5%     │
└─────────────────────────────────────────────────────────┘

[ AI ] (Sprint 1 başlığı)
[ KPI grid: AI / Rerank / Web Search / Research / ... ]

[ ALTYAPI ]
[ KPI grid: Storage / Trigger ]

[ Aylık Maliyet Trendi chart ]
```

### 3.2 Layout (3 kolon flex)

| Sol | Orta | Sağ |
|-----|------|-----|
| Bütçe / Harcama: `$7.85 / $10.00` (büyük, tabular nums) + alt satır `78.5% kullanıldı` (xs, muted) | Yatay progress bar (h-2, rounded-full); dolu kısım §3.3'teki bant rengiyle dolar (clamp `pct: 0..100`) | Bant rozeti (Badge component): bant rengi + Türkçe label |

### 3.3 Bant → renk eşleşmesi

| Bant | Bar/Rozet rengi (Tailwind class) | Türkçe label |
|------|----------------------------------|--------------|
| `normal` | `bg-green-500` / `bg-green-500/15 text-green-400 border-green-500/30` | `Normal` |
| `standard` | `bg-yellow-500` / `bg-yellow-500/15 text-yellow-400 border-yellow-500/30` | `Standard'a Düşürüldü` |
| `economy` | `bg-orange-500` / `bg-orange-500/15 text-orange-400 border-orange-500/30` | `Economy'ye Düşürüldü` |
| `exhausted` | `bg-red-500` / `bg-red-500/15 text-red-400 border-red-500/30` | `Bütçe Tükendi` |

### 3.4 Plan atanmamış edge case

```
┌─────────────────────────────────────────────────────────┐
│  Aylık AI Bütçesi                          [İzleme Yok] │
│  Bu firmaya plan atanmamış — bütçe limiti yok.          │
└─────────────────────────────────────────────────────────┘
```

Rozet: `bg-muted text-muted-foreground` (gri).

### 3.5 Util: `computeBudgetBand(spend, cap)`

`src/features/companies/lib/budget-band.ts` (yeni dosya):

```typescript
export type BudgetBand = 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'

export interface BudgetStatus {
  band: BudgetBand
  pct: number          // 0..100, clamped (gerçek değer >100 olabilir; UI'da tooltip)
  rawPct: number       // pct'nin clamp'lenmemiş hali
  label: string        // Türkçe rozet label
  barColorClass: string
  badgeClass: string
}

export function computeBudgetBand(spendUsd: number, capUsd: number | null | undefined): BudgetStatus
```

Kurallar:
- `capUsd == null || capUsd === 0` → `band: 'unconfigured'`, label: `İzleme Yok`
- Aksi halde `rawPct = (spendUsd / capUsd) * 100`
- `pct = Math.min(100, Math.max(0, rawPct))`
- Bant: `< 80 → normal`, `80-95 → standard`, `95-97 → economy`, `≥ 97 → exhausted`
- Renk class'ları sabit map'ten çekilir (yukarıdaki tablo)

Util pure → unit test'lenebilir.

### 3.6 Component: `<BudgetStatusCard />`

`src/features/companies/components/budget-status-card.tsx`:

```typescript
interface BudgetStatusCardProps {
  spendUsd: number
  capUsd: number | null
}
```

Render: Card → 3 kolon flex (sm:grid-cols-3) → sol metin / orta bar / sağ rozet. `unconfigured` bandında orta+sağ kolon gizlenir, sol metin tek satır info'ya dönüşür.

`useCompanyUsage()` ve `useCompany()` hook'larını mount eden component (`UsageTab`) prop olarak geçirir; component kendisi data fetch etmez (presentation only).

---

## 4. Module 3 — Quote Pipeline (Settings)

### 4.1 Yerleşim

`src/features/settings/` altına yeni section. Settings nav'da slot: `pricingPlans` ve `pricingConfig`'ten sonra (pricing semantik komşuluğu).

`src/features/settings/components/settings-nav.tsx`'e yeni entry:

```typescript
{ key: 'quotePipeline', label: 'Quote Pipeline', icon: GitBranch }
```

`src/features/settings/pages/settings-page.tsx`'e yeni route case → `<QuotePipelineSection />`.

### 4.2 İçerik

`src/features/settings/components/quote-pipeline-section.tsx` (yeni). Hiç API call yok, tamamen statik.

**Yapı:**

```
Quote Pipeline (h2)
─────────────────────────────────────────────
[Intro paragraf]
"Teklif hazırlama süreci quote.prepare.v1 Trigger.dev task'i ile
asenkron çalışır. 7 adım sırasıyla ilerler; herhangi bir adım hata
verirse bütçe rezervasyonu serbest bırakılır ve task retry'a alınır."

[7 adım kartı — grid grid-cols-1 lg:grid-cols-2 gap-4]
┌───────────────────────────┐  ┌───────────────────────────┐
│ 1. Bütçe Rezervasyonu     │  │ 2. Hazırlama              │
│ Firma AI bütçesinden $0.10│  │ AI agent KB + playbook    │
│ rezerve edilir; yetersizse│  │ arar, multi-step tool     │
│ task durdurulur.          │  │ calling ile içerik üretir.│
└───────────────────────────┘  └───────────────────────────┘
... (7 kart toplam)

[Config notu kutusu — Card amber/info]
"⚠ Yapılandırma Notları
• Max 3 retry, 180s timeout
• Internal endpoint'ler AI_INTERNAL_SECRET env ile korunur
• CUSTOMER konuşmalarında research tool çalıştırılmaz"
```

### 4.3 Adım listesi (sabit array)

```typescript
const STEPS = [
  { n: 1, title: 'Bütçe Rezervasyonu', desc: 'Firma AI bütçesinden $0.10 rezerve edilir; yetersizse task durdurulur.' },
  { n: 2, title: 'Hazırlama', desc: 'AI agent KB + playbook arar, multi-step tool calling ile içerik üretir.' },
  { n: 3, title: 'Oluşturma', desc: 'Quote entity oluşturulur (advisory lock ile referans numarası).' },
  { n: 4, title: 'Doküman', desc: 'Şablon varsa DOCX dokümanı üretilir.' },
  { n: 5, title: 'Değerlendirme', desc: 'Firmanın trust level\'ına göre onay gerekliliği belirlenir (TrustLevelService).' },
  { n: 6, title: 'Konuşma Yazımı', desc: 'Sonuç ASSISTANT turn olarak konuşmaya yazılır + QUOTE_PREPARED in-app bildirimi gönderilir.' },
  { n: 7, title: 'Bütçe Kapanışı', desc: 'Gerçek LLM maliyetiyle bütçe rezervasyonu kapatılır.' },
]
```

> Açıklamalar `12-quotes.md` § "Trigger.dev Task" bölümünden birebir alındı (kısaltılmış).

---

## 5. Dosya Haritası

| # | Dosya | İşlem | Modül |
|---|-------|-------|-------|
| 1 | `src/features/companies/lib/budget-band.ts` | **Yeni** util + `BudgetBand` type | M1 |
| 2 | `src/features/companies/lib/budget-band.test.ts` | **Yeni** unit test (vitest) | M1 |
| 3 | `src/features/companies/components/budget-status-card.tsx` | **Yeni** component | M1 |
| 4 | `src/features/companies/components/usage-tab.tsx` | `<BudgetStatusCard />` mount + `useCompany` çağrısı | M1 |
| 5 | `src/features/settings/components/quote-pipeline-section.tsx` | **Yeni** component (statik içerik) | M3 |
| 6 | `src/features/settings/components/settings-nav.tsx` | `quotePipeline` entry ekle | M3 |
| 7 | `src/features/settings/pages/settings-page.tsx` | Yeni route case → `<QuotePipelineSection />` | M3 |

**Toplam:** 4 yeni, 3 modify. Sprint 1'den daha küçük scope.

---

## 6. Doğrulama

- `tsc -b && vite build` exit 0
- `npm run lint` — bu sprint'te eklenen kodda yeni hata yok
- `npm test` (vitest) — `budget-band.test.ts` 4 bant + 2 edge (unconfigured, >%100) için pass
- Dev server visual smoke:
  - `/companies/:id` → Kullanım tab — Bütçe kartı en üstte, plan'ı olan firmada %P + bant rozeti, plan'ı olmayanda gri "İzleme Yok"
  - `/settings/quote-pipeline` — 7 adım kartı + intro + config notu

---

## 7. Sprint Dışında Bırakılanlar

- **Module 2 — Dashboard at-risk firmalar widget'i** (backend aggregate endpoint hazır olduğunda)
- **System Architecture sayfası** (16-system-architecture.md, Sprint 3'te)
- **Bütçe trend grafiği** (% kullanımının zaman içindeki seyri — YAGNI, ihtiyaç çıkarsa Sprint 2.5)
- **`budget_downgrade` SSE event tüketimi** (canlı izleme — backend WS/SSE gateway gerekir, scope dışı)

---

## 8. Riskler & Belirsizlikler

| Risk | Etki | Azaltma |
|------|------|---------|
| Bant eşikleri (%80/95/97) backend'de değişirse UI yanlış gösterir | Düşük | Eşikleri tek kaynaktan (`budget-band.ts` üst sabitler) çek; backend doc değişirse 1 dosya güncellenir |
| `company.plan === null` ama backend `customerOperationsBudgetUsd` veya başka alan kullanıyorsa | Çok düşük | Edge case "İzleme Yok" görünür; yanlış pozitif yok |
| Settings nav 16 → 17 section, sıkışıklık | Düşük | Mevcut sidebar overflow scroll var |
| `useCompany()` zaten `UsageTab` parent'ında çağrıldığından double fetch riski | Çok düşük | react-query aynı `queryKey` cache'ler |

---

## 9. Sonraki Adım

1. Bu spec onaylanır.
2. `superpowers:writing-plans` skill'i invoke edilir.
3. Plan `docs/superpowers/plans/2026-04-18-sprint2-budget-visibility-and-quote-pipeline.md` olarak yazılır.
4. Plan onayında subagent-driven-development ile task task implementasyon.
