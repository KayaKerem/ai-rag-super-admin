import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from '@/components/layout/auth-guard'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/features/auth/pages/login-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { CompaniesPage } from '@/features/companies/pages/companies-page'
import { CompanyDetailPage } from '@/features/companies/pages/company-detail-page'

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
