# Superadmin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React SPA superadmin dashboard with shadcn/ui for managing companies, configs, users, and usage/cost tracking.

**Architecture:** Feature-based folder structure with 4 features (auth, dashboard, companies, settings). TanStack Query for server state, React Router v6 for routing, React Hook Form + Zod for forms. Collapsed icon sidebar layout, dark mode only.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Table, React Router v6, React Hook Form, Zod, Recharts, Lucide Icons, Sonner (toast)

---

## File Structure

```
src/
  features/
    auth/
      components/login-form.tsx
      hooks/use-auth.ts
      hooks/use-login.ts
      pages/login-page.tsx
      types.ts
    dashboard/
      components/kpi-card.tsx
      components/cost-trend-chart.tsx
      components/category-breakdown.tsx
      hooks/use-platform-summary.ts
      pages/dashboard-page.tsx
    companies/
      components/company-table.tsx
      components/company-header.tsx
      components/create-company-dialog.tsx
      components/usage-tab.tsx
      components/usage-chart.tsx
      components/config-tab.tsx
      components/config-accordion.tsx
      components/users-tab.tsx
      components/invite-dialog.tsx
      components/csv-import-dialog.tsx
      hooks/use-companies.ts
      hooks/use-company.ts
      hooks/use-company-config.ts
      hooks/use-company-users.ts
      hooks/use-company-usage.ts
      pages/companies-page.tsx
      pages/company-detail-page.tsx
      types.ts
    settings/
      components/settings-nav.tsx
      components/config-section.tsx
      components/pricing-form.tsx
      hooks/use-platform-defaults.ts
      pages/settings-page.tsx
      types.ts
  components/
    ui/                              → shadcn components (added via CLI)
    layout/
      app-layout.tsx
      sidebar.tsx
      auth-guard.tsx
  lib/
    api-client.ts
    query-keys.ts
    utils.ts
    validations.ts
  App.tsx
  main.tsx
  index.css
.env
.env.example
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env`, `.env.example`, `components.json`

- [ ] **Step 1: Create Vite project with React + TypeScript**

```bash
cd /Users/keremkaya/Desktop/firma/ai-rag-super-admin
pnpm create vite . --template react-ts
```

Select: React, TypeScript when prompted. If the directory is not empty, confirm overwrite.

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add react-router-dom @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod recharts lucide-react sonner axios
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind CSS**

Replace `src/index.css` with:

```css
@import "tailwindcss";
```

Update `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Update `tsconfig.json` — add to `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Update `tsconfig.app.json` — add to `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
pnpm dlx shadcn@latest init
```

When prompted:
- Style: New York
- Base color: Zinc
- CSS variables: yes

Then force dark mode only. Edit `src/index.css` — after the shadcn imports, add:

```css
html {
  color-scheme: dark;
}
```

Also edit `index.html` to add `class="dark"` to the `<html>` tag:

```html
<html lang="en" class="dark">
```

- [ ] **Step 5: Add shadcn components we'll need**

```bash
pnpm dlx shadcn@latest add button input label card dialog dropdown-menu table tabs accordion badge separator tooltip select form toast chart sonner
```

- [ ] **Step 6: Create environment files**

Create `.env`:
```
VITE_API_URL=http://localhost:3000
```

Create `.env.example`:
```
VITE_API_URL=http://localhost:3000
```

Add `.env` to `.gitignore` (append to existing):
```
.env
.env.local
node_modules
dist
```

- [ ] **Step 7: Create minimal App.tsx placeholder**

```tsx
function App() {
  return <div className="min-h-screen bg-background text-foreground">Super Admin</div>
}

export default App
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```

Expected: App loads at localhost:5173 with dark background and "Super Admin" text.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + shadcn/ui project"
```

---

### Task 2: Utility Layer (API Client, Helpers, Query Keys)

**Files:**
- Create: `src/lib/api-client.ts`, `src/lib/utils.ts` (extend shadcn's), `src/lib/query-keys.ts`

- [ ] **Step 1: Create API client with auth interceptor**

Create `src/lib/api-client.ts`:

```ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

- [ ] **Step 2: Add formatting utilities to utils.ts**

The file `src/lib/utils.ts` should already exist from shadcn init (with `cn`). Append these:

```ts
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function formatBytes(bytes: number): string {
  const gb = bytes / 1e9
  return `${gb.toFixed(2)} GB`
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
```

- [ ] **Step 3: Create query key factory**

Create `src/lib/query-keys.ts`:

```ts
export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    detail: (id: string) => ['companies', id] as const,
    config: (id: string) => ['companies', id, 'config'] as const,
    users: (id: string) => ['companies', id, 'users'] as const,
    usage: (id: string, months: number) => ['companies', id, 'usage', months] as const,
    usageCurrent: (id: string) => ['companies', id, 'usage', 'current'] as const,
  },
  platform: {
    summary: (months: number) => ['platform', 'summary', months] as const,
    defaults: ['platform', 'defaults'] as const,
  },
}
```

