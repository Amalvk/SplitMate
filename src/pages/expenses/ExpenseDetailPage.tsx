import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ExpenseForm } from '@/components/expense/ExpenseForm'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { deleteExpenseAction } from '@/services/actions/expenseActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { formatDateLong } from '@/utils/date'
import { formatINR } from '@/utils/currency'

export default function ExpenseDetailPage() {
  const { expenseId } = useParams<{ expenseId: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.currentUser?.id)
  const expenses = useDataStore((s) => s.expenses)
  const members = useDataStore((s) => s.members)
  const groups = useDataStore((s) => s.groups)

  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const expense = expenses.find((e) => e.id === expenseId)
  if (!expense) return <Navigate to={ROUTES.dashboard} replace />

  const group = groups.find((g) => g.id === expense.groupId)
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const categoryMeta = EXPENSE_CATEGORIES[expense.category]

  async function handleDelete() {
    await deleteExpenseAction(expense!, userId ?? '')
    toast.success('Expense deleted', { description: 'Balances have been updated.' })
    navigate(group ? ROUTES.groupExpenses(group.id) : ROUTES.dashboard)
  }

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          <ArrowLeft className="size-4" /> Cancel edit
        </Button>
        <ExpenseForm expense={expense} lockedGroupId={expense.groupId} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" /> Back
      </Button>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-2xl">{categoryMeta.emoji}</div>
              <div>
                <h1 className="text-xl font-bold">{expense.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {formatDateLong(expense.date)} · {group?.name}
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold num-tabular">{formatINR(expense.amountMinor)}</span>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Paid by</p>
            <div className="flex flex-wrap gap-3">
              {expense.payers.map((p) => (
                <div key={p.memberId} className="flex items-center gap-2 rounded-full bg-secondary pl-1 pr-3 py-1">
                  <Avatar name={byId[p.memberId]?.name ?? '?'} size="xs" />
                  <span className="text-sm font-medium">{byId[p.memberId]?.name}</span>
                  <span className="text-xs text-muted-foreground num-tabular">{formatINR(p.amountMinor)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Split {expense.split.type} between {expense.split.participantIds.length} people
            </p>
            <div className="divide-y divide-border rounded-xl border border-border">
              {expense.split.participantIds.map((id) => (
                <div key={id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={byId[id]?.name ?? '?'} size="sm" />
                  <span className="text-sm font-medium flex-1">{byId[id]?.name}</span>
                  <span className="text-sm font-semibold num-tabular">{formatINR(expense.split.shares[id] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {expense.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm">{expense.notes}</p>
            </div>
          )}

          {expense.receiptUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Receipt</p>
              <img src={expense.receiptUrl} alt="Receipt" className="max-h-64 rounded-xl border border-border object-cover" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete expense?"
        description="This will affect group balances for everyone involved."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
