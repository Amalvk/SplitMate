import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExpenseTimeline } from '@/components/expense/ExpenseTimeline'
import { RecurringExpensesCard } from '@/components/groups/RecurringExpensesCard'
import { EXPENSE_CATEGORY_LIST } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { useGroupExpenses } from '@/hooks/useGroupBalances'
import { useDataStore } from '@/store/dataStore'
import type { ExpenseCategory, Group } from '@/types'

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest'

export function ExpensesTab({ group }: { group: Group }) {
  const navigate = useNavigate()
  const expenses = useGroupExpenses(group.id)
  const members = useDataStore((s) => s.members).filter((m) => group.memberIds.includes(m.id))

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [paidBy, setPaidBy] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let list = expenses.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
    if (category !== 'all') list = list.filter((e) => e.category === category)
    if (paidBy !== 'all') list = list.filter((e) => e.payers.some((p) => p.memberId === paidBy))

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sort === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sort === 'highest') return b.amountMinor - a.amountMinor
      return a.amountMinor - b.amountMinor
    })
    return list
  }, [expenses, query, category, paidBy, sort])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => navigate(`${ROUTES.newExpense}?groupId=${group.id}`)}>
          <Plus className="size-4" /> Add expense
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory | 'all')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXPENSE_CATEGORY_LIST.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Paid by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Paid by anyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="highest">Highest amount</SelectItem>
            <SelectItem value="lowest">Lowest amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ExpenseTimeline expenses={filtered} />

      <RecurringExpensesCard group={group} />
    </div>
  )
}
