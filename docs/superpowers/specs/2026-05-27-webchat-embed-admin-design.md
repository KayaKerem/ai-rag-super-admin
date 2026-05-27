# Sub-project 2 — WebChat + Embed Admin (2026-05-27)

**Sub-project:** 2 of 4 (Audit response decomposition; merged with original sub-5 WP plugin because sub-2 alone was too thin — visitor verify-fail dashboard is Sprint B17, kill-switch has no backend endpoint, brand/logo migration covers only cosmetic work)
**Backend docs:**
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/23-webchat-publicchat.md` (13 sections)
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/26-wp-plugin.md` (11 sections)
- `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/05b-visitor-session-stats.md` (B17 deferred — backend mirror endpoint yok)

**FE repo:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin`
**Prior commit:** `cbc8f76` (Sprint 10 sub-1)
**Branch strategy:** single-branch ship to main (autonomous)

## 1. Scope

Tek 12. tab + 1 settings section + ~7 commit. Sprint 9 ölçeği.

| Bölge | İçerik | Backend |
|------|--------|---------|
| `company-detail-page` → yeni 12. **"WebChat"** tab | Brand color + logo URL form (migration from `agent-settings-card`) + slug readonly + WP plugin section + universal embed section | `PUT /platform/companies/:id` (zaten sub-1'de wire'lı) |
| ↳ **Section A:** WordPress Plugin | `.zip indir` button (direct download anchor) + install steps + version display | `GET /public/wp-plugin/version.json` (no-auth), `GET /public/wp-plugin/by-slug/:slug/edfu-chat.zip` |
| ↳ **Section B:** Universal Embed | 3-tab (HTML / Next.js / Vue) snippet preview + clipboard copy | In-memory template + `embedScriptUrlTemplate` from version.json |
| ↳ Bottom note | Cross-link banner: "Visitor verify-fail stats Sprint B17 follow-up" | — |
| `/settings` → yeni **"Web Channel"** section | Kill-switch read-only status badge "ENV-managed" + açıklama | Backend endpoint yok — placeholder |
| **Migration** | `agent-settings-card.tsx` lines 201-217 (`brandColor` + `logoUrl` form fields) DELETE; yeni `webchat-config-card.tsx` aynı fields'ı host eder | Form payload aynı (`UpdateCompanyPayload` zaten 3 alanı içerir: brandColor, logoUrl, timezone — sub-1 fa83329) |

**Out of scope (kayıt için):**
- Visitor verify-fail dashboard (B17, `/platform/companies/:id/visitor-session-stats` mirror endpoint yok)
- Kill-switch toggle action (Coolify env-only — backend FE'ye env okuma endpoint'i yok)
- Live preview iframe (Sub-5 doc §10 TODO)
- Domain whitelist / CORS opt-in (Sub-5 doc §10 TODO)
- Plugin version comparison patron-vs-current (B35)
- Test-on-this-page button (Sub-5 doc §10 TODO)
- Brand color luminance hint ("light foreground" warning) — Sub-5 doc §10 TODO
- Embed analytics utm_source injection (Sub-5 doc §10 TODO)

## 2. Architecture / patterns

Mevcut konvansiyonlara saygı:

- **Yeni route yok.** Tab eklemesi + settings section. Bundle delta ~5-8 kB raw.
- **Hook layer:** Tek yeni hook `useWpPluginVersion()` — TanStack Query, queryKey `['public', 'wp-plugin-version']`, staleTime 5 min (backend `Cache-Control: max-age=300` ile uyumlu). **Native `fetch()` kullanır, `apiClient` axios DEĞİL** — gerekçe: `apiClient` Authorization header'ı tüm istekler için inject eder (interceptor); expired token public endpoint'e 401 yapabilir. `fetch(`${import.meta.env.VITE_API_URL}/public/wp-plugin/version.json`)` direkt.
- **Download trigger:** anchor `<a href={url} download>İndir</a>` — browser direct download. React Query gerekmez (binary stream). URL: `${BASE_API}/public/wp-plugin/by-slug/${slug}/edfu-chat.zip`. BASE_API derive from `import.meta.env.VITE_API_URL`.
- **Snippet generation:** Client-side template string. `embedScriptUrlTemplate` from version.json `.replace('{slug}', slug)`; fallback hardcoded `${BASE_API}/public/wp-plugin/by-slug/${slug}/edfu-chat.js`. 3 framework variants (HTML/Next.js/Vue) inline string interpolation.
- **Copy to clipboard:** `navigator.clipboard.writeText(snippet).then(...)` + sonner success toast "Kopyalandı"; catch → error toast "Kopyalama başarısız — manuel seç".
- **Tabs primitive:** `@/components/ui/tabs` (shadcn, sub-1'de playbook-admin'de zaten kullanılan — drop-in).
- **Brand color migration:** `agent-settings-card.tsx`'dan `brandColor` + `logoUrl` form fields SİL (lines 201-217 area); aynı state pattern (useState) yeni `webchat-config-card.tsx`'e taşı. `UpdateCompanyPayload` aynı (3 field hala destekli, agent-settings-card sadece `name/customerAgentTrustLevel/.../timezone` yollayacak; WebChatConfigCard sadece `brandColor`+`logoUrl` yollayacak — backend partial PATCH).
- **Settings page integration:** `SettingsPage` navigation-based (`activeSection: string` + `SettingsNav` sidebar + conditional ladder). Yeni `'webChannel'` activeSection key + `SettingsNav` item + ladder branch.
- **MSW handler:** `src/mocks/handlers.ts` tek dosya, `// ─── WP Plugin Version` comment'i altına version.json handler ekle.

