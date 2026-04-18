# Sprint 6 — /docs Genişletme: 4 Yeni Bölüm (II)

**Tarih:** 2026-04-18
**Scope:** Mevcut /docs sayfasına 4 yeni bölüm daha. Sprint 5'te shipped 9 bölümün üstüne 4 yeni → toplam 13. Hibrit mod — 3 operasyonel-sentez + 1 API-quickref. Bundle lazy-load yine YAGNI (cumulative post-Sprint 6 bundle + değeri ölçülüp Sprint 7+ kararı).

## Arka Plan

Sprint 5 sonunda /docs sayfası 9 bölümde kapandı (`genel-mimari`, `auth-yetkilendirme`, `mesaj-akisi`, `agent-tool`, `model-downgrade`, `fiyatlandirma-gelir`, `quote-pipeline`, `firma-config`, `sorun-giderme`). Bundle +24.74 kB raw / +4.88 kB gzipped. Pattern stabil: `DOCS_SECTIONS` registry + `DocsSectionCard` shared shell + hand-built React (markdown renderer YOK, MDX YOK).

Backend'in 16 `frontend-admin/` doc dosyasından 7'si henüz /docs'ta yansıtılmıyor (iki doc "coming soon" / yarım feature — `13-company-memories.md`, `14-proactive-insights.md` — hariç). Bu sprint geri kalan 7'den **yüksek operasyonel değerli 4 konu**yu alıyor. Sırası numerik doc sırası — kullanıcı tercihi ("sırayla yap işte"): 01 → 03 → 05 → 07.

## Seçim Kriteri

Sprint 5'teki çerçeve korunur: operasyonel sentez ("bir admin bu konuda günlük hangi soruyu sorar") vs API-quickref (alan-referansı tabloları). Seçilen 4 konu:

| # | Backend doc | /docs bölüm | Mod | Neden bu sprint |
|---|---|---|---|---|
| 1 | `01-companies.md` | `firma-yonetimi` 🏢 | operasyonel-sentez | Süper admin'in en sık açtığı ekran (firma listesi + detay); status lifecycle + billing-events her gün sorulur |
| 2 | `03-tool-plans.md` | `platform-tool-planlari` 🧰 | operasyonel-sentez | `agent-tool` bölümündeki tool listesini plana bağlayan governance katmanı; plan+override resolution kafa karıştırıcı |
| 3 | `05-analytics.md` | `platform-analytics` 📊 | operasyonel-sentez | Usage/quality/agent-metrics üç endpoint ailesinin haritası; dashboard KPI kaynağı |
| 4 | `07-data-sources-admin.md` | `veri-kaynaklari` 🔌 | API-quickref | Küçük doc; connector type + status + crawler config tablo ağırlıklı |

## Yeni Bölümler

### 1. `firma-yonetimi` 🏢 (operasyonel-sentez)

**Kaynak:** `01-companies.md`.

