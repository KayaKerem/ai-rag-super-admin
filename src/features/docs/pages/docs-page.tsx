import { DocsToc } from '../components/docs-toc'
import { DOCS_SECTIONS } from '../lib/sections'

export function DocsPage() {
  return (
    <div className="flex gap-8">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-56 shrink-0 overflow-y-auto lg:block">
        <DocsToc />
      </aside>
      <main className="min-w-0 flex-1 space-y-12 pb-24">
        {DOCS_SECTIONS.length === 0 ? (
          <div className="text-sm text-muted-foreground">Henüz bölüm eklenmedi.</div>
        ) : (
          DOCS_SECTIONS.map((s) => <s.Component key={s.id} />)
        )}
      </main>
    </div>
  )
}
