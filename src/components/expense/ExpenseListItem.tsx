import { Link } from 'react-router-dom'
import { Mic, PenLine } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { formatINR } from '@/utils/currency'
import type { Expense } from '@/types'

export function ExpenseListItem({ expense }: { expense: Expense }) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const members = useDataStore((s) => s.members)
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const categoryMeta = EXPENSE_CATEGORIES[expense.category]

  const payerNames = expense.payers.map((p) => byId[p.memberId]?.name ?? 'Someone').join(' & ')
  const isPayer = userId ? expense.payers.some((p) => p.memberId === userId) : false
  const myShare = userId ? (expense.split.shares[userId] ?? 0) : 0
  const myPaid = userId ? expense.payers.filter((p) => p.memberId === userId).reduce((s, p) => s + p.amountMinor, 0) : 0
  const netForMe = myPaid - myShare

  return (
    <Link
      to={ROUTES.expense(expense.id)}
      className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-secondary/60 transition-colors"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-xl">{categoryMeta.emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium truncate">{expense.title}</p>
          {expense.source === 'voice' && <Mic className="size-3 text-muted-foreground shrink-0" />}
          {expense.source === 'text' && <PenLine className="size-3 text-muted-foreground shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {payerNames} paid {formatINR(expense.amountMinor)} · {expense.split.participantIds.length} people
        </p>
      </div>
      <div className="text-right shrink-0">
        {netForMe === 0 ? (
          <span className="text-xs text-muted-foreground">Not involved</span>
        ) : netForMe > 0 ? (
          <span className="text-sm font-semibold text-success">
            {isPayer ? `You lent ${formatINR(netForMe)}` : `You get ${formatINR(netForMe)}`}
          </span>
        ) : (
          <span className="text-sm font-semibold text-destructive">You owe {formatINR(-netForMe)}</span>
        )}
      </div>
    </Link>
  )
}
