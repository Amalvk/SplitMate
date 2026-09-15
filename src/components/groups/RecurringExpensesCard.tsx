import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Plus, Repeat, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXPENSE_CATEGORY_LIST } from '@/constants/categories'
import { addExpenseAction } from '@/services/actions/expenseActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { calculateCustomSplit, calculateEqualSplit } from '@/utils/calculations'
import { formatINR, rupeesToMinor } from '@/utils/currency'
import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'
import type { Expense, ExpenseCategory, Group, RecurringExpense, RecurringFrequency } from '@/types'

const schema = z.object({
  title: z.string().min(2, 'Give it a name.'),
  amount: z.coerce.number().positive('Enter an amount greater than zero.'),
  category: z.string(),
  frequency: z.enum(['weekly', 'monthly', 'yearly']),
})
type FormValues = z.infer<typeof schema>

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

export function RecurringExpensesCard({ group }: { group: Group }) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const members = useDataStore((s) => s.members)
  const recurringExpenses = useDataStore((s) => s.recurringExpenses)
  const addRecurring = useDataStore((s) => s.addRecurring)
  const removeRecurring = useDataStore((s) => s.removeRecurring)

  const groupRecurring = useMemo(() => recurringExpenses.filter((r) => r.groupId === group.id), [recurringExpenses, group.id])
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0, category: 'utilities', frequency: 'monthly' },
  })

  function onSubmit(values: FormValues) {
    if (!userId) return
    const amountMinor = rupeesToMinor(values.amount)
    const recurring: RecurringExpense = {
      id: generateId('rec'),
      groupId: group.id,
      title: values.title.trim(),
      amountMinor,
      category: values.category as ExpenseCategory,
      frequency: values.frequency as RecurringFrequency,
      startDate: nowIso(),
      participantIds: group.memberIds,
      payers: [{ memberId: userId, amountMinor }],
      splitType: 'equal',
      createdBy: userId,
      createdAt: nowIso(),
      active: true,
    }
    addRecurring(recurring)
    toast.success('Recurring expense created', { description: `${recurring.title} will repeat ${FREQUENCY_LABEL[recurring.frequency].toLowerCase()}.` })
    form.reset()
    setOpen(false)
  }

  async function handleLogNow(recurring: RecurringExpense) {
    if (!userId) return
    // Recurring templates are a local convenience (not synced), but the expense a "Log now" tap
    // creates is real group data, so it always goes through the same write path as any other
    // expense — straight to Firestore when configured, not just the local store.
    const splitResult =
      recurring.splitType === 'equal'
        ? calculateEqualSplit(recurring.amountMinor, recurring.participantIds)
        : calculateCustomSplit(recurring.amountMinor, recurring.splitInputs ?? {})
    const now = nowIso()
    const expense: Expense = {
      id: generateId('exp'),
      groupId: recurring.groupId,
      title: recurring.title,
      amountMinor: recurring.amountMinor,
      category: recurring.category,
      date: now,
      payers: recurring.payers,
      split: { type: recurring.splitType, participantIds: recurring.participantIds, shares: splitResult.shares },
      createdBy: recurring.createdBy,
      createdAt: now,
      updatedAt: now,
      source: 'manual',
      isRecurringInstance: true,
      recurringExpenseId: recurring.id,
    }
    await addExpenseAction(expense, userId, group)
    toast.success(`Logged ${recurring.title} for this period`)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="size-4 text-primary" />
            <h3 className="font-semibold">Recurring expenses</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New recurring
          </Button>
        </div>

        {groupRecurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rent, subscriptions, utilities — set them up once and log each period in a tap.</p>
        ) : (
          <div className="space-y-2">
            {groupRecurring.map((r) => {
              const equalPreview = calculateEqualSplit(r.amountMinor, r.participantIds)
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar name={byId[r.payers[0]?.memberId]?.name ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {FREQUENCY_LABEL[r.frequency]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatINR(r.amountMinor)} · {equalPreview.valid ? formatINR(Object.values(equalPreview.shares)[0] ?? 0) : ''} each
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleLogNow(r)}>
                    <Zap className="size-3.5" /> Log now
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeRecurring(r.id)}>
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New recurring expense</DialogTitle>
            <DialogDescription>Split equally among everyone in {group.name} each period.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rec-title">Title</Label>
              <Input id="rec-title" placeholder="e.g. Rent" {...form.register('title')} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rec-amount">Amount</Label>
                <Input id="rec-amount" type="number" min={0} step="0.01" {...form.register('amount')} />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Controller
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORY_LIST.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.emoji} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
