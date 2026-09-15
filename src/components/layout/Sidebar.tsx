import { NavLink } from 'react-router-dom'
import { Bell, LayoutDashboard, Settings, Users, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useDataStore } from '@/store/dataStore'

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.groups, label: 'Groups', icon: Users },
  { to: ROUTES.settlements, label: 'Settlements', icon: Wallet },
  { to: ROUTES.members, label: 'Members', icon: Users },
  { to: ROUTES.notifications, label: 'Notifications', icon: Bell },
]

export function Sidebar() {
  const unread = useDataStore((s) => s.notifications.filter((n) => !n.read).length)

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 shrink-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">S</div>
        <span className="font-semibold text-lg tracking-tight">SplitMate</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
              )
            }
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
            {item.to === ROUTES.notifications && unread > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <NavLink
          to={ROUTES.settings}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
            )
          }
        >
          <Settings className="size-4.5" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