- [ ] **Step 4: Verify build passes**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api-client.ts src/lib/utils.ts src/lib/query-keys.ts
git commit -m "feat: add API client, formatting utils, query key factory"
```

---

### Task 3: Auth Feature (Login + AuthGuard)

**Files:**
- Create: `src/features/auth/types.ts`, `src/features/auth/hooks/use-auth.ts`, `src/features/auth/hooks/use-login.ts`, `src/features/auth/components/login-form.tsx`, `src/features/auth/pages/login-page.tsx`, `src/components/layout/auth-guard.tsx`

- [ ] **Step 1: Create auth types**

Create `src/features/auth/types.ts`:

```ts
export interface User {
  id: string
  email: string
  name: string
  isPlatformAdmin: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
```

- [ ] **Step 2: Create useAuth hook**

Create `src/features/auth/hooks/use-auth.ts`:

```ts
import { useState, useEffect, useCallback } from 'react'
import type { User } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token')
  })

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user

  return { user, token, isAuthenticated, login, logout }
}
```

- [ ] **Step 3: Create useLogin mutation hook**

Create `src/features/auth/hooks/use-login.ts`:

```ts
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { LoginRequest, LoginResponse } from '../types'

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post('/auth/login', data)
      return response.data
    },
  })
}
```

- [ ] **Step 4: Create LoginForm component**

Create `src/features/auth/components/login-form.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useLogin } from '../hooks/use-login'
import { useAuth } from '../hooks/use-auth'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const loginMutation = useLogin()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setError(null)
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        if (!data.user.isPlatformAdmin) {
          setError('Bu hesap platform admin yetkisine sahip değil.')
          return
        }
        login(data.token, data.user)
        navigate('/')
      },
      onError: () => {
        setError('Email veya şifre hatalı.')
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@firma.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 5: Create LoginPage**

Create `src/features/auth/pages/login-page.tsx`:

```tsx
import { LoginForm } from '../components/login-form'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-extrabold text-primary-foreground">S</span>
          </div>
          <h1 className="text-lg font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">Platform yönetim paneli</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-5 text-base font-semibold">Giriş Yap</h2>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Platform Admin erişimi gereklidir
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create AuthGuard**

Create `src/components/layout/auth-guard.tsx`:

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'

export function AuthGuard() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/ src/components/layout/auth-guard.tsx
git commit -m "feat: add auth feature with login form and auth guard"
```

---

### Task 4: Layout (Sidebar + App Shell)

**Files:**
- Create: `src/components/layout/sidebar.tsx`, `src/components/layout/app-layout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Settings, LogOut } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Şirketler' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
]

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-screen w-14 flex-col items-center border-r bg-card py-4">
        {/* Logo */}
        <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-extrabold text-primary-foreground">S</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Logout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Çıkış</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Create AppLayout**

Create `src/components/layout/app-layout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Wire up routing in App.tsx**

Replace `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from '@/components/layout/auth-guard'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/features/auth/pages/login-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div>Dashboard</div>} />
              <Route path="/companies" element={<div>Companies</div>} />
              <Route path="/companies/:id" element={<div>Company Detail</div>} />
              <Route path="/settings" element={<div>Settings</div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
```

- [ ] **Step 4: Verify — login page renders, sidebar shows on placeholder routes**

```bash
pnpm dev
```

Expected: `/login` shows login form. After faking a token in localStorage (`localStorage.setItem('auth_token','test'); localStorage.setItem('auth_user','{"id":"1","email":"a@b.com","name":"Test","isPlatformAdmin":true}')`) and navigating to `/`, sidebar with icons is visible and placeholder text shows.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/App.tsx
git commit -m "feat: add sidebar layout and routing setup"
```

---

### Task 5: Dashboard Feature

**Files:**
- Create: `src/features/dashboard/hooks/use-platform-summary.ts`, `src/features/dashboard/components/kpi-card.tsx`, `src/features/dashboard/components/cost-trend-chart.tsx`, `src/features/dashboard/components/category-breakdown.tsx`, `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] **Step 1: Create usePlatformSummary hook**

Create `src/features/dashboard/hooks/use-platform-summary.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

interface UsageMonth {
  month: string
  companyCount: number
  ai: { totalTokens: number; costUsd: number }
  storage: { totalBytes: number; costUsd: number }
  cdn: { transferBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}

interface PlatformSummary {
  months: UsageMonth[]
}

export function usePlatformSummary(months: number = 6) {
  return useQuery({
    queryKey: queryKeys.platform.summary(months),
    queryFn: async (): Promise<PlatformSummary> => {
      const { data } = await apiClient.get(`/platform/usage/summary?months=${months}`)
      return data
    },
  })
}
```

- [ ] **Step 2: Create KpiCard component**

Create `src/features/dashboard/components/kpi-card.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  subtitleColor?: string
}

export function KpiCard({ label, value, subtitle, subtitleColor }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className={`mt-1 text-xs ${subtitleColor ?? 'text-muted-foreground'}`}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create CostTrendChart**

Create `src/features/dashboard/components/cost-trend-chart.tsx`:

```tsx
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthData {
  month: string
  totalCostUsd: number
}

interface CostTrendChartProps {
  data: MonthData[]
}

export function CostTrendChart({ data }: CostTrendChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5), // "2026-03" -> "03"
    cost: d.totalCostUsd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aylık Maliyet Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Maliyet']}
              contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
            />
            <Bar dataKey="cost" fill="#6d28d9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create CategoryBreakdown**

Create `src/features/dashboard/components/category-breakdown.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface CategoryBreakdownProps {
  ai: number
  cdn: number
  storage: number
  trigger: number
}

const categories = [
  { key: 'ai' as const, label: 'AI', color: '#6d28d9' },
  { key: 'cdn' as const, label: 'CDN', color: '#3b82f6' },
  { key: 'storage' as const, label: 'Storage', color: '#22c55e' },
  { key: 'trigger' as const, label: 'Trigger', color: '#f59e0b' },
]

export function CategoryBreakdown({ ai, cdn, storage, trigger }: CategoryBreakdownProps) {
  const values = { ai, cdn, storage, trigger }
  const max = Math.max(ai, cdn, storage, trigger, 0.01)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Kategori Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-semibold">{formatCurrency(values[cat.key])}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((values[cat.key] / max) * 100, 1)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create DashboardPage**

Create `src/features/dashboard/pages/dashboard-page.tsx`:

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlatformSummary } from '../hooks/use-platform-summary'
import { KpiCard } from '../components/kpi-card'
import { CostTrendChart } from '../components/cost-trend-chart'
import { CategoryBreakdown } from '../components/category-breakdown'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function DashboardPage() {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = usePlatformSummary(months)

  const current = data?.months[0]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview</p>
        </div>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor...</div>
      ) : current ? (
        <>
          <div className="mb-6 grid grid-cols-4 gap-3">
            <KpiCard label="Toplam Şirket" value={String(current.companyCount)} />
            <KpiCard label="Toplam Maliyet" value={formatCurrency(current.totalCostUsd)} />
            <KpiCard label="AI Token" value={formatNumber(current.ai.totalTokens)} subtitle={formatCurrency(current.ai.costUsd)} />
            <KpiCard label="Storage" value={formatBytes(current.storage.totalBytes)} subtitle={formatCurrency(current.storage.costUsd)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CostTrendChart data={data!.months} />
            <CategoryBreakdown
              ai={current.ai.costUsd}
              cdn={current.cdn.costUsd}
              storage={current.storage.costUsd}
              trigger={current.trigger.costUsd}
            />
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Wire DashboardPage into App.tsx routing**

In `src/App.tsx`, replace the dashboard placeholder route:

```tsx
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
// ...
<Route path="/" element={<DashboardPage />} />
```

- [ ] **Step 7: Verify — dashboard renders with loading state**

```bash
pnpm dev
```

Expected: Dashboard page shows KPI cards, chart, and breakdown (loading state if no backend).

- [ ] **Step 8: Commit**

```bash
git add src/features/dashboard/
git commit -m "feat: add dashboard page with KPI cards, trend chart, category breakdown"
```

---

### Task 6: Companies List Feature

**Files:**
- Create: `src/features/companies/types.ts`, `src/features/companies/hooks/use-companies.ts`, `src/features/companies/hooks/use-company-usage.ts`, `src/features/companies/components/company-table.tsx`, `src/features/companies/components/create-company-dialog.tsx`, `src/features/companies/pages/companies-page.tsx`

- [ ] **Step 1: Create company types**

Create `src/features/companies/types.ts`:

```ts
export interface Company {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CompanyUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  companyId: string
  isActive: boolean
  isPlatformAdmin: boolean
  createdAt: string
}

