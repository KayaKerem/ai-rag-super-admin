# Sub-project 2 — WebChat + Embed Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 12th "WebChat" tab in company detail (brand/logo migration + WP plugin section + universal embed snippets) and a kill-switch placeholder section in /settings.

**Architecture:** Tek tab eklemesi + 1 settings section + 6 yeni component dosyası. Brand/logo `agent-settings-card`'tan WebChat tab'a migrate edilir (single source of truth). WP plugin `version.json` no-auth public endpoint — native `fetch()` ile (axios apiClient interceptor'ı bypass). Snippet template'leri client-side string interpolation. Yeni route yok. Bundle delta < 10 kB raw.

**Tech Stack:** React 19, TypeScript, TanStack Query v5, shadcn/ui Tabs/Select/Card, sonner toast, native `fetch()` for public endpoint, MSW handlers single-file.

**Spec:** `/Users/keremkaya/Desktop/firma/ai-rag-super-admin/docs/superpowers/specs/2026-05-27-webchat-embed-admin-design.md` (committed `f1ddd7a`)

**Acceptance:** `tsc -b` 0 error (baseline 0), `vite build` green, 7-step browser smoke pass (spec §6).

---

## File Structure

**New files (6):**
- `src/features/companies/hooks/use-wp-plugin-version.ts` — public version.json fetch (native fetch, no axios)
- `src/features/companies/components/webchat-tab.tsx` — tab container
- `src/features/companies/components/webchat-config-card.tsx` — brand color + logo URL form (host of migrated fields)
- `src/features/companies/components/wp-plugin-section.tsx` — Section A: download + install steps + version
- `src/features/companies/components/universal-embed-section.tsx` — Section B: 3-tab snippet + copy
- `src/features/settings/components/web-channel-section.tsx` — kill-switch placeholder section

**Modified files (5):**
- `src/features/companies/pages/company-detail-page.tsx` — add 12th TabsTrigger + TabsContent
- `src/features/companies/components/agent-settings-card.tsx` — DELETE brandColor + logoUrl form fields (lines 201-217 area)
- `src/features/settings/pages/settings-page.tsx` — `SettingsNav` item + activeSection ladder branch (`SettingsNav` lives in `src/features/settings/components/settings-nav.tsx`; check first)
- `src/lib/query-keys.ts` — add `public.wpPluginVersion`
- `src/mocks/handlers.ts` — version.json handler

---

## T1 — Hook + queryKey + MSW (C1)

### Task 1: useWpPluginVersion hook + queryKey + MSW handler

**Files:**
- Modify: `src/lib/query-keys.ts` (add `public` namespace)
- Create: `src/features/companies/hooks/use-wp-plugin-version.ts`
- Modify: `src/mocks/handlers.ts` (new comment section)

- [ ] **Step 1: Read query-keys.ts current shape**

Run: `Read src/lib/query-keys.ts`

Confirm structure: `queryKeys = { companies: {...}, platform: {...}, admin: {...} }`. We'll add `public` as a new top-level namespace.

- [ ] **Step 2: Add public namespace to query-keys.ts**

Open `src/lib/query-keys.ts`. After the closing brace of `admin: { ... }` (around line 76) but BEFORE the outer `}` of `queryKeys`, add:

```ts
  public: {
    wpPluginVersion: ['public', 'wp-plugin-version'] as const,
  },
```

So the final shape is:
```ts
export const queryKeys = {
  companies: { ... },
  platform: { ... },
  admin: { ... },
  public: {
    wpPluginVersion: ['public', 'wp-plugin-version'] as const,
  },
}
```

- [ ] **Step 3: Create the hook file**

Create `src/features/companies/hooks/use-wp-plugin-version.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export interface WpPluginVersion {
  version: string
  tested_up_to: string
  requires_at_least: string
  downloadUrlTemplate: string
  embedScriptUrlTemplate: string
  available: boolean
}

export function useWpPluginVersion() {
  return useQuery({
    queryKey: queryKeys.public.wpPluginVersion,
    queryFn: async (): Promise<WpPluginVersion> => {
      const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
      const res = await fetch(`${base}/public/wp-plugin/version.json`)
      if (!res.ok) throw new Error(`version.json fetch failed: ${res.status}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

Note: `fetch()` not `apiClient` — avoids axios Authorization header injection on no-auth endpoint.

- [ ] **Step 4: Add MSW handler**

Read `src/mocks/handlers.ts` first 60 lines to confirm `BASE` const + `http`/`HttpResponse` imports.

Append at the end of the handlers array, before the closing `]`:

```ts
  // ─── WP Plugin Version (no-auth public)
  http.get(`${BASE}/public/wp-plugin/version.json`, () => {
    return HttpResponse.json({
      version: '1.0.0',
      tested_up_to: '6.9',
      requires_at_least: '6.2',
      downloadUrlTemplate: `${BASE}/public/wp-plugin/by-slug/{slug}/edfu-chat.zip`,
      embedScriptUrlTemplate: `${BASE}/public/wp-plugin/by-slug/{slug}/edfu-chat.js`,
      available: true,
    })
  }),
```

- [ ] **Step 5: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 0 errors. If hook file has missing imports (e.g. queryKeys path), fix.

- [ ] **Step 6: Commit**

```bash
git add src/lib/query-keys.ts src/features/companies/hooks/use-wp-plugin-version.ts src/mocks/handlers.ts
git commit -m "$(cat <<'EOF'
feat(webchat): useWpPluginVersion hook + queryKey + MSW

Backend: GET /public/wp-plugin/version.json (no-auth public endpoint).
Uses native fetch() to bypass apiClient Authorization interceptor
(expired token would 401 a public endpoint).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T2 — Tab shell + integration (C2)

### Task 2: WebChatTab shell component + company-detail-page integration

**Files:**
- Create: `src/features/companies/components/webchat-tab.tsx` (skeleton)
- Modify: `src/features/companies/pages/company-detail-page.tsx` (add 12th tab)

- [ ] **Step 1: Read company-detail-page.tsx**

Run: `Read src/features/companies/pages/company-detail-page.tsx`

Confirm: 11 TabsTrigger entries (line ~34-44), matching TabsContent (line ~46+). Look at the `Company` type imported and how it's passed to existing tab components like `<PlanTab>` to mirror the prop shape for WebChat.

- [ ] **Step 2: Create WebChatTab skeleton**

Create `src/features/companies/components/webchat-tab.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import type { Company } from '../types'

interface WebChatTabProps {
  company: Company
}

export function WebChatTab({ company }: WebChatTabProps) {
  return (
    <div className="space-y-4">
      {/* Slug readonly */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Slug</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted px-2 py-1 rounded">{company.slug}</code>
          <p className="text-xs text-muted-foreground mt-2">
            Slug "Şirket Bilgi" sekmesinden değiştirilebilir.
          </p>
        </CardContent>
      </Card>

      {/* Brand + Logo card placeholder (filled in Task 3) */}
      <div data-placeholder="webchat-config-card">{/* Task 3 */}</div>

      {/* WP plugin section placeholder (filled in Task 5) */}
      <div data-placeholder="wp-plugin-section">{/* Task 5 */}</div>

      {/* Universal embed section placeholder (filled in Task 6) */}
      <div data-placeholder="universal-embed-section">{/* Task 6 */}</div>

      {/* B17 cross-link banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Visitor verify-fail dashboard Sprint B follow-up</p>
          <p className="text-xs text-muted-foreground">
            Backend mirror endpoint (<code>/platform/companies/:id/visitor-session-stats</code>) henüz yok — Sprint B17.
          </p>
        </div>
      </div>
    </div>
  )
}
```

If `Company` type doesn't have `slug` field, add it first. Verify with `grep -n "slug" src/features/companies/types.ts`.

- [ ] **Step 3: Wire into company-detail-page.tsx**

In `src/features/companies/pages/company-detail-page.tsx`:

Add import (with other component imports):
```tsx
import { WebChatTab } from '../components/webchat-tab'
```

In the TabsList (around line 34-44), after the last `TabsTrigger` (likely `proactive`), add:
```tsx
          <TabsTrigger value="webchat">WebChat</TabsTrigger>
```

After the last `TabsContent`, add:
```tsx
        <TabsContent value="webchat" className="mt-4">
          <WebChatTab company={company} />
        </TabsContent>
```

- [ ] **Step 4: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -15
```

Expected: 0 errors, build green. Confirm lazy chunk includes the new WebChatTab (it's part of company-detail-page chunk since eager).

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/
git commit -m "$(cat <<'EOF'
feat(webchat): WebChatTab shell + 12th tab in company detail

Tab includes slug readonly card, placeholders for brand/logo config
+ WP plugin + universal embed sections (filled in next commits),
and a B17 cross-link banner for visitor verify-fail stats.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T3 — Config card (C3)

### Task 3: WebChatConfigCard (brand color + logo URL form)

**Files:**
- Create: `src/features/companies/components/webchat-config-card.tsx`
- Modify: `src/features/companies/components/webchat-tab.tsx` (replace placeholder)

- [ ] **Step 1: Read agent-settings-card.tsx for migration source**

Run: `Read src/features/companies/components/agent-settings-card.tsx`

Note exactly how `brandColor` + `logoUrl` are wired today:
- Where state is declared (likely `useState<string>` near lines 42-50)
- Where form inputs render (lines 201-217 area)
- Where the mutation submit payload is built (likely a `handleSave` or similar around line 80-90)
- The `useUpdateCompany` import and how it's called

We mirror this exact pattern in the new file.

- [ ] **Step 2: Create WebChatConfigCard**

Create `src/features/companies/components/webchat-config-card.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUpdateCompany } from '../hooks/use-company'
import type { Company } from '../types'

interface WebChatConfigCardProps {
  company: Company
}

export function WebChatConfigCard({ company }: WebChatConfigCardProps) {
  const updateCompany = useUpdateCompany(company.id)
  const [brandColor, setBrandColor] = useState<string>(company.brandColor ?? '#000000')
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl ?? '')

  // Sync local state when company prop changes (after mutation refetch)
  useEffect(() => {
    setBrandColor(company.brandColor ?? '#000000')
    setLogoUrl(company.logoUrl ?? '')
  }, [company.brandColor, company.logoUrl])

  const hasChanges =
    brandColor !== (company.brandColor ?? '#000000') ||
    logoUrl !== (company.logoUrl ?? '')

  function handleSave() {
    updateCompany.mutate(
      {
        brandColor: brandColor || null,
        logoUrl: logoUrl || null,
      },
      {
        onSuccess: () => toast.success('Kaydedildi'),
        onError: () => toast.error('Kaydedilemedi'),
      }
    )
  }

  function handleReset() {
    setBrandColor(company.brandColor ?? '#000000')
    setLogoUrl(company.logoUrl ?? '')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Marka ve Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brandColor">Marka Rengi</Label>
          <Input
            id="brandColor"
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-32"
          />
          <p className="text-xs text-muted-foreground">
            Widget bubble + header rengi (hex #RRGGBB). Backend yalnızca 6-hane hex kabul eder.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            https URL (max 500 karakter). Boş bırakırsanız logosuz görünür.
          </p>
        </div>

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Sıfırla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
              {updateCompany.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

(Adapt to existing `useUpdateCompany` signature. If it returns a different mutation shape, match it.)

- [ ] **Step 3: Wire into WebChatTab**

In `src/features/companies/components/webchat-tab.tsx`:

Add import:
```tsx
import { WebChatConfigCard } from './webchat-config-card'
```

Replace the placeholder `<div data-placeholder="webchat-config-card">{/* Task 3 */}</div>` with:
```tsx
<WebChatConfigCard company={company} />
```

- [ ] **Step 4: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 0 errors. If `Company` type missing `brandColor` or `logoUrl` (it shouldn't — sub-1 added them at commit fa83329), fix the type first.

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/components/
git commit -m "$(cat <<'EOF'
feat(webchat): WebChatConfigCard for brand color + logo URL

New WebChat tab section hosts brand+logo form. Reuses existing
useUpdateCompany mutation. agent-settings-card will lose these
fields in the next commit (migration).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T4 — Migration delete (C4)

### Task 4: Remove brandColor + logoUrl from agent-settings-card

**Files:**
- Modify: `src/features/companies/components/agent-settings-card.tsx`

- [ ] **Step 1: Read the file end-to-end**

Run: `Read src/features/companies/components/agent-settings-card.tsx`

Locate ALL references to `brandColor` and `logoUrl`:
- State declarations (`useState`)
- `useEffect` sync (if present)
- Form input render blocks (lines 201-217 area per prior review)
- `handleSave` payload object
- `hasChanges` derivation
- `handleReset` function
- Any other touch

- [ ] **Step 2: Delete brandColor + logoUrl across all touchpoints**

For each:
- State: remove `const [brandColor, setBrandColor] = useState(...)` and `const [logoUrl, setLogoUrl] = useState(...)`
- useEffect: remove `setBrandColor(...)` and `setLogoUrl(...)` calls; if useEffect becomes empty, remove the entire useEffect
- Form render: remove the `<div className="space-y-2"><Label ... brandColor>...</div>` and `<div ... logoUrl>...</div>` JSX blocks
- handleSave payload: remove `brandColor` and `logoUrl` fields from the object passed to `updateCompany.mutate(...)`
- hasChanges: remove `brandColor !== company.brandColor` and `logoUrl !== company.logoUrl` comparisons
- handleReset: remove resetters for those two fields

- [ ] **Step 3: Verify card title still makes sense**

Read the file's Card title (likely "Agent Ayarları" or "Operasyon Ayarları"). After removal, the card contains operational fields (trustLevel, autoApproveThreshold, timeouts, budget, timezone). If the title still applies, leave it. If it referenced "Marka" or "Görünüm", retitle to "Agent Ayarları".

- [ ] **Step 4: Verify TS**

Run: `npx tsc -b 2>&1 | tail -10`

Expected: 0 errors. If TS fails, a reference was missed — re-grep `brandColor\|logoUrl` in the file:

`grep -n "brandColor\|logoUrl" src/features/companies/components/agent-settings-card.tsx`

Expected: 0 matches.

- [ ] **Step 5: Commit**

```bash
git add src/features/companies/components/agent-settings-card.tsx
git commit -m "$(cat <<'EOF'
refactor(companies): remove brand+logo from agent-settings-card

These fields moved to the new WebChat tab (single source of truth).
Card now hosts only agent operational settings (trust, timeouts,
budget, timezone).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T5 — Section A: WP plugin (C5)

### Task 5: WpPluginSection (download + install steps + version)

**Files:**
- Create: `src/features/companies/components/wp-plugin-section.tsx`
- Modify: `src/features/companies/components/webchat-tab.tsx` (replace placeholder)

- [ ] **Step 1: Create WpPluginSection**

Create `src/features/companies/components/wp-plugin-section.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'
import { useWpPluginVersion } from '../hooks/use-wp-plugin-version'

interface WpPluginSectionProps {
  slug: string
}

export function WpPluginSection({ slug }: WpPluginSectionProps) {
  const { data, isLoading } = useWpPluginVersion()

  const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
  const zipUrl = data?.downloadUrlTemplate
    ? data.downloadUrlTemplate.replace('{slug}', slug)
    : `${base}/public/wp-plugin/by-slug/${slug}/edfu-chat.zip`

  const isAvailable = data?.available ?? true

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">WordPress Plugin</CardTitle>
        {data && (
          <Badge variant="outline" className="text-xs">
            v{data.version} (WP {data.requires_at_least}+)
          </Badge>
        )}
        {!data && !isLoading && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Plugin version bilgisi alınamadı
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button asChild disabled={!isAvailable}>
            <a href={zipUrl} download>
              <Download className="h-4 w-4 mr-2" />
              .zip indir
            </a>
          </Button>
          {!isAvailable && (
            <p className="text-xs text-muted-foreground mt-2">
              Şu an indirilebilir değil.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Kurulum:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>WP admin {`>`} Plugins {`>`} Add New {`>`} Upload Plugin</li>
            <li>İndirdiğin <code>edfu-chat-{slug}.zip</code> dosyasını seç</li>
            <li>Install Now → Activate</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Wire into WebChatTab**

In `src/features/companies/components/webchat-tab.tsx`:

Add import:
```tsx
import { WpPluginSection } from './wp-plugin-section'
```

Replace `<div data-placeholder="wp-plugin-section">{/* Task 5 */}</div>` with:
```tsx
<WpPluginSection slug={company.slug} />
```

- [ ] **Step 3: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -15
```

Expected: 0 errors, build green.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/
git commit -m "$(cat <<'EOF'
feat(webchat): WpPluginSection with .zip download

Section A of the WebChat tab. Reads version.json for current plugin
metadata, builds the slug-templated download URL, shows install
steps. .zip download is an anchor element (no fetch — browser
direct download). Available:false in version.json disables button.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T6 — Section B: Universal embed (C6)

### Task 6: UniversalEmbedSection (3-tab snippet + copy)

**Files:**
- Create: `src/features/companies/components/universal-embed-section.tsx`
- Modify: `src/features/companies/components/webchat-tab.tsx` (replace placeholder)

- [ ] **Step 1: Create UniversalEmbedSection**

Create `src/features/companies/components/universal-embed-section.tsx`:

```tsx
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useWpPluginVersion } from '../hooks/use-wp-plugin-version'

interface UniversalEmbedSectionProps {
  slug: string
}

function buildSnippets(scriptUrl: string) {
  return {
    html: `<script src="${scriptUrl}"></script>`,
    next: `import Script from 'next/script';

<Script src="${scriptUrl}" strategy="afterInteractive" />`,
    vue: `<script setup>
import { onMounted } from 'vue';
onMounted(() => {
  const s = document.createElement('script');
  s.src = '${scriptUrl}';
  document.body.appendChild(s);
});
</script>`,
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Kopyalandı')
  } catch {
    toast.error('Kopyalama başarısız — manuel seç')
  }
}

export function UniversalEmbedSection({ slug }: UniversalEmbedSectionProps) {
  const { data } = useWpPluginVersion()

  const scriptUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
    return data?.embedScriptUrlTemplate
      ? data.embedScriptUrlTemplate.replace('{slug}', slug)
      : `${base}/public/wp-plugin/by-slug/${slug}/edfu-chat.js`
  }, [data?.embedScriptUrlTemplate, slug])

  const snippets = useMemo(() => buildSnippets(scriptUrl), [scriptUrl])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Universal Embed</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          WordPress dışındaki siteler için tek satır embed.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="next">Next.js</TabsTrigger>
            <TabsTrigger value="vue">Vue</TabsTrigger>
          </TabsList>

          {(['html', 'next', 'vue'] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-3">
              <div className="relative">
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto">
                  <code>{snippets[key]}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(snippets[key])}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Kopyala
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Wire into WebChatTab**

In `src/features/companies/components/webchat-tab.tsx`:

Add import:
```tsx
import { UniversalEmbedSection } from './universal-embed-section'
```

Replace `<div data-placeholder="universal-embed-section">{/* Task 6 */}</div>` with:
```tsx
<UniversalEmbedSection slug={company.slug} />
```

- [ ] **Step 3: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -15
```

Expected: 0 errors, build green.

- [ ] **Step 4: Commit**

```bash
git add src/features/companies/components/
git commit -m "$(cat <<'EOF'
feat(webchat): UniversalEmbedSection with HTML/Next/Vue snippets

Section B of the WebChat tab. 3-tab snippet preview with clipboard
copy button per tab. Template URL sourced from version.json
embedScriptUrlTemplate (fallback hardcoded). navigator.clipboard
with sonner toast feedback.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## T7 — Settings Web Channel + final verify (C7)

### Task 7: WebChannelSection in /settings + final verify

**Files:**
- Create: `src/features/settings/components/web-channel-section.tsx`
- Modify: `src/features/settings/components/settings-nav.tsx` (add nav item — verify file path first)
- Modify: `src/features/settings/pages/settings-page.tsx` (add activeSection branch)

- [ ] **Step 1: Read settings page + nav**

Run:
```
Read src/features/settings/pages/settings-page.tsx
Read src/features/settings/components/settings-nav.tsx
```

Confirm:
- `activeSection` state type (likely `string` or a union)
- `SettingsNav` props (likely `{activeSection, onSelect, configuredSections?}`)
- The conditional ladder pattern (`activeSection === 'pricingPlans' ? <X /> : ...`)
- Where to insert a new branch — typically at the end of the chain or in the "default" else branch

If `SettingsNav` is at a different path, grep first: `grep -rn "function SettingsNav\|const SettingsNav" src/features/settings/`

- [ ] **Step 2: Create WebChannelSection**

Create `src/features/settings/components/web-channel-section.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'

export function WebChannelSection() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">WebChat Embed Kill-Switch</CardTitle>
          <Badge variant="outline" className="text-xs">ENV-managed</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                <code>WEBCHAT_EMBED_ENABLED</code> ortam değişkeni Coolify env panelinden yönetilir.
                Değer <code>false</code> ya da <code>0</code> ise embed-mode mesajlaşma 503 döner;
                cookie-mode WebChat çalışmaya devam eder.
              </p>
              <p>
                Statü göstergesi için backend admin endpoint'i henüz yok — Sprint B follow-up.
                Mevcut değer Coolify env panelinde görüntülenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">İlgili Dokümantasyon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Per-tenant WebChat config: Şirket detay → WebChat sekmesi</p>
          <p>• Visitor verify-fail stats: Sprint B17 follow-up</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Add nav item in SettingsNav**

In `src/features/settings/components/settings-nav.tsx`, find the items array (likely an array of `{key, label}` objects or a similar list).

Add (placement: at the end or grouped logically):
```ts
{ key: 'webChannel', label: 'Web Channel' },
```

Match the exact shape of existing items (some may have additional fields like `description`).

- [ ] **Step 4: Add activeSection branch in settings-page.tsx**

In `src/features/settings/pages/settings-page.tsx`, find the conditional ladder (around line 226+).

Add a branch before the final `else` (which likely renders the default block-config form):

```tsx
        ) : activeSection === 'webChannel' ? (
          <WebChannelSection />
```

Add import at top:
```tsx
import { WebChannelSection } from '../components/web-channel-section'
```

- [ ] **Step 5: Verify TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -20
```

Expected: 0 errors, build green. Note the bundle size delta — should be < 10 kB raw total across all 7 commits.

- [ ] **Step 6: Grep regression checks**

Run:
```
grep -rn "brandColor\|logoUrl" src/features/companies/components/agent-settings-card.tsx
grep -rn "brandColor\|logoUrl" src/features/companies/components/webchat-config-card.tsx
```

Expected:
- agent-settings-card.tsx → 0 matches
- webchat-config-card.tsx → multiple matches (form fields)

- [ ] **Step 7: Commit**

```bash
git add src/features/settings/
git commit -m "$(cat <<'EOF'
feat(settings): WebChannelSection kill-switch placeholder

New /settings section: ENV-managed kill-switch info card.
WEBCHAT_EMBED_ENABLED currently set in Coolify; backend admin
endpoint for FE-side status display deferred to Sprint B.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Final verify

### Task 8: Build + manual smoke + push

- [ ] **Step 1: Full TS + build**

Run:
```
npx tsc -b 2>&1 | tail -10
npm run build 2>&1 | tail -25
```

Expected: 0 errors. Bundle delta < 10 kB raw vs prior `cbc8f76`.

- [ ] **Step 2: Manual browser smoke (dev mode)**

Run: `npm run dev` (background)

Walk through spec §6 7-step checklist:
1. `/companies/:id` → 12. tab "WebChat" görünür ve clickable
2. Brand color picker change → "Kaydet" → 200 toast → reload → değer persist
3. Logo URL input change → "Kaydet" → 200 toast → reload → persist
4. `/companies/:id?tab=config` → agent-settings-card'da brand/logo YOK
5. WebChat tab: WP plugin section version badge "v1.0.0", `.zip indir` btn `href` doğru URL (DevTools inspect)
6. WebChat tab: Universal embed 3-tab snippet render; "Kopyala" → toast + clipboard içerik snippet'le eşleşir
7. `/settings` → SettingsNav'da "Web Channel" item; tıklayınca section "ENV-managed" badge görünür

Eksiklik varsa fix commit + tekrar smoke.

- [ ] **Step 3: Push origin/main**

```bash
git push origin main 2>&1 | tail -5
```

- [ ] **Step 4: Update memory**

Append `project_sub2_webchat_recap.md` to user memory + update `MEMORY.md` index + `project_next_session_todo.md` (mark sub-2 shipped, sub-3 next).

---

## Acceptance criteria

- [ ] 7 commits land on main (C1 through C7)
- [ ] `tsc -b` returns 0 errors
- [ ] `vite build` green, bundle delta < 10 kB raw
- [ ] 7-step browser smoke checklist passes
- [ ] `grep -rn "brandColor\|logoUrl" src/features/companies/components/agent-settings-card.tsx` → 0 matches (migration complete)
- [ ] WebChat tab is the single source of truth for brand/logo
- [ ] Settings page has new "Web Channel" navigation item

---

## Reference cards

**Existing patterns to reuse:**
- Tabs primitive: `@/components/ui/tabs` — see `src/features/companies/pages/company-detail-page.tsx`
- Card pattern: `src/features/companies/components/agent-settings-card.tsx` (source of truth pattern)
- Settings nav + activeSection ladder: `src/features/settings/pages/settings-page.tsx:178-271`
- Clipboard pattern: `email-templates`, `playbook-admin`, `service-accounts` already use `navigator.clipboard.writeText`
- queryKey factory: `src/lib/query-keys.ts`
- MSW handler: single-file `src/mocks/handlers.ts`, comment-organized sections
- Sub-1 brand/logo wire (the source we migrate): commit `fa83329`

**Backend doc references:**
- Sub scope: `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/23-webchat-publicchat.md` §11
- WP plugin endpoints: `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/26-wp-plugin.md` §1-§4, §8
- B17 deferred note: `/Users/keremkaya/Desktop/firma/ai-rag-template/docs/frontend-admin/05b-visitor-session-stats.md`

**Out-of-scope reminders (do NOT expand):**
- Visitor verify-fail dashboard (B17, no backend endpoint)
- Kill-switch toggle action (env-only)
- Live preview iframe (sub-5 TODO)
- Domain whitelist / CORS opt-in
- Plugin version comparison
- `language` field on Company (B29 persist gap)
