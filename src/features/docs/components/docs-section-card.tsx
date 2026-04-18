import type { ReactNode } from 'react'

interface DocsSectionCardProps {
  id: string
  title: string
  icon: string
  children: ReactNode
}

export function DocsSectionCard({ id, title, icon, children }: DocsSectionCardProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