## 3. Component breakdown

**New files (6):**
| Path | Sorumluluk |
|------|------------|
| `src/features/companies/components/webchat-tab.tsx` | Tab container; hosts WebChatConfigCard + WpPluginSection + UniversalEmbedSection + bottom B17 cross-link banner |
| `src/features/companies/components/webchat-config-card.tsx` | Brand color + logo URL form (mutation via `useUpdateCompany`). Pattern: useState + manuel sync useEffect (agent-settings-card paterni) |
| `src/features/companies/components/wp-plugin-section.tsx` | Section A: download anchor + install steps numbered list + version badge |
| `src/features/companies/components/universal-embed-section.tsx` | Section B: 3-tab snippet preview + copy clipboard btn |
| `src/features/companies/hooks/use-wp-plugin-version.ts` | `useWpPluginVersion()` query hook (no-auth public endpoint) |
| `src/features/settings/components/web-channel-section.tsx` | Settings page section: kill-switch status badge "ENV-managed" + açıklama |

**Modified files (5):**
| Path | Değişiklik |
|------|------------|
| `src/features/companies/pages/company-detail-page.tsx` | TabsList'e 12. `<TabsTrigger value="webchat">WebChat</TabsTrigger>`; TabsContent rendering `<WebChatTab company={company} />` |
| `src/features/companies/components/agent-settings-card.tsx` | DELETE: `brandColor` + `logoUrl` state, form alanları (lines 201-217), submit payload field'ları. Keep: `timezone` + diğer agent ayarları. Card title gözden geçir (eğer "Marka ve Görünüm" gibiyse → "Agent Ayarları" gibi rename) |
| `src/features/settings/pages/settings-page.tsx` | `SettingsNav`'a yeni item `{key: 'webChannel', label: 'Web Channel'}`; activeSection conditional ladder'a branch `activeSection === 'webChannel' ? <WebChannelSection /> : ...` |
| `src/lib/query-keys.ts` | Yeni namespace `public: { wpPluginVersion: ['public', 'wp-plugin-version'] as const }` |
| `src/mocks/handlers.ts` | `// ─── WP Plugin Version` section: `GET /public/wp-plugin/version.json` handler |

## 4. Data flow

