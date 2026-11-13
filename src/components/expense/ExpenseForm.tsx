import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PayerSelector } from '@/components/expense/PayerSelector'
import { SplitEditor } from '@/components/expense/SplitEditor'
import { addExpenseAction, updateExpenseAction } from '@/services/actions/expenseActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import {
  calculateCustomSplit,
  calculateEqualSplit,
  calculateMultiplePayerExpense,
  calculatePercentageSplit,
  calculateShareSplit,
} from '@/utils/calculations'
import { nowIso } from '@/utils/date'
import { cn } from '@/utils/cn'
import { minorToRupees, rupeesToMinor } from '@/utils/currency'
import { generateId } from '@/utils/id'
import type { Expense, ExpenseCategory, ExpensePayer, SplitType } from '@/types'

export interface ExpenseDraft {
  title?: string
  amountMinor?: number
  category?: ExpenseCategory
  payers?: ExpensePayer[]
  participantIds?: string[]
  splitType?: SplitType
  splitInputs?: Record<string, number>
  notes?: string
  source?: Expense['source']
}

interface ExpenseFormProps {
  lockedGroupId?: string
  expense?: Expense
  draft?: ExpenseDraft
  onSaved?: (expense: Expense) => void
  onCancel?: () => void
}

const SPLIT_LABELS: Record<SplitType, string> = {
  equal: 'Split equally',
  unequal: 'Split unequally',
  percentage: 'Split by percentage',
  shares: 'Split by shares',
}

export function ExpenseForm({ lockedGroupId, expense, draft, onSaved, onCancel }: ExpenseFormProps) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const groups = useDataStore((s) => s.groups)
  const members = useDataStore((s) => s.members)
  const [saving, setSaving] = useState(false)

  const myGroups = useMemo(() => groups.filter((g) => userId && g.memberIds.includes(userId)), [groups, userId])

  const [groupId, setGroupId] = useState(expense?.groupId ?? lockedGroupId ?? myGroups[0]?.id ?? '')
  const group = groups.find((g) => g.id === groupId)
  const groupMembers = useMemo(
    () => (group ? members.filter((m) => group.memberIds.includes(m.id)) : []),
    [group, members],
  )

  const [title, setTitle] = useState(expense?.title ?? draft?.title ?? '')
  const [amountRupees, setAmountRupees] = useState(
    expense ? minorToRupees(expense.amountMinor) : draft?.amountMinor ? minorToRupees(draft.amountMinor) : '',
  )
  const [category] = useState<ExpenseCategory>(expense?.category ?? draft?.category ?? 'other')

  const amountMinor = rupeesToMinor(Number(amountRupees) || 0)

  const [payers, setPayers] = useState<ExpensePayer[]>(
    expense?.payers ?? draft?.payers ?? [],
  )

  const [splitOpen, setSplitOpen] = useState(false)
  const [splitType, setSplitType] = useState<SplitType>(expense?.split.type ?? draft?.splitType ?? 'equal')
  const [participantIds, setParticipantIds] = useState<string[]>(
    expense?.split.participantIds ?? draft?.participantIds ?? group?.memberIds ?? [],
  )
  const [splitInputs, setSplitInputs] = useState<Record<string, number>>(expense?.split.inputs ?? draft?.splitInputs ?? {})

  // Keep the single payer's amount synced to the total.
  useEffect(() => {
    if (payers.length === 1) {
      setPayers([{ memberId: payers[0].memberId, amountMinor }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountMinor])

  useEffect(() => {
    if (!expense && !draft && group) {
      setParticipantIds(group.memberIds)
      setPayers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  function computeSplitResult() {
    const relevant = Object.fromEntries(participantIds.map((id) => [id, splitInputs[id] ?? 0]))
    if (splitType === 'equal') return calculateEqualSplit(amountMinor, participantIds)
    if (splitType === 'unequal') return calculateCustomSplit(amountMinor, relevant)
    if (splitType === 'percentage') return calculatePercentageSplit(amountMinor, relevant)
    return calculateShareSplit(amountMinor, relevant)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !group) return

    if (!title.trim()) return toast.error('Give the expense a title.')
    if (amountMinor <= 0) return toast.error('Enter an amount greater than zero.')

    if (payers.length === 0) return toast.error('Select who paid for this expense.')

    const payerCheck = calculateMultiplePayerExpense(payers, amountMinor)
    if (!payerCheck.valid) return toast.error(payerCheck.error ?? 'Check who paid.')

    const splitResult = computeSplitResult()
    if (!splitResult.valid) {
      setSplitOpen(true)
      return toast.error(splitResult.error ?? 'Check the split.')
    }

    const now = nowIso()
    const result: Expense = {
      id: expense?.id ?? generateId('exp'),
      groupId: group.id,
      title: title.trim(),
      amountMinor,
      category,
      // New expenses are stamped with the moment they're added; edits keep their original date.
      date: expense?.date ?? now,
      notes: expense?.notes,
      receiptUrl: expense?.receiptUrl,
      payers,
      split: { type: splitType, participantIds, inputs: splitInputs, shares: splitResult.shares },
      createdBy: expense?.createdBy ?? userId,
      createdAt: expense?.createdAt ?? now,
      updatedAt: now,
      source: expense?.source ?? draft?.source ?? 'manual',
    }

    setSaving(true)
    try {
      if (expense) {
        await updateExpenseAction(result, userId)
        toast.success('Expense updated')
      } else {
        await addExpenseAction(result, userId, group)
        toast.success('Expense added ✓', { description: `${result.title} — ${(amountMinor / 100).toFixed(2)} split among ${participantIds.length}.` })
      }
      onSaved?.(result)
    } catch (err) {
      toast.error('Couldn’t save this expense', { description: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (myGroups.length === 0) {
    return <p className="text-sm text-muted-foreground">Create a group first before adding an expense.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!lockedGroupId && (
        <div className="space-y-1.5">
          <Label>Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a group" />
            </SelectTrigger>
            <SelectContent>
              {myGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {group && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <PayerSelector
              members={groupMembers}
              amountMinor={amountMinor}
              payers={payers}
              onChange={setPayers}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense-title">Title</Label>
              <Input id="expense-title" autoFocus placeholder="e.g. Dinner at Zoca" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  id="expense-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  className="pl-6"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {group && (
        <Card>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => setSplitOpen((o) => !o)}
              aria-expanded={splitOpen}
              className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">Split between</p>
                <p className="mt-1.5 truncate text-xs text-muted-foreground">
                  {SPLIT_LABELS[splitType]} · {participantIds.length} {participantIds.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', splitOpen && 'rotate-180')} />
            </button>
            {splitOpen && (
              <div className="border-t border-border p-4 sm:p-5">
            <SplitEditor
              members={groupMembers}
              amountMinor={amountMinor}
              splitType={splitType}
              onSplitTypeChange={setSplitType}
              participantIds={participantIds}
              onParticipantsChange={setParticipantIds}
              inputs={splitInputs}
              onInputsChange={setSplitInputs}
            />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={saving}>
          {expense ? 'Save changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
