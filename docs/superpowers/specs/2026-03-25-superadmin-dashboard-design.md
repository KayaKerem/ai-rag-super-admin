# Superadmin Dashboard — Design Spec

## Overview

Platform yönetim paneli (superadmin dashboard) — şirket CRUD, config yönetimi, kullanıcı yönetimi ve usage/maliyet takibi için SPA frontend uygulaması. Backend API'leri hazır ve çalışır durumda.

## Tech Stack

| Katman | Seçim | Sebep |
|--------|-------|-------|
| Framework | Vite + React (SPA) | SSR gereksiz, admin paneli, hızlı dev |
| UI | shadcn/ui | Modern component library, dark mode, Tailwind |
| State / Data | TanStack Query | Server state, cache, auto-refetch |
| Routing | React Router v6 | Client-side, file-based olmayan SPA routing |
| Charts | Recharts (shadcn chart) | shadcn entegrasyonu hazır |
| Tables | TanStack Table (shadcn DataTable) | Sorting, filtering, pagination |
| Forms | React Hook Form + Zod | shadcn form entegrasyonu hazır |
| Tema | Dark mode only | Vercel/GitHub tarzı |
| Package Manager | pnpm | Kullanıcı tercihi |

## API Connection

- Base URL: `.env` dosyasından `VITE_API_URL`
- Auth: `Authorization: Bearer <jwt_token>` header
- Token storage: localStorage
- Tüm `/platform/*` endpoint'leri JWT + isPlatformAdmin kontrolü gerektirir

## Proje Yapısı (Feature-based)

```
src/
  features/
    auth/
      components/       → LoginForm
      hooks/            → useAuth, useLogin
      pages/            → LoginPage
      types.ts
    dashboard/
      components/       → KpiCard, CostTrendChart, CategoryBreakdown
      hooks/            → usePlatformSummary
      pages/            → DashboardPage
    companies/
      components/       → CompanyTable, CompanyHeader, UsageTab, ConfigTab, UsersTab
                          ConfigAccordion, InviteDialog, CsvImportDialog, UsageChart
      hooks/            → useCompanies, useCompany, useCompanyConfig, useCompanyUsers, useCompanyUsage
      pages/            → CompaniesPage, CompanyDetailPage
      types.ts
    settings/
      components/       → SettingsNav, ConfigSection, PricingForm
      hooks/            → usePlatformDefaults
      pages/            → SettingsPage
      types.ts
  components/
    ui/                 → shadcn components
    layout/             → AppLayout, Sidebar, AuthGuard
  lib/
    api-client.ts       → axios/fetch wrapper, auth interceptor
    query-keys.ts       → TanStack Query key factory
    utils.ts            → formatCurrency, formatBytes, formatNumber
    validations.ts      → Zod schemas (config blokları)
  hooks/
    use-auth-guard.ts
  App.tsx
  main.tsx
  index.css             → Tailwind + shadcn theme (dark only)
```

## Sayfa Yapısı & Routing

| Route | Sayfa | Auth |
|-------|-------|------|
| `/login` | Login | Public |
| `/` | Dashboard | Protected |
| `/companies` | Şirket Listesi | Protected |
| `/companies/:id` | Şirket Detay (3 tab) | Protected |
| `/settings` | Platform Ayarları | Protected |

## Layout

- **Collapsed sidebar (icon-only):** Vercel tarzı, sol tarafta 56px dar sidebar
- Icon'lar: Dashboard (grid), Companies (building), Settings (gear), Logout
- Hover'da tooltip ile sayfa adı
- Aktif sayfa vurgulanır (mor arka plan)
- Sağda tam genişlik content alanı

## Sayfa Tasarımları

### 1. Login (`/login`)

- Ortalanmış, minimal form — logo + "Super Admin" başlığı
- Email + Şifre alanları
- `POST /auth/login` → JWT token → localStorage
- Response'da `isPlatformAdmin: false` ise hata: "Bu hesap platform admin yetkisine sahip değil"
- Başarılı girişte `/` dashboard'a redirect
- AuthGuard: token yoksa veya expire olduysa `/login`'e redirect

### 2. Dashboard (`/`)

- **4 KPI kartı:** Toplam Şirket, Toplam Maliyet, AI Token (formatlanmış), Storage (GB)
- **Aylık maliyet trend chart:** Bar chart, son N ay
- **Kategori dağılımı:** AI, CDN, Storage, Trigger progress bar'ları (renk kodlu)
- Veri: `GET /platform/usage/summary?months=6`
- Period seçici (dropdown): "Bu Ay", "Son 3 Ay", "Son 6 Ay", "Son 12 Ay"

### 3. Şirket Listesi (`/companies`)

