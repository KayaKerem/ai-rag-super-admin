# Sprint 3 — Bilgi & Dokümantasyon Sayfası Design

**Tarih:** 2026-04-18
**Durum:** Brainstorm onaylı, implementation öncesi spec
**Kaynak doküman:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/16-system-architecture.md` (39KB, 14 bölüm)

## 1. Amaç

Backend tarafından yazılmış 14 bölümlük sistem mimari rehberini superadmin paneli içinde okunabilir, gezilebilir bir "Bilgi & Dokümantasyon" sayfası olarak sunmak. Backend doc'unun ilk satırı niyeti açıkça beyan ediyor:

> "Superadmin panelinde 'Bilgi & Dokumantasyon' sayfası olarak gosterilebilir."

Sprint 3 bu sayfanın **temelini ve ilk 5 bölümünü** kurar; geri kalan 9 bölüm sonraki sprintlerde aynı şablonla eklenir.

## 2. Kapsam

### Sprint 3 İçinde

- Yeni `/docs` route + sidebar nav item ("Dokümantasyon", `BookOpen` ikon)
- TOC sidebar + scroll-spy + smooth scroll layout shell'i
- 5 doc bölümü (hand-built React, Sprint 2 Quote Pipeline tarzı):
  1. Genel Mimari
  2. Mesaj İşlem Akışı
  3. Agent Tool Sistemi (19 tool tablosu)
  5. Model Seçimi & Downgrade
  14. Sorun Giderme
- Sprint 2 Followup #1 wire: `budgetDowngradeThresholdPct` plan-aware geçişi (`computeBudgetBand` imzası + UsageTab'tan plan değeri pass-through)

### Sprint 3 DIŞINDA

- Diğer 9 doc bölümü (4 Bütçe & Maliyet, 6 Config Miras Zinciri, 7 Arama Altyapısı, 8 Teklif Pipeline, 9 WhatsApp & Kanal, 10 Güvenlik, 11 Bildirim & Onay, 12 Ayar Referansı, 13 Maliyet Tahmini) → Sprint 4/5
- Sprint 2'de Settings altına eklenmiş Quote Pipeline'ın `/docs`'a taşınması → Sprint 4'te değerlendirilir
- Sprint 2 Followup #2 (BudgetStatusCard skeleton placeholder) → ayrı interrupt commit, Sprint 3 scope'una dahil değil
- React.lazy ile code-splitting (5 bölümde gerek yok; 14'e çıkarken değerlendirilir)
- Yeni backend endpoint isteme veya API wiring (sayfa firma-agnostik, statik içerik)
- Markdown render (react-markdown gibi) — hand-built React kararı brainstorm'da onaylandı

## 3. Mimari

### 3.1 Üst Yapı

**Route:** `/docs` (tek route, anchor-based section navigation)

**Sidebar:** Mevcut `src/components/layout/sidebar.tsx`'teki `navItems` dizisine yeni item eklenir:

```typescript
{ to: '/docs', icon: BookOpen, label: 'Dokümantasyon' }
```

Servis Hesapları'nın altına gelir → toplam 6 sidebar item.

**Layout:** Settings sayfasının nav patern'iyle aynı mantık — sol kolonda sticky TOC sidebar, sağda scroll content. Tek route, anchor-based nav (`#genel-mimari`, `#mesaj-akisi` vs.). TOC item'a tıklayınca `scrollIntoView({ behavior: 'smooth' })`. Scroll oldukça aktif TOC item highlight (scroll-spy via `IntersectionObserver`).

### 3.2 Dosya Yapısı

```
src/features/docs/
  pages/
    docs-page.tsx              # Shell: TOC + content area layout, tüm Section'ları sırayla render eder
  components/
    docs-toc.tsx               # Sticky sol nav, scroll-spy, smooth scroll
    docs-section-card.tsx      # Ortak section wrapper: <section id> + h2 + emoji ikon + body
  sections/
    genel-mimari.tsx
    mesaj-akisi.tsx
    agent-tool.tsx
    model-downgrade.tsx
    sorun-giderme.tsx
  lib/
    sections.ts                # Section registry: { id, title, icon, slug, Component }
```

**Section registry (`lib/sections.ts`):** Tek truth source. Hem `DocsPage` (sırayla render) hem `DocsToc` (nav listesi) buradan okur. Yeni bölüm eklemek = registry'ye ekle + component yaz.

```typescript
export interface DocsSection {
  id: string;            // anchor slug, ör. 'genel-mimari'
  title: string;         // TOC ve h2 başlığı
  icon: string;          // emoji veya lucide isim
  Component: React.FC;
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  // ...
];
```

