import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { calculateMemberBalances } from '@/utils/calculations'

export function useDashboardStats() {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const groups = useDataStore((s) => s.groups)
  const expenses = useDataStore((s) => s.expenses)
  const settlements = useDataStore((s) => s.settlements)

  return useMemo(() => {
    const myGroups = groups.filter((g) => userId && g.memberIds.includes(userId))
    const myGroupIds = new Set(myGroups.map((g) => g.id))

    let totalExpenses = 0
    let youPaid = 0
    let youOwe = 0
    let othersOweYou = 0
    let pendingSettlements = 0

    for (const group of myGroups) {
      const groupExpenses = expenses.filter((e) => e.groupId === group.id)
      const groupSettlements = settlements.filter((s) => s.groupId === group.id)
      totalExpenses += groupExpenses.reduce((sum, e) => sum + e.amountMinor, 0)
      youPaid += groupExpenses.reduce(
        (sum, e) => sum + e.payers.filter((p) => p.memberId === userId).reduce((s, p) => s + p.amountMinor, 0),
        0,
      )
      pendingSettlements += groupSettlements.filter((s) => s.status !== 'paid').length

      const balances = calculateMemberBalances(group.memberIds, groupExpenses, groupSettlements)
      const myBalance = balances.find((b) => b.memberId === userId)
      if (myBalance) {
        if (myBalance.netMinor < 0) youOwe += -myBalance.netMinor
        if (myBalance.netMinor > 0) othersOweYou += myBalance.netMinor
      }
    }

    return {
      totalExpenses,
      youPaid,
      youOwe,
      othersOweYou,
      groupsCount: myGroups.length,
      pendingSettlements,
      myGroups: myGroups.filter((g) => myGroupIds.has(g.id)),
    }
  }, [userId, groups, expenses, settlements])
}
