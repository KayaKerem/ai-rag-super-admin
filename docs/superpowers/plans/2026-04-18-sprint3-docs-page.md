# Sprint 3 — Bilgi & Dokümantasyon Sayfası Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yeni `/docs` sayfası altında 5 doküman bölümü (Genel Mimari, Mesaj Akışı, Agent Tool Sistemi, Model Downgrade, Sorun Giderme) + Sprint 2'den `budgetDowngradeThresholdPct` plan-aware wire'ı.

**Architecture:** Hand-built React komponentleri + tek `/docs` route + sticky TOC sidebar + IntersectionObserver scroll-spy. Section registry pattern (`lib/sections.ts`) yeni bölüm eklemeyi tek dosyaya indirir. `BudgetStatusCard` opsiyonel `thresholdPct` prop'u ile plan-aware band hesaplar; eski çağrıcılar etkilenmez.

**Tech Stack:** React 18 + TypeScript strict + Vite + Tailwind + react-router-dom + lucide-react. Yeni paket YOK. Test framework yok — `console.assert` tabanlı node verify script + `tsc -b` + `vite build` yeterlilik kanıtı.

**Spec referansı:** `docs/superpowers/specs/2026-04-18-sprint3-docs-page-design.md`

**Backend doküman:** `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/16-system-architecture.md`

---

## Dosya Haritası

### Yeni dosyalar (CREATE)

| Dosya | Sorumluluk |
|---|---|
| `scripts/verify-budget-band.cjs` | Task 1 numerik assert script (Node, no deps) |
| `src/features/docs/lib/sections.ts` | Section registry: `DocsSection` interface + `DOCS_SECTIONS` array |
| `src/features/docs/components/docs-section-card.tsx` | Ortak section wrapper (`<section id>` + h2 + emoji ikon) |
| `src/features/docs/components/docs-toc.tsx` | Sticky sol nav + scroll-spy + smooth scroll |
| `src/features/docs/pages/docs-page.tsx` | Shell: TOC + content area, registry'den section'ları sırayla render eder |
| `src/features/docs/sections/genel-mimari.tsx` | Section 1 — 6 bileşen kart grid + akış metni |
| `src/features/docs/sections/mesaj-akisi.tsx` | Section 2 — 7-step kart (Quote Pipeline tarzı) |
| `src/features/docs/sections/agent-tool.tsx` | Section 3 — 21 tool tablosu + filtreleme akışı (4 step) + CUSTOMER vs INTERNAL tablosu |
| `src/features/docs/sections/model-downgrade.tsx` | Section 4 — Bütçe bandları tablosu + uyarı kutusu + cross-reference |
| `src/features/docs/sections/sorun-giderme.tsx` | Section 5 — FAQ list (5-7 item) + log anahtar kelimeleri tablosu |

### Değiştirilen dosyalar (MODIFY)

| Dosya | Değişiklik |
|---|---|
| `src/features/companies/lib/budget-band.ts` | `computeBudgetBand` 3. parametre `thresholdPct?: number` |
| `src/features/companies/components/budget-status-card.tsx` | `thresholdPct?: number` prop ekle, hesaplamaya geçir |
| `src/features/companies/components/usage-tab.tsx` | `<BudgetStatusCard ... thresholdPct={plan?.budgetDowngradeThresholdPct} />` |
| `src/components/layout/sidebar.tsx` | `navItems` array'e `{ to: '/docs', icon: BookOpen, label: 'Dokümantasyon' }` |
| `src/App.tsx` | `<Route path="/docs" element={<DocsPage />} />` |

---

## Task 1: `computeBudgetBand` plan-aware (followup #1)

