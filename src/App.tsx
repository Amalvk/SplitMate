import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from '@/layouts/ProtectedRoute'
import { ROUTES } from '@/constants/routes'
import { useBootstrapDemoData } from '@/hooks/useBootstrapDemoData'
import { useThemeEffect } from '@/hooks/useTheme'
import { useFirebaseDataSync } from '@/hooks/useFirebaseDataSync'
import { PageLoader } from '@/components/common/PageLoader'

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))

const GroupsPage = lazy(() => import('@/pages/groups/GroupsPage'))
const NewGroupPage = lazy(() => import('@/pages/groups/NewGroupPage'))
const GroupDetailPage = lazy(() => import('@/pages/groups/GroupDetailPage'))

const NewExpensePage = lazy(() => import('@/pages/expenses/NewExpensePage'))
const ExpenseDetailPage = lazy(() => import('@/pages/expenses/ExpenseDetailPage'))

const SettlementsPage = lazy(() => import('@/pages/settlements/SettlementsPage'))

const MembersPage = lazy(() => import('@/pages/members/MembersPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

const queryClient = new QueryClient()

function AppRoutes() {
  useBootstrapDemoData()
  useThemeEffect()
  useFirebaseDataSync()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />

            <Route path={ROUTES.groups} element={<GroupsPage />} />
            <Route path={ROUTES.newGroup} element={<NewGroupPage />} />
            <Route path="/groups/:groupId/*" element={<GroupDetailPage />} />

            <Route path={ROUTES.newExpense} element={<NewExpensePage />} />
            <Route path="/expenses/:expenseId" element={<ExpenseDetailPage />} />

            <Route path={ROUTES.settlements} element={<SettlementsPage />} />
            <Route path="/settlements/:settlementId" element={<SettlementsPage />} />

            <Route path={ROUTES.members} element={<MembersPage />} />
            <Route path={ROUTES.notifications} element={<NotificationsPage />} />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.settings} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
