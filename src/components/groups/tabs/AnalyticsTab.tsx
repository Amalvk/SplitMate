import { useMemo, useState } from 'react'
import { format, isWithinInterval, subDays, subMonths } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LIST } from '@/constants/categories'
import { useGroupExpenses } from '@/hooks/useGroupBalances'
import { useDataStore } from '@/store/dataStore'
import { formatINR } from '@/utils/currency'
import { cn } from '@/utils/cn'
import type { Group } from '@/types'

type RangeKey = '7d' | '30d' | '3m' | 'all'
const RANGES: { value: RangeKey; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '3m', label: '3 months' },
  { value: 'all', label: 'All time' },
]

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
]

/** Fixed category -> color slot, by the category's permanent position in EXPENSE_CATEGORY_LIST — stable
 * across filters/re-renders (color follows the entity, never its sorted rank). Categories past the 8th
 * validated slot share the last slot rather than repainting an earlier category's color. */
const CATEGORY_COLOR_INDEX = new Map(EXPENSE_CATEGORY_LIST.map((c, i) => [c.value, Math.min(i, CHART_COLORS.length - 1)]))

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted-foreground">
          {formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsTab({ group }: { group: Group }) {
  const expenses = useGroupExpenses(group.id)
  const members = useDataStore((s) => s.members).filter((m) => group.memberIds.includes(m.id))
  const [range, setRange] = useState<RangeKey>('all')

  const filtered = useMemo(() => {
    if (range === 'all') return expenses
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const start = range === '3m' ? subMonths(new Date(), 3) : subDays(new Date(), days)
    return expenses.filter((e) => isWithinInterval(new Date(e.date), { start, end: new Date() }))
  }, [expenses, range])

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of filtered) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountMinor)
    return EXPENSE_CATEGORY_LIST.filter((c) => totals.has(c.value))
      .map((c) => ({
        name: `${c.emoji} ${c.label}`,
        value: totals.get(c.value) ?? 0,
        fill: CHART_COLORS[CATEGORY_COLOR_INDEX.get(c.value) ?? 0],
      }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const timeData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of filtered) {
      const key = format(new Date(e.date), 'd MMM')
      totals.set(key, (totals.get(key) ?? 0) + e.amountMinor)
    }
    return Array.from(totals.entries()).map(([date, amount]) => ({ date, amount: amount / 100 }))
  }, [filtered])

  const memberData = useMemo(
    () =>
      members.map((m, i) => ({
        name: m.name,
        value: filtered.filter((e) => e.payers.some((p) => p.memberId === m.id)).reduce((s, e) => s + e.payers.find((p) => p.memberId === m.id)!.amountMinor, 0),
        fill: CHART_COLORS[Math.min(i, CHART_COLORS.length - 1)],
      })),
    [filtered, members],
  )

  const topExpenses = useMemo(() => [...filtered].sort((a, b) => b.amountMinor - a.amountMinor).slice(0, 5), [filtered])

  if (expenses.length === 0) {
    return <EmptyState emoji="📊" title="Nothing to analyze yet" description="Add a few expenses and insights will show up here." />
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border', range === r.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="📊" title="No expenses in this range" description="Try a wider date range." />
      ) : (
        <>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Spending by category</h3>
              <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 42, 100)}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-secondary)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', formatter: (v: unknown) => formatINR(Number(v), { whole: true }), fontSize: 11, fill: 'var(--color-foreground)' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Spending over time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timeData} margin={{ left: -12 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="amount" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-4">Member contribution</h3>
              <ResponsiveContainer width="100%" height={Math.max(memberData.length * 42, 100)}>
                <BarChart data={memberData} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-secondary)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', formatter: (v: unknown) => formatINR(Number(v), { whole: true }), fontSize: 11, fill: 'var(--color-foreground)' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Top expenses</h3>
              <div className="space-y-2.5">
                {topExpenses.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-lg">{EXPENSE_CATEGORIES[e.category].emoji}</span>
                    <span className="text-sm font-medium flex-1 truncate">{e.title}</span>
                    <span className="text-sm font-semibold num-tabular">{formatINR(e.amountMinor)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