export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  storage: { currentBytes: number; costUsd: number }
  cdn: { transferBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}

export interface CompanyUsage {
  companyId: string
  companyName: string
  months: UsageMonth[]
}
```

- [ ] **Step 2: Create useCompanies hook**

Create `src/features/companies/hooks/use-companies.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: async (): Promise<Company[]> => {
      const { data } = await apiClient.get('/platform/companies')
      return data
    },
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<Company> => {
      const { data } = await apiClient.post('/platform/companies', { name })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
```

- [ ] **Step 3: Create useCompanyUsage hook (for current month per company)**

Create `src/features/companies/hooks/use-company-usage.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { UsageMonth } from '../types'

export function useCompanyUsageCurrent(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.usageCurrent(companyId),
    queryFn: async (): Promise<UsageMonth> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/usage/current`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useCompanyUsage(companyId: string, months: number = 6) {
  return useQuery({
    queryKey: queryKeys.companies.usage(companyId, months),
    queryFn: async () => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/usage?months=${months}`)
      return data
    },
    enabled: !!companyId,
  })
}
```

- [ ] **Step 4: Create CompanyTable component**

Create `src/features/companies/components/company-table.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { Company } from '../types'

interface CompanyWithUsage extends Company {
  aiCost?: number
  cdnCost?: number
  storageCost?: number
  triggerCost?: number
  totalCost?: number
}

const columns: ColumnDef<CompanyWithUsage>[] = [
  {
    accessorKey: 'name',
    header: 'Şirket Adı',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-bold text-primary">
            {getInitials(name)}
          </div>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Oluşturulma',
    cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.getValue('createdAt'))}</span>,
  },
  {
    accessorKey: 'aiCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-violet-400" onClick={() => column.toggleSorting()}>
        AI <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-violet-400">{formatCurrency(row.getValue('aiCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'cdnCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-blue-400" onClick={() => column.toggleSorting()}>
        CDN <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-blue-400">{formatCurrency(row.getValue('cdnCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'storageCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-green-400" onClick={() => column.toggleSorting()}>
        Storage <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-green-400">{formatCurrency(row.getValue('storageCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'triggerCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="text-yellow-400" onClick={() => column.toggleSorting()}>
        Trigger <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-yellow-400">{formatCurrency(row.getValue('triggerCost') ?? 0)}</span>,
  },
  {
    accessorKey: 'totalCost',
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="font-semibold" onClick={() => column.toggleSorting()}>
        Toplam <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.getValue('totalCost') ?? 0)}</span>,
  },
]

interface CompanyTableProps {
  data: CompanyWithUsage[]
  isLoading: boolean
}

export function CompanyTable({ data, isLoading }: CompanyTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
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
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">Şirket bulunamadı.</TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/companies/${row.original.id}`)}
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

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          / {data.length} şirket
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            ‹
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            ›
          </Button>
        </div>
      </div>
    </div>
  )
}

export type { CompanyWithUsage }
```

- [ ] **Step 5: Create CreateCompanyDialog**

Create `src/features/companies/components/create-company-dialog.tsx`:

```tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useCreateCompany } from '../hooks/use-companies'
import { toast } from 'sonner'

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const createCompany = useCreateCompany()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createCompany.mutate(name.trim(), {
      onSuccess: () => {
        toast.success('Şirket oluşturuldu')
        setName('')
        setOpen(false)
      },
      onError: () => {
        toast.error('Şirket oluşturulamadı')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Yeni Şirket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Şirket Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Şirket Adı</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Firma adı" autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={createCompany.isPending}>
              {createCompany.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 6: Create CompaniesPage**

Create `src/features/companies/pages/companies-page.tsx`:

```tsx
import { useCompanies } from '../hooks/use-companies'
import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { CompanyTable, type CompanyWithUsage } from '../components/company-table'
import { CreateCompanyDialog } from '../components/create-company-dialog'

export function CompaniesPage() {
  const { data: companies, isLoading: companiesLoading } = useCompanies()

  const usageQueries = useQueries({
    queries: (companies ?? []).map((c) => ({
      queryKey: queryKeys.companies.usageCurrent(c.id),
      queryFn: async () => {
        const { data } = await apiClient.get(`/platform/companies/${c.id}/usage/current`)
        return { companyId: c.id, ...data }
      },
      enabled: !!companies,
    })),
  })

  const tableData: CompanyWithUsage[] = (companies ?? []).map((c) => {
    const usage = usageQueries.find((q) => q.data?.companyId === c.id)?.data
    return {
      ...c,
      aiCost: usage?.ai?.costUsd ?? 0,
      cdnCost: usage?.cdn?.costUsd ?? 0,
      storageCost: usage?.storage?.costUsd ?? 0,
      triggerCost: usage?.trigger?.costUsd ?? 0,
      totalCost: usage?.totalCostUsd ?? 0,
    }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Şirketler</h1>
          <p className="text-sm text-muted-foreground">{companies?.length ?? 0} şirket</p>
        </div>
        <CreateCompanyDialog />
      </div>
      <CompanyTable data={tableData} isLoading={companiesLoading} />
    </div>
  )
}
```

- [ ] **Step 7: Wire CompaniesPage into App.tsx**

In `src/App.tsx`, replace the companies placeholder:

```tsx
import { CompaniesPage } from '@/features/companies/pages/companies-page'
// ...
<Route path="/companies" element={<CompaniesPage />} />
```

- [ ] **Step 8: Commit**

```bash
git add src/features/companies/types.ts src/features/companies/hooks/ src/features/companies/components/company-table.tsx src/features/companies/components/create-company-dialog.tsx src/features/companies/pages/companies-page.tsx src/App.tsx
git commit -m "feat: add companies list page with cost columns and create dialog"
```

---

### Task 7: Company Detail — Header + Usage Tab

**Files:**
- Create: `src/features/companies/hooks/use-company.ts`, `src/features/companies/components/company-header.tsx`, `src/features/companies/components/usage-tab.tsx`, `src/features/companies/components/usage-chart.tsx`, `src/features/companies/pages/company-detail-page.tsx`

- [ ] **Step 1: Create useCompany hook**

Create `src/features/companies/hooks/use-company.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Company } from '../types'

export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async (): Promise<Company> => {
      const { data } = await apiClient.get(`/platform/companies/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.patch(`/platform/companies/${id}`, { name })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platform/companies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
    },
  })
}
```

- [ ] **Step 2: Create CompanyHeader**

Create `src/features/companies/components/company-header.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { getInitials, formatDate } from '@/lib/utils'
import { useUpdateCompany, useDeleteCompany } from '../hooks/use-company'
import { toast } from 'sonner'
import type { Company } from '../types'

