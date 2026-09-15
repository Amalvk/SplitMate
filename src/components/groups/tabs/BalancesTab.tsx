import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RecordSettlementDialog } from '@/components/settlement/RecordSettlementDialog'
import { useGroupBalances } from '@/hooks/useGroupBalances'
import { useDataStore } from '@/store/dataStore'
import { formatINR } from '@/utils/currency'
import type { Group, SettlementSuggestion } from '@/types'

export function BalancesTab({ group }: { group: Group }) {
  const { balances, suggestions } = useGroupBalances(group.id, group.memberIds)
  const members = useDataStore((s) => s.members)
  const byId = Object.fromEntries(members.map((m) => [m.id, m]))
  const [active, setActive] = useState<SettlementSuggestion | null>(null)

  const outstandingCount = balances.filter((b) => b.netMinor !== 0).length

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">Balances</h3>
          <div className="space-y-3">
            {balances
              .sort((a, b) => b.netMinor - a.netMinor)
              .map((b) => (
                <div key={b.memberId} className="flex items-center gap-3">
                  <Avatar name={byId[b.memberId]?.name ?? '?'} size="sm" />
                  <span className="text-sm font-medium flex-1">{byId[b.memberId]?.name}</span>
                  <span
                    className={`text-sm font-semibold num-tabular ${
                      b.netMinor > 0 ? 'text-success' : b.netMinor < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {b.netMinor > 0 ? `receives ${formatINR(b.netMinor)}` : b.netMinor < 0 ? `owes ${formatINR(-b.netMinor)}` : 'settled up'}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card className="border-primary/30 bg-accent/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-semibold">Smart Settlement</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Settle the group with {suggestions.length} payment{suggestions.length > 1 ? 's' : ''} instead of {outstandingCount}.
            </p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-background border border-border p-3">
                  <Avatar name={byId[s.fromMemberId]?.name ?? '?'} size="sm" />
                  <span className="text-sm font-medium">{byId[s.fromMemberId]?.name}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <Avatar name={byId[s.toMemberId]?.name ?? '?'} size="sm" />
                  <span className="text-sm font-medium flex-1">{byId[s.toMemberId]?.name}</span>
                  <span className="text-sm font-semibold num-tabular">{formatINR(s.amountMinor)}</span>
                  <Button size="sm" variant="outline" onClick={() => setActive(s)}>
                    Settle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {active && (
        <RecordSettlementDialog
          open={!!active}
          onOpenChange={(open) => !open && setActive(null)}
          groupId={group.id}
          fromMemberId={active.fromMemberId}
          toMemberId={active.toMemberId}
          amountMinor={active.amountMinor}
        />
      )}
    </div>
  )
}
