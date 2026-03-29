# Subscription Status & Billing Events Spec

Backend dokumanina (`docs/frontend-admin/01-companies.md`) gore sirket abonelik durumu yonetimi ve fatura olay gecmisi.

---

## 1. Yeni Tipler

**Dosya:** `src/features/companies/types.ts`

```typescript
export type SubscriptionStatus = 'trialing' | 'active' | 'suspended' | 'cancelled' | 'past_due'

// Company tipine eklenmeli:
// subscriptionStatus: SubscriptionStatus
// statusChangedAt: string | null

export interface UpdateCompanyStatusRequest {
  status: 'active' | 'suspended' | 'cancelled'
}

export interface UpdateCompanyStatusResponse {
  id: string
  subscriptionStatus: SubscriptionStatus
  statusChangedAt: string
}

export interface BillingEvent {
  id: string
  companyId: string
  eventType: 'status_change' | 'plan_upgrade' | 'plan_downgrade_scheduled' | 'plan_downgrade_executed' | 'plan_removed' | 'plan_downgrade_cancelled' | 'admin_override'
  metadata: Record<string, string>
  actorId: string
  createdAt: string
}
```

## 2. Company Tipi Genisletme

Mevcut Company interface'ine 2 alan eklenmeli:
```typescript
subscriptionStatus: SubscriptionStatus
statusChangedAt: string | null
```

## 3. Query Keys

```typescript
companies: {
  // ... mevcut
  billingEvents: (id: string) => ['companies', id, 'billing-events'] as const,
}
```

## 4. Hooks

**Dosya:** `src/features/companies/hooks/use-company-billing.ts`

```typescript
useUpdateCompanyStatus(companyId)   // PATCH /platform/companies/:id/status
useCompanyBillingEvents(companyId)  // GET /platform/companies/:id/billing-events
```

## 5. Mock Data

- mockCompanies'e `subscriptionStatus` ve `statusChangedAt` ekle
- mockBillingEvents: her sirket icin ornek olaylar

## 6. MSW Handlers

- `PATCH /platform/companies/:id/status` — status guncelle, billing event olustur
- `GET /platform/companies/:id/billing-events` — olay listesi (limit destegi)

## 7. UI — Plan Tab'ina Entegrasyon

Mevcut plan-tab.tsx'e 2 yeni section eklenir:

### Abonelik Durumu
- Mevcut durum badge (trialing=mavi, active=yesil, suspended=sari, cancelled=kirmizi, past_due=turuncu)
- Durum degistirme: Select (active/suspended/cancelled) + "Uygula" butonu
- Onay dialog: "Bu firma {status} durumuna gecilecek. Suspended/cancelled firmalarin API erisimi engellenir."

### Fatura Olay Gecmisi
- Timeline/tablo: eventType badge, metadata ozeti, actorId, tarih
- Son 50 olay (varsayilan limit)