interface CompanyHeaderProps {
  company: Company
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(company.name)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const updateCompany = useUpdateCompany(company.id)
  const deleteCompany = useDeleteCompany()

  function handleSaveName() {
    if (!editName.trim() || editName.trim() === company.name) {
      setEditing(false)
      return
    }
    updateCompany.mutate(editName.trim(), {
      onSuccess: () => {
        toast.success('Şirket adı güncellendi')
        setEditing(false)
      },
    })
  }

  function handleDelete() {
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast.success('Şirket silindi')
        navigate('/companies')
      },
    })
  }

  return (
    <div className="mb-6 flex items-center gap-4 border-b pb-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-lg font-bold text-primary">
        {getInitials(company.name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="h-8 w-64 text-lg font-bold"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-bold">{company.name}</h1>
          )}
          <span className="rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            ID: {company.id.slice(0, 6)}...
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Oluşturulma: {formatDate(company.createdAt)}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { setEditName(company.name); setEditing(true) }}>
          <Pencil className="mr-1 h-3 w-3" /> Düzenle
        </Button>
        <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-1 h-3 w-3" /> Sil
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şirketi Sil</DialogTitle>
            <DialogDescription>
              "{company.name}" şirketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteCompany.isPending}>
              {deleteCompany.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 3: Create UsageChart (stacked bar)**

Create `src/features/companies/components/usage-chart.tsx`:

```tsx
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UsageMonth } from '../types'

interface UsageChartProps {
  data: UsageMonth[]
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    month: d.month.slice(5),
    AI: d.ai.costUsd,
    CDN: d.cdn.costUsd,
    Storage: d.storage.costUsd,
    Trigger: d.trigger.costUsd,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Aylık Maliyet Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} formatter={(v: number) => `$${v.toFixed(2)}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="AI" stackId="a" fill="#6d28d9" />
            <Bar dataKey="CDN" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Storage" stackId="a" fill="#22c55e" />
            <Bar dataKey="Trigger" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create UsageTab**

Create `src/features/companies/components/usage-tab.tsx`:

```tsx
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanyUsage } from '../hooks/use-company-usage'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { UsageChart } from './usage-chart'
import { formatCurrency, formatBytes, formatNumber } from '@/lib/utils'

interface UsageTabProps {
  companyId: string
}

const periodOptions = [
  { value: '1', label: 'Bu Ay' },
  { value: '3', label: 'Son 3 Ay' },
  { value: '6', label: 'Son 6 Ay' },
  { value: '12', label: 'Son 12 Ay' },
]

export function UsageTab({ companyId }: UsageTabProps) {
  const [months, setMonths] = useState(6)
  const { data, isLoading } = useCompanyUsage(companyId, months)

  const current = data?.months?.[0]

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
  if (!current) return <div className="text-sm text-muted-foreground">Veri bulunamadı.</div>

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <KpiCard label="AI" value={formatCurrency(current.ai.costUsd)} subtitle={`${formatNumber(current.ai.totalTokens)} token`} subtitleColor="text-violet-400" />
        <KpiCard label="CDN" value={formatCurrency(current.cdn.costUsd)} subtitle={`${formatBytes(current.cdn.transferBytes)} transfer`} subtitleColor="text-blue-400" />
        <KpiCard label="Storage" value={formatCurrency(current.storage.costUsd)} subtitle={`${formatBytes(current.storage.currentBytes)} kullanım`} subtitleColor="text-green-400" />
        <KpiCard label="Trigger" value={formatCurrency(current.trigger.costUsd)} subtitle={`${formatNumber(current.trigger.taskCount)} task`} subtitleColor="text-yellow-400" />
      </div>

      <UsageChart data={data.months} />
    </div>
  )
}
```

- [ ] **Step 5: Create CompanyDetailPage with tabs (usage wired, others placeholder)**

Create `src/features/companies/pages/company-detail-page.tsx`:

```tsx
import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompany } from '../hooks/use-company'
import { CompanyHeader } from '../components/company-header'
import { UsageTab } from '../components/usage-tab'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: company, isLoading } = useCompany(id!)

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>
  if (!company) return <div className="text-sm text-muted-foreground">Şirket bulunamadı.</div>

  return (
    <div>
      <CompanyHeader company={company} />

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Kullanım</TabsTrigger>
          <TabsTrigger value="config">Konfigürasyon</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
        </TabsList>
        <TabsContent value="usage" className="mt-4">
          <UsageTab companyId={id!} />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <div className="text-sm text-muted-foreground">Konfigürasyon (yakında)</div>
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <div className="text-sm text-muted-foreground">Kullanıcılar (yakında)</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 6: Wire CompanyDetailPage into App.tsx**

In `src/App.tsx`:

```tsx
import { CompanyDetailPage } from '@/features/companies/pages/company-detail-page'
// ...
<Route path="/companies/:id" element={<CompanyDetailPage />} />
```

- [ ] **Step 7: Commit**

```bash
git add src/features/companies/hooks/use-company.ts src/features/companies/components/company-header.tsx src/features/companies/components/usage-tab.tsx src/features/companies/components/usage-chart.tsx src/features/companies/pages/company-detail-page.tsx src/App.tsx
git commit -m "feat: add company detail page with header, usage tab, and stacked chart"
```

---

### Task 8: Company Detail — Config Tab

**Files:**
- Create: `src/lib/validations.ts`, `src/features/companies/hooks/use-company-config.ts`, `src/features/companies/components/config-accordion.tsx`, `src/features/companies/components/config-tab.tsx`

- [ ] **Step 1: Create Zod validation schemas for config blocks**

Create `src/lib/validations.ts`:

```ts
import { z } from 'zod'

export const s3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  keyPrefix: z.string().optional(),
})

