import { NavLink } from 'react-router-dom'
import { Bell, LayoutDashboard, User, Users } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'

const ITEMS = [
  { to: ROUTES.dashboard, label: 'Home', icon: LayoutDashboard },
  { to: ROUTES.groups, label: 'Groups', icon: Users },
  { to: ROUTES.notifications, label: 'Activity', icon: Bell },
  { to: ROUTES.profile, label: 'Profile', icon: User },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium min-h-14',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="size-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