```
company-detail-page
  └─ Tabs (existing 11 + new "webchat")
      └─ TabsContent value="webchat"
          └─ <WebChatTab company={company}>
              ├─ <WebChatConfigCard company={company} />
              │   └─ useUpdateCompany() mutation
              │       └─ PATCH /platform/companies/:id  body: {brandColor?, logoUrl?}
              ├─ <WpPluginSection slug={company.slug} />
              │   └─ useWpPluginVersion() → version field
              │   └─ <a href={zipUrl} download>İndir</a>
              ├─ <UniversalEmbedSection slug={company.slug} />
              │   └─ useWpPluginVersion() → embedScriptUrlTemplate
              │   └─ Tabs (HTML/Next.js/Vue) + Copy button
              └─ <CrossLinkBanner /> [B17 visitor-stats Sprint B note]
```

```
settings-page
  └─ SettingsNav (sidebar)
      └─ item 'webChannel' selected
  └─ activeSection ladder
      └─ activeSection === 'webChannel'
          └─ <WebChannelSection />
              ├─ Status badge "ENV-managed"
              └─ Açıklama: "WEBCHAT_EMBED_ENABLED değişikliği Coolify env panelinde yapılır.
                 Status FE'de görüntülenemez — backend endpoint Sprint B follow-up."
```

## 5. Error / edge cases

| Senaryo | Davranış |
|---------|----------|
| version.json fetch fail (network/404) | Fallback hardcoded URL'ler kullanılır; WP plugin section'da küçük badge "Plugin version bilgisi alınamadı" (no toast, graceful) |
| `available: false` in version.json | `.zip indir` button disabled + badge "Şu an indirilebilir değil" |
| `slug` missing (theoretical — required field) | WebChat tab içinde "Slug eksik — Şirket Bilgi sekmesinden kontrol edin" placeholder |
| Clipboard API blocked / permission denied | catch'te toast.error('Kopyalama başarısız — manuel seç') |
| 400 brand color invalid hex | UpdateCompany hook mevcut error handling (sub-1 fa83329 ile geldi); form-field inline error |
| WebChatConfigCard save partial fail | onError generic toast "Kaydedilemedi"; onSuccess "Kaydedildi" + state reset |
| agent-settings-card brand/logo silmek → diğer fields submit'i kırarsa | Migration commit'inde tsc check; eğer form state'i kıran field varsa bul + onar |

## 6. Testing + verification

Sub-1 ile aynı: 0 unit test framework. Verification:

- **TS:** `npx tsc -b 2>&1 | tail -10` → 0 error (baseline 0)
- **Build:** `npm run build` → green, bundle delta < 10 kB raw
- **Grep regressionchecks:**
  - `grep -rn "brandColor\|logoUrl" src/features/companies/components/agent-settings-card.tsx` → 0 match (post-migration)
  - `grep -rn "brandColor\|logoUrl" src/features/companies/components/webchat-config-card.tsx` → present
- **Manuel browser smoke (post-merge):**
  1. Company detail → 12. tab "WebChat" görünür ve clickable
  2. Brand color picker değişiklik → save → 200; GET'te geri gelir
  3. Logo URL input → save → 200
  4. Agent settings tab'da brand color + logo URL artık YOK (silinmiş)
  5. WP plugin section: version badge "1.0.0" (mock), `.zip indir` btn href = `${BASE_API}/public/wp-plugin/by-slug/${slug}/edfu-chat.zip`
  6. Universal embed: 3 tab snippet render; slug substitute doğru; "Kopyala" → toast + pano içeriği matches snippet
  7. /settings → "Web Channel" item sidebar'da; tıklayınca section "ENV-managed" badge görünür

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Migration sırasında agent-settings-card form state'i kırılır | M | M | tsc green-check; commit C3 öncesi adım: önce WebChat config card ekle (C2-3), DİĞER sonraki commit'te agent-settings'tan SİL. İki adım garantili. |
| version.json baseURL mismatch (dev vs prod) | Düşük | Düşük | `import.meta.env.VITE_API_URL` doğru kaynak; MSW dev'de intercept eder |
| `apiClient` Authorization header public endpoint'e gönderir → expired token 401 yapar | M | M | `useWpPluginVersion` hook native `fetch()` kullanır (axios bypass). Auth-less request garanti. |
| Snippet `<slug>` substitute hatası (URL içinde escape issue) | Düşük | Düşük | Slug regex `[a-z0-9-]+` zaten URL-safe |
| Clipboard API SSR / iframe restrict | Düşük | Düşük | Browser only — admin paneli zaten browser-mode (SSR yok); catch error |
| `WebChatTab` lazy chunk size beklenenden büyük | Düşük | Düşük | Build sonrası ölç; > 15 kB ise WP + Embed sections lazy import |
| `agent-settings-card` Card title brand/logo silince anlamsızlaşır | M | Düşük | Card title gözden geçir, gerekirse rename |
| `language` field bu sprint'te de eklenmemeli (B29 persist gap) | Bilinen | Düşük | Spec'te dokümante: ne agent-settings ne WebChat |

