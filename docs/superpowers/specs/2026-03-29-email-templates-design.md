# Email Sablonlari Yonetimi Spec

Backend dokumanina (`docs/frontend-admin/09-email-templates.md`) gore super admin paneline email sablon yonetimi eklenmesi.

---

## 1. Sayfa Yapisi

**Route:** `/email-templates`
**Sidebar:** Yeni nav item — Mail ikonu, Settings'in altinda
**Guard:** AuthGuard (mevcut yapi)

---

## 2. Yeni Tipler

**Dosya:** `src/features/companies/types.ts`

```typescript
// ─── Email Templates ──────────────────────────────

export interface EmailTemplate {
  id: string
  slug: string
  name: string
  subject: string
  bodyHtml: string
  availableVariables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateEmailTemplateRequest {
  subject?: string
  bodyHtml?: string
  isActive?: boolean
}

export interface EmailPreviewRequest {
  variables: Record<string, string>
}

export interface EmailPreviewResponse {
  subject: string
  html: string
}
```

---

## 3. Query Keys

**Dosya:** `src/lib/query-keys.ts`

```typescript
platform: {
  // ... mevcut
  emailTemplates: ['platform', 'email-templates'] as const,
  emailTemplate: (slug: string) => ['platform', 'email-templates', slug] as const,
}
```

---

## 4. Hooks

**Yeni dosya:** `src/features/email-templates/hooks/use-email-templates.ts`

```typescript
useEmailTemplates()                    // GET /platform/email-templates
useEmailTemplate(slug: string)         // GET /platform/email-templates/:slug
useUpdateEmailTemplate(slug: string)   // PATCH /platform/email-templates/:slug
usePreviewEmailTemplate(slug: string)  // POST /platform/email-templates/:slug/preview
```

- `usePreviewEmailTemplate` bir mutation hook olacak (her preview isteginde farkli variables gonderilir)
- Update sonrasi `emailTemplates` ve `emailTemplate(slug)` query'leri invalidate edilecek

---

## 5. Mock Data

**Dosya:** `src/mocks/data.ts`

15 sablon icin mock data. Her sablon:
- `id`, `slug`, `name`, `subject`, `bodyHtml` (basit Handlebars HTML)
- `availableVariables` (dokumandaki degisken listesinden)
- `isActive` (cogu true, payment_succeeded/payment_failed/invoice_sent/user_joined false)
- `createdAt`, `updatedAt`

Ornekler:
```typescript
{ slug: 'welcome', name: 'Hoş Geldiniz', subject: '{{companyName}} - Hoş Geldiniz!', bodyHtml: '<h2>Merhaba {{userName}}</h2><p>{{companyName}} ailesine hoş geldiniz...</p>', availableVariables: ['userName', 'companyName', 'loginUrl', 'trialEndDate', 'planName'], isActive: true }
{ slug: 'user_invite', name: 'Kullanıcı Daveti', subject: '{{companyName}} - Davet', bodyHtml: '<h2>Merhaba!</h2><p>{{inviterName}} sizi {{companyName}} ekibine davet etti...</p>', availableVariables: ['companyName', 'inviterName', 'role', 'acceptUrl', 'expiresIn'], isActive: true }
```

---

## 6. MSW Handlers

**Dosya:** `src/mocks/handlers.ts`

4 handler:

