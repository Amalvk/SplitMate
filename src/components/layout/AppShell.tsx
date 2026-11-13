import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Fab } from '@/components/layout/Fab'

export function AppShell() {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar />
        <main className="px-4 py-5 sm:py-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 lg:pb-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <Fab />
    </div>
  )
}
