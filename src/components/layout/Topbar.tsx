import { useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, SunMoon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useUiStore, type Theme } from '@/store/uiStore'

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: SunMoon }

export function Topbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.currentUser)
  const unread = useDataStore((s) => s.notifications.filter((n) => !n.read).length)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const ThemeIcon = THEME_ICON[theme]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
      <div className="lg:hidden flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">S</div>
        <span className="font-semibold tracking-tight">SplitMate</span>
      </div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              <ThemeIcon className="size-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="size-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="size-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <SunMoon className="size-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" onClick={() => navigate(ROUTES.notifications)}>
          <Bell className="size-4.5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />}
        </Button>

        <button onClick={() => navigate(ROUTES.profile)} className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar name={user?.name ?? '?'} size="sm" />
        </button>
      </div>
    </header>
  )
}
