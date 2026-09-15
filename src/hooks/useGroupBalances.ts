import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import { calculateMemberBalances, optimizeSettlements } from '@/utils/calculations'

export function useGroupExpenses(groupId: string) {
  const expenses = useDataStore((s) => s.expenses)
  return useMemo(() => expenses.filter((e) => e.groupId === groupId), [expenses, groupId])
}

export function useGroupSettlements(groupId: string) {
  const settlements = useDataStore((s) => s.settlements)
  return useMemo(() => settlements.filter((st) => st.groupId === groupId), [settlements, groupId])
}

export function useGroupBalances(groupId: string, memberIds: string[]) {
  const expenses = useGroupExpenses(groupId)
  const settlements = useGroupSettlements(groupId)

  return useMemo(() => {
    const balances = calculateMemberBalances(memberIds, expenses, settlements)
    const suggestions = optimizeSettlements(balances)
    const totalSpent = expenses.reduce((sum, e) => sum + e.amountMinor, 0)
    return { balances, suggestions, totalSpent }
  }, [memberIds, expenses, settlements])
}
