import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExpenseTimeline } from '@/components/expense/ExpenseTimeline'
import { EXPENSE_CATEGORY_LIST } from '@/constants/categories'
import { useGroupExpenses } from '@/hooks/useGroupBalances'
import { compareNewestFirst } from '@/utils/date'
import { useDataStore } from '@/store/dataStore'
import type { ExpenseCategory, Group } from '@/types'

export function ExpensesTab({ group }: { group: Group }) {
  const expenses = useGroupExpenses(group.id)
  const members = useDataStore((s) => s.members).filter((m) => group.memberIds.includes(m.id))

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [paidBy, setPaidBy] = useState<string | 'all'>('all')

  const filtered = useMemo(() => {
    let list = expenses.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
    if (category !== 'all') list = list.filter((e) => e.category === category)
    if (paidBy !== 'all') list = list.filter((e) => e.payers.some((p) => p.memberId === paidBy))

    list = [...list].sort(compareNewestFirst)
    return list
  }, [expenses, query, category, paidBy])

  return (
    <div className="space-y-4">
      <div className="relative sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search expenses..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory | 'all')}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {EXPENSE_CATEGORY_LIST.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paidBy} onValueChange={setPaidBy}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Paid by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Paid by anyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      <ExpenseTimeline expenses={filtered} />
    </div>
  )
}
