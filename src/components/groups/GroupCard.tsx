import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GROUP_CATEGORIES } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { useGroupBalances, useGroupExpenses } from '@/hooks/useGroupBalances'
import { formatINR } from '@/utils/currency'
import { formatFriendlyDate } from '@/utils/date'
import type { Group } from '@/types'

export function GroupCard({ group }: { group: Group }) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const expenses = useGroupExpenses(group.id)
  const { balances, totalSpent } = useGroupBalances(group.id, group.memberIds)
  const myBalance = balances.find((b) => b.memberId === userId)
  const categoryMeta = GROUP_CATEGORIES[group.category]
  const lastActivity = expenses[0]?.date

  return (
    <Link to={ROUTES.group(group.id)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${group.colorTheme}1a` }}
              >
                {categoryMeta.emoji}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" /> {group.memberIds.length} Members
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="font-semibold num-tabular">{formatINR(totalSpent, { whole: true })}</p>
            </div>
            {myBalance && myBalance.netMinor !== 0 && (
              <div className="text-right">
                <p className={myBalance.netMinor > 0 ? 'text-sm font-semibold text-success' : 'text-sm font-semibold text-destructive'}>
                  {myBalance.netMinor > 0 ? `You receive ${formatINR(myBalance.netMinor)}` : `You owe ${formatINR(-myBalance.netMinor)}`}
                </p>
              </div>
            )}
            {myBalance && myBalance.netMinor === 0 && expenses.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground">Settled up</p>
            )}
          </div>

          {lastActivity && (
            <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
              Last activity {formatFriendlyDate(lastActivity)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
