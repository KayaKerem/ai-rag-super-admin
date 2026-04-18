import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { AuthYetkilendirme } from '../sections/auth-yetkilendirme'
import { FirmaYonetimi } from '../sections/firma-yonetimi'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { PlatformToolPlanlari } from '../sections/platform-tool-planlari'
import { ModelDowngrade } from '../sections/model-downgrade'
import { FiyatlandirmaGelir } from '../sections/fiyatlandirma-gelir'
import { PlatformAnalytics } from '../sections/platform-analytics'
import { QuotePipeline } from '../sections/quote-pipeline'
import { FirmaConfig } from '../sections/firma-config'
import { VeriKaynaklari } from '../sections/veri-kaynaklari'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari',           title: 'Genel Mimari',             icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme',     title: 'Auth & Yetkilendirme',     icon: '🔐', Component: AuthYetkilendirme },
  { id: 'firma-yonetimi',         title: 'Firma Yönetimi',           icon: '🏢', Component: FirmaYonetimi },
  { id: 'mesaj-akisi',            title: 'Mesaj İşlem Akışı',        icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool',             title: 'Agent Tool Sistemi',       icon: '🛠️', Component: AgentTool },
  { id: 'platform-tool-planlari', title: 'Platform Tool Planları',   icon: '🧰', Component: PlatformToolPlanlari },
  { id: 'model-downgrade',        title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir',    title: 'Fiyatlandırma & Gelir',    icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'platform-analytics',     title: 'Platform Analytics',       icon: '📊', Component: PlatformAnalytics },
  { id: 'quote-pipeline',         title: 'Quote Pipeline',           icon: '📄', Component: QuotePipeline },
  { id: 'firma-config',           title: 'Firma Config Referansı',   icon: '⚙️', Component: FirmaConfig },
  { id: 'veri-kaynaklari',        title: 'Veri Kaynakları',          icon: '🔌', Component: VeriKaynaklari },
  { id: 'sorun-giderme',          title: 'Sorun Giderme',            icon: '🔧', Component: SorunGiderme },
]
