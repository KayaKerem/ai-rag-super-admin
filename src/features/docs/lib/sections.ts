import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { AuthYetkilendirme } from '../sections/auth-yetkilendirme'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { ModelDowngrade } from '../sections/model-downgrade'
import { FiyatlandirmaGelir } from '../sections/fiyatlandirma-gelir'
import { QuotePipeline } from '../sections/quote-pipeline'
import { FirmaConfig } from '../sections/firma-config'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari',        title: 'Genel Mimari',             icon: '🏗️', Component: GenelMimari },
  { id: 'auth-yetkilendirme',  title: 'Auth & Yetkilendirme',     icon: '🔐', Component: AuthYetkilendirme },
  { id: 'mesaj-akisi',         title: 'Mesaj İşlem Akışı',        icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool',          title: 'Agent Tool Sistemi',       icon: '🛠️', Component: AgentTool },
  { id: 'model-downgrade',     title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'fiyatlandirma-gelir', title: 'Fiyatlandırma & Gelir',    icon: '💰', Component: FiyatlandirmaGelir },
  { id: 'quote-pipeline',      title: 'Quote Pipeline',           icon: '📄', Component: QuotePipeline },
  { id: 'firma-config',        title: 'Firma Config Referansı',   icon: '⚙️', Component: FirmaConfig },
  { id: 'sorun-giderme',       title: 'Sorun Giderme',            icon: '🔧', Component: SorunGiderme },
]
