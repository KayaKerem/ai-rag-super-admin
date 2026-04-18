# Sprint 5 — /docs Genişletme: 4 Yeni Bölüm

**Tarih:** 2026-04-18
**Scope:** Mevcut /docs sayfasına 4 yeni bölüm ekleme. Hibrit mod — 3 operasyonel-sentez + 1 API-quickref. Bundle lazy-load yok (YAGNI; delta ölçülüp Sprint 6+ kararı).

## Arka Plan

Sprint 3'te /docs sayfası 5 operasyonel-sentez bölümü ile shipped (`genel-mimari`, `mesaj-akisi`, `agent-tool`, `model-downgrade`, `sorun-giderme`). Pattern: `DOCS_SECTIONS` registry + `DocsSectionCard` shared shell + hand-built React (markdown renderer YOK). Bundle delta Sprint 3 sonunda +21.74 kB raw.

Backend'in 16 frontend-admin doc dosyasından 11'i henüz /docs'ta yansıtılmıyor (13 ve 14 "coming soon" / yarım özellik). Bu sprint bu 11'den **operasyonel değeri en yüksek 4 konu** için bölüm ekliyor. Geri kalan 7 konu Sprint 6+ adayı.

## Seçim Kriteri

Mevcut 5 bölüm gibi **operasyonel sentez** önceliği: "bu backend doc'u ne diyor" yerine "bir admin bu konuda günlük hangi soruyu sorar". 4. bölüm (firma-config) tek istisna — alan-referansı tablolarına kasıtlı quick-ref.

## Yeni Bölümler

### 1. `auth-yetkilendirme` 🔐 (operasyonel-sentez)

**Kaynak backend doc'ları:** `00-overview.md` (auth + guards) + `04-users.md` (user mgmt).

**İçerik iskeleti:**
- 1-paragraf intro: JWT + PlatformAdminGuard kombinasyonu, her `/platform/*` endpoint'i koruyor.
- Auth header code block: `Authorization: Bearer <accessToken>`.
- Guard zinciri tablosu (3 kolon: adım | kontrol | başarısızsa dönüş): JwtAuthGuard → PlatformAdminGuard → handler.
- Hata tablosu: `401 unauthorized` (token yok/geçersiz), `403 platform_admin_required` (admin değil), `401 token_expired` (süresi dolmuş).
- `isPlatformAdmin` flag card: kim atar, nasıl değişir.
- Platform-admin user endpoint özeti (GET list, POST create, PATCH update, DELETE deactivate) — alan detayı değil, amaç+endpoint özeti.
- Sorun-giderme cross-ref inline link.

**Satır hedefi:** ~70.

### 2. `fiyatlandirma-gelir` 💰 (operasyonel-sentez)

**Kaynak:** `08-pricing-plans.md`.

**İçerik iskeleti:**
- Intro: plan tanımı → firmaya atama → billing döngüsü → gelir.
- Billing döngüsü card: 14 gün trial → 30 günlük periyot reset; `companyPeriodStart` `company.createdAt`'a bağlı.
- Plan alanları tablosu (alan | tip | açıklama): `monthlyPriceTry`, `includedUsers`, `extraUserPriceTry`, `budgetUsd`, `budgetDowngradeThresholdPct`, `maxStorageGb`, `maxFileSizeMb`, `allowedModels`, `allowedTools`, `isActive`. `budgetDowngradeThresholdPct` satırında `model-downgrade` bölümüne anchor link.
- Upgrade/downgrade action tablosu (action | mantık | efektif): `upgraded` (anlık + prorate), `downgrade_scheduled` (sonraki dönem), `no_change`, `removed`.
- MRR formülü code block:
  ```
  companyMrr = monthlyPriceTry + max(0, userCount - includedUsers) * extraUserPriceTry
  ```
- Otomatik cron callout: `POST /internal/process-downgrades`, 01:00 UTC günlük, `X-AI-Internal-Key` header ile korunur.

**Satır hedefi:** ~85.

### 3. `quote-pipeline` 📄 (operasyonel-sentez)

