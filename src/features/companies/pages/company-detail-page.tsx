import { useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompany } from '../hooks/use-company'
import { CompanyHeader } from '../components/company-header'
import { UsageTab } from '../components/usage-tab'
import { AnalyticsTab } from '../components/analytics-tab'
import { ConfigTab } from '../components/config-tab'
import { ToolConfigTab } from '../components/tool-config-tab'
import { UsersTab } from '../components/users-tab'
import { DataSourcesTab } from '../components/data-sources-tab'
import { PlanTab } from '../components/plan-tab'

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
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Konfigürasyon</TabsTrigger>
          <TabsTrigger value="tools">Tool&apos;lar</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
          <TabsTrigger value="data-sources">Veri Kaynaklari</TabsTrigger>
        </TabsList>
        <TabsContent value="usage" className="mt-4">
          <UsageTab companyId={id!} />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanTab companyId={id!} company={company} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab companyId={id!} />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigTab companyId={id!} />
        </TabsContent>
        <TabsContent value="tools" className="mt-4">
          <ToolConfigTab companyId={id!} />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab companyId={id!} />
        </TabsContent>
        <TabsContent value="data-sources" className="mt-4">
          <DataSourcesTab companyId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