### 3.3 Bağımlılıklar

Yeni paket gerekmiyor:
- `lucide-react` (BookOpen ikonu) zaten var
- Smooth scroll native `Element.scrollIntoView({ behavior: 'smooth' })`
- Scroll-spy native `IntersectionObserver`
- Card/CardContent/CardHeader/CardTitle zaten `@/components/ui/card`'da

## 4. Bölüm İçerikleri

Her bölüm `DocsSectionCard` wrapper içinde. Tek `<section id="...">` anchor, h2 başlık + emoji ikon + body.

### 4.1 Genel Mimari (`#genel-mimari`)

4-6 ana bileşeni gösteren kart grid (2-col grid):

- **Frontend (Admin Panel + Embed Widget)** — React + Vite + Tailwind, Vercel/Netlify deploy
- **Backend API** — NestJS + TypeORM, Hetzner/Railway
- **Worker** — Trigger.dev v3 background jobs (quote pipeline, embeddings)
- **Veritabanı** — Postgres + pgvector (vector store)
- **LLM Sağlayıcı** — OpenRouter (Anthropic, OpenAI, Google modelleri)
- **Mesajlaşma Kanalları** — WhatsApp Business, Web embed widget, Customer agent

Her kart: emoji ikon + bileşen adı + 1-2 cümle açıklama + (varsa) sağlayıcı/host notu.

Altta basit metin akış: "Mesaj geldi → Backend doğrular → Worker tetiklenir → LLM çağrılır → Yanıt yazılır → Kanala iletilir"

### 4.2 Mesaj İşlem Akışı (`#mesaj-akisi`)

Sprint 2 Quote Pipeline'ın 7-step kart deseninin aynısı (familyar pattern). Backend doc §2'den adımlar:

1. **Webhook al** — kanal entegrasyonundan inbound mesaj gelir
2. **Doğrula** — imza/HMAC, rate limit, kanal eşleşmesi
3. **Conversation lookup/create** — `customerId + channelId` ile mevcut konuşmayı bul veya yenisini aç
4. **Memory yükle** — company memory + conversation memory + customer profile
5. **Agent çalıştır** — sistem prompt + memory + araçlar ile LLM çağrısı
6. **Tool dispatch** — model tool çağırırsa worker'a delegate (quote, search, customer update, vb.)
7. **Yanıt yaz** — final mesajı conversation'a kaydet + kanala gönder

Her step: numaralı badge + başlık + 1-2 cümle açıklama. Quote Pipeline ile aynı görsel ritim.

### 4.3 Agent Tool Sistemi (`#agent-tool`)

Üstte 1 paragraf giriş: "Agent her turda bu tool'lara erişir; kullanım frekansı ve maliyeti kullanıcıya görünür."

Altında 19 tool'u listeleyen tablo. Backend doc §3.1'den. Kolonlar:

