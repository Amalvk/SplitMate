import { useMemo } from 'react'
import { ExpenseListItem } from '@/components/expense/ExpenseListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { formatFriendlyDate } from '@/utils/date'
import type { Expense } from '@/types'

export function ExpenseTimeline({ expenses }: { expenses: Expense[] }) {
  const groups = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const map = new Map<string, Expense[]>()
    for (const expense of sorted) {
      const label = formatFriendlyDate(expense.date)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(expense)
    }
    return Array.from(map.entries())
  }, [expenses])

  if (expenses.length === 0) {
    return <EmptyState emoji="🧾" title="No expenses yet" description="Start tracking your group's spending." />
  }

  return (
    <div className="space-y-6">
      {groups.map(([label, items]) => (
        <div key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 px-3">{label}</p>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {items.map((expense) => (
              <ExpenseListItem key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