export const cdnConfigSchema = z.object({
  enabled: z.boolean().optional(),
  domain: z.string().optional(),
  keyPairId: z.string().optional(),
  privateKey: z.string().optional(),
  ttlSec: z.coerce.number().optional(),
})

export const mailConfigSchema = z.object({
  apiKey: z.string().optional(),
  fromAddress: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().optional(),
})

export const aiConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
  model: z.string().optional(),
  compactionModel: z.string().optional(),
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  requestTimeoutMs: z.coerce.number().optional(),
  budgetUsd: z.coerce.number().optional(),
  fallbackProvider: z.enum(['anthropic', 'openai', 'gemini']).nullable().optional(),
})

export const embeddingConfigSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  dimensions: z.coerce.number().optional(),
})

export const langfuseConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseUrl: z.string().optional(),
})

export const triggerConfigSchema = z.object({
  projectRef: z.string().optional(),
  secretKey: z.string().optional(),
})

export const limitsConfigSchema = z.object({
  maxStorageMb: z.coerce.number().optional(),
  maxFileSizeMb: z.coerce.number().optional(),
  historyTokenBudget: z.coerce.number().optional(),
  compactionTriggerTokens: z.coerce.number().optional(),
})

export const pricingConfigSchema = z.object({
  s3PerGbMonthUsd: z.coerce.number().optional(),
  cdnPerGbTransferUsd: z.coerce.number().optional(),
  triggerPerTaskUsd: z.coerce.number().optional(),
})

export const configBlockSchemas = {
  aiConfig: aiConfigSchema,
  s3Config: s3ConfigSchema,
  cdnConfig: cdnConfigSchema,
  mailConfig: mailConfigSchema,
  embeddingConfig: embeddingConfigSchema,
  langfuseConfig: langfuseConfigSchema,
  triggerConfig: triggerConfigSchema,
  limitsConfig: limitsConfigSchema,
  pricingConfig: pricingConfigSchema,
} as const

export type ConfigBlockKey = keyof typeof configBlockSchemas
```

- [ ] **Step 2: Create useCompanyConfig hook**

Create `src/features/companies/hooks/use-company-config.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function useCompanyConfig(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.config(companyId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/config`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useUpdateCompanyConfig(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      const { data } = await apiClient.put(`/platform/companies/${companyId}/config`, config)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.config(companyId) })
    },
  })
}
```

- [ ] **Step 3: Create ConfigAccordion — reusable config block form**

Create `src/features/companies/components/config-accordion.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import type { z } from 'zod'

interface FieldConfig {
  key: string
  label: string
  type?: 'text' | 'number' | 'password' | 'select' | 'boolean'
  options?: string[]
  placeholder?: string
}

interface ConfigAccordionProps {
  blockKey: ConfigBlockKey
  label: string
  icon: string
  fields: FieldConfig[]
  currentValues: Record<string, unknown> | undefined
  onSave: (blockKey: ConfigBlockKey, values: Record<string, unknown>) => void
  isSaving: boolean
}

export function ConfigAccordion({ blockKey, label, icon, fields, currentValues, onSave, isSaving }: ConfigAccordionProps) {
  const schema = configBlockSchemas[blockKey]
  const hasConfig = currentValues && Object.keys(currentValues).length > 0

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: (currentValues as z.infer<typeof schema>) ?? {},
  })

  function handleSubmit(values: z.infer<typeof schema>) {
    // Filter out empty strings and undefined to avoid overwriting with empty
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    )
    onSave(blockKey, cleaned)
  }

  function isMasked(value: unknown): boolean {
    return typeof value === 'string' && value.includes('****')
  }

  return (
    <AccordionItem value={blockKey} className="rounded-lg border">
      <AccordionTrigger className="rounded-lg bg-card px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant={hasConfig ? 'default' : 'secondary'} className="text-[10px]">
            {hasConfig ? 'Configured' : 'Defaults'}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => {
              const currentVal = currentValues?.[field.key]
              const masked = isMasked(currentVal)

              if (field.type === 'select' && field.options) {
                return (
                  <div key={field.key}>
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    <Select
                      value={form.watch(field.key as never) ?? ''}
                      onValueChange={(v) => form.setValue(field.key as never, v as never)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={masked ? String(currentVal) : 'Seçin'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              }

              return (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <Input
                    {...form.register(field.key as never)}
                    type={field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    placeholder={masked ? String(currentVal) : (field.placeholder ?? '')}
                    className={`mt-1 ${masked ? 'italic text-muted-foreground' : ''}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end border-t pt-3">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </AccordionContent>
    </AccordionItem>
  )
}
```

- [ ] **Step 4: Create ConfigTab**

Create `src/features/companies/components/config-tab.tsx`:

```tsx
import { Accordion } from '@/components/ui/accordion'
import { useCompanyConfig, useUpdateCompanyConfig } from '../hooks/use-company-config'
import { ConfigAccordion } from './config-accordion'
import { toast } from 'sonner'
import type { ConfigBlockKey } from '@/lib/validations'
import { Info } from 'lucide-react'

interface ConfigTabProps {
  companyId: string
}

