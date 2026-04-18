import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { DOCS_SECTIONS } from '../lib/sections'

export function DocsToc() {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (DOCS_SECTIONS.length === 0) return

    const sectionMap = new Map<string, IntersectionObserverEntry>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sectionMap.set(entry.target.id, entry)
        }
        const firstVisible = DOCS_SECTIONS
          .map((s) => sectionMap.get(s.id))
          .find((e) => e?.isIntersecting)
        if (firstVisible) {
          setActiveId(firstVisible.target.id)
        } else {
          const lastAbove = [...DOCS_SECTIONS].reverse().find((s) => {
            const e = sectionMap.get(s.id)
            return e ? e.boundingClientRect.top < 0 : false
          })
          if (lastAbove) setActiveId(lastAbove.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    for (const s of DOCS_SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  if (DOCS_SECTIONS.length === 0) {
    return <div className="text-sm text-muted-foreground">İçerik yükleniyor...</div>
  }

  return (
    <nav aria-label="Doküman içindekiler">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        İçindekiler
      </div>
      <ul className="space-y-1">
        {DOCS_SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={activeId === s.id ? 'location' : undefined}
              onClick={(e) => handleClick(e, s.id)}
              className={cn(
                'block rounded-md px-2 py-1 text-sm transition-colors',
                activeId === s.id
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <span className="mr-1.5" aria-hidden>{s.icon}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
