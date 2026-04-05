import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, Settings, LogOut, Mail, Wallet } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2, label: 'Şirketler' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
  { to: '/treasury', icon: Wallet, label: 'Treasury' },
  { to: '/email-templates', icon: Mail, label: 'Email Şablonları' },
]

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    // Fire-and-forget: notify backend about logout
    apiClient.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  return (
    <TooltipProvider delay={0}>
      <aside className="flex h-screen w-14 flex-col items-center border-r bg-card py-4">
        {/* Logo */}
        <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-extrabold text-primary-foreground">S</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger
                render={
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                  </NavLink>
                }
              />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Logout */}
        <Tooltip>
          <TooltipTrigger
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Çıkış</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