**Rollout:** Tek branch (main) → 7 commit → push. Feature flag yok.

## 8. Out of scope (Sprint B/D/diğer sub-projects)

- **Sprint B17:** `/platform/companies/:id/visitor-session-stats` super-admin mirror endpoint + UI (verify-fail dashboard)
- **Sprint B31:** WebChat conversation list (`channel=WEB_CHAT` filter) — patron-admin'de var, super-admin tarafında yok
- **Sprint B32:** Per-tenant widget config UI (brand picker, logo, greeting override) — kısmen bu sprint'te kapatılıyor (brand+logo) ama "greeting override" + advanced config B32
- **Sprint B34:** WP plugin admin UI 2-section layout — bu sprint'te kapatılıyor (Section A + B); B34 sadece doc reference olarak kalır
- **Sprint B35:** Plugin version comparison patron-vs-current (staleness check)
- **Sub-project 3:** Platform Cron Ops dashboard (`/internal/*` route'lar)
- **Sub-project 4:** Translation cost band + per-tenant coverage (Mod 10)

## 9. Implementation order

7 commit sıralı:

1. **C1** — `query-keys.ts` `public` namespace + `useWpPluginVersion` hook + MSW handler
2. **C2** — `WebChatTab` shell component (sadece kabuk, slug readonly placeholder) + `company-detail-page.tsx` integration (12. tab)
3. **C3** — `WebChatConfigCard` (brand color + logo URL form, wire `useUpdateCompany`)
4. **C4** — `agent-settings-card.tsx`'tan brand color + logo URL form fields'ı SİL (migration tamamla)
5. **C5** — `WpPluginSection` (download anchor + install steps + version display)
6. **C6** — `UniversalEmbedSection` (3-tab snippet + copy)
7. **C7** — `SettingsPage` Web Channel section + cross-link banner + final tsc/build verify

**Migration safety order (C3 → C4):** Yeni WebChatConfigCard fonctionel olduktan sonra agent-settings-card'tan sil. İki commit aralığında brand/logo iki yerde olur (geçici), C4'ten sonra tek yerde. Kullanıcıya rahatsızlık vermiyor (her iki form da aynı PATCH endpoint'i).

Acceptance: tsc 0 error, vite build green, 7-step browser smoke pass.

## 10. References

- Backend docs:
  - `23-webchat-publicchat.md` §11 (Admin UI gereksinimleri tablo)
  - `26-wp-plugin.md` §8 (Admin UI 2-section layout)
  - `05b-visitor-session-stats.md` UYARI (super-admin mirror Sprint B17)
- Existing patterns:
  - Tabs pattern: `src/features/companies/pages/company-detail-page.tsx`
  - Settings navigation: `src/features/settings/pages/settings-page.tsx:218-271`
  - Form state useState: `src/features/companies/components/agent-settings-card.tsx`
  - Sub-1 brand/logo wire: commit `fa83329`