const configBlocks: { key: ConfigBlockKey; label: string; icon: string; fields: { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[]; placeholder?: string }[] }[] = [
  {
    key: 'aiConfig', label: 'AI Config', icon: '🤖',
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
      { key: 'model', label: 'Model' },
      { key: 'compactionModel', label: 'Compaction Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'requestTimeoutMs', label: 'Timeout (ms)', type: 'number' },
      { key: 'budgetUsd', label: 'Budget (USD)', type: 'number' },
      { key: 'fallbackProvider', label: 'Fallback Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
    ],
  },
  {
    key: 's3Config', label: 'S3 Config', icon: '📦',
    fields: [
      { key: 'bucket', label: 'Bucket' },
      { key: 'region', label: 'Region' },
      { key: 'endpoint', label: 'Endpoint' },
      { key: 'keyPrefix', label: 'Key Prefix' },
    ],
  },
  {
    key: 'cdnConfig', label: 'CDN Config', icon: '🌐',
    fields: [
      { key: 'domain', label: 'Domain' },
      { key: 'keyPairId', label: 'Key Pair ID' },
      { key: 'privateKey', label: 'Private Key' },
      { key: 'ttlSec', label: 'TTL (sn)', type: 'number' },
    ],
  },
  {
    key: 'mailConfig', label: 'Mail Config', icon: '✉️',
    fields: [
      { key: 'apiKey', label: 'API Key' },
      { key: 'fromAddress', label: 'From Address' },
      { key: 'fromName', label: 'From Name' },
      { key: 'replyTo', label: 'Reply To' },
    ],
  },
  {
    key: 'embeddingConfig', label: 'Embedding Config', icon: '🧬',
    fields: [
      { key: 'provider', label: 'Provider' },
      { key: 'model', label: 'Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  {
    key: 'langfuseConfig', label: 'Langfuse Config', icon: '📊',
    fields: [
      { key: 'publicKey', label: 'Public Key' },
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'baseUrl', label: 'Base URL' },
    ],
  },
  {
    key: 'triggerConfig', label: 'Trigger Config', icon: '⚡',
    fields: [
      { key: 'projectRef', label: 'Project Ref' },
      { key: 'secretKey', label: 'Secret Key' },
    ],
  },
  {
    key: 'limitsConfig', label: 'Limits Config', icon: '🚧',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number' },
    ],
  },
  {
    key: 'pricingConfig', label: 'Pricing Config', icon: '💰',
    fields: [
      { key: 's3PerGbMonthUsd', label: 'S3 ($/GB/ay)', type: 'number' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN ($/GB)', type: 'number' },
      { key: 'triggerPerTaskUsd', label: 'Trigger ($/task)', type: 'number' },
    ],
  },
]

export function ConfigTab({ companyId }: ConfigTabProps) {
  const { data: config, isLoading } = useCompanyConfig(companyId)
  const updateConfig = useUpdateCompanyConfig(companyId)

  function handleSave(blockKey: ConfigBlockKey, values: Record<string, unknown>) {
    updateConfig.mutate(
      { [blockKey]: values },
      {
        onSuccess: () => toast.success(`${blockKey} güncellendi`),
        onError: () => toast.error('Kaydetme başarısız'),
      }
    )
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-card p-3">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Boş bırakılan alanlar platform defaults'tan miras alınır. Sadece değiştirmek istediğiniz alanları doldurun.
        </span>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {configBlocks.map((block) => (
          <ConfigAccordion
            key={block.key}
            blockKey={block.key}
            label={block.label}
            icon={block.icon}
            fields={block.fields}
            currentValues={config?.[block.key]}
            onSave={handleSave}
            isSaving={updateConfig.isPending}
          />
        ))}
      </Accordion>
    </div>
  )
}
```

- [ ] **Step 5: Wire ConfigTab into CompanyDetailPage**

In `src/features/companies/pages/company-detail-page.tsx`, replace config placeholder:

```tsx
import { ConfigTab } from '../components/config-tab'
// ...
<TabsContent value="config" className="mt-4">
  <ConfigTab companyId={id!} />
</TabsContent>
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/validations.ts src/features/companies/hooks/use-company-config.ts src/features/companies/components/config-accordion.tsx src/features/companies/components/config-tab.tsx src/features/companies/pages/company-detail-page.tsx
git commit -m "feat: add config tab with accordion forms and Zod validation"
```

---

### Task 9: Company Detail — Users Tab

**Files:**
- Create: `src/features/companies/hooks/use-company-users.ts`, `src/features/companies/components/users-tab.tsx`, `src/features/companies/components/invite-dialog.tsx`, `src/features/companies/components/csv-import-dialog.tsx`

- [ ] **Step 1: Create useCompanyUsers hook**

Create `src/features/companies/hooks/use-company-users.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { CompanyUser } from '../types'

export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.users(companyId),
    queryFn: async (): Promise<CompanyUser[]> => {
      const { data } = await apiClient.get(`/platform/companies/${companyId}/users`)
      return data
    },
    enabled: !!companyId,
  })
}

