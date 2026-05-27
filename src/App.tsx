import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from '@/components/layout/auth-guard'
import { PlatformAdminGuard } from '@/components/layout/platform-admin-guard'
import { AppLayout } from '@/components/layout/app-layout'
import { RouteLoadingFallback } from '@/components/layout/route-loading-fallback'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { CompaniesPage } from '@/features/companies/pages/companies-page'
import { CompanyDetailPage } from '@/features/companies/pages/company-detail-page'
import { EmailTemplatesPage } from '@/features/email-templates/pages/email-templates-page'
import { ServiceAccountsPage } from '@/features/service-accounts/pages/service-accounts-page'

const DocsPage = lazy(() =>
  import('@/features/docs/pages/docs-page').then((m) => ({
    default: m.DocsPage,
  }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/settings-page').then((m) => ({
    default: m.SettingsPage,
  }))
)
const CostHealthPage = lazy(() =>
  import('@/features/cost-health/pages/cost-health-page').then((m) => ({
    default: m.CostHealthPage,
  }))
)
const AgentQualityPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-page').then((m) => ({
    default: m.AgentQualityPage,
  }))
)
const AgentQualityAlertsPage = lazy(() =>
  import('@/features/agent-quality/pages/agent-quality-alerts-page').then(
    (m) => ({ default: m.AgentQualityAlertsPage })
  )
)
const AgentRouteBindingsPage = lazy(() =>
  import('@/features/agent-route-bindings/pages/agent-route-bindings-page').then(
    (m) => ({ default: m.AgentRouteBindingsPage })
  )
)
const PlaybookAdminPage = lazy(() =>
  import('@/features/playbook-admin/pages/playbook-admin-page').then((m) => ({
    default: m.PlaybookAdminPage,
  }))
)
const PlatformOpsPage = lazy(() =>
  import('@/features/platform-ops/pages/platform-ops-page').then((m) => ({
    default: m.PlatformOpsPage,
  }))
)

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
              <Route path="/" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
              <Route path="/service-accounts" element={<ServiceAccountsPage />} />
              <Route
                path="/docs"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <DocsPage />
                  </Suspense>
                }
              />
              <Route element={<PlatformAdminGuard />}>
                <Route
                  path="/admin/cost-health"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <CostHealthPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/agent-quality"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <AgentQualityPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/agent-quality/alerts"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <AgentQualityAlertsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/agent-route-bindings"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <AgentRouteBindingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/playbooks/recompute"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <PlaybookAdminPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/platform-ops"
                  element={
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <PlatformOpsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
