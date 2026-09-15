import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { recordSettlementAction } from '@/services/actions/settlementActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { formatINR, minorToRupees, rupeesToMinor } from '@/utils/currency'
import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'
import type { Settlement } from '@/types'

interface RecordSettlementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  fromMemberId: string
  toMemberId: string
  amountMinor: number
}

export function RecordSettlementDialog({ open, onOpenChange, groupId, fromMemberId, toMemberId, amountMinor }: RecordSettlementDialogProps) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const members = useDataStore((s) => s.members)
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))

  const [amountRupees, setAmountRupees] = useState(minorToRupees(amountMinor))
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setAmountRupees(minorToRupees(amountMinor))
      setNote('')
    }
  }, [open, amountMinor])

  async function handleRecord(status: 'paid' | 'pending') {
    if (!userId) return
    const settlement: Settlement = {
      id: generateId('stl'),
      groupId,
      fromMemberId,
      toMemberId,
      amountMinor: rupeesToMinor(amountRupees),
      status,
      note: note.trim() || undefined,
      createdAt: nowIso(),
      settledAt: status === 'paid' ? nowIso() : undefined,
      history: [{ id: generateId('hist'), status, amountMinor: rupeesToMinor(amountRupees), note: note.trim() || undefined, at: nowIso() }],
    }
    await recordSettlementAction(settlement, userId)
    toast.success(status === 'paid' ? 'Settlement completed ✓' : 'Settlement recorded', {
      description: `${byId[fromMemberId]?.name} → ${byId[toMemberId]?.name}: ${formatINR(settlement.amountMinor)}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record settlement</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={byId[fromMemberId]?.name ?? '?'} size="xs" /> {byId[fromMemberId]?.name} pays{' '}
              <Avatar name={byId[toMemberId]?.name ?? '?'} size="xs" /> {byId[toMemberId]?.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settlement-amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                id="settlement-amount"
                type="number"
                min={0}
                step="0.01"
                className="pl-6"
                value={amountRupees}
                onChange={(e) => setAmountRupees(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settlement-note">Note (optional)</Label>
            <Input id="settlement-note" placeholder="e.g. Paid via UPI" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleRecord('pending')}>
            Save as pending
          </Button>
          <Button variant="success" onClick={() => handleRecord('paid')}>
            Mark as paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