- `GET /platform/email-templates` — tum sablonlari dondur (slug'a gore sirali)
- `GET /platform/email-templates/:slug` — tek sablon
- `PATCH /platform/email-templates/:slug` — subject/bodyHtml/isActive guncelle
- `POST /platform/email-templates/:slug/preview` — Handlebars basit replace ile render

Preview handler'i: `bodyHtml` icindeki `{{variable}}` pattern'lerini request body'deki `variables` map'inden replace eder. Tam Handlebars engine gereksiz — basit regex replace yeterli (mock icin `{{#if}}` blokları desteklenmeyecek, sadece `{{variable}}` replace).

---

## 7. Sayfa ve Bilesenler

### 7a. Feature Klasor Yapisi

```
src/features/email-templates/
  pages/
    email-templates-page.tsx
  components/
    email-template-table.tsx
    email-template-edit-dialog.tsx
    email-preview.tsx
  hooks/
    use-email-templates.ts
```

### 7b. EmailTemplatesPage (`/email-templates`)

- Baslik: "Email Şablonları"
- Alt baslik: sablon sayisi
- `EmailTemplateTable` bilesenini render eder

### 7c. EmailTemplateTable

Tablo kolonlari:
| Kolon | Deger | Not |
|-------|-------|----|
| Sablon Adi | `name` | — |
| Slug | `slug` | Badge |
| Konu | `subject` | max 60 karakter, truncated |
| Durum | `isActive` | Badge: Aktif (yesil) / Pasif (gri) |
| Son Guncelleme | `updatedAt` | formatDate |

Satira tiklaninca `EmailTemplateEditDialog` acilir.

Arama (global filter) destegi.

### 7d. EmailTemplateEditDialog

Props: `{ template: EmailTemplate | null, open: boolean, onOpenChange }`

**Form alanlari:**
- **Konu** — Input (text, max 500)
- **Body HTML** — Textarea (monospace font, min-h-[300px], Handlebars HTML yapistirma alani)
- **Aktif** — Switch toggle
- **Kullanilabilir Degiskenler** — read-only Badge listesi (`availableVariables` array'inden). Her badge `{{degisken}}` formatinda gosterilir. Tiklaninca clipboard'a kopyalar (kolaylik).

**Butonlar:**
- "Onizle" — preview endpoint'ini cagirir
- "Kaydet" — PATCH endpoint'i
- "Iptal"

### 7e. EmailPreview

Preview butona basilinca:
1. `availableVariables` icin ornek degerler olusturulur (hardcoded map)
2. `POST /platform/email-templates/:slug/preview` cagirilir
3. Donen `subject` bir text olarak, `html` bir sandboxed iframe icinde gosterilir

**Ornek degisken map'i:**
```typescript
const sampleVariables: Record<string, string> = {
  userName: 'Ali Veli',
  companyName: 'Acme Inc',
  adminName: 'Mehmet Yılmaz',
  loginUrl: 'https://app.example.com/login',
  trialEndDate: '15 Nisan 2026',
  planName: 'Pro',
  upgradeUrl: 'https://app.example.com/upgrade',
  daysRemaining: '7',
  oldPlanName: 'Starter',
  newPlanName: 'Pro',
  currentPlanName: 'Pro',
  effectiveDate: '14 Nisan 2026',
  prorateTry: '124.58',
  changedFeatures: 'AI bütçesi: 25→10 USD, Depolama: 20→5 GB',
  usagePercent: '80',
  resetDate: '1 Nisan 2026',
  inviterName: 'Ayşe Demir',
  role: 'admin',
  acceptUrl: 'https://app.example.com/invite/abc123',
  expiresIn: '7 gün',
  resetUrl: 'https://app.example.com/reset/abc123',
  verificationUrl: 'https://app.example.com/verify/abc123',
  amount: '2.990,00 ₺',
  currency: 'TRY',
  invoiceUrl: 'https://app.example.com/invoice/123',
  retryUrl: 'https://app.example.com/billing',
  nextAttemptDate: '3 Nisan 2026',
  invoiceNumber: 'INV-2026-0042',
  downloadUrl: 'https://app.example.com/invoice/123/download',
  newUserName: 'Yeni Kullanıcı',
  newUserEmail: 'yeni@firma.com',
  newUserRole: 'member',
}
```

Iframe: `<iframe sandbox="" srcDoc={html} />` — sandbox attribute XSS'i onler.

Preview dialog icinde (edit dialog'un altinda) veya ayri bir panel olarak gosterilir.

---

## 8. Router ve Sidebar Guncellemeleri

### App.tsx
```tsx
<Route path="/email-templates" element={<EmailTemplatesPage />} />
```

### Sidebar
Nav items'a Settings'ten sonra:
```typescript
{ to: '/email-templates', icon: Mail, label: 'Email Şablonları' }
```

`Mail` ikonu `lucide-react`'tan import edilir.

---

## 9. Etkilenen Dosyalar Ozeti

| Dosya | Degisiklik |
|-------|-----------|
| `src/features/companies/types.ts` | EmailTemplate, UpdateEmailTemplateRequest, EmailPreviewRequest/Response tipleri |
| `src/lib/query-keys.ts` | emailTemplates, emailTemplate keys |
| `src/mocks/data.ts` | 15 sablon mock data |
| `src/mocks/handlers.ts` | 4 yeni handler |
| `src/features/email-templates/hooks/use-email-templates.ts` | YENi DOSYA — 4 hook |
| `src/features/email-templates/pages/email-templates-page.tsx` | YENi DOSYA — sayfa |
| `src/features/email-templates/components/email-template-table.tsx` | YENi DOSYA — tablo |
| `src/features/email-templates/components/email-template-edit-dialog.tsx` | YENi DOSYA — duzenleme dialog |
| `src/features/email-templates/components/email-preview.tsx` | YENi DOSYA — iframe onizleme |
| `src/App.tsx` | Route ekleme |
| `src/components/layout/sidebar.tsx` | Nav item ekleme |
