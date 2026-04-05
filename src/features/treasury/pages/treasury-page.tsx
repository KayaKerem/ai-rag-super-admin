import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TreasuryDashboard } from '../components/treasury-dashboard'
import { TreasuryCustomers } from '../components/treasury-customers'
import { TreasuryTransactions } from '../components/treasury-transactions'
import { TreasuryAlerts } from '../components/treasury-alerts'
import { TreasuryActions } from '../components/treasury-actions'
import { TreasuryConfigComponent } from '../components/treasury-config'

export function TreasuryPage() {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Treasury Yonetimi</h1>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="customers">Musteriler</TabsTrigger>
          <TabsTrigger value="transactions">Islemler</TabsTrigger>
          <TabsTrigger value="alerts">Uyarilar</TabsTrigger>
          <TabsTrigger value="actions">Aksiyonlar</TabsTrigger>
          <TabsTrigger value="config">Ayarlar</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-4">
          <TreasuryDashboard />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <TreasuryCustomers />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <TreasuryTransactions />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <TreasuryAlerts />
        </TabsContent>
        <TabsContent value="actions" className="mt-4">
          <TreasuryActions />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <TreasuryConfigComponent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
