import type { MemberBalance, SettlementSuggestion } from '@/types'

/**
 * Greedy debt-simplification: repeatedly matches the largest creditor against the largest
 * debtor, settling the smaller of the two amounts, until every balance is zeroed out.
 * This minimizes the number of payments needed to settle a group (the classic Splitwise-style
 * "smart settlement" algorithm) rather than resolving every pairwise IOU individually.
 */
export function optimizeSettlements(balances: MemberBalance[]): SettlementSuggestion[] {
  const creditors = balances
    .filter((b) => b.netMinor > 0)
    .map((b) => ({ memberId: b.memberId, amount: b.netMinor }))
  const debtors = balances
    .filter((b) => b.netMinor < 0)
    .map((b) => ({ memberId: b.memberId, amount: -b.netMinor }))

  const suggestions: SettlementSuggestion[] = []

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    const creditor = creditors[0]
    const debtor = debtors[0]
    const amount = Math.min(creditor.amount, debtor.amount)

    if (amount > 0) {
      suggestions.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amountMinor: amount })
    }

    creditor.amount -= amount
    debtor.amount -= amount

    if (creditor.amount <= 0) creditors.shift()
    if (debtor.amount <= 0) debtors.shift()
  }

  return suggestions
}

/**
 * Public entry point for computing how a group should settle up. Currently backed by
 * `optimizeSettlements` — kept as a distinct export so callers reason in terms of
 * "what are the settlements" separately from the optimization strategy used to produce them.
 */
export function calculateSettlements(balances: MemberBalance[]): SettlementSuggestion[] {
  return optimizeSettlements(balances)
}
