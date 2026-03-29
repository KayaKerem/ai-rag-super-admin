# Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Super admin paneline email şablon yönetimi eklemek — listeleme, düzenleme, önizleme.

**Architecture:** Yeni `email-templates` feature modülü. Types → mock data → MSW handlers → hooks → UI bileşenleri → routing sırası. Mevcut codebase pattern'leri korunuyor (TanStack Query, MSW, shadcn/ui).

**Tech Stack:** React 19, TypeScript, TanStack Query, TanStack Table, MSW 2, shadcn/ui, Tailwind CSS, lucide-react

---

### Task 1: Types ve Query Keys

**Files:**
- Modify: `src/features/companies/types.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: EmailTemplate tiplerini ekle**

`src/features/companies/types.ts` — dosyanın sonuna ekle:

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

- [ ] **Step 2: Query keys ekle**

`src/lib/query-keys.ts` — `platform` objesine ekle:

```typescript
emailTemplates: ['platform', 'email-templates'] as const,
emailTemplate: (slug: string) => ['platform', 'email-templates', slug] as const,
```

- [ ] **Step 3: Commit**

```bash
git add src/features/companies/types.ts src/lib/query-keys.ts
git commit -m "feat: add email template types and query keys"
```

---

### Task 2: Mock Data

**Files:**
- Modify: `src/mocks/data.ts`

- [ ] **Step 1: mockEmailTemplates dizisini ekle**

`src/mocks/data.ts` — dosyanın sonuna (`mockRevenue`'dan sonra) ekle:

```typescript
// Email templates
export const mockEmailTemplates: any[] = [
  {
    id: 'et-1', slug: 'welcome', name: 'Hoş Geldiniz',
    subject: '{{companyName}} - Hoş Geldiniz!',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>{{companyName}} ailesine hoş geldiniz!</p><p><a href="{{loginUrl}}">Giriş yapın</a></p><p>Deneme süreniz {{trialEndDate}} tarihinde sona erecektir. Planınız: {{planName}}</p>',
    availableVariables: ['userName', 'companyName', 'loginUrl', 'trialEndDate', 'planName'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'et-2', slug: 'trial_ending', name: 'Deneme Süresi Bitiyor',
    subject: '{{companyName}} - Deneme süreniz {{daysRemaining}} gün sonra bitiyor',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} deneme sürenizin bitmesine {{daysRemaining}} gün kaldı.</p><p>Deneme bitiş: {{trialEndDate}}</p><p><a href="{{upgradeUrl}}">Planınızı yükseltin</a></p>',
    availableVariables: ['companyName', 'adminName', 'daysRemaining', 'trialEndDate', 'upgradeUrl'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-3', slug: 'trial_ended', name: 'Deneme Süresi Doldu',
    subject: '{{companyName}} - Deneme süreniz sona erdi',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} deneme süreniz sona erdi.</p><p><a href="{{upgradeUrl}}">Plan seçin</a></p>',
    availableVariables: ['companyName', 'adminName', 'upgradeUrl'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-4', slug: 'plan_upgraded', name: 'Plan Yükseltildi',
    subject: '{{companyName}} - Planınız yükseltildi!',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{oldPlanName}} → {{newPlanName}} olarak yükseltildi.</p>{{#if prorateTry}}<p>Kıst hesap: {{prorateTry}} TL</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'oldPlanName', 'newPlanName', 'prorateTry'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-5', slug: 'plan_downgrade_scheduled', name: 'Plan Düşürme Planlandı',
    subject: '{{companyName}} - Plan değişikliği planlandı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{currentPlanName}} → {{newPlanName}} olarak {{effectiveDate}} tarihinde değişecektir.</p>',
    availableVariables: ['companyName', 'adminName', 'currentPlanName', 'newPlanName', 'effectiveDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-6', slug: 'downgrade_executed', name: 'Plan Düşürme Uygulandı',
    subject: '{{companyName}} - Plan değişikliği uygulandı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} planınız {{oldPlanName}} → {{newPlanName}} olarak değiştirildi.</p>{{#if changedFeatures}}<p>Değişen özellikler: {{changedFeatures}}</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'oldPlanName', 'newPlanName', 'changedFeatures'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-7', slug: 'quota_warning', name: 'Kota Uyarısı',
    subject: '{{companyName}} - AI bütçenizin %{{usagePercent}} kullanıldı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} AI bütçenizin %{{usagePercent}} oranında kullanıldı.</p><p>Kota sıfırlama: {{resetDate}}</p>',
    availableVariables: ['companyName', 'adminName', 'usagePercent', 'resetDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-8', slug: 'quota_exhausted', name: 'Kota Doldu',
    subject: '{{companyName}} - AI bütçeniz tükendi',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} AI bütçeniz tamamen kullanıldı.</p><p>Kota sıfırlama: {{resetDate}}</p>',
    availableVariables: ['companyName', 'adminName', 'resetDate'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-9', slug: 'user_invite', name: 'Kullanıcı Daveti',
    subject: '{{companyName}} - Davet edildiniz!',
    bodyHtml: '<h2>Merhaba!</h2><p>{{inviterName}} sizi {{companyName}} ekibine {{role}} olarak davet etti.</p><p><a href="{{acceptUrl}}">Daveti kabul edin</a></p><p>Bu davet {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['companyName', 'inviterName', 'role', 'acceptUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'et-10', slug: 'password_reset', name: 'Şifre Sıfırlama',
    subject: 'Şifre sıfırlama talebi',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın.</p><p><a href="{{resetUrl}}">Şifremi sıfırla</a></p><p>Bu bağlantı {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['userName', 'resetUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-11', slug: 'email_verification', name: 'Email Doğrulama',
    subject: 'Email adresinizi doğrulayın',
    bodyHtml: '<h2>Merhaba {{userName}}</h2><p>Email adresinizi doğrulamak için:</p><p><a href="{{verificationUrl}}">Email adresimi doğrula</a></p><p>Bu bağlantı {{expiresIn}} geçerlidir.</p>',
    availableVariables: ['userName', 'verificationUrl', 'expiresIn'],
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-12', slug: 'payment_succeeded', name: 'Ödeme Başarılı',
    subject: '{{companyName}} - Ödemeniz alındı',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için {{amount}} {{currency}} tutarında ödemeniz başarıyla alındı.</p>{{#if invoiceUrl}}<p><a href="{{invoiceUrl}}">Faturayı görüntüle</a></p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'amount', 'currency', 'invoiceUrl'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-13', slug: 'payment_failed', name: 'Ödeme Başarısız',
    subject: '{{companyName}} - Ödemeniz başarısız oldu',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için ödemeniz başarısız oldu.</p><p><a href="{{retryUrl}}">Ödeme bilgilerini güncelleyin</a></p>{{#if nextAttemptDate}}<p>Sonraki deneme: {{nextAttemptDate}}</p>{{/if}}',
    availableVariables: ['companyName', 'adminName', 'retryUrl', 'nextAttemptDate'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-14', slug: 'invoice_sent', name: 'Fatura Gönderildi',
    subject: '{{companyName}} - Fatura #{{invoiceNumber}}',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{companyName}} için {{amount}} {{currency}} tutarında faturanız hazırlandı.</p><p><a href="{{downloadUrl}}">Faturayı indir</a></p>',
    availableVariables: ['companyName', 'adminName', 'invoiceNumber', 'amount', 'currency', 'downloadUrl'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'et-15', slug: 'user_joined', name: 'Yeni Üye Katıldı',
    subject: '{{companyName}} - Yeni üye: {{newUserName}}',
    bodyHtml: '<h2>Merhaba {{adminName}}</h2><p>{{newUserName}} ({{newUserEmail}}) {{companyName}} ekibine {{newUserRole}} olarak katıldı.</p>',
    availableVariables: ['companyName', 'adminName', 'newUserName', 'newUserEmail', 'newUserRole'],
    isActive: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/mocks/data.ts
git commit -m "feat: add email templates mock data (15 templates)"
```

---

### Task 3: MSW Handlers

**Files:**
- Modify: `src/mocks/handlers.ts`

- [ ] **Step 1: Import ekle**

`src/mocks/handlers.ts` — import'a ekle:

```typescript
import {
  // ... mevcut importlar
  mockEmailTemplates,
} from './data'
```

- [ ] **Step 2: 4 handler ekle**

handlers dizisinin sonuna (kapanış `]`'den önce):

```typescript
// ─── Email Templates ─────────────────────────────
http.get(`${BASE}/platform/email-templates`, async () => {
  await delay(200)
  const sorted = [...mockEmailTemplates].sort((a, b) => a.slug.localeCompare(b.slug))
  return HttpResponse.json(sorted)
}),

http.get(`${BASE}/platform/email-templates/:slug`, async ({ params }) => {
  await delay(150)
  const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
  if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
  return HttpResponse.json(template)
}),

http.patch(`${BASE}/platform/email-templates/:slug`, async ({ params, request }) => {
  await delay(300)
  const body = (await request.json()) as any
  const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
  if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
  if (body.subject !== undefined) template.subject = body.subject
  if (body.bodyHtml !== undefined) template.bodyHtml = body.bodyHtml
  if (body.isActive !== undefined) template.isActive = body.isActive
  template.updatedAt = new Date().toISOString()
  return HttpResponse.json(template)
}),

http.post(`${BASE}/platform/email-templates/:slug/preview`, async ({ params, request }) => {
  await delay(200)
  const body = (await request.json()) as any
  const template = mockEmailTemplates.find((t: any) => t.slug === params.slug)
  if (!template) return HttpResponse.json({ message: 'Template not found' }, { status: 404 })
  const vars = body.variables ?? {}
  let subject = template.subject as string
  let html = template.bodyHtml as string
  // Simple {{variable}} replacement (no Handlebars engine needed for mock)
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(re, value as string)
    html = html.replace(re, value as string)
  }
  // Strip unresolved {{#if}}/{{/if}}/{{#unless}}/{{/unless}} blocks for clean preview
  html = html.replace(/\{\{#(?:if|unless)\s+\w+\}\}/g, '').replace(/\{\{\/(?:if|unless)\}\}/g, '')
  // Strip remaining unresolved {{variables}}
  subject = subject.replace(/\{\{[^}]+\}\}/g, '')
  html = html.replace(/\{\{[^}]+\}\}/g, '')
  return HttpResponse.json({ subject, html })
}),
```

- [ ] **Step 3: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/mocks/handlers.ts
git commit -m "feat: add MSW handlers for email templates CRUD and preview"
```

---

### Task 4: Hooks

**Files:**
- Create: `src/features/email-templates/hooks/use-email-templates.ts`

- [ ] **Step 1: Hook dosyasını oluştur**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { EmailTemplate, UpdateEmailTemplateRequest, EmailPreviewResponse } from '@/features/companies/types'

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.platform.emailTemplates,
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data } = await apiClient.get('/platform/email-templates')
      return data
    },
  })
}

export function useEmailTemplate(slug: string) {
  return useQuery({
    queryKey: queryKeys.platform.emailTemplate(slug),
    queryFn: async (): Promise<EmailTemplate> => {
      const { data } = await apiClient.get(`/platform/email-templates/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function useUpdateEmailTemplate(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateEmailTemplateRequest): Promise<EmailTemplate> => {
      const { data } = await apiClient.patch(`/platform/email-templates/${slug}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.emailTemplates })
      qc.invalidateQueries({ queryKey: queryKeys.platform.emailTemplate(slug) })
    },
  })
}

export function usePreviewEmailTemplate(slug: string) {
  return useMutation({
    mutationFn: async (variables: Record<string, string>): Promise<EmailPreviewResponse> => {
      const { data } = await apiClient.post(`/platform/email-templates/${slug}/preview`, { variables })
      return data
    },
  })
}
```

- [ ] **Step 2: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/features/email-templates/hooks/use-email-templates.ts
git commit -m "feat: add email template hooks (list, detail, update, preview)"
```

---

### Task 5: EmailTemplateTable bileşeni

**Files:**
- Create: `src/features/email-templates/components/email-template-table.tsx`

- [ ] **Step 1: Tablo bileşenini oluştur**

```tsx
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import type { EmailTemplate } from '@/features/companies/types'

const columns: ColumnDef<EmailTemplate>[] = [
  {
    accessorKey: 'name',
    header: 'Şablon Adı',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('slug')}</Badge>,
  },
  {
    accessorKey: 'subject',
    header: 'Konu',
    cell: ({ row }) => {
      const subject = row.getValue('subject') as string
      return <span className="text-muted-foreground">{subject.length > 60 ? subject.slice(0, 60) + '…' : subject}</span>
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Durum',
    cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'default' : 'secondary'}>
        {row.getValue('isActive') ? 'Aktif' : 'Pasif'}
      </Badge>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Son Güncelleme',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('updatedAt'))}</span>,
  },
]

interface EmailTemplateTableProps {
  data: EmailTemplate[]
  isLoading: boolean
  onSelect: (template: EmailTemplate) => void
}

export function EmailTemplateTable({ data, isLoading, onSelect }: EmailTemplateTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Ara..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Yükleniyor...</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Şablon bulunamadı.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/email-templates/components/email-template-table.tsx
git commit -m "feat: add email template table component"
```

---

### Task 6: EmailPreview bileşeni

**Files:**
- Create: `src/features/email-templates/components/email-preview.tsx`

- [ ] **Step 1: Preview bileşenini oluştur**

```tsx
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { usePreviewEmailTemplate } from '../hooks/use-email-templates'

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

interface EmailPreviewProps {
  slug: string
  availableVariables: string[]
}

export function EmailPreview({ slug, availableVariables }: EmailPreviewProps) {
  const preview = usePreviewEmailTemplate(slug)

  function handlePreview() {
    const vars: Record<string, string> = {}
    for (const v of availableVariables) {
      vars[v] = sampleVariables[v] ?? v
    }
    preview.mutate(vars)
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={preview.isPending}>
        <Eye className="mr-1 h-4 w-4" />
        {preview.isPending ? 'Yükleniyor...' : 'Önizle'}
      </Button>

      {preview.data && (
        <div className="space-y-2 rounded-lg border p-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Konu: </span>
            <span className="text-sm">{preview.data.subject}</span>
          </div>
          <iframe
            sandbox=""
            srcDoc={preview.data.html}
            className="w-full rounded border bg-white"
            style={{ minHeight: 200 }}
            title="Email önizleme"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/email-templates/components/email-preview.tsx
git commit -m "feat: add email preview component with sandboxed iframe"
```

---

### Task 7: EmailTemplateEditDialog bileşeni

**Files:**
- Create: `src/features/email-templates/components/email-template-edit-dialog.tsx`

- [ ] **Step 1: Edit dialog bileşenini oluştur**

```tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUpdateEmailTemplate } from '../hooks/use-email-templates'
import { EmailPreview } from './email-preview'
import type { EmailTemplate } from '@/features/companies/types'

interface EmailTemplateEditDialogProps {
  template: EmailTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailTemplateEditDialog({ template, open, onOpenChange }: EmailTemplateEditDialogProps) {
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [isActive, setIsActive] = useState(true)
  const updateTemplate = useUpdateEmailTemplate(template?.slug ?? '')

  useEffect(() => {
    if (template) {
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
      setIsActive(template.isActive)
    }
  }, [template])

  function handleSave() {
    if (!template) return
    updateTemplate.mutate(
      { subject, bodyHtml, isActive },
      {
        onSuccess: () => {
          toast.success('Şablon güncellendi')
          onOpenChange(false)
        },
        onError: () => toast.error('Güncelleme başarısız'),
      }
    )
  }

  function handleCopyVariable(variable: string) {
    navigator.clipboard.writeText(`{{${variable}}}`)
    toast.success(`{{${variable}}} kopyalandı`)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <Badge variant="outline">{template.slug}</Badge>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <Label>Konu</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={500} />
          </div>

          {/* Body HTML */}
          <div>
            <Label>Body HTML</Label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ minHeight: 300 }}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Label>Aktif</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Available variables */}
          <div>
            <Label className="mb-2 block">Kullanılabilir Değişkenler</Label>
            <div className="flex flex-wrap gap-1.5">
              {template.availableVariables.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCopyVariable(v)}
                >
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Değişkene tıklayarak kopyalayın</p>
          </div>

          {/* Preview */}
          <EmailPreview slug={template.slug} availableVariables={template.availableVariables} />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/features/email-templates/components/email-template-edit-dialog.tsx
git commit -m "feat: add email template edit dialog with variable badges and preview"
```

---

### Task 8: EmailTemplatesPage + Routing + Sidebar

**Files:**
- Create: `src/features/email-templates/pages/email-templates-page.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Sayfa bileşenini oluştur**

```tsx
import { useState } from 'react'
import { useEmailTemplates } from '../hooks/use-email-templates'
import { EmailTemplateTable } from '../components/email-template-table'
import { EmailTemplateEditDialog } from '../components/email-template-edit-dialog'
import type { EmailTemplate } from '@/features/companies/types'

export function EmailTemplatesPage() {
  const { data: templates, isLoading } = useEmailTemplates()
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleSelect(template: EmailTemplate) {
    setSelected(template)
    setDialogOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Email Şablonları</h1>
        <p className="text-sm text-muted-foreground">{templates?.length ?? 0} şablon</p>
      </div>

      <EmailTemplateTable
        data={templates ?? []}
        isLoading={isLoading}
        onSelect={handleSelect}
      />

      <EmailTemplateEditDialog
        template={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
```

- [ ] **Step 2: App.tsx'e route ekle**

Import:
```typescript
import { EmailTemplatesPage } from '@/features/email-templates/pages/email-templates-page'
```

`<Route element={<AppLayout />}>` bloğu içine, settings route'undan sonra:
```tsx
<Route path="/email-templates" element={<EmailTemplatesPage />} />
```

- [ ] **Step 3: Sidebar'a nav item ekle**

`src/components/layout/sidebar.tsx` — import'a `Mail` ekle:
```typescript
import { LayoutDashboard, Building2, Settings, LogOut, Mail } from 'lucide-react'
```

navItems dizisine Settings'ten sonra:
```typescript
{ to: '/email-templates', icon: Mail, label: 'Email Şablonları' },
```

- [ ] **Step 4: Build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/features/email-templates/pages/email-templates-page.tsx src/App.tsx src/components/layout/sidebar.tsx
git commit -m "feat: add email templates page with routing and sidebar nav"
```

---

### Task 9: Build Doğrulama & Final Kontrol

**Files:** Kontrol only

- [ ] **Step 1: TypeScript build kontrol**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx tsc --noEmit`

Hata varsa düzelt.

- [ ] **Step 2: Vite build**

Run: `cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin && npx vite build 2>&1 | tail -10`

- [ ] **Step 3: Commit'leri teyit**

```bash
git log --oneline -10
```

8 commit bekleniyor:
1. Types ve query keys
2. Mock data (15 şablon)
3. MSW handlers (list, detail, update, preview)
4. Hooks (4 hook)
5. EmailTemplateTable bileşeni
6. EmailPreview bileşeni
7. EmailTemplateEditDialog bileşeni
8. Page + routing + sidebar

- [ ] **Step 4: Varsa build fix commit**

```bash
git add -A
git commit -m "fix: resolve build errors from email templates feature"
```