**İçerik iskeleti:**
- 1-paragraf intro: `/platform/companies` CRUD + status lifecycle + billing-events history. Tümü `PlatformAdminGuard` ile korunur.
- Endpoint tablosu (4 kolon: method | path | amaç | dönüş — dönüş kolonu kısa şekil label: "Company", "Company[]", "202 + taskId", "204"): `POST /platform/companies` (Company), `GET /platform/companies` (Company[]), `GET /:id` (Company), `PATCH /:id` (Company), `DELETE /:id` (204), `DELETE /:companyId/leads/:leadId/permanent` (202 + `{ taskId, status }`), `PATCH /:id/status` (`{ id, subscriptionStatus, statusChangedAt }`), `GET /:id/billing-events` (BillingEvent[]).
- PATCH ayar alanları tablosu (4 kolon: alan | tip | GET sample | açıklama — default kolonu yerine "GET response örnek değeri" kullan, backend doc default belirtmiyor): `name` (string, —, firma adı), `customerAgentTrustLevel` (enum, `FULL_CONTROL`, otonomi seviyesi: FULL_CONTROL → AUTO_MESSAGE → AUTO_ALL_QUOTE_APPROVAL → FULLY_AUTOMATIC), `autoApproveQuoteThreshold` (number USD / null, null, AUTO_ALL_QUOTE_APPROVAL modunda eşik), `approvalTimeoutMinutes` (number, 120, onay bekleme süresi), `approvalTimeoutAction` (enum, `REMIND`, REMIND | AUTO_SEND | HOLD). Trust-level satırında `#firma-config`'e cross-ref.
- Status lifecycle violet callout: Manuel `active | suspended | cancelled` — `trialing` ve `past_due` otomatik lifecycle'a ait, manuel atanamaz (400). `suspended`/`cancelled` → `SubscriptionGuard` 403 verir. Her status değişikliği `billing_events`'e `status_change` kaydı ekler (`actorId: 'platform-admin'`).
- Billing event tipleri tablosu (kod | ne zaman): 7 event — `status_change`, `plan_upgrade`, `plan_downgrade_scheduled`, `plan_downgrade_executed`, `plan_removed`, `plan_downgrade_cancelled`, `admin_override`. `plan_*` satırlarında `#fiyatlandirma-gelir` cross-ref. Not: backend `05-analytics.md`'deki response örneğinde `plan_changed` geçiyor — kanonik enum `01-companies.md`'deki 7'li listedir, `plan_changed` dokümantasyon kalıntısı.
- KVKK/GDPR amber callout: `DELETE /:companyId/leads/:leadId/permanent` asenkron (202 + Trigger.dev `{ taskId, status: 'processing' }`). Silme kapsamı: lead + ilişkili tüm veri (cascade).

**Satır hedefi:** ~130.

### 2. `platform-tool-planlari` 🧰 (operasyonel-sentez)

**Kaynak:** `03-tool-plans.md`.

