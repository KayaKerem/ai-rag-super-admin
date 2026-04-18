import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { MesajAkisi } from '../sections/mesaj-akisi'
import { AgentTool } from '../sections/agent-tool'
import { ModelDowngrade } from '../sections/model-downgrade'
import { SorunGiderme } from '../sections/sorun-giderme'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
  { id: 'agent-tool', title: 'Agent Tool Sistemi', icon: '🛠️', Component: AgentTool },
  { id: 'model-downgrade', title: 'Model Seçimi & Downgrade', icon: '⚖️', Component: ModelDowngrade },
  { id: 'sorun-giderme', title: 'Sorun Giderme', icon: '🔧', Component: SorunGiderme },
]
