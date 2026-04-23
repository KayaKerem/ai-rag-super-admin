import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from '@/components/layout/auth-guard'
import { AppLayout } from '@/components/layout/app-layout'
import { RouteLoadingFallback } from '@/components/layout/route-loading-fallback'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { CompaniesPage } from '@/features/companies/pages/companies-page'
import { CompanyDetailPage } from '@/features/companies/pages/company-detail-page'
import { SettingsPage } from '@/features/settings/pages/settings-page'
import { EmailTemplatesPage } from '@/features/email-templates/pages/email-templates-page'
import { ServiceAccountsPage } from '@/features/service-accounts/pages/service-accounts-page'
import { DocsPage } from '@/features/docs/pages/docs-page'

const CostHealthPage = lazy(() =>
  import('@/features/cost-health/pages/cost-health-page').then((m) => ({
    default: m.CostHealthPage,
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
              <Route path="/service-accounts" element={<ServiceAccountsPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route
                path="/admin/cost-health"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <CostHealthPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
