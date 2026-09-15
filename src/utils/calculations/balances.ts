import type { Expense, MemberBalance, Settlement } from '@/types'

/**
 * Computes each member's paid / owed / net balance across a set of expenses.
 * `paidMinor` / `owedMinor` reflect expense activity only; `netMinor` also folds in
 * any settlements already marked `paid`, so it represents the true outstanding balance.
 *
 * Positive netMinor => the member should receive money.
 * Negative netMinor => the member owes money.
 */
export function calculateMemberBalances(
  memberIds: string[],
  expenses: Expense[],
  settlements: Settlement[] = [],
): MemberBalance[] {
  const paid: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]))
  const owed: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]))

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      paid[payer.memberId] = (paid[payer.memberId] ?? 0) + payer.amountMinor
    }
    for (const [memberId, shareMinor] of Object.entries(expense.split.shares)) {
      owed[memberId] = (owed[memberId] ?? 0) + shareMinor
    }
  }

  const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, (paid[id] ?? 0) - (owed[id] ?? 0)]))

  for (const settlement of settlements) {
    if (settlement.status !== 'paid') continue
    net[settlement.fromMemberId] = (net[settlement.fromMemberId] ?? 0) + settlement.amountMinor
    net[settlement.toMemberId] = (net[settlement.toMemberId] ?? 0) - settlement.amountMinor
  }

  return memberIds.map((id) => ({
    memberId: id,
    paidMinor: paid[id] ?? 0,
    owedMinor: owed[id] ?? 0,
    netMinor: net[id] ?? 0,
  }))
}