- **Header:** Arama kutusu + "Yeni Şirket" butonu
- **Tablo kolonları:** Şirket Adı (avatar + isim), Oluşturulma, AI ($), CDN ($), Storage ($), Trigger ($), Toplam ($)
- Her maliyet kolonu kendi rengiyle: AI (mor #a78bfa), CDN (mavi #3b82f6), Storage (yeşil #22c55e), Trigger (sarı #f59e0b)
- Tüm kolonlar sortable
- Satıra tıklayınca `/companies/:id`'ye navigate
- Pagination
- Veri: `GET /platform/companies` + her şirket için `GET /platform/companies/:id/usage/current`
- "Yeni Şirket" → Dialog: şirket adı input → `POST /platform/companies`

### 4. Şirket Detay (`/companies/:id`)

**Header:**
- Şirket avatar (initials) + isim + ID (kısaltılmış) + oluşturulma tarihi
- Düzenle butonu → inline edit veya dialog
- Sil butonu → confirmation dialog → `DELETE /platform/companies/:id`

**Tab: Kullanım**
- 4 KPI kartı: AI, CDN, Storage, Trigger — her biri maliyet + ham metrik (token, GB, task count)
- Stacked bar chart: aylık trend, kategori bazlı (renk kodlu legend)
- Period seçici dropdown
- Veri: `GET /platform/companies/:id/usage?months=N`

**Tab: Konfigürasyon**
- Bilgi banner: "Boş bırakılan alanlar platform defaults'tan miras alınır"
- 9 accordion bloğu: AI, S3, CDN, Mail, Embedding, Langfuse, Trigger, Limits, Pricing
- Her bloğun badge'i: "Configured" (yeşil) veya "Defaults" (gri)
- Açılan blokta form alanları (React Hook Form + Zod validation)
- Maskeli alanlar (API key vb.) gri italic — gönderilmezse mevcut değer korunur
- Her blok kendi "Kaydet" butonu → `PUT /platform/companies/:id/config` (partial merge)
- Veri: `GET /platform/companies/:id/config`

**Tab: Kullanıcılar**
- Header: kullanıcı sayısı + "CSV Import" + "Davet Et" butonları
- Tablo: Avatar (circle), İsim, Email, Rol (badge: owner sarı, admin mor, member gri), Katılma tarihi, ⋯ menüsü
- ⋯ menüsü: Rol değiştir (dropdown), Deaktif et (confirmation)
- "Davet Et" → Dialog: email + rol select → `POST /platform/companies/:id/users/invite`
- "CSV Import" → File upload dialog → `POST /platform/companies/:id/users/bulk-import` (multipart)
- Veri: `GET /platform/companies/:id/users`

### 5. Platform Ayarları (`/settings`)

- **Sol navigasyon:** Pricing (öne çıkarılmış), AI Config, S3, CDN, Mail, Embedding, Langfuse, Trigger, Limits
- **Sağ content:** Aktif section'ın formu
- Şirket config ile aynı form alanları ama platform-wide scope
- Pricing özellikle vurgulanmış: S3 ($/GB/ay), CDN ($/GB transfer), Trigger ($/task)
- Her section kendi "Kaydet" butonu → `PUT /platform/config/defaults`
- Veri: `GET /platform/config/defaults`

## Format Kuralları

| Veri Tipi | Format | Örnek |
|-----------|--------|-------|
| Para | `$X.XX` | `$14.47` |
| Byte → GB | `bytes / 1e9`, `X.XX GB` | `5.00 GB` |
| Token | Binlik separator | `1,250,000` |
| Tarih | Türkçe kısa | `15 Oca 2026` |

## Renk Paleti (Kategori)

| Kategori | Renk | Hex |
|----------|------|-----|
| AI | Mor | `#a78bfa` / `#6d28d9` |
| CDN | Mavi | `#3b82f6` / `#60a5fa` |
| Storage | Yeşil | `#22c55e` / `#4ade80` |
| Trigger | Sarı | `#f59e0b` / `#f59e0b` |

## Hata Yönetimi

| Hata Kodu | UI Davranışı |
|-----------|-------------|
| `platform_admin_required` | Login'e redirect + toast |
| `company_not_found` | 404 sayfası veya companies listesine redirect |
| `user_not_found` | Toast hata mesajı |
| `email_already_registered` | Form field hatası |
| `invalid_role` | Form field hatası |
| `file_required` | CSV import dialog'da hata |
| 401 (token expired) | Login'e redirect |
| Network error | Toast: "Bağlantı hatası" |

## Auth Akışı

1. Kullanıcı `/login`'e gelir
2. Email + şifre → `POST /auth/login`
3. Response: JWT token + user bilgisi
4. `isPlatformAdmin: true` kontrolü — false ise hata göster
5. Token localStorage'a kaydedilir
6. API client her request'e `Authorization: Bearer <token>` ekler
7. 401 response gelirse token temizle → `/login`'e redirect
8. AuthGuard: token yoksa protected route'lara erişim engeli

## API Endpoint Özeti

| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | `/auth/login` | POST |
| Companies list | `/platform/companies` | GET |
| Company create | `/platform/companies` | POST |
| Company detail | `/platform/companies/:id` | GET |
| Company update | `/platform/companies/:id` | PATCH |
| Company delete | `/platform/companies/:id` | DELETE |
| Company config | `/platform/companies/:id/config` | GET |
| Company config update | `/platform/companies/:id/config` | PUT |
| Company users | `/platform/companies/:id/users` | GET |
| User invite | `/platform/companies/:id/users/invite` | POST |
| User update | `/platform/companies/:id/users/:userId` | PATCH |
| User deactivate | `/platform/companies/:id/users/:userId` | DELETE |
| Bulk import | `/platform/companies/:id/users/bulk-import` | POST |
| Company usage | `/platform/companies/:id/usage` | GET |
| Company usage current | `/platform/companies/:id/usage/current` | GET |
| Platform summary | `/platform/usage/summary` | GET |
| Platform defaults | `/platform/config/defaults` | GET |
| Platform defaults update | `/platform/config/defaults` | PUT |
