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
