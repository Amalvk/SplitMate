import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { ExpenseListItem } from '@/components/expense/ExpenseListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/constants/routes'
import { useGroupBalances, useGroupExpenses } from '@/hooks/useGroupBalances'
import { useDataStore } from '@/store/dataStore'
import { formatINR } from '@/utils/currency'
import type { Group } from '@/types'

export function OverviewTab({ group }: { group: Group }) {
  const expenses = useGroupExpenses(group.id)
  const { balances, suggestions, totalSpent } = useGroupBalances(group.id, group.memberIds)
  const members = useDataStore((s) => s.members)
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const recent = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <p className="text-xl font-bold num-tabular mt-1">{formatINR(totalSpent, { whole: true })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Expenses logged</p>
            <p className="text-xl font-bold num-tabular mt-1">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Settlements needed</p>
            <p className="text-xl font-bold num-tabular mt-1">{suggestions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Member balances</h3>
          <div className="space-y-3">
            {balances
              .filter((b) => b.netMinor !== 0)
              .sort((a, b) => b.netMinor - a.netMinor)
              .map((b) => (
                <div key={b.memberId} className="flex items-center gap-3">
                  <Avatar name={byId[b.memberId]?.name ?? '?'} size="sm" />
                  <span className="text-sm font-medium flex-1">{byId[b.memberId]?.name}</span>
                  <span className={`text-sm font-semibold num-tabular ${b.netMinor > 0 ? 'text-success' : 'text-destructive'}`}>
                    {b.netMinor > 0 ? `receives ${formatINR(b.netMinor)}` : `owes ${formatINR(-b.netMinor)}`}
                  </span>
                </div>
              ))}
            {balances.every((b) => b.netMinor === 0) && (
              <p className="text-sm text-muted-foreground">Everyone’s settled up 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent expenses</h3>
          <Link to={ROUTES.groupExpenses(group.id)} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState emoji="🧾" title="No expenses yet" description="Add your first expense to get started." />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {recent.map((expense) => (
              <ExpenseListItem key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
