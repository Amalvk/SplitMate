import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Mic, Plus, Receipt, Sparkles, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { GroupCard } from '@/components/groups/GroupCard'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { formatINR } from '@/utils/currency'
import { buildInsights } from '@/utils/insights'

const QUICK_ACTIONS = [
  { label: 'Add Expense', icon: Receipt, to: ROUTES.newExpense },
  { label: 'Voice Expense', icon: Mic, to: `${ROUTES.newExpense}?mode=voice` },
  { label: 'New Group', icon: Users, to: ROUTES.newGroup },
  { label: 'Settle Up', icon: Wallet, to: ROUTES.settlements },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const stats = useDashboardStats()
  const expenses = useDataStore((s) => s.expenses)
  const insights = buildInsights(stats.myGroups, expenses.filter((e) => stats.myGroups.some((g) => g.id === e.groupId)))

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hasGroups = stats.myGroups.length > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hey {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here’s where your groups stand today.</p>
        </div>
        <div className="hidden sm:flex gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action.label} variant={action.label === 'Add Expense' ? 'default' : 'outline'} onClick={() => navigate(action.to)}>
              <action.icon className="size-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="sm:hidden grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button key={action.label} variant="outline" className="justify-start" onClick={() => navigate(action.to)}>
            <action.icon className="size-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Expenses" value={formatINR(stats.totalExpenses, { whole: true })} icon={Receipt} delay={0} />
        <StatCard label="You Paid" value={formatINR(stats.youPaid, { whole: true })} icon={Wallet} tone="info" delay={0.03} />
        <StatCard label="You Owe" value={formatINR(stats.youOwe, { whole: true })} icon={ArrowRight} tone="destructive" delay={0.06} />
        <StatCard label="Others Owe You" value={formatINR(stats.othersOweYou, { whole: true })} icon={ArrowRight} tone="success" delay={0.09} />
        <StatCard label="Groups" value={String(stats.groupsCount)} icon={Users} delay={0.12} />
        <StatCard label="Pending Settlements" value={String(stats.pendingSettlements)} icon={Sparkles} tone="warning" delay={0.15} />
      </div>

      {insights.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-primary" />
              <h2 className="font-semibold">Smart Insights</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {insights.map((insight) => (
                <div key={insight.text} className="flex items-start gap-2.5 rounded-xl bg-secondary/60 p-3">
                  <span className="text-lg leading-none">{insight.emoji}</span>
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Your Groups</h2>
          {hasGroups && (
            <Link to={ROUTES.groups} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>

        {hasGroups ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.myGroups.slice(0, 6).map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🧳"
            title="No groups yet"
            description="Create your first group to start splitting expenses with friends, roommates or coworkers."
            action={
              <>
                <Button onClick={() => navigate(ROUTES.newGroup)}>
                  <Plus className="size-4" /> Create a group
                </Button>
              </>
            }
          />
        )}
      </div>
    </div>
  )
}