**Kaynak:** `12-quotes.md` + Trigger.dev bağlantısı (mesaj-akisi'nde referans var, burada derin).

**İçerik iskeleti:**
- Intro: teklif akışı — chat → intent detect → quote generate → Trigger.dev task → DB.
- 5-adım akış tablosu (adım | tetikleyici | aktör | sonuç): mesaj-akisi pattern'inde.
- Trust level + limits card: trust level eşikleri, firma bazında quote limit/gün.
- Durum geçiş tablosu: `pending` → `queued` → `processing` → `completed` | `failed`.
- Trigger.dev `quote.process` task card: task ne çalıştırır, hata durumunda retry davranışı.
- Sorun giderme için `sorun-giderme` bölümüne inline link.

**Satır hedefi:** ~80.

### 4. `firma-config` ⚙️ (API-quickref)

**Kaynak:** `02-company-config.md`.

**İçerik iskeleti:** Üç config bloğu için üç tablo. Her tablo 4 kolon: alan | tip | default | açıklama.

- `aiConfig` tablosu: `model`, `allowedModels`, `temperature`, `maxTokens`, `systemPrompt`, `budgetDowngradeThresholdPct` (not: plan atanmışsa plan override eder).
- `embeddingConfig` tablosu: `model`, `dimensions`, `chunkSize`, `chunkOverlap`.
- `limitsConfig` tablosu: `maxStorageGb`, `maxFileSizeMb`, `maxConcurrentQueries`, `rateLimitPerMinute`.
- Plan override amber callout: "Plan atanmışsa plan alanları config'teki aynı adlı alanları override eder. `fiyatlandirma-gelir` bölümüne bak."

**Satır hedefi:** ~90 (tablo ağırlıklı).

## Registry Güncellemesi

`src/features/docs/lib/sections.ts` — `DOCS_SECTIONS` sırası:

```ts
export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme', title: 'Auth & Yetkilendirme', icon: '🔐', Component: AuthYetkilendirme },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool', title: 'Agent Tool Sistemi', icon: '🛠️', Component: AgentTool },
  { id: 'model-downgrade', title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir', title: 'Fiyatlandırma & Gelir', icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'quote-pipeline', title: 'Quote Pipeline', icon: '📄', Component: QuotePipeline },
  { id: 'firma-config', title: 'Firma Config Referansı', icon: '⚙️', Component: FirmaConfig },
  { id: 'sorun-giderme', title: 'Sorun Giderme', icon: '🔧', Component: SorunGiderme },
]
```

## Cross-reference Linkleri (in-section anchor'lar)

| Kaynak bölüm | Hedef anchor | Bağlam |
|---|---|---|
| `fiyatlandirma-gelir` | `#model-downgrade` | `budgetDowngradeThresholdPct` satırında |
| `model-downgrade` | `#fiyatlandirma-gelir` | Plan tablosunun amber callout'una eklenir (zaten plan-aware metinde referans var; explicit link) |
| `firma-config` | `#fiyatlandirma-gelir` | Plan override callout'unda |
| `auth-yetkilendirme` | `#sorun-giderme` | 401/403 hataları satırında |

## Test & Doğrulama Planı

- **Unit test:** Yok. Mevcut 5 section'ın da testi yok — static content. Pattern korunur.
- **TypeScript:** `npx tsc -b` → 0 hata.
- **Build:** `npm run build` → başarılı. Bundle delta ölç (raw + gzipped). +40 kB üstü ise Sprint 6'da `React.lazy` + `Suspense` + route-level lazy-load ayrı issue olarak açılır.
- **Manuel QA checklist:**
  - /docs açıldığında 9 section sırayla render
  - TOC (sol sidebar, lg+ viewport) 9 başlık gösterir, aktif section highlight çalışır
  - Her yeni section'ın `id`'si adres çubuğunda anchor olarak çalışır (`/docs#auth-yetkilendirme` direkt scroll)
  - Cross-ref linkleri tıklandığında doğru section'a scroll + scroll-mt-20 offset çalışır
  - Keyboard Tab nav: inline linkler odaklanabilir, focus-visible ring görünür
  - Reduced-motion (prefers-reduced-motion: reduce) ile scroll anlık
  - Mobile (<lg): TOC gizli, section'lar alt alta sorunsuz

## Uygulama Sırası (Implementation Order)

Her bölüm bağımsız dosya — paralel yazım uygun. Registry güncelleme en son (tek commit).

1. `auth-yetkilendirme.tsx`
2. `fiyatlandirma-gelir.tsx`
3. `quote-pipeline.tsx`
4. `firma-config.tsx`
5. `model-downgrade.tsx`'a cross-ref link eklenmesi (minor edit)
6. `lib/sections.ts` registry + import satırları
7. `npx tsc -b` + `npm run build` + bundle delta ölç
8. Dev server manuel QA

Commit stratejisi: 5 commit (her section kendi commit'i + registry + cross-ref tek commit'te kapanır) — Sprint 3'ün atomik-commit pattern'ini takip eder (`028ed13` → `f11f67e`). Registry commit'i yalnızca 4 section dosyası merge-ready olduktan sonra atılır ki `npx tsc -b` hiç kırılmasın.

Commit sırası:
1. `feat(docs): add auth-yetkilendirme section`
2. `feat(docs): add fiyatlandirma-gelir section`
3. `feat(docs): add quote-pipeline section`
4. `feat(docs): add firma-config section`
5. `feat(docs): register 4 new sections + wire cross-ref links`

## YAGNI (Bu Sprint'te Yok)

- Markdown renderer
- Lazy-loading route (delta-driven karar Sprint 6+)
- /docs içi arama
- Code block copy butonu
- Versiyonlama / değişiklik geçmişi
- i18n (mevcut Türkçe korunur)
- Printable/export mode
- Content source: backend doc'tan auto-sync script (manuel senkron korunur)

## Scope Dışı / Sonraki Sprint Adayı

Backend doc'ları → /docs bölüm eşleşmesi:

| Backend doc | /docs bölüm | Durum |
|---|---|---|
| 00-overview | auth-yetkilendirme | Bu sprint |
| 01-companies | — | Sonraki (operasyonel-sentez: "Firma Yaşam Döngüsü") |
| 02-company-config | firma-config | Bu sprint |
| 03-tool-plans | — | Sonraki (operasyonel-sentez: "Tool Governance") |
| 04-users | auth-yetkilendirme | Bu sprint |
| 05-analytics | — | Sonraki (quickref: "Analytics Endpoints") |
| 06-models | model-downgrade | Mevcut (Sprint 3) |
| 07-data-sources-admin | — | Sonraki (operasyonel-sentez: "Data Sources & RAG") |
| 08-pricing-plans | fiyatlandirma-gelir | Bu sprint |
| 09-email-templates | — | Sonraki (quickref) |
| 10-activity-log | — | Sonraki ("Aktivite & Audit" ile birleşik) |
| 11-search-analytics | — | Sonraki ("Aktivite & Audit" ile birleşik) |
| 12-quotes | quote-pipeline | Bu sprint |
| 13-company-memories | — | Bekleme (Phase 3 "coming soon") |
| 14-proactive-insights | — | Bekleme (eksik feature — insight viewing yok) |
| 15-service-accounts | — | Sonraki (quickref) |
| 16-system-architecture | genel-mimari + mesaj-akisi + agent-tool | Mevcut (Sprint 3) |

## Riskler & Azaltıcılar

| Risk | Azaltıcı |
|---|---|
| Bundle delta büyür, ilk sayfa yavaşlar | Build sonrası ölç; +40 kB eşiği geçilirse Sprint 6'da lazy-load |
| Backend doc'u değişir, /docs'taki içerik eskir | Manuel senkron korunur; sprint başı doc diff kontrolü workflow'da var |
| Cross-ref anchor'lar kırılır (section id değişirse) | `DOCS_SECTIONS` registry TypeScript `id` string literal — ileride `as const` + union type ile derleme-zamanı kontrolü eklenebilir (bu sprint'te değil) |
| Plan override callout'u yanlış yönlendirir | `fiyatlandirma-gelir`'in satırları backend `08-pricing-plans.md` ile diff'lenir implementation sırasında |

## Başarı Kriterleri

- 9 section /docs'ta render oluyor, TOC güncel
- `npx tsc -b` 0 hata
- `npm run build` başarılı, bundle delta raporlanmış
- Cross-ref linkler tıklanıyor ve doğru hedefe gidiyor
- Manuel QA checklist 100% geçiyor
- Satır toplamı: 4 yeni section ≈ 325 satır, registry +8 satır, cross-ref +2-3 satır