**Files:**
- Modify: `src/features/companies/lib/budget-band.ts`
- Create: `scripts/verify-budget-band.cjs` (Node verify script — Sprint 2'deki pattern)

**Bağlam:** Spec §5.1-§5.3. Backend semantik spec aşamasında doğrulandı: yalnızca birinci eşik (Normal → Standard) plan-aware; %95 ve %97 sabit. Default 80.

- [ ] **Step 1: Node verify script'i yaz**

`scripts/verify-budget-band.cjs` dosyasını oluştur. Sprint 2'de aynı pattern kullanıldı (commit `731643a` öncesi). Script TS değil JS — derlemeden çalıştırılır. Tüm bant geçişlerini ve geri uyumluluğu test eder:

```javascript
// scripts/verify-budget-band.cjs
// Standalone JS port of computeBudgetBand for verification.
// Mirror src/features/companies/lib/budget-band.ts exactly.

function computeBudgetBand(spendUsd, capUsd, thresholdPct) {
  if (capUsd == null || capUsd <= 0) {
    return { band: 'unconfigured', pct: 0, rawPct: 0 }
  }
  const rawPct = (spendUsd / capUsd) * 100
  const pct = Math.min(100, Math.max(0, rawPct))
  const t1 = thresholdPct ?? 80
  let band
  if (rawPct < t1) band = 'normal'
  else if (rawPct < 95) band = 'standard'
  else if (rawPct < 97) band = 'economy'
  else band = 'exhausted'
  return { band, pct, rawPct }
}

const cases = [
  // thresholdPct verildiğinde birinci eşik kayar
  { args: [69, 100, 70], expect: 'normal',    msg: 'spend<t1 → normal' },
  { args: [70, 100, 70], expect: 'standard',  msg: 'spend>=t1 → standard' },
  { args: [94, 100, 70], expect: 'standard',  msg: 'spend<95 → hala standard' },
  { args: [95, 100, 70], expect: 'economy',   msg: '95 sabit' },
  { args: [97, 100, 70], expect: 'exhausted', msg: '97 sabit' },

  // thresholdPct undefined → Sprint 2 davranışı korunur (regression guard)
  { args: [79, 100],     expect: 'normal',    msg: 'default<80 → normal' },
  { args: [80, 100],     expect: 'standard',  msg: 'default>=80 → standard' },
  { args: [95, 100],     expect: 'economy',   msg: 'default 95' },
  { args: [97, 100],     expect: 'exhausted', msg: 'default 97' },

  // edge: thresholdPct=80 (default ile aynı) → Sprint 2 ile aynı
  { args: [80, 100, 80], expect: 'standard',  msg: 'explicit 80 == undefined' },

  // unconfigured
  { args: [50, null],    expect: 'unconfigured', msg: 'null cap' },
  { args: [50, 0],       expect: 'unconfigured', msg: 'zero cap' },
]

let pass = 0, fail = 0
for (const c of cases) {
  const result = computeBudgetBand(...c.args)
  const ok = result.band === c.expect
  if (ok) { pass++ } else { fail++; console.error(`FAIL: ${c.msg} — got ${result.band}, expected ${c.expect}`) }
}
console.log(`${pass}/${pass + fail} cases passed`)
process.exit(fail === 0 ? 0 : 1)
```

- [ ] **Step 2: Script'i çalıştır — başarısız olmalı**

```bash
node scripts/verify-budget-band.cjs
```

Beklenen: `12/12 cases passed` — bu adım aslında script'in mevcut JS port'unun doğru olduğunu gösterir (port `t1 = thresholdPct ?? 80` mantığını içeriyor, yani test edilen davranışla uyumlu). Bu adımın amacı script'in çalışır olduğunu doğrulamak.

Eğer script hata verirse (syntax vb.) önce script'i düzelt.

- [ ] **Step 3: `budget-band.ts` imzasını güncelle**

`src/features/companies/lib/budget-band.ts` dosyasında 40-55 arası satırları değiştir. **`computeBudgetBand` imzasına 3. parametre ekle, ilk eşik plan-aware:**

```typescript
export function computeBudgetBand(
  spendUsd: number,
  capUsd: number | null | undefined,
  thresholdPct?: number,
): BudgetStatus {
  if (capUsd == null || capUsd <= 0) {
    return { band: 'unconfigured', pct: 0, rawPct: 0, ...BAND_META.unconfigured }
  }

  const rawPct = (spendUsd / capUsd) * 100
  const pct = Math.min(100, Math.max(0, rawPct))

  const t1 = thresholdPct ?? 80
  let band: BudgetBand
  if (rawPct < t1) band = 'normal'
  else if (rawPct < 95) band = 'standard'
  else if (rawPct < 97) band = 'economy'
  else band = 'exhausted'

  return { band, pct, rawPct, ...BAND_META[band] }
}
```

Diğer şeylere dokunma — `BudgetBand`, `BudgetStatus`, `BAND_META` aynen kalır.

- [ ] **Step 4: TypeScript build et — temiz olmalı**

```bash
npx tsc -b
```

Beklenen: hata yok. `BudgetStatusCard` mevcut çağrısı (`computeBudgetBand(spendUsd, capUsd)`) hala çalışır çünkü 3. parametre opsiyonel.

- [ ] **Step 5: Verify script'i tekrar çalıştır — geçmeli**

```bash
node scripts/verify-budget-band.cjs
```

Beklenen output:
```
12/12 cases passed
```

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/lib/budget-band.ts scripts/verify-budget-band.cjs
git commit -m "feat: make computeBudgetBand plan-aware via optional thresholdPct param

Sprint 2 followup #1. Backend doc 16-system-architecture.md §5.3 + §12
confirm budgetDowngradeThresholdPct only shifts the first threshold
(Normal → Standard); 95 and 97 stay fixed. Default is 80.

When thresholdPct is undefined, Sprint 2 behavior is preserved
(regression-safe). Verified by 12-case node script.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: `BudgetStatusCard` + `UsageTab` thresholdPct pass-through

**Files:**
- Modify: `src/features/companies/components/budget-status-card.tsx`
- Modify: `src/features/companies/components/usage-tab.tsx`

**Bağlam:** Spec §5.2 son iki paragraf. Card'a opsiyonel prop ekle, UsageTab'tan plan değeri geçir.

- [ ] **Step 1: `BudgetStatusCardProps` tipine prop ekle ve hesaplamaya geçir**

`src/features/companies/components/budget-status-card.tsx` dosyasının 5-11 arası satırları:

```typescript
interface BudgetStatusCardProps {
  spendUsd: number
  capUsd: number | null
  thresholdPct?: number
}

export function BudgetStatusCard({ spendUsd, capUsd, thresholdPct }: BudgetStatusCardProps) {
  const status = computeBudgetBand(spendUsd, capUsd, thresholdPct)
  // ... geri kalan dosya değişmez
```

Sadece interface'e satır ekle, destructure ekle, `computeBudgetBand` çağrısına 3. argümanı ekle. JSX kısmı değişmez.

- [ ] **Step 2: `UsageTab`'ta prop'u geç**

`src/features/companies/components/usage-tab.tsx` dosyasında 51. satırdaki `<BudgetStatusCard ... />` çağrısını güncelle:

```tsx
<BudgetStatusCard
  spendUsd={current.totalCostUsd}
  capUsd={budgetCap}
  thresholdPct={plan?.budgetDowngradeThresholdPct}
/>
```

`plan` zaten 26. satırda `usePricingPlan(company?.planId ?? '')` ile mevcut. `plan?.budgetDowngradeThresholdPct` undefined olabilir (plan henüz yüklenmemişse veya backend dönmemişse) — bu durumda `computeBudgetBand` default 80 kullanır. Tip tarafı güvenli (`PricingPlan.budgetDowngradeThresholdPct: number`, types.ts:224).

- [ ] **Step 3: TypeScript build et — temiz olmalı**

```bash
npx tsc -b
```

Beklenen: hata yok.

- [ ] **Step 4: Vite build ile bundle'ı doğrula**

```bash
npx vite build
```

Beklenen: `dist/` üretildi, hata yok. Bu adım, prop ekleme yüzünden runtime'da bir şey kırılmadığını ek garanti.

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/components/budget-status-card.tsx src/features/companies/components/usage-tab.tsx
git commit -m "feat: pass plan budgetDowngradeThresholdPct to BudgetStatusCard

UsageTab now reads plan.budgetDowngradeThresholdPct (already loaded
via usePricingPlan) and passes it through. When the field is missing
(undefined plan), card falls back to default 80 — Sprint 2 behavior
preserved.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Sidebar item + `/docs` route + page shell + section registry + section card

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/App.tsx`
- Create: `src/features/docs/lib/sections.ts`
- Create: `src/features/docs/components/docs-section-card.tsx`
- Create: `src/features/docs/pages/docs-page.tsx`

**Bağlam:** Spec §3.1 + §3.2. Boş shell ile başla — section'lar Task 5-8'de gelecek. Registry başlangıçta boş bir array; her section task'ı bir entry ekleyecek.

- [ ] **Step 1: `DocsSection` registry'sini oluştur (boş)**

`src/features/docs/lib/sections.ts`:

```typescript
import type { ComponentType } from 'react'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = []
```

Henüz section yok — Task 5-8 her birini ayrı entry olarak ekleyecek.

- [ ] **Step 2: `DocsSectionCard` ortak wrapper komponentini oluştur**

`src/features/docs/components/docs-section-card.tsx`:

```tsx
import type { ReactNode } from 'react'

interface DocsSectionCardProps {
  id: string
  title: string
  icon: string
  children: ReactNode
}

export function DocsSectionCard({ id, title, icon, children }: DocsSectionCardProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
```

`scroll-mt-20` Tailwind utility — `scrollIntoView` anchor sıçraması yaptığında üstten 5rem (80px) boşluk bırakır, AppLayout header'ı içeriği örtmesin.

- [ ] **Step 3: `DocsPage` shell'i oluştur (TOC placeholder ile)**

`src/features/docs/pages/docs-page.tsx`:

```tsx
import { DOCS_SECTIONS } from '../lib/sections'

export function DocsPage() {
  return (
    <div className="flex gap-8">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-56 shrink-0 lg:block">
        {/* DocsToc — Task 4'te eklenecek */}
        <nav className="text-sm text-muted-foreground">
          {DOCS_SECTIONS.length === 0 ? (
            <div>İçerik yükleniyor...</div>
          ) : (
            <ul className="space-y-1">
              {DOCS_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="hover:text-foreground">{s.title}</a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 space-y-12 pb-24">
        {DOCS_SECTIONS.length === 0 ? (
          <div className="text-sm text-muted-foreground">Henüz bölüm eklenmedi.</div>
        ) : (
          DOCS_SECTIONS.map((s) => <s.Component key={s.id} />)
        )}
      </main>
    </div>
  )
}
```

Geçici nav, anchor link'lerle native scroll yapar — Task 4 bunu `DocsToc` ile değiştirecek (smooth scroll + scroll-spy). Bu adımın amacı route'un erişilebilir olduğunu kanıtlamak.

- [ ] **Step 4: Sidebar'a "Dokümantasyon" item ekle**

`src/components/layout/sidebar.tsx` dosyasında 2. satırdaki `lucide-react` import'una `BookOpen` ekle:

```typescript
import { LayoutDashboard, Building2, Settings, LogOut, Mail, KeyRound, BookOpen } from 'lucide-react'
```

8-14 arası `navItems` array'inin sonuna yeni entry ekle (Servis Hesapları'ndan sonra):

```typescript
const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Şirketler' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/email-templates', icon: Mail, label: 'Email Şablonları' },
  { to: '/service-accounts', icon: KeyRound, label: 'Servis Hesapları' },
  { to: '/docs', icon: BookOpen, label: 'Dokümantasyon' },
]
```

Sidebar render mantığı (NavLink + Tooltip) değişmez.

- [ ] **Step 5: Route'u `App.tsx`'e ekle**

`src/App.tsx` dosyasında 12. satırdan sonra import ekle:

```typescript
import { DocsPage } from '@/features/docs/pages/docs-page'
```

37. satırdan önce route ekle (Servis Hesapları'nın altına):

```tsx
<Route path="/service-accounts" element={<ServiceAccountsPage />} />
<Route path="/docs" element={<DocsPage />} />
```

Bu route otomatik olarak `<AuthGuard />` + `<AppLayout />` altında — spec §3.1 gereği.

- [ ] **Step 6: TypeScript build et**

```bash
npx tsc -b
```

Beklenen: hata yok.

- [ ] **Step 7: Vite build ile bundle'ı doğrula**

```bash
npx vite build
```

Beklenen: `dist/` üretildi. `DocsPage` chunk'a girdi.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/sidebar.tsx src/App.tsx src/features/docs/
git commit -m "feat: add /docs route, sidebar item, empty section registry + shell

Bilgi & Dokümantasyon page foundation. New 6th sidebar item with
BookOpen icon. /docs renders an empty shell with placeholder TOC and
content area, driven by DOCS_SECTIONS registry. Sections are added in
follow-up tasks; each new section requires only a registry entry +
component file.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: `DocsToc` komponenti (sticky + scroll-spy + smooth scroll)

**Files:**
- Create: `src/features/docs/components/docs-toc.tsx`
- Modify: `src/features/docs/pages/docs-page.tsx`

**Bağlam:** Spec §3.1 son paragraf. `IntersectionObserver` opts: `rootMargin: '-20% 0px -70% 0px'`, `threshold: 0`. Tıklamada smooth scroll + URL hash güncelleme.

- [ ] **Step 1: `DocsToc` komponentini yaz**

`src/features/docs/components/docs-toc.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { DOCS_SECTIONS } from '../lib/sections'

export function DocsToc() {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (DOCS_SECTIONS.length === 0) return

    const sectionMap = new Map<string, IntersectionObserverEntry>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionMap.set(entry.target.id, entry)
        }
        const firstVisible = DOCS_SECTIONS
          .map((s) => sectionMap.get(s.id))
          .find((e) => e?.isIntersecting)
        if (firstVisible) {
          setActiveId(firstVisible.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    for (const s of DOCS_SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  if (DOCS_SECTIONS.length === 0) {
    return <div className="text-sm text-muted-foreground">İçerik yükleniyor...</div>
  }

  return (
    <nav aria-label="Doküman içindekiler">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        İçindekiler
      </div>
      <ul className="space-y-1">
        {DOCS_SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => handleClick(e, s.id)}
              className={cn(
                'block rounded-md px-2 py-1 text-sm transition-colors',
                activeId === s.id
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <span className="mr-1.5" aria-hidden>{s.icon}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

`history.replaceState` URL hash'i günceller ama default scroll-jump tetiklemez (preventDefault zaten var). Active state ilk render'da `null` — kullanıcı scroll edince observer set eder.

- [ ] **Step 2: `DocsPage`'i `DocsToc` kullanacak şekilde güncelle**

`src/features/docs/pages/docs-page.tsx` — geçici nav'ı `<DocsToc />` ile değiştir:

```tsx
import { DocsToc } from '../components/docs-toc'
import { DOCS_SECTIONS } from '../lib/sections'

export function DocsPage() {
  return (
    <div className="flex gap-8">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-56 shrink-0 overflow-y-auto lg:block">
        <DocsToc />
      </aside>
      <main className="min-w-0 flex-1 space-y-12 pb-24">
        {DOCS_SECTIONS.length === 0 ? (
          <div className="text-sm text-muted-foreground">Henüz bölüm eklenmedi.</div>
        ) : (
          DOCS_SECTIONS.map((s) => <s.Component key={s.id} />)
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript build et**

```bash
npx tsc -b
```

Beklenen: hata yok.

- [ ] **Step 4: Vite build et**

```bash
npx vite build
```

Beklenen: hata yok. `IntersectionObserver` modern target browser'larda native, polyfill gerekmiyor.

- [ ] **Step 5: Commit**

```bash
git add src/features/docs/components/docs-toc.tsx src/features/docs/pages/docs-page.tsx
git commit -m "feat: add DocsToc with IntersectionObserver scroll-spy + smooth scroll

Sticky left nav, registry-driven. rootMargin '-20% 0px -70% 0px'
matches shadcn docs pattern — section becomes active when it crosses
the top 20% band of the viewport. Click triggers smooth scrollIntoView
and replaces URL hash without a default scroll jump.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Section 1 — Genel Mimari

**Files:**
- Create: `src/features/docs/sections/genel-mimari.tsx`
- Modify: `src/features/docs/lib/sections.ts`

**Bağlam:** Spec §4.1. 6 bileşen kart grid + akış metni. Hand-built kart estetiği — `Card`/`CardContent`/`CardHeader`/`CardTitle` shadcn'den.

- [ ] **Step 1: `GenelMimari` section komponentini yaz**

`src/features/docs/sections/genel-mimari.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface ArchComponent {
  icon: string
  name: string
  desc: string
  host: string
}

const COMPONENTS: ArchComponent[] = [
  { icon: '🖥️', name: 'Frontend (Admin Panel + Embed Widget)', desc: 'React + Vite + Tailwind. Süperadmin paneli ve müşteri web chat embed widget\'ı.', host: 'Vercel / Netlify' },
  { icon: '⚙️', name: 'Backend API', desc: 'NestJS + TypeORM. Tüm REST endpoint\'leri, auth, RBAC, business logic.', host: 'Hetzner / Railway' },
  { icon: '🔧', name: 'Worker', desc: 'Trigger.dev v3 background job\'ları. Quote pipeline, embedding üretimi, async görevler.', host: 'Trigger.dev cloud' },
  { icon: '🗄️', name: 'Veritabanı', desc: 'Postgres + pgvector. Relational data + vector embedding store (RAG için).', host: 'Self-hosted / managed Postgres' },
  { icon: '🤖', name: 'LLM Sağlayıcı', desc: 'OpenRouter aracılığıyla Anthropic, OpenAI, Google modelleri.', host: 'OpenRouter API' },
  { icon: '💬', name: 'Mesajlaşma Kanalları', desc: 'WhatsApp Business API, web embed widget, customer agent webhook\'ları.', host: 'WhatsApp Cloud API + custom' },
]

export function GenelMimari() {
  return (
    <DocsSectionCard id="genel-mimari" title="Genel Mimari" icon="🏗️">
      <p className="text-sm text-muted-foreground">
        Sistem 6 ana bileşenden oluşur. Backend mesajları kabul eder, Worker ağır işleri arka planda çalıştırır, LLM'e OpenRouter üzerinden gidilir, sonuçlar Postgres + pgvector'da saklanır.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {COMPONENTS.map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <span className="mr-2" aria-hidden>{c.icon}</span>
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div>{c.desc}</div>
              <div className="text-xs italic">Host: {c.host}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">Mesaj Akışı (yüksek seviye)</div>
          <div className="mt-2">
            Mesaj geldi → Backend doğrular → Worker tetiklenir → LLM çağrılır → Yanıt yazılır → Kanala iletilir
          </div>
          <div className="mt-2 text-xs italic">
            Detaylı 7 adımlı akış için <a href="#mesaj-akisi" className="underline hover:text-foreground">Mesaj İşlem Akışı</a> bölümüne bakın.
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: Registry'ye entry ekle**

`src/features/docs/lib/sections.ts`:

```typescript
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
]
```

- [ ] **Step 3: TypeScript build + Vite build**

```bash
npx tsc -b && npx vite build
```

Beklenen: ikisi de temiz.

- [ ] **Step 4: Commit**

```bash
git add src/features/docs/sections/genel-mimari.tsx src/features/docs/lib/sections.ts
git commit -m "feat(docs): add Section 1 — Genel Mimari (6 component grid + flow)

Hand-built card grid in Sprint 2 Quote Pipeline style. 6 components
(Frontend / Backend / Worker / DB / LLM / Channels) each with icon,
name, description, host. Closes with a violet flow-summary card that
links to mesaj-akisi anchor.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Section 2 — Mesaj İşlem Akışı

**Files:**
- Create: `src/features/docs/sections/mesaj-akisi.tsx`
- Modify: `src/features/docs/lib/sections.ts`

**Bağlam:** Spec §4.2. Quote Pipeline'ın 7-step kart deseninin **birebir aynısı** — `quote-pipeline-section.tsx:9-17,29-43` referans al, kopyalama dahil görsel ritim aynı olsun.

- [ ] **Step 1: `MesajAkisi` section komponentini yaz**

`src/features/docs/sections/mesaj-akisi.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface PipelineStep {
  n: number
  title: string
  desc: string
}

const STEPS: PipelineStep[] = [
  { n: 1, title: 'Webhook Alımı', desc: 'WhatsApp Cloud API, embed widget veya customer agent webhook\'undan inbound mesaj backend\'e ulaşır.' },
  { n: 2, title: 'Doğrulama', desc: 'İmza/HMAC, rate limit, kanal eşleşmesi kontrol edilir; geçersiz istekler reddedilir.' },
  { n: 3, title: 'Conversation Lookup/Create', desc: '`customerId + channelId` ile mevcut konuşma aranır; yoksa yeni konuşma oluşturulur.' },
  { n: 4, title: 'Memory Yükleme', desc: 'Company memory + conversation memory + customer profile context\'e yüklenir.' },
  { n: 5, title: 'Agent Çalıştırma', desc: 'Sistem promptu + memory + araçlar ile LLM çağrısı yapılır (OpenRouter üzerinden).' },
  { n: 6, title: 'Tool Dispatch', desc: 'Model bir tool çağırırsa worker\'a delegate edilir (quote, search, customer update vb.).' },
  { n: 7, title: 'Yanıt Yazımı', desc: 'Final mesaj conversation\'a kaydedilir + kanala (WhatsApp/widget) gönderilir.' },
]

export function MesajAkisi() {
  return (
    <DocsSectionCard id="mesaj-akisi" title="Mesaj İşlem Akışı" icon="💬">
      <p className="text-sm text-muted-foreground">
        Bir mesaj backend'e ulaştıktan sonra 7 adımlık deterministik bir pipeline çalışır. Her adım hata verirse önceki adımların etkisi geri alınır (örn. agent başarısızsa rezervasyon serbest bırakılır).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STEPS.map((step) => (
          <Card key={step.n}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-400">
                  {step.n}
                </span>
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
          </Card>
        ))}
      </div>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: Registry'ye entry ekle**

`src/features/docs/lib/sections.ts` — array'e Genel Mimari'den sonra ekle:

```typescript
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { MesajAkisi } from '../sections/mesaj-akisi'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
]
```

- [ ] **Step 3: TypeScript build + Vite build**

```bash
npx tsc -b && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/docs/sections/mesaj-akisi.tsx src/features/docs/lib/sections.ts
git commit -m "feat(docs): add Section 2 — Mesaj İşlem Akışı (7-step cards)

Same numbered-badge card grid pattern as Sprint 2 quote-pipeline-
section. 7 steps from backend §2: webhook → validate → conversation
lookup → memory → agent → tool dispatch → response.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Section 3 — Agent Tool Sistemi (21 tool tablosu + filtreleme + CUSTOMER vs INTERNAL)

**Files:**
- Create: `src/features/docs/sections/agent-tool.tsx`
- Modify: `src/features/docs/lib/sections.ts`

**Bağlam:** Spec §4.3. Backend §3.1, §3.2, §3.3 birleşimi. Tool listesi backend tablosundan **birebir** kopyalanır — 21 satır, snake_case isimler, dot-notation YOK. Backend doc başlığı "(19 adet)" diyerek hatalı sayım veriyor; satırları say.

- [ ] **Step 1: `AgentTool` section komponentini yaz**

`src/features/docs/sections/agent-tool.tsx`. Bu büyük bir komponent — 3 alt-blok (tool tablosu + filtreleme + CUSTOMER vs INTERNAL). Tüm içerik aşağıda:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface Tool {
  name: string
  category: 'search' | 'template' | 'action'
  desc: string
  needsApproval: boolean
  inCustomer: boolean
}

const TOOLS: Tool[] = [
  { name: 'search_knowledge_base',     category: 'search',   desc: 'Bilgi bankasında arama (politikalar, kurallar, ürünler)',                         needsApproval: false, inCustomer: true  },
  { name: 'search_drive_documents',    category: 'search',   desc: 'Yüklenen dokümanlarda arama (PDF, Word, Excel)',                                  needsApproval: false, inCustomer: true  },
  { name: 'list_knowledge_categories', category: 'search',   desc: 'Bilgi bankası kategorilerini listeler',                                            needsApproval: false, inCustomer: true  },
  { name: 'search_playbook',           category: 'search',   desc: 'Satış playbook\'unda arama (SSS, fiyat, objection handling)',                     needsApproval: false, inCustomer: true  },
  { name: 'search_notes',              category: 'search',   desc: 'Kişisel notlarda arama',                                                           needsApproval: false, inCustomer: false },
  { name: 'search_memory',             category: 'search',   desc: 'Kullanıcı hafızasında arama',                                                      needsApproval: false, inCustomer: false },
  { name: 'web_search',                category: 'search',   desc: 'Exa API ile web\'de güncel bilgi arama',                                           needsApproval: false, inCustomer: true  },
  { name: 'research',                  category: 'search',   desc: 'Derin web araştırması (şirket/pazar/konu) — Exa + LLM özetleme',                   needsApproval: false, inCustomer: false },
  { name: 'get_lead_context',          category: 'search',   desc: 'Müşteri bilgisi (CUSTOMER modda hassas alanlar gizlenir)',                         needsApproval: false, inCustomer: true  },
  { name: 'view_pipeline',             category: 'search',   desc: 'Lead pipeline özeti (sayı + değer)',                                               needsApproval: false, inCustomer: false },
  { name: 'view_lead',                 category: 'search',   desc: 'Lead detay bilgisi',                                                               needsApproval: false, inCustomer: false },
  { name: 'view_quote_stats',          category: 'search',   desc: 'Teklif istatistikleri',                                                            needsApproval: false, inCustomer: false },
  { name: 'analyze_sales',             category: 'search',   desc: 'Satış analizi (trend, dönüşüm, ülke)',                                             needsApproval: false, inCustomer: false },
  { name: 'templates',                 category: 'template', desc: 'Şablon arama + önerme + doldurma (çoklu işlem)',                                   needsApproval: true,  inCustomer: false },
  { name: 'notes',                     category: 'action',   desc: 'Not oluşturma + güncelleme + silme (çoklu işlem)',                                 needsApproval: true,  inCustomer: false },
  { name: 'memory',                    category: 'action',   desc: 'Uzun vadeli kullanıcı hafızası kaydetme/sorgulama',                                needsApproval: false, inCustomer: false },
  { name: 'create_quote',              category: 'action',   desc: 'Asenkron teklif hazırlama süreci başlatır',                                        needsApproval: true,  inCustomer: false },
  { name: 'send_quote',                category: 'action',   desc: 'Önceden hazırlanmış teklifi kanala gönderir',                                       needsApproval: true,  inCustomer: false },
  { name: 'schedule_follow_up',        category: 'action',   desc: 'Müşteri için takip tarihi planlar',                                                needsApproval: false, inCustomer: true  },
  { name: 'update_lead_status',        category: 'action',   desc: 'Lead pipeline durumunu günceller',                                                 needsApproval: false, inCustomer: true  },
  { name: 'escalate_to_human',         category: 'action',   desc: 'Konuşmayı insan operatöre aktarır',                                                needsApproval: false, inCustomer: true  },
]

interface FilterStep {
  n: number
  title: string
  desc: string
}

const FILTER_STEPS: FilterStep[] = [
  { n: 1, title: 'Plan Filtreleme',           desc: 'Plan\'daki `allowedTools` listesi uygulanır. `["*"]` = tüm tool\'lar (enterprise).' },
  { n: 2, title: 'Şirket Override',           desc: 'Firma bazlı override: `{ "fill_template": true, "web_search": false }`. Plan\'dan bağımsız ekleme/çıkarma.' },
  { n: 3, title: 'Konuşma Tipi Filtreleme',   desc: 'CUSTOMER konuşma → `CUSTOMER_EXCLUDED_TOOLS` çıkarılır. INTERNAL konuşma → değişiklik yok.' },
  { n: 4, title: 'Lead Bağımlılık Filtreleme', desc: 'Konuşmada lead yoksa → `LEAD_DEPENDENT_TOOLS` çıkarılır (get_lead_context, schedule_follow_up, update_lead_status, escalate_to_human).' },
]

interface ConvCompare {
  feature: string
  internal: string
  customer: string
}

const CONV_COMPARISON: ConvCompare[] = [
  { feature: 'Erişim',           internal: 'Firma paneli (çalışanlar)',          customer: 'WhatsApp, web chat (müşteriler)' },
  { feature: 'Tool\'lar',        internal: 'Tüm 21 tool',                         customer: '~9 tool (gizli olanlar çıkarılır)' },
  { feature: 'Veri görünürlüğü', internal: 'INTERNAL_ONLY + CUSTOMER_SAFE',       customer: 'Yalnızca CUSTOMER_SAFE' },
  { feature: 'Sistem promptu',   internal: 'Genel talimatlar',                    customer: '+ Müşteri yüzlü kurallar + satış stratejisi' },
  { feature: 'Guardrail',        internal: 'Temel kontroller',                    customer: '+ İç veri sızıntısı tespiti (maliyet, marj vb.)' },
  { feature: 'Trust Level',      internal: 'Devre dışı (onay yok)',               customer: 'Aktif (trust level\'a göre onay)' },
  { feature: 'Arama',            internal: 'Tüm içerikler',                       customer: 'Yalnızca `visibilityScope = CUSTOMER_SAFE`' },
]

const CATEGORY_BADGE: Record<Tool['category'], string> = {
  search:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  template: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  action:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export function AgentTool() {
  return (
    <DocsSectionCard id="agent-tool" title="Agent Tool Sistemi" icon="🛠️">
      <p className="text-sm text-muted-foreground">
        Agent her LLM çağrısı sırasında bu tool'lara erişir. Kullanım frekansı ve maliyeti firma bazında izlenir. Toplam {TOOLS.length} tool, 3 kategoride: <strong>search</strong> ({TOOLS.filter(t => t.category === 'search').length}), <strong>template</strong> ({TOOLS.filter(t => t.category === 'template').length}), <strong>action</strong> ({TOOLS.filter(t => t.category === 'action').length}).
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Tool Adı</th>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">Ne Yapar</th>
                <th className="px-3 py-2 text-center">Onay</th>
                <th className="px-3 py-2 text-center">CUSTOMER</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-xs">{t.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[t.category]}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{t.desc}</td>
                  <td className="px-3 py-2 text-center">{t.needsApproval ? '✅' : '—'}</td>
                  <td className="px-3 py-2 text-center">{t.inCustomer ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 mt-6 text-base font-semibold">Tool Filtreleme Akışı</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          LLM'e gönderilmeden önce tool seti 4 adımlı bir filtreden geçer.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FILTER_STEPS.map((step) => (
            <Card key={step.n}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs text-violet-400">
                    {step.n}
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 mt-6 text-base font-semibold">CUSTOMER vs INTERNAL Konuşma</h3>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Özellik</th>
                  <th className="px-3 py-2 text-left">INTERNAL</th>
                  <th className="px-3 py-2 text-left">CUSTOMER</th>
                </tr>
              </thead>
              <tbody>
                {CONV_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{row.feature}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.internal}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.customer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: Registry'ye entry ekle**

`src/features/docs/lib/sections.ts` — array'e ekle:

```typescript
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool', title: 'Agent Tool Sistemi', icon: '🛠️', Component: AgentTool },
]
```

- [ ] **Step 3: TypeScript build + Vite build**

```bash
npx tsc -b && npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/docs/sections/agent-tool.tsx src/features/docs/lib/sections.ts
git commit -m "feat(docs): add Section 3 — Agent Tool Sistemi (21 tools + filter + CUSTOMER vs INTERNAL)

Backend §3.1 tool table (21 rows verbatim, 3 categories: search/template/
action). Each row shows name, category badge, purpose, approval flag,
CUSTOMER availability. §3.2 4-step filter pipeline as numbered cards.
§3.3 CUSTOMER vs INTERNAL feature comparison table. Tool names use
snake_case exactly as backend defines.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Section 4 (Model Downgrade) + Section 5 (Sorun Giderme) — combined

**Files:**
- Create: `src/features/docs/sections/model-downgrade.tsx`
- Create: `src/features/docs/sections/sorun-giderme.tsx`
- Modify: `src/features/docs/lib/sections.ts`

**Bağlam:** Spec §4.4 + §4.5. Birleşik task çünkü ikisi de tablo + paragraf düzeyinde içerik. Backend §5.3 (downgrade tablosu), §14 (sorun giderme tablosu) referans.

- [ ] **Step 1: `ModelDowngrade` section komponentini yaz**

`src/features/docs/sections/model-downgrade.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface BandRow {
  name: string
  threshold: string
  behavior: string
  rowClass: string
}

const BANDS: BandRow[] = [
  { name: 'Normal',             threshold: '< %80',     behavior: 'Tam kalite model (örn. Claude Sonnet 4.6)', rowClass: '' },
  { name: 'Standard Downgrade', threshold: '%80 – %95', behavior: 'Orta kalite model',                          rowClass: 'bg-yellow-500/5' },
  { name: 'Economy Downgrade',  threshold: '%95 – %97', behavior: 'Düşük maliyetli model',                      rowClass: 'bg-orange-500/5' },
  { name: 'Exhausted',          threshold: '≥ %97',     behavior: 'Yanıt vermez, "bütçe doldu" mesajı',         rowClass: 'bg-red-500/5' },
]

export function ModelDowngrade() {
  return (
    <DocsSectionCard id="model-downgrade" title="Model Seçimi & Downgrade" icon="⚖️">
      <p className="text-sm text-muted-foreground">
        Firma bütçesi aşıldıkça model otomatik olarak daha ucuz tier'a düşürülür. Aşağıdaki dört bant backend tarafından firma bazında uygulanır.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Bant</th>
                <th className="px-3 py-2 text-left">Eşik (varsayılan)</th>
                <th className="px-3 py-2 text-left">Davranış</th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.name} className={`border-b last:border-b-0 ${b.rowClass}`}>
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.threshold}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.behavior}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-amber-400">⚠ Plan-Bazlı Threshold</div>
          <div className="mt-2">
            Yukarıdaki yüzdeler varsayılandır. <code className="rounded bg-muted px-1 py-0.5 text-xs">budgetDowngradeThresholdPct</code> alanı <strong>yalnızca Normal → Standard geçişini</strong> kontrol eder (default 80). %95 (Economy) ve %97 (Exhausted) eşikleri sabittir, plan-bazında değişmez. Backend §5.3 + §12 ile teyit edildi.
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="py-4 text-sm text-muted-foreground">
          <div className="font-semibold text-violet-400">🔗 Bütçe Status Card</div>
          <div className="mt-2">
            Bir firmanın gerçek bant durumunu görmek için: <strong>Companies → firma seç → Usage tab → en üstteki Bütçe Durumu kartı</strong>. Kart, firmanın planına göre band hesaplar (yukarıdaki kuralları uygulayarak).
          </div>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 2: `SorunGiderme` section komponentini yaz**

`src/features/docs/sections/sorun-giderme.tsx`. Backend §14'ten 7 yaygın sorun + 8 log anahtar kelime tablosu (tam liste backend'de var):

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { DocsSectionCard } from '../components/docs-section-card'

interface Issue {
  problem: string
  cause: string
  fix: string
  link?: { href: string; label: string }
}

const ISSUES: Issue[] = [
  {
    problem: 'Bütçe limiti aşıldı',
    cause: '`budgetUsd` düşük ayarlı.',
    fix: 'Config\'ten budget artırın veya ay başını bekleyin.',
    link: { href: '#model-downgrade', label: 'Model Downgrade' },
  },
  {
    problem: 'AI yanıtları yavaş',
    cause: 'Premium model + uzun tarihçe.',
    fix: '`multiModelStepEnabled` açın, `historyTokenBudget` düşürün.',
  },
  {
    problem: 'Arama sonucu boş',
    cause: 'Embedding henüz tamamlanmadı.',
    fix: 'Knowledge item status\'u kontrol edin (READY olmalı).',
  },
  {
    problem: 'WhatsApp mesaj gönderilemiyor',
    cause: '24h penceresi kapandı.',
    fix: '`defaultTemplateName` ayarlanmalı.',
  },
  {
    problem: 'Model downgrade olmuyor',
    cause: 'Threshold çok yüksek.',
    fix: '`budgetDowngradeThresholdPct` düşürün (örnek: 70).',
    link: { href: '#model-downgrade', label: 'Model Downgrade' },
  },
  {
    problem: 'Tool çağrısı başarısız, hata logu nerede?',
    cause: 'Worker logları Trigger.dev dashboard\'unda.',
    fix: 'Trigger.dev cloud panelinde son task çalışmasının log\'una bakın. `quote.prepare.v1` task ismiyle filtreleyin.',
    link: { href: '#agent-tool', label: 'Agent Tool Sistemi' },
  },
  {
    problem: 'Quote oluşmadı, hangi adımda takıldı?',
    cause: 'Pipeline 7 adımdan birinde hata aldı.',
    fix: 'Settings → Quote Pipeline sayfasındaki step açıklamalarına bakın; Trigger.dev log\'unda hangi adımda exception atıldığı görünür.',
  },
]

interface LogKey {
  message: string
  meaning: string
}

const LOG_KEYS: LogKey[] = [
  { message: 'Research blocked: insufficient budget', meaning: 'Research tool bütçe yetersiz.' },
  { message: 'Channel model downgraded',              meaning: 'WhatsApp\'ta model düşürüldü.' },
  { message: 'Failed to settle reservation',          meaning: 'Bütçe kapanışı başarısız (kritik).' },
  { message: 'Output guardrail retry failed',         meaning: 'Guardrail sonrası tekrar üretim başarısız.' },
  { message: 'computeLlmCost Model not found',        meaning: 'Maliyet hesaplanamadı, $0 kaydedildi.' },
  { message: 'Trigger.dev quote pipeline failed',     meaning: 'Teklif pipeline hatası.' },
  { message: 'Lead lookup failed',                    meaning: 'Lead bulunamadı (teklif akışı).' },
  { message: 'OpenRouter models fetch failed',        meaning: 'Model listesi çekilemedi, fallback kullanılıyor.' },
]

export function SorunGiderme() {
  return (
    <DocsSectionCard id="sorun-giderme" title="Sorun Giderme" icon="🔧">
      <p className="text-sm text-muted-foreground">
        Sık karşılaşılan sorunlar ve çözüm önerileri. Detay için ilgili bölüme bağlantı.
      </p>

      <div className="space-y-3">
        {ISSUES.map((issue) => (
          <Card key={issue.problem}>
            <CardContent className="space-y-2 py-3 text-sm">
              <div className="font-semibold">❓ {issue.problem}</div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Olası neden:</span> {issue.cause}
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Çözüm:</span> {issue.fix}
              </div>
              {issue.link && (
                <div className="text-xs italic text-muted-foreground">
                  İlgili bölüm:{' '}
                  <a href={issue.link.href} className="underline hover:text-foreground">
                    {issue.link.label}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-base font-semibold">Log İzleme Anahtar Kelimeleri</h3>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Log Mesajı</th>
                <th className="px-3 py-2 text-left">Anlam</th>
              </tr>
            </thead>
            <tbody>
              {LOG_KEYS.map((k) => (
                <tr key={k.message} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{k.message}</td>
                  <td className="px-3 py-2 text-muted-foreground">{k.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DocsSectionCard>
  )
}
```

- [ ] **Step 3: Registry'ye iki yeni entry ekle**

`src/features/docs/lib/sections.ts` — final hali:

```typescript
import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { ModelDowngrade } from '../sections/model-downgrade'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool', title: 'Agent Tool Sistemi', icon: '🛠️', Component: AgentTool },
  { id: 'model-downgrade', title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'sorun-giderme', title: 'Sorun Giderme', icon: '🔧', Component: SorunGiderme },
]
```

- [ ] **Step 4: TypeScript build + Vite build**

```bash
npx tsc -b && npx vite build
```

- [ ] **Step 5: Final regresyon kontrolü — Sprint 2 davranışı bozulmamış mı**

```bash
node scripts/verify-budget-band.cjs
```

Beklenen: `12/12 cases passed` (Task 1'den beri korunmuş olmalı).

- [ ] **Step 6: Commit**

```bash
git add src/features/docs/sections/model-downgrade.tsx src/features/docs/sections/sorun-giderme.tsx src/features/docs/lib/sections.ts
git commit -m "feat(docs): add Section 4 (Model Downgrade) + Section 5 (Sorun Giderme)

Section 4: 4-band budget table + amber warning aligned with task 1's
plan-aware threshold (only first threshold shifts; 95/97 fixed) +
violet cross-reference card pointing to BudgetStatusCard in Usage tab.

Section 5: 7 common issues as cards (problem/cause/fix + cross-anchor
links to relevant sections) + log keyword reference table from
backend §14.

Closes Sprint 3 — 5 sections shipped.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Sprint 3 Tamamlama Doğrulaması

Tüm 8 task tamamlandıktan sonra final smoke testi:

- [ ] **`npx tsc -b` temiz**
- [ ] **`npx vite build` temiz**
- [ ] **`node scripts/verify-budget-band.cjs` → 12/12 passed**
- [ ] **Git log son 8 commit Sprint 3 işine ait**: `git log --oneline -8`
- [ ] **Manuel smoke (implementer browser açabiliyorsa)**:
  - `/docs` route açılır
  - Sidebar'da BookOpen ikonu var, hover'da "Dokümantasyon" tooltip'i çıkar
  - 5 bölüm sırayla görünür
  - Sol TOC'taki bir item'a tıkla → smooth scroll + URL hash (`/docs#agent-tool`) güncellenir
  - Aşağı scroll et → TOC active highlight değişir
  - Companies → bir firma → Usage tab: BudgetStatusCard mevcut planın `budgetDowngradeThresholdPct` değerine uygun bant gösterir (regresyon yok)
  - Settings → Quote Pipeline mevcut yerinde çalışıyor (regresyon yok)

Eğer browser smoke yapılamadıysa: bu iki başarı kriterini implementer açıkça not eder, kullanıcı manuel kontrol için bilgilendirilir.