| Tool Adı | Kategori | Amaç |
|---|---|---|
| `memory.write` | Memory | Conversation memory'sine kalıcı not ekler |
| `quote.create` | Quote | Yeni teklif başlatır (Quote Pipeline'ı tetikler) |
| ... (19 satır) | ... | ... |

Kategori değerleri: Memory / Quote / Search / Conversation / Customer (5 kategori).

Tablo `<table>` semantic, Tailwind ile shadcn-table benzeri stilize edilir (border-b, padding, hover bg). Mobile için horizontal scroll.

### 4.4 Model Seçimi & Downgrade (`#model-downgrade`)

Backend doc §5 + §5.3 birleşimi. İki alt blok:

**Üst — Bütçe Bandları Tablosu**

| Bant | Eşik (varsayılan) | Davranış |
|---|---|---|
| Normal | < %80 | Tam kalite model (örn. Claude Sonnet 4.6) |
| Standard Downgrade | %80 – %95 | Orta kalite model |
| Economy Downgrade | %95 – %97 | Düşük maliyetli model |
| Exhausted | ≥ %97 | Yanıt vermez, "bütçe doldu" mesajı |

Tablonun **altında uyarı kutusu** (amber):
> "Yukarıdaki yüzdeler varsayılan değerlerdir. Her firmanın planında `budgetDowngradeThresholdPct` alanı vardır ve bu değer ilk eşiği (Normal → Standard geçişi) belirler. Diğer eşikler buna göre kayar."

**Alt — Bütçe Status Card Cross-Reference**

Mini-açıklama: "Companies → bir firma seç → Usage tab → en üstteki Bütçe Durumu kartı, o firmanın gerçek planına göre bandı hesaplar."

### 4.5 Sorun Giderme (`#sorun-giderme`)

FAQ tarzı 5-7 yaygın sorun + çözüm. Backend doc §14'ten adapte. Her item: h3 (soru) + paragraf (cevap) + (varsa) ilgili bölüme link (anchor).

Örnek format:
- **Bir mesaj cevapsız kaldı, ne yaparım?**
  Önce conversation log'u kontrol et... → ilgili bölüm: [Mesaj İşlem Akışı](#mesaj-akisi)
- **Bütçe bittiği halde model çalışıyor — neden?**
  Plan'in `budgetDowngradeThresholdPct` değerine bak... → [Model Downgrade](#model-downgrade)
- **WhatsApp mesajları gelmiyor.**
  Webhook URL ve HMAC secret eşleşmiyor olabilir...
- **Tool çağrısı başarısız, hata logu nerede?**
  Worker logları Trigger.dev dashboard'unda...
- **Quote oluşmadı, hangi adımda takıldı?**
  Settings → Quote Pipeline sayfasını gör...

## 5. Sprint 2 Followup #1 — `budgetDowngradeThresholdPct` Wire

Sprint 2'de hardcoded olan band eşiklerini plan-aware'e çıkarmak. Backend doc §5.3 onayladı: alan `PricingPlan.budgetDowngradeThresholdPct: number` olarak gerçekten kullanılıyor.

### 5.1 Backend Doğrulama (Implementation Önkoşulu)

Plan implementer'ı ilk task'ta `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/06-models.md` ve `16-system-architecture.md` §5.3'ü okur ve aşağıdakileri netleştirir:

- `budgetDowngradeThresholdPct` tek bir threshold mı (sadece Normal → Standard geçişi) yoksa tüm bandları mı kaydırıyor?
- Diğer eşikler (Economy, Exhausted) hardcoded delta mı yoksa ayrı alanlar mı?
- Default değer nedir?

Bu doğrulama olmadan kod değişikliği yapılmaz.

### 5.2 Kod Değişiklikleri

**`src/features/companies/lib/budget-band.ts`:**
- Mevcut imza: `computeBudgetBand(spendUsd, capUsd)` — bandlar `<80/<95/<97` hardcoded
- Yeni imza: `computeBudgetBand(spendUsd, capUsd, thresholdPct?)` — `thresholdPct` undefined ise mevcut hardcoded değerlere düşer (geri uyumlu)

**`src/features/companies/components/budget-status-card.tsx`:**
- Yeni opsiyonel prop: `thresholdPct?: number`
- `computeBudgetBand`'e geçirir

**`src/features/companies/components/usage-tab.tsx`:**
- `<BudgetStatusCard ... thresholdPct={plan?.budgetDowngradeThresholdPct} />`

### 5.3 Doğrulama

Sprint 2'deki gibi programatik `console.assert` ile band hesaplamasını test et. Yeni vakalar: `thresholdPct` verildiğinde band geçişi doğru noktada olur, undefined verildiğinde mevcut davranış değişmez.

## 6. Task Breakdown

8 task, sırayla:

1. **Backend doğrulama + `computeBudgetBand` plan-aware** (followup #1) — backend doc oku, imza güncelle, programatik verify
2. **`BudgetStatusCard` + `UsageTab` thresholdPct entegrasyonu** — prop pass-through, query'den değeri geçir
3. **Sidebar item + /docs route + page shell** — `BookOpen` ikon, `pages/docs-page.tsx` boş layout (TOC sidebar + content area iskelet), router register
4. **`DocsToc` komponenti** — sticky sol nav, scroll-spy ile aktif item highlight, smooth scroll
5. **Section 1 — Genel Mimari** — 4-6 kart grid + akış metni
6. **Section 2 — Mesaj İşlem Akışı** — Quote Pipeline tarzı 7-step kart
7. **Section 3 — Agent Tool Sistemi** — 19 tool tablosu (kategori kolonu dahil)
8. **Section 4 — Model Downgrade + Section 5 — Sorun Giderme** (kombine task — ikisi de görece kısa)

## 7. Başarı Kriterleri

- Sidebar'a tıkla → `/docs` açılır → 5 bölüm tek sayfada görünür
- TOC'ta tıkla → smooth scroll + aktif item highlight
- Companies → Usage tab'da BudgetStatusCard, plan'in `budgetDowngradeThresholdPct` değerine göre band hesaplar
- `thresholdPct` undefined olduğunda mevcut Sprint 2 davranışı korunur (regression yok)
- TypeScript `tsc -b` temiz, build çalışır
- Settings/Quote Pipeline mevcut yerinde çalışmaya devam eder (regression yok)
- Yeni doc bölümü eklemek için tek değişiklik: `lib/sections.ts`'e entry + component dosyası
