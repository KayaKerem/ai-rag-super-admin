import type { ComponentType } from 'react'
import { GenelMimari } from '../sections/genel-mimari'

export interface DocsSection {
  id: string
  title: string
  icon: string
  Component: ComponentType
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: 'genel-mimari', title: 'Genel Mimari', icon: '🏗️', Component: GenelMimari },
]
