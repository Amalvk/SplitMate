import { useMemo } from 'react'
import { ExpenseListItem } from '@/components/expense/ExpenseListItem'
import { EmptyState } from '@/components/common/EmptyState'
import { compareNewestFirst, formatFriendlyDate } from '@/utils/date'
import type { Expense } from '@/types'

/**
 * Oldest expense first, latest at the bottom. `numbers` maps expense id -> its position (1, 2, 3…)
 * in the group's full list, so a number stays the same while filtering; without it, the visible
 * rows are simply numbered in order.
 */
export function ExpenseTimeline({ expenses, numbers }: { expenses: Expense[]; numbers?: Map<string, number> }) {
  const groups = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => compareNewestFirst(b, a))
    const map = new Map<string, Expense[]>()
    for (const expense of sorted) {
      const label = formatFriendlyDate(expense.date)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(expense)
    }
    return Array.from(map.entries())
  }, [expenses])

  const sequence = useMemo(
    () => new Map([...expenses].sort((a, b) => compareNewestFirst(b, a)).map((e, i) => [e.id, i + 1] as const)),
    [expenses],
  )

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
              <ExpenseListItem key={expense.id} expense={expense} number={numbers?.get(expense.id) ?? sequence.get(expense.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