**İçerik iskeleti:**
- 1-paragraf intro: Plan governance sistemi — registry + plan tanımı + firma override. Amaç: tool erişimini plan bazında açmak/kapamak.
- Endpoint tablosu (4 satır): `GET /platform/tool-plans`, `PUT /platform/tool-plans`, `GET /platform/companies/:id/tool-config`, `PUT /platform/companies/:id/tool-config`.
- Resolve kuralı violet callout: **`resolvedTools`** sırası — (1) Firma `PricingPlan`'a bağlıysa plan `allowedTools` tek otorite; `toolPlanConfig` yok sayılır, (2) plan yoksa `toolPlanConfig.plan` → plan'ın `tools` listesi, (3) `overrides: {toolId: bool}` üstüne biner. `#fiyatlandirma-gelir`'e cross-ref (plan önceliği için) ve `#agent-tool`'a cross-ref (runtime tool filtrelemesinin buraya bağlı olduğu notu — `agent-tool` bölümünün TOOLS listesi bazı tool'ları grupluyor, `registeredTools` ise raw set).
- Source değerleri tablosu (3 satır): `plan` (planda var), `override` (override ile açıldı), `not_in_plan` (planda yok ama UI'da göster). `enabled` nihai hesap; not: `enabled: false` olduğu halde `source: 'plan'` olabilir (override ile kapatılmışsa).
- Plan validasyon tablosu (3 kolon: kural | detay | violation HTTP): plan ID `/^[a-z0-9-]{2,50}$/` (422), label zorunlu max 100 karakter (422), max 20 plan (422), `defaultPlan` mevcut olmalı (422), tool ID'leri `registeredTools`'da olmalı — `*` wildcard istisnası (422), default plan silinemez (422).
- `registeredTools` amber callout: Read-only, backend tarafından belirlenir, super admin düzenleyemez. Backend sürümüne göre değişken (Nisan 2026'da 24 tool); runtime'da `GET /platform/tool-plans` sayıyı döner.

**Satır hedefi:** ~120.

### 3. `platform-analytics` 📊 (operasyonel-sentez)

**Kaynak:** `05-analytics.md`.

**İçerik iskeleti:**
- 1-paragraf intro: Üç metrik ailesi — Usage (maliyet), Analytics (kalite/tool/feedback), Agent Metrics (citation/human-workflow/alerts). Gelir metrikleri (`/platform/revenue`) ayrı bölüm — `#fiyatlandirma-gelir`.
- Endpoint ailesi tablosu (endpoint | query | amaç): `GET /platform/companies/:id/usage` (`?months=1-12`, default 1), `/usage/current` (—), `/platform/usage/summary` (`?months=1-12`, default 1), `/companies/:id/analytics` (`?months=1-12`), `/companies/:id/agent-metrics` (`?windowDays=1-365`, default 30).
- Maliyet kategorileri tablosu (kategori | eventType (snake_case) | response key (camelCase) | formül): `ai` toplamı + alt event'ler. Alt satırlar: `ai_turn` / `ai_turn_cache_hit` / `web_search` / `ai_rerank` / `research_tool` / `quote_prepare` / `memory_auto_extract` / `proactive_freshness` / `proactive_gap` / `proactive_quality`. Ayrıca: `storage` / `cdn` (her zaman 0) / `trigger`. Formül kolonu: AI öncelik `providerMetadata.openrouter.cost` → `computeLlmCost()` fallback; web_search `$0.007 + $0.001 × resultCount`; rerank `$0.0025/sorgu` (~500 token altı); trigger `quantity × triggerPerTaskUsd`; storage `(bytes/1e9) × s3PerGbMonthUsd`.
- Event/response key farkı note: eventType `snake_case` (DB), response aggregation key `camelCase` (API). Örnek: eventType `research_tool` → response `research.searchCount`.
- `ai_turn_cache_hit` blue callout: Phase 1 response cache — LLM çağrılmaz, $0 maliyet. `cacheHits.hitRate` ve `estimatedSavingsUsd` dashboard'da gösterilir.
- Kalite metrikleri tablosu (metrik | hesap | yön): `satisfactionRate`, `avgGroundedness`, `avgRelevance`, `lowQualityCount` (groundedness<0.5 VEYA relevance<0.5), `noResultRate`.
- Agent-metrics alert kodları tablosu (kod | severity | tetik): `low_citation_coverage` (warning, <%60), `low_feedback_quality_score` (warning, <70/100), `pending_approval_backlog` (critical, ≥10 bekleyen).
- Son paragraf violet callout: Gelir analitiği (MRR, marginTry, byPlan) bu bölümde değil — `#fiyatlandirma-gelir` + `/platform/revenue` endpoint'i için.

**Satır hedefi:** ~135 (revenue drop ile).

### 4. `veri-kaynaklari` 🔌 (API-quickref)

**Kaynak:** `07-data-sources-admin.md`.

**İçerik iskeleti:**
- 1-paragraf intro: Connector system — backend `website_crawler` gibi type'lar tanımlar; her firma kendi data source'larını ekler; platform admin hepsini görüntüler.
- Endpoint tablosu (3 satır): `GET /platform/data-source-types` (→ type array), `GET /platform/data-sources` (filtreler: `type`, `status`, `companyId` — response envelope `{ items, total }`), `GET /platform/companies/:id/data-sources` (firma-scoped; envelope kaynak doküman'da açık değil — plan yazarı mevcut pattern'i takip edip envelope'suz array varsayar, runtime'da `items` bekliyorsa implement sırasında fix).
- Status değerleri tablosu (status | anlam | renk önerisi): `active` (emerald), `syncing` (blue), `paused` (zinc), `error` (red — `errorMessage` satırı ile birlikte).
- Response field tablosu (items elemanı): `id`, `companyId`/`companyName`, `type`, `name`, `config` (type-özel JSON, örn. website_crawler `{ url }`), `status`, `errorMessage`, `itemCount`, `lastSyncAt`, `nextSyncAt`, `createdAt`.
- Crawler config amber callout: `PUT /platform/config/defaults` body.`crawlerConfig` — `cloudflareAccountId`, `cloudflareApiToken` (masked), `maxGlobalConcurrentCrawls`. Her sync → `crawl_sync` usage event. Firma bazlı limit → `#firma-config`'in `crawlMaxPages` / `crawlMaxSources` alanlarına cross-ref (section-level anchor — field-level değil).

**Satır hedefi:** ~100.

## Registry Güncellemesi

`src/features/docs/lib/sections.ts` — 13 section'lık final sıra:

```ts
export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari',           title: 'Genel Mimari',             icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme',     title: 'Auth & Yetkilendirme',     icon: '🔐', Component: AuthYetkilendirme },
  { id: 'firma-yonetimi',         title: 'Firma Yönetimi',           icon: '🏢', Component: FirmaYonetimi },
  { id: 'mesaj-akisi',            title: 'Mesaj İşlem Akışı',        icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool',             title: 'Agent Tool Sistemi',       icon: '🛠️', Component: AgentTool },
  { id: 'platform-tool-planlari', title: 'Platform Tool Planları',   icon: '🧰', Component: PlatformToolPlanlari },
  { id: 'model-downgrade',        title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir',    title: 'Fiyatlandırma & Gelir',    icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'platform-analytics',     title: 'Platform Analytics',       icon: '📊', Component: PlatformAnalytics },
  { id: 'quote-pipeline',         title: 'Quote Pipeline',           icon: '📄', Component: QuotePipeline },
  { id: 'firma-config',           title: 'Firma Config Referansı',   icon: '⚙️', Component: FirmaConfig },
  { id: 'veri-kaynaklari',        title: 'Veri Kaynakları',          icon: '🔌', Component: VeriKaynaklari },
  { id: 'sorun-giderme',          title: 'Sorun Giderme',            icon: '🔧', Component: SorunGiderme },
]
```

**Yerleşim mantığı:**
- `firma-yonetimi` → `auth-yetkilendirme`'den sonra (admin'in ilk gördüğü operasyon: firma listesi)
- `platform-tool-planlari` → `agent-tool`'dan sonra (tool listesi → plan governance doğal akış)
- `platform-analytics` → `fiyatlandirma-gelir`'den sonra (gelir → analytics → usage detayı akışı; `quote-pipeline` önüne gelir çünkü quote bir alt başlık, analytics üst başlık)
- `veri-kaynaklari` → `firma-config`'den sonra (config'in `limitsConfig.crawlMax*` alanlarının referansı oradaki)

## Cross-reference Linkleri (in-section anchor'lar)

| Kaynak bölüm | Hedef anchor | Bağlam |
|---|---|---|
| `firma-yonetimi` | `#firma-config` | PATCH trust-level satırında — approval davranışı config'e de yazılır |
| `firma-yonetimi` | `#fiyatlandirma-gelir` | Billing event tablosunda `plan_*` satırları |
| `platform-tool-planlari` | `#fiyatlandirma-gelir` | Resolve violet callout — `PricingPlan.allowedTools` önceliği |
| `platform-tool-planlari` | `#agent-tool` | Resolve violet callout — registered tool set aynı |
| `platform-analytics` | `#fiyatlandirma-gelir` | Son paragraf violet callout — gelir analitiği ayrı bölüm pointer |
| `veri-kaynaklari` | `#firma-config` | Crawler config amber callout'ta `crawlMaxPages` / `crawlMaxSources` referansı |

## Test & Doğrulama Planı

- **Unit test:** Yok (mevcut 9 section'ın da yok, static content). Pattern korunur.
- **TypeScript:** `npx tsc -b` → 0 hata.
- **Build:** `npm run build` → başarılı. Bundle delta ölç (raw + gzipped). +40 kB/sprint eşiği aşılırsa Sprint 7 lazy-load ayrı issue. Cumulative (Sprint 5 + 6) = ~50 kB raw olacak tahmin — threshold per-sprint.
- **Manuel QA checklist:**
  - /docs açıldığında 13 section sırayla render
  - TOC (sol sidebar, lg+ viewport) 13 başlık gösterir, scroll-spy aktif
  - 4 yeni section'ın `id`'si direkt URL'de çalışır (`/docs#firma-yonetimi` vb.)
  - 6 yeni cross-ref linki tıklandığında doğru hedefe scroll + scroll-mt-20 offset
  - Keyboard Tab nav: inline linkler odaklanabilir, focus-visible ring görünür
  - Mobile (<lg): TOC gizli, section'lar alt alta sorunsuz
  - Console error yok

## Uygulama Sırası (Implementation Order)

Her bölüm bağımsız dosya. Registry güncelleme en son (tek commit) — TypeScript kırılmasın.

1. `firma-yonetimi.tsx`
2. `platform-tool-planlari.tsx`
3. `platform-analytics.tsx`
4. `veri-kaynaklari.tsx`
5. `lib/sections.ts` registry + 4 import — tek commit, bundle delta commit mesajında
6. `npx tsc -b` + `npm run build` + bundle delta raporla
7. Dev server manuel QA

**Commit stratejisi (Sprint 5 pattern):**
1. `feat(docs): add firma-yonetimi section`
2. `feat(docs): add platform-tool-planlari section`
3. `feat(docs): add platform-analytics section`
4. `feat(docs): add veri-kaynaklari section`
5. `feat(docs): register 4 new sections (9→13) + wire cross-refs`

## YAGNI (Bu Sprint'te Yok)

- Markdown renderer / MDX
- Lazy-loading route (delta-driven karar Sprint 7+)
- /docs içi arama
- Kod bloğu copy butonu
- Versiyonlama / değişiklik geçmişi
- i18n (Türkçe korunur)
- Printable / export mode
- Backend doc'tan auto-sync script (manuel senkron korunur)
- Per-bölüm TOC (sadece section-level TOC var — istenirse Sprint 7)

## Scope Dışı / Sonraki Sprint Adayı

Sprint 6 sonrası kalan backend doc'lar:

| Backend doc | Neden Sprint 6'da değil |
|---|---|
| `09-email-templates.md` | Küçük quickref; diğer quickref grup ile birleşik Sprint 7 |
| `10-activity-log.md` | `11-search-analytics` ile "Aktivite & Audit" birleşik bölüm |
| `11-search-analytics.md` | `10-activity-log` ile birleşik |
| `13-company-memories.md` | Phase 3 "coming soon" — feature eksik |
| `14-proactive-insights.md` | Insight viewing UI eksik — feature yarım |
| `15-service-accounts.md` | Küçük quickref; Sprint 7 quickref grup |

## Riskler & Azaltıcılar

| Risk | Azaltıcı |
|---|---|
| 13 bölümde TOC kalabalık görünür | Pattern Sprint 5'te 9 bölümde test edildi, scroll-spy çalışıyor; TOC sol sticky sidebar zaten scroll ediyor |
| Bundle cumulative (Sprint 5+6) = ~50 kB → lazy-load basıncı | Sprint 6 sonrası delta ölç; +50 kB gzipped ise hâlâ 1.4 MB toplam — kritik değil. Sprint 7+'da karar |
| `platform-tool-planlari` ve `agent-tool` içerik overlap | `platform-tool-planlari` governance odaklı (plan+override resolve kuralı), `agent-tool` mesaj akışı içinde çağırılan tool'lar odaklı. Overlap yerine cross-ref ile birbirine işaret ediyor |
| Backend doc değişirse (özellikle `05-analytics.md` — hızlı genişliyor) | Sprint başı doc diff workflow'u mevcut. Analytics bölümünde kritik field listesi (alert kodları, eventType'lar) açık — değişiklikler minor edit |
| Cross-ref anchor kırılması (id değişirse) | Sprint 5 gibi `DOCS_SECTIONS` registry TS string literal — ileride `as const` + union type eklenebilir (bu sprint'te değil) |

## Başarı Kriterleri

- 13 section /docs'ta render oluyor, TOC 13 başlık
- `npx tsc -b` 0 hata
- `npm run build` başarılı, bundle delta raporlanmış
- 6 yeni cross-ref link tıklanıyor ve doğru hedefe gidiyor
- Manuel QA checklist 100% geçiyor
- Satır toplamı: 4 yeni section ≈ 485 satır (130 + 120 + 135 + 100), registry 9→13 (+10 satır), import +4 satır
