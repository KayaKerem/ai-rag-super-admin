import { cn } from '@/lib/utils'

interface NavItem {
  key: string
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { key: 'pricingPlans', label: 'Fiyatlandırma', icon: '💎' },
  { key: 'pricingConfig', label: 'Pricing', icon: '💰' },
  { key: 'aiConfig', label: 'AI Config', icon: '🤖' },
  { key: 'toolPlans', label: 'Tool Planları', icon: '🔧' },
  { key: 'embeddingConfig', label: 'Embedding', icon: '🧬' },
  { key: 'langfuseConfig', label: 'Langfuse', icon: '📊' },
  { key: 's3Config', label: 'S3 Config', icon: '📦' },
  { key: 'cdnConfig', label: 'CDN Config', icon: '🌐' },
  { key: 'mailConfig', label: 'Mail Config', icon: '✉️' },
  { key: 'triggerConfig', label: 'Trigger', icon: '⚡' },
  { key: 'limitsConfig', label: 'Limits', icon: '🚧' },
  { key: 'crawlerConfig', label: 'Crawler', icon: '🕷️' },
  { key: 'documentProcessingConfig', label: 'Doc Processing', icon: '📄' },
]

interface SettingsNavProps {
  activeSection: string
  onSelect: (key: string) => void
}

export function SettingsNav({ activeSection, onSelect }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
            activeSection === item.key
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