export function useInviteUser(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; role: 'owner' | 'admin' | 'member' }) => {
      const { data } = await apiClient.post(`/platform/companies/${companyId}/users/invite`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useUpdateUserRole(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await apiClient.patch(`/platform/companies/${companyId}/users/${userId}`, { role })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useDeactivateUser(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/platform/companies/${companyId}/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}

export function useBulkImportUsers(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post(`/platform/companies/${companyId}/users/bulk-import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.users(companyId) })
    },
  })
}
```

- [ ] **Step 2: Create InviteDialog**

Create `src/features/companies/components/invite-dialog.tsx`:

```tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useInviteUser } from '../hooks/use-company-users'
import { toast } from 'sonner'

interface InviteDialogProps {
  companyId: string
}

export function InviteDialog({ companyId }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member')
  const invite = useInviteUser(companyId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success('Davet gönderildi')
          setEmail('')
          setRole('member')
          setOpen(false)
        },
        onError: (err: any) => {
          const code = err.response?.data?.code
          if (code === 'email_already_registered') {
            toast.error('Bu email zaten kayıtlı')
          } else {
            toast.error('Davet gönderilemedi')
          }
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Davet Et
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı Davet Et</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" type="email" />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'owner' | 'admin' | 'member')}>
                <SelectTrigger className="mt-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? 'Gönderiliyor...' : 'Davet Gönder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Create CsvImportDialog**

Create `src/features/companies/components/csv-import-dialog.tsx`:

```tsx
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUp } from 'lucide-react'
import { useBulkImportUsers } from '../hooks/use-company-users'
import { toast } from 'sonner'

interface CsvImportDialogProps {
  companyId: string
}

export function CsvImportDialog({ companyId }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImportUsers(companyId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Lütfen bir CSV dosyası seçin')
      return
    }
    bulkImport.mutate(file, {
      onSuccess: () => {
        toast.success('Kullanıcılar başarıyla import edildi')
        setFile(null)
        setOpen(false)
      },
      onError: () => {
        toast.error('Import başarısız')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileUp className="mr-1 h-4 w-4" /> CSV Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu Kullanıcı Import</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              CSV formatı: email, name, role (max 500 satır)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={bulkImport.isPending || !file}>
              {bulkImport.isPending ? 'Import ediliyor...' : 'Import Et'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Create UsersTab**

Create `src/features/companies/components/users-tab.tsx`:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { useCompanyUsers, useUpdateUserRole, useDeactivateUser } from '../hooks/use-company-users'
import { InviteDialog } from './invite-dialog'
import { CsvImportDialog } from './csv-import-dialog'
import { getInitials, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface UsersTabProps {
  companyId: string
}

const roleBadgeVariants: Record<string, string> = {
  owner: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  admin: 'bg-violet-900/30 text-violet-400 border-violet-800',
  member: 'bg-muted text-muted-foreground border-border',
}

export function UsersTab({ companyId }: UsersTabProps) {
  const { data: users, isLoading } = useCompanyUsers(companyId)
  const updateRole = useUpdateUserRole(companyId)
  const deactivate = useDeactivateUser(companyId)

  function handleRoleChange(userId: string, role: string) {
    updateRole.mutate(
      { userId, role },
      {
        onSuccess: () => toast.success('Rol güncellendi'),
        onError: () => toast.error('Rol güncellenemedi'),
      }
    )
  }

  function handleDeactivate(userId: string) {
    if (!confirm('Bu kullanıcıyı deaktif etmek istediğinize emin misiniz?')) return
    deactivate.mutate(userId, {
      onSuccess: () => toast.success('Kullanıcı deaktif edildi'),
      onError: () => toast.error('İşlem başarısız'),
    })
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{users?.length ?? 0} kullanıcı</span>
        <div className="flex gap-2">
          <CsvImportDialog companyId={companyId} />
          <InviteDialog companyId={companyId} />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Katılma</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Kullanıcı bulunamadı.</TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {getInitials(user.name)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleBadgeVariants[user.role]}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Rol Değiştir</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {['owner', 'admin', 'member'].map((role) => (
                              <DropdownMenuItem key={role} onClick={() => handleRoleChange(user.id, role)} disabled={user.role === role}>
                                {role}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivate(user.id)}>
                          Deaktif Et
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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

- [ ] **Step 5: Wire UsersTab into CompanyDetailPage**

In `src/features/companies/pages/company-detail-page.tsx`, replace users placeholder:

```tsx
import { UsersTab } from '../components/users-tab'
// ...
<TabsContent value="users" className="mt-4">
  <UsersTab companyId={id!} />
</TabsContent>
```

- [ ] **Step 6: Commit**

```bash
git add src/features/companies/hooks/use-company-users.ts src/features/companies/components/users-tab.tsx src/features/companies/components/invite-dialog.tsx src/features/companies/components/csv-import-dialog.tsx src/features/companies/pages/company-detail-page.tsx
git commit -m "feat: add users tab with invite, CSV import, role management"
```

---

### Task 10: Platform Settings Feature

**Files:**
- Create: `src/features/settings/hooks/use-platform-defaults.ts`, `src/features/settings/components/settings-nav.tsx`, `src/features/settings/components/config-section.tsx`, `src/features/settings/components/pricing-form.tsx`, `src/features/settings/pages/settings-page.tsx`

- [ ] **Step 1: Create usePlatformDefaults hook**

Create `src/features/settings/hooks/use-platform-defaults.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

export function usePlatformDefaults() {
  return useQuery({
    queryKey: queryKeys.platform.defaults,
    queryFn: async () => {
      const { data } = await apiClient.get('/platform/config/defaults')
      return data
    },
  })
}

export function useUpdatePlatformDefaults() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: Record<string, unknown>) => {
      const { data } = await apiClient.put('/platform/config/defaults', config)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platform.defaults })
    },
  })
}
```

- [ ] **Step 2: Create SettingsNav**

Create `src/features/settings/components/settings-nav.tsx`:

```tsx
import { cn } from '@/lib/utils'

interface SettingsNavProps {
  active: string
  onChange: (key: string) => void
}

const sections = [
  { key: 'pricingConfig', label: 'Pricing', icon: '💰' },
  { key: 'aiConfig', label: 'AI Config', icon: '🤖' },
  { key: 's3Config', label: 'S3 Config', icon: '📦' },
  { key: 'cdnConfig', label: 'CDN Config', icon: '🌐' },
  { key: 'mailConfig', label: 'Mail Config', icon: '✉️' },
  { key: 'embeddingConfig', label: 'Embedding', icon: '🧬' },
  { key: 'langfuseConfig', label: 'Langfuse', icon: '📊' },
  { key: 'triggerConfig', label: 'Trigger', icon: '⚡' },
  { key: 'limitsConfig', label: 'Limits', icon: '🚧' },
]

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((s) => (
        <button
          key={s.key}
          onClick={() => onChange(s.key)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
            active === s.key
              ? 'bg-card font-medium text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="text-xs">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </nav>
  )
}

export { sections }
```

- [ ] **Step 3: Create ConfigSection (reuses config-accordion field definitions)**

Create `src/features/settings/components/config-section.tsx`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { configBlockSchemas, type ConfigBlockKey } from '@/lib/validations'
import type { z } from 'zod'

interface FieldConfig {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
}

interface ConfigSectionProps {
  blockKey: ConfigBlockKey
  title: string
  description: string
  fields: FieldConfig[]
  currentValues: Record<string, unknown> | undefined
  onSave: (values: Record<string, unknown>) => void
  isSaving: boolean
}

export function ConfigSection({ blockKey, title, description, fields, currentValues, onSave, isSaving }: ConfigSectionProps) {
  const schema = configBlockSchemas[blockKey]

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: (currentValues as z.infer<typeof schema>) ?? {},
  })

  function handleSubmit(values: z.infer<typeof schema>) {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined)
    )
    onSave(cleaned)
  }

  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-5 text-xs text-muted-foreground">{description}</p>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="max-w-md">
            <Label className="text-xs text-muted-foreground">{field.label}</Label>
            {field.type === 'select' && field.options ? (
              <Select
                value={form.watch(field.key as never) ?? ''}
                onValueChange={(v) => form.setValue(field.key as never, v as never)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                {...form.register(field.key as never)}
                type={field.type === 'number' ? 'number' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                placeholder={field.placeholder}
                className="mt-1"
              />
            )}
          </div>
        ))}

        <div className="border-t pt-4">
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create SettingsPage**

Create `src/features/settings/pages/settings-page.tsx`:

```tsx
import { useState } from 'react'
import { usePlatformDefaults, useUpdatePlatformDefaults } from '../hooks/use-platform-defaults'
import { SettingsNav } from '../components/settings-nav'
import { ConfigSection } from '../components/config-section'
import { toast } from 'sonner'
import type { ConfigBlockKey } from '@/lib/validations'

const sectionMeta: Record<string, { title: string; description: string; fields: { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[]; placeholder?: string }[] }> = {
  pricingConfig: {
    title: 'Pricing', description: 'Maliyet hesaplamasında kullanılan birim fiyatlar',
    fields: [
      { key: 's3PerGbMonthUsd', label: 'S3 — GB başına aylık fiyat (USD)', type: 'number', placeholder: '0.0245' },
      { key: 'cdnPerGbTransferUsd', label: 'CDN — GB başına transfer fiyatı (USD)', type: 'number', placeholder: '0.085' },
      { key: 'triggerPerTaskUsd', label: 'Trigger — Task başına fiyat (USD)', type: 'number', placeholder: '0.0001' },
    ],
  },
  aiConfig: {
    title: 'AI Config', description: 'Varsayılan AI provider ve model ayarları',
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
      { key: 'model', label: 'Model' },
      { key: 'compactionModel', label: 'Compaction Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'requestTimeoutMs', label: 'Timeout (ms)', type: 'number' },
      { key: 'budgetUsd', label: 'Budget (USD)', type: 'number' },
      { key: 'fallbackProvider', label: 'Fallback Provider', type: 'select', options: ['anthropic', 'openai', 'gemini'] },
    ],
  },
  s3Config: {
    title: 'S3 Config', description: 'Varsayılan S3 depolama ayarları',
    fields: [
      { key: 'bucket', label: 'Bucket' },
      { key: 'region', label: 'Region' },
      { key: 'endpoint', label: 'Endpoint' },
      { key: 'keyPrefix', label: 'Key Prefix' },
    ],
  },
  cdnConfig: {
    title: 'CDN Config', description: 'Varsayılan CDN ayarları',
    fields: [
      { key: 'domain', label: 'Domain' },
      { key: 'keyPairId', label: 'Key Pair ID' },
      { key: 'privateKey', label: 'Private Key' },
      { key: 'ttlSec', label: 'TTL (sn)', type: 'number' },
    ],
  },
  mailConfig: {
    title: 'Mail Config', description: 'Varsayılan email ayarları',
    fields: [
      { key: 'apiKey', label: 'API Key' },
      { key: 'fromAddress', label: 'From Address' },
      { key: 'fromName', label: 'From Name' },
      { key: 'replyTo', label: 'Reply To' },
    ],
  },
  embeddingConfig: {
    title: 'Embedding Config', description: 'Varsayılan embedding ayarları',
    fields: [
      { key: 'provider', label: 'Provider' },
      { key: 'model', label: 'Model' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'apiUrl', label: 'API URL' },
      { key: 'dimensions', label: 'Dimensions', type: 'number' },
    ],
  },
  langfuseConfig: {
    title: 'Langfuse Config', description: 'Varsayılan Langfuse observability ayarları',
    fields: [
      { key: 'publicKey', label: 'Public Key' },
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'baseUrl', label: 'Base URL' },
    ],
  },
  triggerConfig: {
    title: 'Trigger Config', description: 'Varsayılan Trigger.dev ayarları',
    fields: [
      { key: 'projectRef', label: 'Project Ref' },
      { key: 'secretKey', label: 'Secret Key' },
    ],
  },
  limitsConfig: {
    title: 'Limits Config', description: 'Varsayılan kullanım limitleri',
    fields: [
      { key: 'maxStorageMb', label: 'Max Storage (MB)', type: 'number' },
      { key: 'maxFileSizeMb', label: 'Max File Size (MB)', type: 'number' },
      { key: 'historyTokenBudget', label: 'History Token Budget', type: 'number' },
      { key: 'compactionTriggerTokens', label: 'Compaction Trigger Tokens', type: 'number' },
    ],
  },
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('pricingConfig')
  const { data: defaults, isLoading } = usePlatformDefaults()
  const updateDefaults = useUpdatePlatformDefaults()

  const meta = sectionMeta[activeSection]

  function handleSave(values: Record<string, unknown>) {
    updateDefaults.mutate(
      { [activeSection]: values },
      {
        onSuccess: () => toast.success(`${meta.title} güncellendi`),
        onError: () => toast.error('Kaydetme başarısız'),
      }
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Platform Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Yeni şirketler bu varsayılan değerlerle başlar. Şirkete özel config girilmezse bu değerler kullanılır.
        </p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-0">
        <div className="border-r pr-4">
          <SettingsNav active={activeSection} onChange={setActiveSection} />
        </div>
        <div className="pl-6">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            <ConfigSection
              key={activeSection}
              blockKey={activeSection as ConfigBlockKey}
              title={meta.title}
              description={meta.description}
              fields={meta.fields}
              currentValues={defaults?.[activeSection]}
              onSave={handleSave}
              isSaving={updateDefaults.isPending}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Wire SettingsPage into App.tsx**

In `src/App.tsx`:

```tsx
import { SettingsPage } from '@/features/settings/pages/settings-page'
// ...
<Route path="/settings" element={<SettingsPage />} />
```

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/ src/App.tsx
git commit -m "feat: add platform settings page with side nav and config forms"
```

---

### Task 11: Final Integration & Polish

**Files:**
- Modify: `src/App.tsx` (final imports)

- [ ] **Step 1: Verify all imports are wired in App.tsx**

Read `src/App.tsx` and confirm all page imports and routes are present:
- LoginPage at `/login`
- DashboardPage at `/`
- CompaniesPage at `/companies`
- CompanyDetailPage at `/companies/:id`
- SettingsPage at `/settings`

- [ ] **Step 2: Run build and fix any TypeScript errors**

```bash
pnpm build
```

Expected: Build succeeds with zero errors. Fix any issues found.

- [ ] **Step 3: Run dev server and verify all routes**

```bash
pnpm dev
```

Manually test:
- `/login` → login form renders
- After auth → sidebar visible, routes work
- `/` → dashboard with KPI cards
- `/companies` → company table with cost columns
- `/companies/:id` → detail page with 3 tabs
- `/settings` → side nav + config forms

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues and finalize routing"
```
