import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'
import { MesajAkisi } from '../sections/mesaj-akisi'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
  { id: 'mesaj-akisi', title: 'Mesaj İşlem Akışı', icon: '💬', Component: MesajAkisi },
]
