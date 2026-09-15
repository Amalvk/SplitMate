import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bell, CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { ReminderDialog } from '@/components/settlement/ReminderDialog'
import { recordSettlementAction, updateSettlementStatusAction } from '@/services/actions/settlementActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { calculateMemberBalances, optimizeSettlements } from '@/utils/calculations'
import { formatINR } from '@/utils/currency'
import { formatRelative } from '@/utils/date'
import type { Member } from '@/types'

export default function SettlementsPage() {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const groups = useDataStore((s) => s.groups)
  const expenses = useDataStore((s) => s.expenses)
  const settlements = useDataStore((s) => s.settlements)
  const members = useDataStore((s) => s.members)

  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const [reminderTarget, setReminderTarget] = useState<{ member: Member; amountMinor: number; context?: string } | null>(null)

  const myGroups = useMemo(() => groups.filter((g) => userId && g.memberIds.includes(userId)), [groups, userId])

  const { owe, receive } = useMemo(() => {
    const owe: { groupId: string; groupName: string; memberId: string; amountMinor: number }[] = []
    const receive: { groupId: string; groupName: string; memberId: string; amountMinor: number }[] = []
    for (const group of myGroups) {
      const groupExpenses = expenses.filter((e) => e.groupId === group.id)
      const groupSettlements = settlements.filter((s) => s.groupId === group.id)
      const balances = calculateMemberBalances(group.memberIds, groupExpenses, groupSettlements)
      const suggestions = optimizeSettlements(balances)
      for (const s of suggestions) {
        if (s.fromMemberId === userId) owe.push({ groupId: group.id, groupName: group.name, memberId: s.toMemberId, amountMinor: s.amountMinor })
        if (s.toMemberId === userId) receive.push({ groupId: group.id, groupName: group.name, memberId: s.fromMemberId, amountMinor: s.amountMinor })
      }
    }
    return { owe, receive }
  }, [myGroups, expenses, settlements, userId])

  const history = useMemo(
    () => settlements.filter((s) => myGroups.some((g) => g.id === s.groupId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [settlements, myGroups],
  )

  async function markPaid(item: { groupId: string; memberId: string; amountMinor: number }, direction: 'owe' | 'receive') {
    if (!userId) return
    await recordSettlementAction(
      {
        id: crypto.randomUUID(),
        groupId: item.groupId,
        fromMemberId: direction === 'owe' ? userId : item.memberId,
        toMemberId: direction === 'owe' ? item.memberId : userId,
        amountMinor: item.amountMinor,
        status: 'paid',
        createdAt: new Date().toISOString(),
        settledAt: new Date().toISOString(),
        history: [{ id: crypto.randomUUID(), status: 'paid', amountMinor: item.amountMinor, at: new Date().toISOString() }],
      },
      userId,
    )
    toast.success('Settlement completed ✓')
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settlements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Settle up across every group in one place.</p>
      </div>

      <div>
        <h2 className="font-semibold mb-3">You owe</h2>
        {owe.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">You don’t owe anyone right now 🎉</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {owe.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar name={byId[item.memberId]?.name ?? '?'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{byId[item.memberId]?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.groupName}</p>
                  </div>
                  <span className="font-bold num-tabular text-destructive">{formatINR(item.amountMinor)}</span>
                  <Button size="sm" onClick={() => markPaid(item, 'owe')}>
                    Mark as Paid
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">You will receive</h2>
        {receive.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">Nobody owes you anything right now.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {receive.map((item, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar name={byId[item.memberId]?.name ?? '?'} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{byId[item.memberId]?.name}</p>
                    <p className="text-xs text-muted-foreground">{item.groupName}</p>
                  </div>
                  <span className="font-bold num-tabular text-success">{formatINR(item.amountMinor)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => byId[item.memberId] && setReminderTarget({ member: byId[item.memberId], amountMinor: item.amountMinor, context: item.groupName })}
                  >
                    <Bell className="size-3.5" /> Remind
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Settlement history</h2>
        {history.length === 0 ? (
          <EmptyState emoji="💸" title="No settlements yet" description="Once you record a payment, it'll show up here." />
        ) : (
          <div className="space-y-2">
            {history.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar name={byId[s.fromMemberId]?.name ?? '?'} size="sm" />
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium">{byId[s.fromMemberId]?.name}</span> paid{' '}
                    <span className="font-medium">{byId[s.toMemberId]?.name}</span>
                    <p className="text-xs text-muted-foreground">{formatRelative(s.createdAt)} {s.note && `· ${s.note}`}</p>
                  </div>
                  <span className="font-semibold num-tabular">{formatINR(s.amountMinor)}</span>
                  <Badge variant={s.status === 'paid' ? 'success' : s.status === 'partial' ? 'warning' : 'secondary'}>
                    {s.status === 'paid' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                    {s.status}
                  </Badge>
                  {s.status === 'paid' && userId && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Undo"
                      onClick={async () => {
                        await updateSettlementStatusAction(s, 'pending', 'Reverted', userId)
                        toast.success('Settlement reverted to pending')
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {reminderTarget && (
        <ReminderDialog
          open={!!reminderTarget}
          onOpenChange={(open) => !open && setReminderTarget(null)}
          member={reminderTarget.member}
          amountMinor={reminderTarget.amountMinor}
          context={reminderTarget.context}
        />
      )}
    </div>
  )
}
