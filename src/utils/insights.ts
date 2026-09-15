import { isWithinInterval, subMonths } from 'date-fns'
import type { Expense, Group } from '@/types'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import { formatINR } from '@/utils/currency'
import { optimizeSettlements, calculateMemberBalances } from '@/utils/calculations'

export interface Insight {
  emoji: string
  text: string
}

function monthRange(monthsAgo: number) {
  const now = new Date()
  const start = subMonths(new Date(now.getFullYear(), now.getMonth(), 1), monthsAgo)
  const end = subMonths(new Date(now.getFullYear(), now.getMonth() + 1, 1), monthsAgo)
  return { start, end }
}

export function buildInsights(groups: Group[], expenses: Expense[]): Insight[] {
  const insights: Insight[] = []
  if (expenses.length === 0) return insights

  const thisMonth = monthRange(0)
  const lastMonth = monthRange(1)

  const thisMonthExpenses = expenses.filter((e) => isWithinInterval(new Date(e.date), { start: thisMonth.start, end: thisMonth.end }))
  const lastMonthExpenses = expenses.filter((e) => isWithinInterval(new Date(e.date), { start: lastMonth.start, end: lastMonth.end }))

  const byCategory = new Map<string, number>()
  for (const e of thisMonthExpenses.length ? thisMonthExpenses : expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountMinor)
  }
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topCategory) {
    const meta = EXPENSE_CATEGORIES[topCategory[0] as keyof typeof EXPENSE_CATEGORIES]
    insights.push({
      emoji: meta?.emoji ?? '💡',
      text: `${meta?.label ?? 'This category'} is your biggest expense this month, at ${formatINR(topCategory[1], { whole: true })}.`,
    })
  }

  const thisTotal = thisMonthExpenses.reduce((s, e) => s + e.amountMinor, 0)
  const lastTotal = lastMonthExpenses.reduce((s, e) => s + e.amountMinor, 0)
  if (lastTotal > 0) {
    const change = Math.round(((thisTotal - lastTotal) / lastTotal) * 100)
    if (Math.abs(change) >= 1) {
      insights.push({
        emoji: change >= 0 ? '📈' : '📉',
        text: `Spending ${change >= 0 ? 'increased' : 'decreased'} ${Math.abs(change)}% compared with last month.`,
      })
    }
  }

  for (const group of groups) {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id)
    if (groupExpenses.length === 0) continue
    const balances = calculateMemberBalances(group.memberIds, groupExpenses)
    const suggestions = optimizeSettlements(balances)
    const outstanding = balances.some((b) => b.netMinor !== 0)
    if (outstanding && suggestions.length > 0 && suggestions.length < balances.filter((b) => b.netMinor !== 0).length) {
      insights.push({
        emoji: '✨',
        text: `${group.name} can settle up with just ${suggestions.length} payment${suggestions.length > 1 ? 's' : ''}.`,
      })
      break
    }
  }

  const groupWithMost = [...groups].sort((a, b) => {
    const totalA = expenses.filter((e) => e.groupId === a.id).reduce((s, e) => s + e.amountMinor, 0)
    const totalB = expenses.filter((e) => e.groupId === b.id).reduce((s, e) => s + e.amountMinor, 0)
    return totalB - totalA
  })[0]
  if (groupWithMost) {
    const groupExpenses = expenses.filter((e) => e.groupId === groupWithMost.id)
    const total = groupExpenses.reduce((s, e) => s + e.amountMinor, 0)
    const byCat = new Map<string, number>()
    for (const e of groupExpenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amountMinor)
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]
    if (top && total > 0) {
      const pct = Math.round((top[1] / total) * 100)
      const meta = EXPENSE_CATEGORIES[top[0] as keyof typeof EXPENSE_CATEGORIES]
      if (pct >= 25) {
        insights.push({
          emoji: meta?.emoji ?? '📊',
          text: `${meta?.label ?? 'One category'} expenses account for ${pct}% of ${groupWithMost.name}'s spending.`,
        })
      }
    }
  }

  return insights.slice(0, 4)
}
